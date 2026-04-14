import { redirect } from "next/navigation";
import { getAdminViewerSummary } from "../../lib/auth";
import { AdminRegisterCard } from "./_components/admin-register-card";

export default async function AdminRegisterPage() {
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
          <h1 className="hero-title" style={{ fontSize: "clamp(2.6rem, 7vw, 4.8rem)" }}>创建家主密钥</h1>
          <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.7 }}>
            注册后创建家庭，系统会生成家庭邀请码。家人注册自己的账号后输入邀请码即可加入。
          </p>
        </div>
        <AdminRegisterCard />
      </section>
    </main>
  );
}
