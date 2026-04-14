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
          <div className="brand-kicker">家宴星球</div>
          <h1 className="hero-title" style={{ fontSize: "clamp(2.6rem, 7vw, 4.8rem)" }}>创建家庭身份</h1>
          <p className="section-copy" style={{ maxWidth: 560 }}>
            不再使用邮箱登录。每个人用自己的账号密码进入，之后通过家庭邀请码加入同一个家庭。
          </p>
        </div>
        <RegisterCard />
      </section>
    </main>
  );
}
