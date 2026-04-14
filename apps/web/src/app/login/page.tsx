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
          <div className="brand-kicker">家宴星球</div>
          <h1 className="hero-title" style={{ fontSize: "clamp(2.6rem, 7vw, 4.8rem)" }}>回到家庭星舱</h1>
          <p className="section-copy" style={{ maxWidth: 560 }}>
            现在只需要账号和密码。登录后，如果你还没有加入家庭，可以输入家主给你的家庭邀请码。
          </p>
        </div>
        <LoginCard />
      </section>
    </main>
  );
}
