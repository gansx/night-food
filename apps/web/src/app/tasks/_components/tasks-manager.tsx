"use client";

import { formatDateTime, getTaskStatusLabel, isTaskExpired } from "@night-food/lib";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { OrbitSelect } from "../../_components/orbit-select";
import { ClaimTaskButton } from "./claim-task-button";
import { SubmitTaskButton } from "./submit-task-button";

export type MemberTaskRow = {
  id: string;
  title: string;
  description: string | null;
  reward_points: number | null;
  status: string;
  assigned_user_id: string | null;
  due_at: string | null;
  created_at: string;
};

const filterOptions = ["all", "open", "claimed", "in_progress", "submitted", "completed", "cancelled"] as const;

export function TasksManager({
  initialTasks,
  taskApprovalRequired,
  viewerUserId,
  viewerRole
}: {
  initialTasks: MemberTaskRow[];
  taskApprovalRequired: boolean;
  viewerUserId: string;
  viewerRole: string | null;
}) {
  const [filter, setFilter] = useState<(typeof filterOptions)[number]>("all");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") {
      params.set("filter", filter);
    }
    window.history.replaceState(null, "", params.toString() ? `/tasks?${params.toString()}` : "/tasks");
  }, [filter]);

  const filteredTasks = initialTasks.filter((task) => filter === "all" || task.status === filter);
  const openTasks = filteredTasks.filter(
    (task) => task.status === "open" && (!task.assigned_user_id || task.assigned_user_id === viewerUserId)
  );
  const myTasks = filteredTasks.filter((task) => task.assigned_user_id === viewerUserId);

  return (
    <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 320px)", gap: 20 }}>
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
          {taskApprovalRequired ? "任务完成后需要家主审核才会发放积分。" : "任务完成后自动到账积分。"}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ minWidth: 160 }}>
            <OrbitSelect
              value={filter}
              onChange={(nextFilter) => setFilter(nextFilter as (typeof filterOptions)[number])}
              options={filterOptions.map((option) => ({
                value: option,
                label: option === "all" ? "全部任务" : getTaskStatusLabel(option)
              }))}
            />
          </div>
        </div>

        <h2 className="section-title">可领取任务</h2>
        <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
          {openTasks.length ? (
            openTasks.map((task) => {
              const expired = isTaskExpired(task.due_at);
              return (
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
                        {task.title}
                      </Link>
                      <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 14 }}>
                        截止：{formatDateTime(task.due_at)}
                        {expired ? " | 已过期" : ""}
                      </div>
                    </div>
                    <span style={{ color: "var(--accent)", fontWeight: 800 }}>+{Number(task.reward_points)}</span>
                  </div>
                  <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 14 }}>
                    {task.description || "家庭任务"}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <ClaimTaskButton taskId={task.id} disabledReason={expired ? "这个任务已经过期，无法领取。" : undefined} />
                  </div>
                </article>
              );
            })
          ) : (
            <div style={{ color: "var(--text-muted)" }}>目前没有开放任务。</div>
          )}
        </div>
      </div>

      <aside className="glass-panel" style={{ padding: 24 }}>
        <h2 className="section-title">我的任务</h2>
        <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
          {myTasks.length ? (
            myTasks.map((task) => {
              const expired = isTaskExpired(task.due_at);
              return (
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
                    {task.title}
                  </Link>
                  <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 14 }}>
                    状态：{getTaskStatusLabel(task.status as never)} | 奖励 {Number(task.reward_points)} 积分
                  </div>
                  <div style={{ marginTop: 6, color: "var(--text-muted)", fontSize: 14 }}>
                    截止：{formatDateTime(task.due_at)}
                    {expired && ["claimed", "in_progress"].includes(task.status) ? " | 已过期" : ""}
                  </div>
                  {["claimed", "in_progress"].includes(task.status) ? (
                    <div style={{ marginTop: 12 }}>
                      <SubmitTaskButton taskId={task.id} />
                    </div>
                  ) : null}
                </article>
              );
            })
          ) : (
            <div style={{ color: "var(--text-muted)" }}>你还没有领取或被指派任务。</div>
          )}
        </div>

        {viewerRole === "owner" ? (
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
  );
}
