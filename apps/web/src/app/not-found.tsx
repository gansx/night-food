import Link from "next/link";

export default function NotFound() {
  return (
    <main className="app-shell">
      <section className="glass-panel" style={{ padding: 28 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>页面不存在</h1>
        <p style={{ margin: "12px 0 0", color: "var(--text-muted)" }}>
          这个链接可能已经失效，或者页面还没有创建。
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            marginTop: 16,
            borderRadius: 999,
            padding: "12px 18px",
            background: "var(--brand)",
            color: "#fff",
            fontWeight: 700
          }}
        >
          返回首页
        </Link>
      </section>
    </main>
  );
}
