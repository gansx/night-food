import type { Route } from "next";
import Link from "next/link";
import { webPrimaryNav } from "@night-food/types";

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
      <header
        className="glass-panel"
        style={{
          padding: 24,
          display: "grid",
          gap: 18,
          marginBottom: 20
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 18,
            flexWrap: "wrap"
          }}
        >
          <div>
            <div style={{ color: "var(--brand-dark)", fontWeight: 700, fontSize: 14 }}>
              家庭成员端
            </div>
            <h1 style={{ margin: "10px 0 0", fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
              {title}
            </h1>
            <p className="section-copy" style={{ maxWidth: 720 }}>
              {description}
            </p>
          </div>
          <div
            style={{
              padding: "14px 18px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.72)",
              border: "1px solid var(--border-soft)",
              minWidth: 220
            }}
          >
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>当前入口</div>
            <div style={{ marginTop: 6, fontWeight: 800, fontSize: 22 }}>家庭成员视角</div>
            <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 14 }}>
              点餐、任务、订单、积分
            </div>
          </div>
        </div>

        <nav
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 10
          }}
        >
          {webPrimaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href as Route}
              style={{
                padding: 14,
                borderRadius: 18,
                background: "rgba(255,255,255,0.64)",
                border: "1px solid var(--border-soft)"
              }}
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
    </main>
  );
}
