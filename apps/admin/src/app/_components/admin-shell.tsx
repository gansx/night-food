import type { Route } from "next";
import Link from "next/link";
import { adminPrimaryNav } from "@night-food/types";
import { LogoutButton } from "./logout-button";

export function AdminShell({
  title,
  description,
  activeHref = "",
  children
}: {
  title: string;
  description: string;
  activeHref?: string;
  children: React.ReactNode;
}) {
  const isActive = (href: string) => activeHref === href || activeHref.startsWith(`${href}/`);

  return (
    <main className="admin-shell">
      <header className="admin-panel shell-hero">
        <div className="shell-head">
          <div>
            <div className="brand-kicker">家宴中枢 | Owner Console</div>
            <h1 className="hero-title" style={{ fontSize: "clamp(2.3rem, 6vw, 4.8rem)" }}>{title}</h1>
            <p className="hero-subtitle">
              {description}
            </p>
          </div>
          <div className="identity-card">
            <div style={{ color: "var(--muted)", fontSize: 14 }}>管理身份</div>
            <div style={{ marginTop: 6, fontWeight: 900, fontSize: 22 }}>家主</div>
            <div style={{ marginTop: 14 }}>
              <LogoutButton />
            </div>
          </div>
        </div>

        <nav className="primary-nav">
          {adminPrimaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href as Route}
              className={`nav-card${isActive(item.href) ? " is-active" : ""}`}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <div style={{ fontWeight: 700 }}>{item.label}</div>
              <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                {item.description}
              </div>
            </Link>
          ))}
        </nav>
      </header>
      {children}
      <nav className="mobile-bottom-nav">
        {adminPrimaryNav.map((item) => (
          <Link
            key={item.href}
            href={item.href as Route}
            className={isActive(item.href) ? "is-active" : undefined}
            aria-current={isActive(item.href) ? "page" : undefined}
          >
            {item.label.replace("管理", "")}
          </Link>
        ))}
      </nav>
    </main>
  );
}
