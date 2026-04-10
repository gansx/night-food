import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Night Food Admin",
  description: "Owner console for family menus, tasks, points, and members."
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

