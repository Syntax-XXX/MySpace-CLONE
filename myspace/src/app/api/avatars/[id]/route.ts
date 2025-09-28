import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

const BUCKET = "user-uploads"; // Using the existing bucket; avatars are stored under avatars/{userId}.png

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id || id === "default") {
      return svgFallback("U");
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return svgFallback(id[0]?.toUpperCase() || "U");

    const path = `avatars/${id}.png`;
    const { data, error } = await supabase.storage.from(BUCKET).download(path);

    if (error || !data) {
      return svgFallback(id[0]?.toUpperCase() || "U");
    }

    const blob = data as Blob;
    const buf = Buffer.from(await blob.arrayBuffer());
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return svgFallback("U");
  }
}

function svgFallback(initial: string) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#cfe1ff"/>
      <stop offset="100%" stop-color="#90b4ff"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" fill="url(#g)"/>
  <circle cx="64" cy="50" r="26" fill="#ffffff" opacity="0.8"/>
  <rect x="20" y="80" width="88" height="28" rx="14" fill="#ffffff" opacity="0.8"/>
  <text x="64" y="60" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="700" fill="#003366">${initial}</text>
</svg>`;
  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=600",
    },
  });
}
