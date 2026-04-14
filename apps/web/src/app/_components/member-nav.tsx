"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { webPrimaryNav } from "@night-food/types";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MemberNav({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const isMobile = variant === "mobile";

  return (
    <nav className={isMobile ? "mobile-bottom-nav" : "primary-nav"}>
      {webPrimaryNav.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href as Route}
            className={`${isMobile ? "" : "nav-card"}${active ? " is-active" : ""}`.trim()}
            aria-current={active ? "page" : undefined}
          >
            {isMobile ? (
              item.label.replace("家庭", "")
            ) : (
              <>
                <div style={{ fontWeight: 700 }}>{item.label}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>
                  {item.description}
                </div>
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
