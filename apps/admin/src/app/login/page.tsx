import { redirect } from "next/navigation";
import { getAdminViewerSummary } from "../../lib/auth";
import { AdminLoginCard } from "./_components/admin-login-card";

export default async function AdminLoginPage() {
  const viewer = await getAdminViewerSummary();

  if (viewer?.role === "owner" && viewer.householdStatus === "active") {
    redirect("/");
  }

  return (
    <main className="admin-shell">
      <section
        className="admin-panel"
        style={{
          padding: 28,
          display: "grid",
          gap: 20,
          maxWidth: 720,
          margin: "48px auto 0"
        }}
      >
        <div>
          <div className="brand-kicker">家宴中枢</div>
          <h1 className="hero-title" style={{ fontSize: "clamp(2.6rem, 7vw, 4.8rem)" }}>进入家主控制台</h1>
          <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.7 }}>
            家主用账号密码进入管理台。首次使用时先注册账号，再创建家庭并获得家庭邀请码。
          </p>
        </div>
        <AdminLoginCard />
      </section>
    </main>
  );
}
