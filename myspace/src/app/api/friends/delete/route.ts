import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return NextResponse.json({ error: "Admin supabase not configured" }, { status: 500 });

    const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

    const { data: udata } = await supabaseAdmin.auth.getUser(token);
    const uid = udata?.user?.id;
    if (!uid) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { friendId } = await req.json();
    if (!friendId) return NextResponse.json({ error: "Missing friendId" }, { status: 400 });

    // Remove friendship regardless of order
    const { error: delErr } = await supabaseAdmin
      .from("friends")
      .delete()
      .or(`and(user_a.eq.${uid},user_b.eq.${friendId}),and(user_a.eq.${friendId},user_b.eq.${uid})`);

    if (delErr) return NextResponse.json({ error: "Delete failed", details: delErr }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "server error" }, { status: 500 });
  }
}
