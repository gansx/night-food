import { redirect } from "next/navigation";
import { getAdminViewerSummary } from "../../../lib/auth";
import { OwnerBootstrapForm } from "./_components/owner-bootstrap-form";

export default async function OwnerSetupPage() {
  const viewer = await getAdminViewerSummary();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role === "member") {
    redirect("/");
  }

  if (viewer.householdId && viewer.role === "owner") {
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
          maxWidth: 760,
          margin: "48px auto 0"
        }}
      >
        <div>
          <div style={{ color: "var(--brand)", fontWeight: 700, fontSize: 14 }}>
            家庭初始化
          </div>
          <h1 style={{ margin: "12px 0 0", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            先创建你的家庭空间
          </h1>
          <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.7 }}>
            完成后你会成为该家庭的家主，并可以继续邀请家人、配置菜单、发布任务和管理积分规则。
          </p>
        </div>

        <OwnerBootstrapForm />
      </section>
    </main>
  );
}
