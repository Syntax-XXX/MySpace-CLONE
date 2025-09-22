import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return NextResponse.json({ error: "Admin supabase not configured" }, { status: 500 });

    const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

    const body = await req.json();
    const { visibility, allow_messages, profile_music_url, theme } = body;

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    const userId = userData.user.id;

    // upsert into user_settings
    const payload = {
      user_id: userId,
      visibility: visibility ?? "public",
      allow_messages: allow_messages ?? true,
      profile_music_url: profile_music_url ?? null,
      theme: theme ? JSON.stringify(theme) : "{}",
    };
    const { error: upsertErr } = await supabaseAdmin.from("user_settings").upsert(payload, { onConflict: "user_id" });
    if (upsertErr) return NextResponse.json({ error: "Upsert failed", details: upsertErr }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "server error" }, { status: 500 });
  }
}