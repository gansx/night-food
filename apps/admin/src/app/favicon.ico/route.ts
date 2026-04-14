const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="56" fill="#020507"/>
  <path d="M52 82h152v92H52z" fill="#ef9f5d"/>
  <path d="M76 108h104M76 137h64" fill="none" stroke="#1c0b05" stroke-linecap="round" stroke-width="14"/>
  <circle cx="186" cy="170" r="30" fill="#22748d"/>
  <path d="M176 170h20M186 160v20" stroke="#f5e8dc" stroke-linecap="round" stroke-width="9"/>
</svg>`;

export function GET() {
  return new Response(faviconSvg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
