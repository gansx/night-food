const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="56" fill="#020507"/>
  <circle cx="128" cy="128" r="84" fill="#ef9f5d"/>
  <path d="M72 126c17-30 36-45 56-45s39 15 56 45" fill="none" stroke="#1c0b05" stroke-linecap="round" stroke-width="16"/>
  <path d="M88 151h80" fill="none" stroke="#1c0b05" stroke-linecap="round" stroke-width="16"/>
  <path d="M184 114c0 40-25 68-56 68s-56-28-56-68" fill="none" stroke="#295a44" stroke-linecap="round" stroke-width="16"/>
</svg>`;

export function GET() {
  return new Response(faviconSvg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
