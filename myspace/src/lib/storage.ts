import { getSupabaseClient } from "./supabaseClient";

const BUCKET = "user-uploads";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "audio/mpeg",
  "audio/mp3",
];

function safeName(name: string) {
  return name.replace(/\s+/g, "_");
}

function buildPath(userId: string, filename: string) {
  return `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName(
    filename
  )}`;
}

export async function uploadUserFile(userId: string, file: File) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client not configured");
  if (!userId) throw new Error("Missing userId");
  if (!file) throw new Error("Missing file");


  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error("Unsupported file type");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("File too large (max 10MB)");
  }

  const path = buildPath(userId, file.name);

  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (uploadErr) {
    console.error("Supabase storage upload error:", uploadErr);
    throw uploadErr;
  }

  // Try public URL first
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  let url: string | null = pub?.publicUrl || null;

  // Fallback to signed URL if public not available
  if (!url) {
    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60); // 1 hour
    if (signErr) {
      console.error("Signed URL error:", signErr);
      throw signErr;
    }
    url = signed?.signedUrl || null;
  }

  return {
    storage_path: path,
    url,
    mime_type: file.type,
    size: file.size,
  };
}

export async function uploadUserAvatar(userId: string, file: File) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client not configured");
  if (!userId) throw new Error("Missing userId");
  if (!file) throw new Error("Missing file");
  if (!file.type.startsWith("image/")) throw new Error("Avatar must be an image");
  if (file.size > MAX_BYTES) throw new Error("File too large (max 10MB)");

  const path = `avatars/${userId}.png`;
  // Convert to PNG by trusting browser to provide PNG, or overwrite as-is;
  // If you want strict conversion, handle client-side canvas conversion.
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, cacheControl: "3600", contentType: "image/png" });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { storage_path: path, url: data?.publicUrl || `/api/avatars/${userId}` };
}

export function publicUrl(path?: string) {
  if (!path) return null;
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}
