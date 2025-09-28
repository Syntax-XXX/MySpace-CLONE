import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return NextResponse.json({ error: "Admin supabase not configured" }, { status: 500 });

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
    if (!token) return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });

    const { data: udata, error: uerr } = await supabaseAdmin.auth.getUser(token);
    if (uerr || !udata?.user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    const uid = udata.user.id;

    // Delete profile rows first (cascades in DB recommended, but do safe deletes here)
    await supabaseAdmin.from("notifications").delete().eq("user_id", uid);
    await supabaseAdmin.from("friends").delete().or(`user_a.eq.${uid},user_b.eq.${uid}`);
    await supabaseAdmin.from("friend_requests").delete().or(`requester.eq.${uid},recipient.eq.${uid}`);
    await supabaseAdmin.from("posts").delete().eq("user_id", uid);
    await supabaseAdmin.from("users").delete().eq("id", uid);
    await supabaseAdmin.from("user_settings").delete().eq("user_id", uid);

    // Finally remove auth user
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (delErr) return NextResponse.json({ error: delErr.message || 'Delete failed' }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("account/delete:", e);
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}
