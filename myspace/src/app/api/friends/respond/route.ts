import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return NextResponse.json({ error: "Admin client not configured" }, { status: 500 });

    const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
    const { requestId, action } = await req.json(); // action = 'accept'|'reject'|'cancel'

    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });
    if (!requestId) return NextResponse.json({ error: "Missing requestId" }, { status: 400 });

    const { data: udata, error: uerr } = await supabaseAdmin.auth.getUser(token);
    if (uerr || !udata?.user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    const uid = udata.user.id;

    const { data: reqRow, error: rqErr } = await supabaseAdmin.from("friend_requests").select("*").eq("id", requestId).single();
    if (rqErr || !reqRow) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    // Only recipient can accept/reject; requester can cancel
    if (action === "cancel" && reqRow.requester !== uid) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    if ((action === "accept" || action === "reject") && reqRow.recipient !== uid) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

    if (action === "accept") {
      // insert friends pair normalized
      const a = reqRow.requester;
      const b = reqRow.recipient;
      await supabaseAdmin.from("friends").insert([{ user_a: a, user_b: b }], { upsert: false });
      await supabaseAdmin.from("friend_requests").update({ status: "accepted" }).eq("id", requestId);
      // notify requester
      await supabaseAdmin.from("notifications").insert([{ user_id: reqRow.requester, actor: reqRow.recipient, type: "friend_accept", payload: { requestId } }]);
      return NextResponse.json({ ok: true });
    } else if (action === "reject") {
      await supabaseAdmin.from("friend_requests").update({ status: "rejected" }).eq("id", requestId);
      return NextResponse.json({ ok: true });
    } else if (action === "cancel") {
      await supabaseAdmin.from("friend_requests").update({ status: "cancelled" }).eq("id", requestId);
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err: any) {
    console.error("friends/respond:", err);
    return NextResponse.json({ error: err?.message || "server error" }, { status: 500 });
  }
}