import type { Route } from "next";
import Link from "next/link";
import { adminPrimaryNav } from "@night-food/types";

export function AdminShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="admin-shell">
      <header className="admin-panel" style={{ padding: 24, marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 18,
            alignItems: "flex-start",
            flexWrap: "wrap"
          }}
        >
          <div>
            <div style={{ color: "var(--brand)", fontWeight: 700, fontSize: 14 }}>
              家主管理台
            </div>
            <h1 style={{ margin: "10px 0 0", fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
              {title}
            </h1>
            <p style={{ margin: "10px 0 0", color: "var(--muted)", lineHeight: 1.7, maxWidth: 720 }}>
              {description}
            </p>
          </div>
          <div
            style={{
              padding: "14px 18px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.78)",
              border: "1px solid var(--border)"
            }}
          >
            <div style={{ color: "var(--muted)", fontSize: 14 }}>管理身份</div>
            <div style={{ marginTop: 6, fontWeight: 800, fontSize: 22 }}>家主</div>
          </div>
        </div>

        <nav
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10
          }}
        >
          {adminPrimaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href as Route}
              style={{
                padding: 14,
                borderRadius: 18,
                background: "rgba(255,255,255,0.72)",
                border: "1px solid var(--border)"
              }}
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
    </main>
  );
}
