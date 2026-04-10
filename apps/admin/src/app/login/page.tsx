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
          <div style={{ color: "var(--brand)", fontWeight: 700, fontSize: 14 }}>家主管理登录</div>
          <h1 style={{ margin: "12px 0 0", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            登录家庭管理台
          </h1>
          <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.7 }}>
            家主从这里进入管理台。当前阶段使用邮箱魔法链接登录，适合先完成家庭创建、菜单管理、订单处理和任务审批。
          </p>
        </div>
        <AdminLoginCard
          redirectTo={`${process.env.NEXT_PUBLIC_ADMIN_SITE_URL ?? "http://localhost:3001"}/auth/callback`}
        />
      </section>
    </main>
  );
}
