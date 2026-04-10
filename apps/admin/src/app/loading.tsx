export default function Loading() {
  return (
    <main className="admin-shell">
      <section className="admin-panel" style={{ padding: 28 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>加载中...</h1>
        <p style={{ margin: "12px 0 0", color: "var(--muted)" }}>
          正在同步家庭管理数据，请稍候。
        </p>
      </section>
    </main>
  );
}
