import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return NextResponse.json({ error: "Admin client not configured" }, { status: 500 });

    const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
    const { ids } = await req.json();

    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });
    if (!Array.isArray(ids)) return NextResponse.json({ error: "Missing ids" }, { status: 400 });

    const { data: udata } = await supabaseAdmin.auth.getUser(token);
    const uid = udata?.user?.id;
    if (!uid) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { error } = await supabaseAdmin.from("notifications").update({ is_read: true }).in("id", ids).eq("user_id", uid);
    if (error) return NextResponse.json({ error: "Update failed", details: error }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("notifications/mark-read:", err);
    return NextResponse.json({ error: err?.message || "server error" }, { status: 500 });
  }
}