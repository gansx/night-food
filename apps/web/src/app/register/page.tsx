import { redirect } from "next/navigation";
import { getWebViewerSummary } from "../../lib/auth";
import { RegisterCard } from "./_components/register-card";

export default async function RegisterPage() {
  const viewer = await getWebViewerSummary();

  if (viewer?.householdStatus === "active") {
    redirect("/");
  }

  return (
    <main className="app-shell">
      <section
        className="glass-panel"
        style={{
          padding: 28,
          display: "grid",
          gap: 20,
          maxWidth: 720,
          margin: "48px auto 0"
        }}
      >
        <div>
          <div style={{ color: "var(--brand-dark)", fontWeight: 700, fontSize: 14 }}>家庭账号注册</div>
          <h1 style={{ margin: "12px 0 0", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            创建一个家里人都能理解的账号
          </h1>
          <p className="section-copy" style={{ maxWidth: 560 }}>
            不再使用邮箱登录。每个人用自己的账号密码进入，之后通过家庭邀请码加入同一个家庭。
          </p>
        </div>
        <RegisterCard />
      </section>
    </main>
  );
}
