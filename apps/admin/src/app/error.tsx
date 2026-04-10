"use client";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="admin-shell">
      <section className="admin-panel" style={{ padding: 28 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>管理台暂时不可用</h1>
        <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.7 }}>
          {error.message || "请稍后再试。"}
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
