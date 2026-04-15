import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { getAdminViewerSummary } from "../../lib/auth";
import { createSupabaseServiceRoleClient } from "../../lib/supabase/service-role-client";
import { TasksManager, type AdminTaskRow } from "./_components/tasks-manager";

export default async function AdminTasksPage() {
  const viewer = await getAdminViewerSummary();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "owner") {
    redirect("/");
  }

  if (!viewer.householdId) {
    return (
      <AdminShell title="任务管理" description="你还没有家庭空间，先完成家庭初始化。" activeHref="/tasks">
        <section className="admin-panel" style={{ padding: 24 }}>
          <Link href="/setup/owner" style={{ color: "var(--brand)", fontWeight: 700 }}>
            立即创建家庭
          </Link>
        </section>
      </AdminShell>
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const [{ data: tasks }, { data: householdMembers }] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        "id, title, description, reward_points, status, assigned_user_id, due_at, created_at, profiles:assigned_user_id(display_name, username)"
      )
      .eq("household_id", viewer.householdId)
      .order("created_at", { ascending: false }),
    supabase
      .from("household_members")
      .select("user_id, role, status")
      .eq("household_id", viewer.householdId)
      .eq("status", "active")
  ]);

  const memberUserIds = (householdMembers ?? []).map((member) => member.user_id as string);
  const { data: profiles } = memberUserIds.length
    ? await supabase.from("profiles").select("user_id, display_name, username").in("user_id", memberUserIds)
    : { data: [] as Array<Record<string, unknown>> };

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [
      profile.user_id as string,
      {
        displayName: profile.display_name as string | null,
        username: profile.username as string | null
      }
    ])
  );
  const assignableMembers = (householdMembers ?? [])
    .filter((member) => member.role !== "owner")
    .map((member) => {
      const profile = profileMap.get(member.user_id as string);
      return {
        id: member.user_id as string,
        label: profile?.displayName || profile?.username || "家庭成员"
      };
    });

  const normalizedTasks: AdminTaskRow[] = (tasks ?? []).map((task) => {
    const assignedProfile = Array.isArray(task.profiles) ? task.profiles[0] : task.profiles;
    return {
      id: task.id as string,
      title: task.title as string,
      description: (task.description as string | null) ?? null,
      reward_points: Number(task.reward_points ?? 0),
      status: task.status as string,
      assigned_user_id: (task.assigned_user_id as string | null) ?? null,
      due_at: (task.due_at as string | null) ?? null,
      created_at: task.created_at as string,
      assignedLabel:
        (assignedProfile?.display_name as string | undefined) ||
        (assignedProfile?.username as string | undefined) ||
        "未领取"
    };
  });

  return (
    <AdminShell
      title="任务管理"
      description="发布公开任务或直接指派给家人，查看到期状态并审核积分结算。"
      activeHref="/tasks"
    >
      <TasksManager initialTasks={normalizedTasks} householdId={viewer.householdId} members={assignableMembers} />
    </AdminShell>
  );
}
