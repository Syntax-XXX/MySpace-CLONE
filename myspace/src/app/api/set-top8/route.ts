import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return NextResponse.json({ error: "Admin supabase not configured" }, { status: 500 });

    const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

    const body = await req.json();
    const { top8 } = body; // array of friend UUIDs (max 8)

    if (!Array.isArray(top8) || top8.length > 8) {
      return NextResponse.json({ error: "top8 must be array up to 8 items" }, { status: 400 });
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    const userId = userData.user.id;

    const { error: updErr } = await supabaseAdmin.from("users").update({ top8 }).eq("id", userId);
    if (updErr) return NextResponse.json({ error: "Update failed", details: updErr }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "server error" }, { status: 500 });
  }
}