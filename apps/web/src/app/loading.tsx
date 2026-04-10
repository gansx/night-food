export default function Loading() {
  return (
    <main className="app-shell">
      <section className="glass-panel" style={{ padding: 28 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>加载中...</h1>
        <p style={{ margin: "12px 0 0", color: "var(--text-muted)" }}>
          正在同步家庭数据，请稍候。
        </p>
      </section>
    </main>
  );
}
