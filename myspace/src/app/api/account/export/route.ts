import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return NextResponse.json({ error: "Admin supabase not configured" }, { status: 500 });

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
    if (!token) return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });

    const { data: udata, error: uerr } = await supabaseAdmin.auth.getUser(token);
    if (uerr || !udata?.user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    const uid = udata.user.id;

    // Fetch relevant data for the user
    const [usersRow, settingsRow, notificationsRows] = await Promise.all([
      supabaseAdmin.from("users").select("*").eq("id", uid).maybeSingle(),
      supabaseAdmin.from("user_settings").select("*").eq("user_id", uid).maybeSingle(),
      supabaseAdmin.from("notifications").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(100),
    ]);

    const payload = {
      user: usersRow.data || null,
      user_settings: settingsRow.data || null,
      notifications: notificationsRows.data || [],
      exported_at: new Date().toISOString(),
    };

    return NextResponse.json(payload);
  } catch (e: any) {
    console.error("account/export:", e);
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}
