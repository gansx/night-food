import type { Route } from "next";
import Link from "next/link";
import { webPrimaryNav } from "@night-food/types";
import { LogoutButton } from "./logout-button";

export function MemberShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="app-shell">
      <header className="glass-panel shell-hero">
        <div className="shell-head">
          <div>
            <div className="brand-kicker">家宴星球 | Family Orbit</div>
            <h1 className="hero-title" style={{ fontSize: "clamp(2.3rem, 6vw, 4.8rem)" }}>{title}</h1>
            <p className="hero-subtitle">
              {description}
            </p>
          </div>
          <div className="identity-card">
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>当前入口</div>
            <div style={{ marginTop: 6, fontWeight: 900, fontSize: 22 }}>成员星舱</div>
            <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 14 }}>点餐、任务、订单、积分</div>
            <div style={{ marginTop: 14 }}>
              <LogoutButton />
            </div>
          </div>
        </div>

        <nav className="primary-nav">
          {webPrimaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href as Route}
              className="nav-card"
            >
              <div style={{ fontWeight: 700 }}>{item.label}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>
                {item.description}
              </div>
            </Link>
          ))}
        </nav>
      </header>
      {children}
      <nav className="mobile-bottom-nav">
        {webPrimaryNav.map((item) => (
          <Link key={item.href} href={item.href as Route}>
            {item.label.replace("家庭", "")}
          </Link>
        ))}
      </nav>
    </main>
  );
}
