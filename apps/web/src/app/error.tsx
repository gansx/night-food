"use client";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="app-shell">
      <section className="glass-panel" style={{ padding: 28 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>页面出了点问题</h1>
        <p style={{ margin: "12px 0 0", color: "var(--text-muted)", lineHeight: 1.7 }}>
          {error.message || "暂时无法加载这个页面。"}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 16,
            border: 0,
            borderRadius: 999,
            padding: "12px 18px",
            background: "var(--brand)",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          重新尝试
        </button>
      </section>
    </main>
  );
}
