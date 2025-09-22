import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return NextResponse.json({ error: "Admin client not configured" }, { status: 500 });

    const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
    const body = await req.json();
    const recipient = typeof body?.recipient === 'string' ? body.recipient : null;

    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });
    if (!recipient) return NextResponse.json({ error: "Missing recipient" }, { status: 400 });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const requester = userData.user.id;
    if (requester === recipient) return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });

    // prevent duplicates or existing friends
    const { data: existing } = await supabaseAdmin
      .from("friend_requests")
      .select("*")
      .or(`and(requester.eq.${requester},recipient.eq.${recipient}),and(requester.eq.${recipient},recipient.eq.${requester})`)
      .limit(1);

    if (existing && existing.length) return NextResponse.json({ error: "Request exists" }, { status: 400 });

    const { data: insertReq, error: insertErr } = await supabaseAdmin
      .from("friend_requests")
      .insert([{ requester, recipient, status: "pending" }])
      .select("*")
      .single();

    if (insertErr) return NextResponse.json({ error: "Insert failed", details: insertErr }, { status: 500 });

    // notification
    await supabaseAdmin.from("notifications").insert([{ user_id: recipient, actor: requester, type: "friend_request", payload: { requestId: insertReq.id } }]);

    return NextResponse.json({ ok: true, request: insertReq });
  } catch (err: any) {
    console.error("friends/request:", err);
    return NextResponse.json({ error: err?.message || "server error" }, { status: 500 });
  }
}