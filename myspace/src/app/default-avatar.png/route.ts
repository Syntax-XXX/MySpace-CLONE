export async function GET() {
  // Serve a retro-styled SVG fallback as the default avatar
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#cfe1ff"/>
      <stop offset="100%" stop-color="#90b4ff"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" fill="url(#g)"/>
  <circle cx="64" cy="50" r="26" fill="#ffffff" opacity="0.85"/>
  <rect x="20" y="80" width="88" height="28" rx="14" fill="#ffffff" opacity="0.85"/>
  <text x="64" y="60" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="700" fill="#003366">?</text>
</svg>`;
  return new Response(svg, {
    status: 200,
    headers: {
      // Although the path ends with .png, browsers respect the Content-Type
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
