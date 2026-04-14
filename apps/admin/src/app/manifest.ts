import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "家宴中枢",
    short_name: "家宴中枢",
    description: "家庭菜单、订单、任务、积分和成员管理后台。",
    start_url: "/",
    display: "standalone",
    background_color: "#020507",
    theme_color: "#ef9f5d",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
