import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "家宴中枢",
  description: "Owner console for family menus, tasks, points, and members.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "家宴中枢"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
