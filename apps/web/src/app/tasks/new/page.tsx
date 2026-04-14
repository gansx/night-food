import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberShell } from "../../_components/member-shell";
import { getWebViewerSummary } from "../../../lib/auth";
import { CreateTaskCard } from "./task-create-card";

export default async function NewTaskPage() {
  const viewer = await getWebViewerSummary();

  if (!viewer) {
    redirect("/login");
  }

  if (!viewer.householdId || viewer.role !== "owner") {
    return (
      <MemberShell title="发布任务" description="只有家主可以发布家庭任务。" activeHref="/tasks">
        <section className="glass-panel" style={{ padding: 24, color: "var(--text-muted)" }}>
          当前账号不是家主，或者还没有加入家庭。
          <div style={{ marginTop: 14 }}>
            <Link href="/tasks" style={{ color: "var(--brand)", fontWeight: 700 }}>
              返回任务中心
            </Link>
          </div>
        </section>
      </MemberShell>
    );
  }

  return (
    <MemberShell
      title="发布任务"
      description="家主可以在成员端快速补充新的家庭任务和积分奖励。"
      activeHref="/tasks"
    >
      <CreateTaskCard householdId={viewer.householdId} />
    </MemberShell>
  );
}
