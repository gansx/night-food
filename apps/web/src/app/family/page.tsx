import { redirect } from "next/navigation";
import { getWebViewerSummary } from "../../lib/auth";
import { CreateHouseholdForm } from "./_components/create-household-form";
import { JoinHouseholdForm } from "./_components/join-household-form";

export default async function FamilyGuidePage() {
  const viewer = await getWebViewerSummary();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.householdStatus === "active") {
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
          background:
            "linear-gradient(140deg, rgba(255,248,234,0.96) 0%, rgba(255,245,229,0.88) 42%, rgba(236,252,243,0.86) 100%)"
        }}
      >
        <div>
          <div style={{ color: "var(--brand-dark)", fontWeight: 700, fontSize: 14 }}>家庭引导</div>
          <h1 style={{ margin: "12px 0 0", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
            先进入一个家庭，再开始点餐和赚积分
          </h1>
          <p className="section-copy" style={{ maxWidth: 680 }}>
            当前账号 {viewer.displayName || viewer.username || "家庭成员"} 还没有绑定家庭。你可以自己创建家庭成为家主，
            也可以输入家主给你的家庭邀请码加入已有家庭。
          </p>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 20 }}>
        <JoinHouseholdForm />
        <CreateHouseholdForm />
      </section>
    </main>
  );
}
