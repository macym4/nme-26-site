import { NextRequest } from "next/server";

function paletteFromSlug(slug: string) {
  const palettes = [
    ["#15322a", "#c7b28a", "#fbf7f0"],
    ["#2b4e68", "#d1b895", "#f8f6f2"],
    ["#5c3b33", "#ebd6ba", "#f8f3ec"],
    ["#314b37", "#d8c7a6", "#fbf8f2"],
  ];

  const index = slug.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const variant = request.nextUrl.searchParams.get("variant") ?? "main";
  const [dark, mid, light] = paletteFromSlug(slug);
  const title = slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const svg = `
    <svg width="1600" height="1200" viewBox="0 0 1600 1200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1600" height="1200" fill="${light}"/>
      <rect x="70" y="70" width="1460" height="1060" rx="90" fill="${dark}"/>
      <circle cx="${variant === "main" ? 1180 : 350}" cy="${variant === "main" ? 260 : 860}" r="210" fill="${mid}" opacity="0.88"/>
      <circle cx="${variant === "gallery-1" ? 1180 : 520}" cy="${variant === "gallery-2" ? 260 : 380}" r="120" fill="${light}" opacity="0.62"/>
      <text x="130" y="920" fill="${light}" font-size="84" font-family="Georgia, serif">${title}</text>
      <text x="130" y="1010" fill="${mid}" font-size="42" font-family="Arial, sans-serif">Profile Atlas sample image</text>
    </svg>
  `.trim();

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
