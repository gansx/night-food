import { formatDateTime, getTaskStatusLabel } from "@night-food/lib";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { getAdminViewerSummary } from "../../lib/auth";
import { createSupabaseServerClient } from "../../lib/supabase/server-client";
import { ApproveTaskButton } from "./_components/approve-task-button";
import { CreateTaskForm } from "./_components/create-task-form";

const statusOptions = ["all", "open", "claimed", "submitted", "completed", "cancelled"] as const;

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
      <AdminShell title="任务管理" description="你还没有家庭空间，先完成家庭初始化。">
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

  const supabase = await createSupabaseServerClient();
  let taskQuery = supabase
    .from("tasks")
    .select(
      "id, title, description, reward_points, status, assigned_user_id, due_at, created_at, profiles:assigned_user_id(display_name)"
    )
    .eq("household_id", viewer.householdId)
    .order("created_at", { ascending: false });

  if (currentStatus !== "all") {
    taskQuery = taskQuery.eq("status", currentStatus);
  }

  const { data: tasks } = await taskQuery;

  return (
    <AdminShell
      title="任务管理"
      description="发布家庭任务、筛选状态、查看详情和审批积分结算。"
    >
      <section style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 20 }}>
        <div className="admin-panel" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>任务列表</h2>
              <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
                可按状态筛选，点进详情可以查看任务日志。
              </p>
            </div>

            <form style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <select name="status" defaultValue={currentStatus} style={filterStyle}>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "全部状态" : getTaskStatusLabel(option)}
                  </option>
                ))}
              </select>
              <button type="submit" style={filterButtonStyle}>
                筛选
              </button>
            </form>
          </div>

          <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
            {(tasks ?? []).length ? (
              tasks?.map((task) => {
                const assignedProfile = Array.isArray(task.profiles) ? task.profiles[0] : task.profiles;
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
                          {getTaskStatusLabel(task.status as never)} | 奖励 {Number(task.reward_points)} 积分
                          <br />
                          成员：{(assignedProfile?.display_name as string | undefined) ?? "未领取"}
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

        <CreateTaskForm householdId={viewer.householdId} />
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
  cursor: "pointer"
} satisfies React.CSSProperties;
