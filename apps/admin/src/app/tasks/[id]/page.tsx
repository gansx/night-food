import { formatDateTime, getTaskStatusLabel } from "@night-food/lib";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminViewerSummary } from "../../../lib/auth";
import { createSupabaseServiceRoleClient } from "../../../lib/supabase/service-role-client";
import { AdminShell } from "../../_components/admin-shell";
import { ApproveTaskButton } from "../_components/approve-task-button";
import { UpdateTaskStatusForm } from "./_components/update-task-status-form";

export default async function AdminTaskDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await getAdminViewerSummary();
  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "owner") {
    redirect("/");
  }

  if (!viewer.householdId) {
    redirect("/setup/owner");
  }

  const { id } = await params;
  const supabase = createSupabaseServiceRoleClient();
  const [{ data: task }, { data: logs }] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        "id, title, description, reward_points, status, due_at, created_at, assigned_user_id, profiles:assigned_user_id(display_name)"
      )
      .eq("id", id)
      .eq("household_id", viewer.householdId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("task_logs")
      .select("id, from_status, to_status, note, created_at")
      .eq("task_id", id)
      .order("created_at", { ascending: false })
  ]);

  if (!task) {
    return (
      <AdminShell title="任务详情" description="没有找到这个任务。">
        <section className="admin-panel" style={{ padding: 24 }}>
          <Link href="/tasks" style={{ color: "var(--brand)", fontWeight: 700 }}>
            返回任务列表
          </Link>
        </section>
      </AdminShell>
    );
  }

  const assignedProfile = Array.isArray(task.profiles) ? task.profiles[0] : task.profiles;

  return (
    <AdminShell title="任务详情" description="查看任务日志、审批结果和任务状态控制。">
      <section style={{ display: "grid", gridTemplateColumns: "1fr 0.95fr", gap: 20 }}>
        <div className="admin-panel" style={{ padding: 24 }}>
          <Link href="/tasks" style={{ color: "var(--brand)", fontWeight: 700 }}>
            返回任务列表
          </Link>
          <h2 style={{ margin: "16px 0 0", fontSize: 24 }}>{task.title as string}</h2>
          <div style={{ marginTop: 10, color: "var(--muted)", lineHeight: 1.7 }}>
            状态：{getTaskStatusLabel(task.status as never)}
            <br />
            奖励：{Number(task.reward_points)} 积分
            <br />
            领取人：{(assignedProfile?.display_name as string | undefined) ?? "未领取"}
            <br />
            截止时间：{formatDateTime((task.due_at as string | null) ?? null)}
            <br />
            创建时间：{formatDateTime(task.created_at as string)}
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              background: "var(--panel-alt)",
              color: "var(--muted)",
              lineHeight: 1.7
            }}
          >
            {(task.description as string | null) || "暂无任务说明。"}
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
            {task.status === "submitted" ? <ApproveTaskButton taskId={task.id as string} /> : null}
            {task.status !== "cancelled" && task.status !== "completed" ? (
              <UpdateTaskStatusForm taskId={task.id as string} nextStatus="cancelled" label="取消任务" />
            ) : null}
            {task.status === "cancelled" ? (
              <UpdateTaskStatusForm taskId={task.id as string} nextStatus="open" label="重新开放" />
            ) : null}
          </div>
        </div>

        <div className="admin-panel" style={{ padding: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>任务日志</h2>
          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            {(logs ?? []).length ? (
              (logs ?? []).map((log) => (
                <div
                  key={log.id as string}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid var(--border)"
                  }}
                >
                  <strong>
                    {log.from_status ? getTaskStatusLabel(log.from_status as never) : "初始"} →{" "}
                    {getTaskStatusLabel(log.to_status as never)}
                  </strong>
                  <div style={{ marginTop: 8, color: "var(--muted)", lineHeight: 1.7 }}>
                    {(log.note as string | null) || "无备注"}
                    <br />
                    {formatDateTime(log.created_at as string)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--muted)" }}>当前还没有任务日志。</div>
            )}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
