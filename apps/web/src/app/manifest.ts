import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Night Food Family",
    short_name: "NightFood",
    description: "家庭点餐、任务和积分协作平台。",
    start_url: "/",
    display: "standalone",
    background_color: "#fff7ef",
    theme_color: "#8b5a3c",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
