import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberShell } from "../_components/member-shell";
import { getWebViewerSummary } from "../../lib/auth";
import { createSupabaseServiceRoleClient } from "../../lib/supabase/service-role-client";
import { TasksManager, type MemberTaskRow } from "./_components/tasks-manager";

export default async function TasksPage() {
  const viewer = await getWebViewerSummary();

  if (!viewer) {
    redirect("/login");
  }

  if (!viewer.householdId) {
    return (
      <MemberShell title="家庭任务中心" description="你还没有加入家庭，暂时无法参与任务。" activeHref="/tasks">
        <section className="glass-panel" style={{ padding: 24, color: "var(--text-muted)" }}>
          请先输入家庭邀请码加入家庭。{" "}
          <Link href="/family" style={{ color: "var(--brand)", fontWeight: 700 }}>
            前往家庭引导
          </Link>
        </section>
      </MemberShell>
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const [{ data: tasks }, { data: settings }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, description, reward_points, status, assigned_user_id, due_at, created_at")
      .eq("household_id", viewer.householdId)
      .order("created_at", { ascending: false }),
    supabase
      .from("household_settings")
      .select("task_approval_required")
      .eq("household_id", viewer.householdId)
      .limit(1)
      .maybeSingle()
  ]);

  return (
    <MemberShell
      title="家庭任务中心"
      description="领取公开任务，或处理家主指派给你的任务，完成后赚取家庭积分。"
      activeHref="/tasks"
    >
      <TasksManager
        initialTasks={(tasks ?? []) as MemberTaskRow[]}
        taskApprovalRequired={settings?.task_approval_required !== false}
        viewerUserId={viewer.userId}
        viewerRole={viewer.role}
      />
    </MemberShell>
  );
}
