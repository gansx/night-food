import Link from "next/link";

export default function LegacyJoinPage() {
  return (
    <main className="app-shell">
      <section className="glass-panel" style={{ padding: 28, maxWidth: 720, margin: "48px auto 0" }}>
        <div style={{ color: "var(--brand-dark)", fontWeight: 700, fontSize: 14 }}>加入方式已更新</div>
        <h1 style={{ margin: "12px 0 0", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
          请使用家庭邀请码加入
        </h1>
        <p className="section-copy" style={{ maxWidth: 560 }}>
          邮箱邀请链接已经停用。请先注册或登录账号，然后输入家主给你的家庭邀请码。
        </p>
        <Link
          href="/family"
          style={{
            display: "inline-flex",
            marginTop: 18,
            borderRadius: 999,
            padding: "12px 18px",
            background: "var(--brand)",
            color: "#fff",
            fontWeight: 700
          }}
        >
          前往家庭引导
        </Link>
      </section>
    </main>
  );
}
