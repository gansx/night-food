import { formatDateTime, getTaskStatusLabel } from "@night-food/lib";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberShell } from "../_components/member-shell";
import { getWebViewerSummary } from "../../lib/auth";
import { createSupabaseServerClient } from "../../lib/supabase/server-client";
import { ClaimTaskButton } from "./_components/claim-task-button";
import { SubmitTaskButton } from "./_components/submit-task-button";

const filterOptions = ["all", "open", "claimed", "submitted", "completed", "cancelled"] as const;

export default async function TasksPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const viewer = await getWebViewerSummary();

  if (!viewer) {
    redirect("/login");
  }

  if (!viewer.householdId) {
    return (
      <MemberShell title="家庭任务中心" description="你还没有加入家庭，暂时无法参与任务。">
        <section className="glass-panel" style={{ padding: 24, color: "var(--text-muted)" }}>
          请让家主先邀请你加入家庭。
        </section>
      </MemberShell>
    );
  }

  const { filter } = await searchParams;
  const currentFilter = filterOptions.includes((filter ?? "all") as never)
    ? ((filter ?? "all") as (typeof filterOptions)[number])
    : "all";

  const supabase = await createSupabaseServerClient();
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

  const filteredTasks = (tasks ?? []).filter((task) => {
    if (currentFilter === "all") {
      return true;
    }
    return task.status === currentFilter;
  });

  const openTasks = filteredTasks.filter((task) => task.status === "open");
  const myTasks = filteredTasks.filter(
    (task) => task.assigned_user_id === viewer.userId || task.status === "open"
  );

  return (
    <MemberShell
      title="家庭任务中心"
      description="领取任务、提交完成、查看截止时间和积分到账状态。"
    >
      <section style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        <div className="glass-panel" style={{ padding: 24 }}>
          <div
            style={{
              marginBottom: 16,
              padding: 16,
              borderRadius: 18,
              background: "rgba(255,255,255,0.72)",
              border: "1px solid var(--border-soft)",
              color: "var(--text-muted)",
              lineHeight: 1.7
            }}
          >
            当前规则：
            {settings?.task_approval_required === false
              ? "任务完成后自动到账积分。"
              : "任务完成后需要家主审批才能发放积分。"}
          </div>

          <form style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <select name="filter" defaultValue={currentFilter} style={filterStyle}>
              {filterOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "全部任务" : getTaskStatusLabel(option)}
                </option>
              ))}
            </select>
            <button type="submit" style={filterButtonStyle}>
              筛选
            </button>
          </form>

          <h2 className="section-title">可领取任务</h2>
          <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
            {openTasks.length ? (
              openTasks.map((task) => (
                <article
                  key={task.id}
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid var(--border-soft)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <Link href={`/tasks/${task.id}` as Route} style={{ fontWeight: 700 }}>
                        {task.title as string}
                      </Link>
                      <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 14 }}>
                        截止：{formatDateTime((task.due_at as string | null) ?? null)}
                      </div>
                    </div>
                    <span style={{ color: "var(--accent)", fontWeight: 800 }}>
                      +{Number(task.reward_points)}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 14 }}>
                    {(task.description as string | null) || "家庭任务"}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <ClaimTaskButton taskId={task.id as string} />
                  </div>
                </article>
              ))
            ) : (
              <div style={{ color: "var(--text-muted)" }}>目前没有开放任务。</div>
            )}
          </div>
        </div>

        <aside className="glass-panel" style={{ padding: 24 }}>
          <h2 className="section-title">我的任务</h2>
          <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
            {myTasks.filter((task) => task.assigned_user_id === viewer.userId).length ? (
              myTasks
                .filter((task) => task.assigned_user_id === viewer.userId)
                .map((task) => (
                  <article
                    key={task.id}
                    style={{
                      padding: 16,
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.72)",
                      border: "1px solid var(--border-soft)"
                    }}
                  >
                    <Link href={`/tasks/${task.id}` as Route} style={{ fontWeight: 700 }}>
                      {task.title as string}
                    </Link>
                    <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 14 }}>
                      状态：{getTaskStatusLabel(task.status as never)} | 奖励 {Number(task.reward_points)} 积分
                    </div>
                    <div style={{ marginTop: 6, color: "var(--text-muted)", fontSize: 14 }}>
                      截止：{formatDateTime((task.due_at as string | null) ?? null)}
                    </div>
                    {["claimed", "in_progress"].includes(String(task.status)) ? (
                      <div style={{ marginTop: 12 }}>
                        <SubmitTaskButton taskId={task.id as string} />
                      </div>
                    ) : null}
                  </article>
                ))
            ) : (
              <div style={{ color: "var(--text-muted)" }}>你还没有领取任何任务。</div>
            )}
          </div>

          {viewer.role === "owner" ? (
            <Link
              href={"/tasks/new" as Route}
              style={{
                display: "inline-flex",
                marginTop: 18,
                borderRadius: 999,
                padding: "12px 18px",
                background: "var(--brand)",
                color: "#fff",
                fontWeight: 700
              }}
            >
              发布新任务
            </Link>
          ) : null}
        </aside>
      </section>
    </MemberShell>
  );
}

const filterStyle = {
  borderRadius: 999,
  border: "1px solid var(--border-soft)",
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
