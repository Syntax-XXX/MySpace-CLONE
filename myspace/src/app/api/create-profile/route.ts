import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.error("create-profile: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL missing");
      return NextResponse.json({ error: "Admin supabase not configured" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const body = await req.json().catch(() => ({}));
    const fallbackUserId = body?.user_id || null;

    let user;
    if (token) {
      const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
      if (userErr) {
        console.error("create-profile: auth.getUser error:", userErr);
        return NextResponse.json({ error: "Invalid token", details: userErr }, { status: 401 });
      }
      user = userData?.user;
    } else if (fallbackUserId) {
      user = { id: fallbackUserId, email: body?.email || null };
    } else {
      return NextResponse.json({ error: "Missing auth token or user_id" }, { status: 401 });
    }

    if (!user || !user.id) {
      console.error("create-profile: no user id resolved", { user });
      return NextResponse.json({ error: "Could not resolve user id" }, { status: 400 });
    }

    // build base username
    const base = (user.email || body?.email || "user")
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "")
      .slice(0, 24) || `user`;

    // ensure uniqueness by checking existing usernames and appending a counter
    let username = base;
    let counter = 0;
    while (true) {
      const { data: rows, error: qErr } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("username", username)
        .limit(1);

      if (qErr) {
        console.error("create-profile: username check error:", qErr);
        return NextResponse.json({ error: "Username check failed", details: qErr }, { status: 500 });
      }

      if (!rows || rows.length === 0) break;

      // if existing row is this user, it's fine
      if (rows[0].id === user.id) break;

      counter += 1;
      username = `${base}${counter}`;
      // keep username length reasonable
      if (username.length > 30) {
        username = username.slice(0, 30);
      }
    }

    const profile = {
      id: user.id,
      username,
      email: user.email || body?.email || null,
      created_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabaseAdmin
      .from("users")
      .upsert(profile, { onConflict: "id", returning: "representation" });

    if (upsertErr) {
      console.error("create-profile: upsert error:", upsertErr);
      return NextResponse.json({ error: "Upsert failed", details: upsertErr }, { status: 500 });
    }

    // success
    return NextResponse.json({ ok: true, profile }, { status: 200 });
  } catch (err: any) {
    console.error("create-profile: unexpected error:", err);
    return NextResponse.json({ error: err?.message || "server error", details: String(err) }, { status: 500 });
  }
}