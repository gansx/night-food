import type { Metadata } from "next";
import "./globals.css";
import { ServiceWorkerRegistrar } from "./_components/service-worker-registrar";

export const metadata: Metadata = {
  title: "Night Food Home",
  description: "Family ordering, tasks, points, and household coordination.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Night Food"
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
