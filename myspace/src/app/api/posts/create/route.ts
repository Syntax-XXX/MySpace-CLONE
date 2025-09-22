import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return NextResponse.json({ error: "Admin client not configured" }, { status: 500 });

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const body = await req.json();

    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const userId = userData.user.id;
    const { content, is_bulletin = false, privacy = "friends", location, media = [] } = body;

    // Insert post then media rows in a transaction
    const { data: post, error: postErr } = await supabaseAdmin
      .from("posts")
      .insert([{ author: userId, content, is_bulletin, privacy, location_lat: location?.lat, location_lng: location?.lng }])
      .select("*")
      .single();

    if (postErr) {
      console.error("create-post: post insert error", postErr);
      return NextResponse.json({ error: "Failed to insert post", details: postErr }, { status: 500 });
    }

    // Insert media records if provided (media[] = [{storage_path,url,mime_type,size}])
    if (Array.isArray(media) && media.length > 0) {
      const mediaRows = media.map((m: any) => ({
        post_id: post.id,
        owner: userId,
        storage_path: m.storage_path,
        url: m.url || null,
        mime_type: m.mime_type,
        size: m.size || null,
      }));
      const { error: mediaErr } = await supabaseAdmin.from("media").insert(mediaRows);
      if (mediaErr) console.error("create-post: media insert error", mediaErr);
    }

    // Create notifications for friends if post is not private
    if (privacy !== "private") {
      // simple: notify all friends (for scale, use background job)
      const { data: friendRows } = await supabaseAdmin
        .from("friends")
        .select("user_a,user_b")
        .or(`user_a.eq.${userId},user_b.eq.${userId}`);

      if (friendRows && friendRows.length) {
        const notifyTo = friendRows.map((r: any) => (r.user_a === userId ? r.user_b : r.user_a));
        const notifications = notifyTo.map((toId: string) => ({
          user_id: toId,
          actor: userId,
          type: "bulletin",
          payload: { postId: post.id },
        }));
        await supabaseAdmin.from("notifications").insert(notifications);
      }
    }

    return NextResponse.json({ ok: true, post }, { status: 200 });
  } catch (err: any) {
    console.error("create-post: unexpected", err);
    return NextResponse.json({ error: err?.message || "server error" }, { status: 500 });
  }
}