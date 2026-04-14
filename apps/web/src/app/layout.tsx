import type { Metadata } from "next";
import "./globals.css";
import { ServiceWorkerRegistrar } from "./_components/service-worker-registrar";

export const metadata: Metadata = {
  title: "家宴星球",
  description: "Family ordering, tasks, points, and household coordination.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "家宴星球"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
