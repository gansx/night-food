import { formatDateTime, getTaskStatusLabel, isTaskExpired } from "@night-food/lib";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { OrbitFormSelect } from "../_components/orbit-select";
import { getAdminViewerSummary } from "../../lib/auth";
import { createSupabaseServiceRoleClient } from "../../lib/supabase/service-role-client";
import { ApproveTaskButton } from "./_components/approve-task-button";
import { CreateTaskForm } from "./_components/create-task-form";

const statusOptions = ["all", "open", "claimed", "in_progress", "submitted", "completed", "cancelled"] as const;

export default async function AdminTasksPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
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

  const { status } = await searchParams;
  const currentStatus = statusOptions.includes((status ?? "all") as never)
    ? ((status ?? "all") as (typeof statusOptions)[number])
    : "all";

  const supabase = createSupabaseServiceRoleClient();
  let taskQuery = supabase
    .from("tasks")
    .select(
      "id, title, description, reward_points, status, assigned_user_id, due_at, created_at, profiles:assigned_user_id(display_name, username)"
    )
    .eq("household_id", viewer.householdId)
    .order("created_at", { ascending: false });

  if (currentStatus !== "all") {
    taskQuery = taskQuery.eq("status", currentStatus);
  }

  const [{ data: tasks }, { data: householdMembers }] = await Promise.all([
    taskQuery,
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

  return (
    <AdminShell
      title="任务管理"
      description="发布公开任务或直接指派给家人，查看到期状态并审核积分结算。"
      activeHref="/tasks"
    >
      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(300px, 0.85fr)", gap: 20 }}>
        <div className="admin-panel" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>任务列表</h2>
              <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
                公开任务由成员领取，指派任务会直接进入对应成员的我的任务。
              </p>
            </div>

            <form style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ minWidth: 160 }}>
                <OrbitFormSelect
                  name="status"
                  defaultValue={currentStatus}
                  options={statusOptions.map((option) => ({
                    value: option,
                    label: option === "all" ? "全部状态" : getTaskStatusLabel(option)
                  }))}
                />
              </div>
              <button type="submit" style={filterButtonStyle}>
                筛选
              </button>
            </form>
          </div>

          <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
            {(tasks ?? []).length ? (
              tasks?.map((task) => {
                const assignedProfile = Array.isArray(task.profiles) ? task.profiles[0] : task.profiles;
                const expired = isTaskExpired((task.due_at as string | null) ?? null);
                return (
                  <article
                    key={task.id}
                    style={{
                      padding: 16,
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.72)",
                      border: "1px solid var(--border)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <Link href={`/tasks/${task.id}` as Route} style={{ fontWeight: 700 }}>
                          {task.title as string}
                        </Link>
                        <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 14, lineHeight: 1.7 }}>
                          {getTaskStatusLabel(task.status as never)}
                          {expired && ["open", "claimed", "in_progress"].includes(String(task.status))
                            ? " | 已过期"
                            : ""}{" "}
                          | 奖励 {Number(task.reward_points)} 积分
                          <br />
                          成员：
                          {(assignedProfile?.display_name as string | undefined) ||
                            (assignedProfile?.username as string | undefined) ||
                            "未领取"}
                          <br />
                          截止：{formatDateTime((task.due_at as string | null) ?? null)}
                        </div>
                      </div>
                      <span style={{ color: "var(--brand)", fontWeight: 700 }}>
                        {formatDateTime(task.created_at as string)}
                      </span>
                    </div>
                    {task.description ? (
                      <div style={{ marginTop: 10, color: "var(--muted)", lineHeight: 1.6 }}>
                        {task.description as string}
                      </div>
                    ) : null}
                    {task.status === "submitted" ? (
                      <div style={{ marginTop: 12 }}>
                        <ApproveTaskButton taskId={task.id as string} />
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div style={{ color: "var(--muted)" }}>当前筛选条件下还没有任务。</div>
            )}
          </div>
        </div>

        <CreateTaskForm householdId={viewer.householdId} members={assignableMembers} />
      </section>
    </AdminShell>
  );
}

const filterStyle = {
  borderRadius: 999,
  border: "1px solid var(--border)",
  padding: "10px 14px",
  background: "rgba(255,255,255,0.82)"
} satisfies React.CSSProperties;

const filterButtonStyle = {
  border: 0,
  borderRadius: 999,
  padding: "10px 14px",
  background: "var(--brand)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 800
} satisfies React.CSSProperties;
