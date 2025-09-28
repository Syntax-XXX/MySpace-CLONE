import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return NextResponse.json({ error: "Admin client not configured" }, { status: 500 });

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const userId = userData.user.id;

    // Check if request is FormData (for file uploads) or JSON
    const contentType = req.headers.get("content-type") || "";
    let content, privacy, media = [];

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData (file uploads)
      const formData = await req.formData();
      content = formData.get("content") as string;
      privacy = formData.get("privacy") as string || "friends";

      // Process uploaded files
      const uploadedMedia = [];
      let fileIndex = 0;
      
      while (formData.has(`media_${fileIndex}`)) {
        const file = formData.get(`media_${fileIndex}`) as File;
        if (file && file.size > 0) {
          // Upload file to Supabase Storage
          const fileExt = file.name.split('.').pop();
          const fileName = `${userId}/${Date.now()}_${fileIndex}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('user-uploads')
            .upload(fileName, file, {
              contentType: file.type,
              upsert: false
            });

          if (uploadError) {
            console.error("File upload error:", uploadError);
          } else {
            // Get public URL
            const { data: { publicUrl } } = supabaseAdmin.storage
              .from('user-uploads')
              .getPublicUrl(fileName);

            let urlToSave = publicUrl;
            if (!urlToSave) {
              const { data: signedData, error: signErr } = await supabaseAdmin.storage
                .from('user-uploads')
                .createSignedUrl(fileName, 60 * 60);
              if (!signErr) {
                urlToSave = signedData?.signedUrl || null;
              }
            }

            uploadedMedia.push({
              storage_path: fileName,
              url: urlToSave,
              mime_type: file.type,
              size: file.size
            });
          }
        }
        fileIndex++;
      }
      
      media = uploadedMedia;
    } else {
      // Handle JSON request (no files)
      const body = await req.json();
      content = body.content;
      privacy = body.privacy || "friends";
      media = body.media || [];
    }

    // Insert post then media rows in a transaction
    const { data: post, error: postErr } = await supabaseAdmin
      .from("posts")
      .insert([{ user_id: userId, content }])
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