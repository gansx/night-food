import { redirect } from "next/navigation";
import { getWebViewerSummary } from "../../lib/auth";
import { LoginCard } from "./_components/login-card";

export default async function LoginPage() {
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
          <div style={{ color: "var(--brand-dark)", fontWeight: 700, fontSize: 14 }}>家庭成员登录</div>
          <h1 style={{ margin: "12px 0 0", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            登录到你的家庭空间
          </h1>
          <p className="section-copy" style={{ maxWidth: 560 }}>
            当前使用邮箱魔法链接登录。家主创建家庭后，可以通过邀请链接让家人加入并开始点餐、做任务和赚积分。
          </p>
        </div>
        <LoginCard
          title="成员登录"
          helper="输入邮箱后，我们会发送登录链接到你的邮箱。"
          redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`}
        />
      </section>
    </main>
  );
}
