import { formatDateTime, getTaskStatusLabel } from "@night-food/lib";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberShell } from "../../_components/member-shell";
import { getWebViewerSummary } from "../../../lib/auth";
import { createSupabaseServiceRoleClient } from "../../../lib/supabase/service-role-client";
import { SubmitTaskButton } from "../_components/submit-task-button";

export default async function TaskDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await getWebViewerSummary();
  if (!viewer) {
    redirect("/login");
  }

  if (!viewer.householdId) {
    redirect("/tasks");
  }

  const { id } = await params;
  const supabase = createSupabaseServiceRoleClient();
  const [{ data: task }, { data: logs }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, description, reward_points, status, due_at, created_at, assigned_user_id")
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
      <MemberShell title="任务详情" description="没有找到这个任务。" activeHref="/tasks">
        <section className="glass-panel" style={{ padding: 24 }}>
          <Link href="/tasks" style={{ color: "var(--brand)", fontWeight: 700 }}>
            返回任务列表
          </Link>
        </section>
      </MemberShell>
    );
  }

  const isMine = task.assigned_user_id === viewer.userId;

  return (
    <MemberShell title="任务详情" description="查看任务截止时间、日志和当前奖励。" activeHref="/tasks">
      <section style={{ display: "grid", gridTemplateColumns: "1fr 0.95fr", gap: 20 }}>
        <div className="glass-panel" style={{ padding: 24 }}>
          <Link href="/tasks" style={{ color: "var(--brand)", fontWeight: 700 }}>
            返回任务列表
          </Link>
          <h2 className="section-title" style={{ marginTop: 16, fontSize: 24 }}>
            {task.title as string}
          </h2>
          <div style={{ marginTop: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
            状态：{getTaskStatusLabel(task.status as never)}
            <br />
            奖励：{Number(task.reward_points)} 积分
            <br />
            截止：{formatDateTime((task.due_at as string | null) ?? null)}
            <br />
            创建时间：{formatDateTime(task.created_at as string)}
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              background: "rgba(255,255,255,0.72)",
              border: "1px solid var(--border-soft)",
              color: "var(--text-muted)",
              lineHeight: 1.7
            }}
          >
            {(task.description as string | null) || "暂无任务说明。"}
          </div>

          {isMine && ["claimed", "in_progress"].includes(String(task.status)) ? (
            <div style={{ marginTop: 18 }}>
              <SubmitTaskButton taskId={task.id as string} />
            </div>
          ) : null}
        </div>

        <div className="glass-panel" style={{ padding: 24 }}>
          <h2 className="section-title">任务日志</h2>
          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            {(logs ?? []).length ? (
              (logs ?? []).map((log) => (
                <div
                  key={log.id as string}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid var(--border-soft)"
                  }}
                >
                  <strong>
                    {log.from_status ? getTaskStatusLabel(log.from_status as never) : "初始"} →{" "}
                    {getTaskStatusLabel(log.to_status as never)}
                  </strong>
                  <div style={{ marginTop: 8, color: "var(--text-muted)", lineHeight: 1.7 }}>
                    {(log.note as string | null) || "无备注"}
                    <br />
                    {formatDateTime(log.created_at as string)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--text-muted)" }}>当前还没有任务日志。</div>
            )}
          </div>
        </div>
      </section>
    </MemberShell>
  );
}
