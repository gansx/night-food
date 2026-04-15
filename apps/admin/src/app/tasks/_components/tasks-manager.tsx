"use client";

import { formatDateTime, getTaskStatusLabel, isTaskExpired } from "@night-food/lib";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { OrbitSelect } from "../../_components/orbit-select";
import { ApproveTaskButton } from "./approve-task-button";
import { CreateTaskForm } from "./create-task-form";

export type AdminTaskRow = {
  id: string;
  title: string;
  description: string | null;
  reward_points: number | null;
  status: string;
  assigned_user_id: string | null;
  due_at: string | null;
  created_at: string;
  assignedLabel: string;
};

type TaskAssigneeOption = {
  id: string;
  label: string;
};

const statusOptions = ["all", "open", "claimed", "in_progress", "submitted", "completed", "cancelled"] as const;

export function TasksManager({
  initialTasks,
  householdId,
  members
}: {
  initialTasks: AdminTaskRow[];
  householdId: string;
  members: TaskAssigneeOption[];
}) {
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("all");

  useEffect(() => {
    const params = new URLSearchParams();
    if (status !== "all") {
      params.set("status", status);
    }
    window.history.replaceState(null, "", params.toString() ? `/tasks?${params.toString()}` : "/tasks");
  }, [status]);

  const filteredTasks = initialTasks.filter((task) => status === "all" || task.status === status);

  return (
    <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(300px, 0.85fr)", gap: 20 }}>
      <div className="admin-panel" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>任务列表</h2>
            <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
              筛选会在当前页面静默完成，公开任务由成员领取，指派任务会进入成员的我的任务。
            </p>
          </div>

          <div style={{ minWidth: 160 }}>
            <OrbitSelect
              value={status}
              onChange={(nextStatus) => setStatus(nextStatus as (typeof statusOptions)[number])}
              options={statusOptions.map((option) => ({
                value: option,
                label: option === "all" ? "全部状态" : getTaskStatusLabel(option)
              }))}
            />
          </div>
        </div>

        <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
          {filteredTasks.length ? (
            filteredTasks.map((task) => {
              const expired = isTaskExpired(task.due_at);
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
                        {task.title}
                      </Link>
                      <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 14, lineHeight: 1.7 }}>
                        {getTaskStatusLabel(task.status as never)}
                        {expired && ["open", "claimed", "in_progress"].includes(task.status) ? " | 已过期" : ""} | 奖励{" "}
                        {Number(task.reward_points)} 积分
                        <br />
                        成员：{task.assignedLabel}
                        <br />
                        截止：{formatDateTime(task.due_at)}
                      </div>
                    </div>
                    <span style={{ color: "var(--brand)", fontWeight: 700 }}>{formatDateTime(task.created_at)}</span>
                  </div>
                  {task.description ? (
                    <div style={{ marginTop: 10, color: "var(--muted)", lineHeight: 1.6 }}>{task.description}</div>
                  ) : null}
                  {task.status === "submitted" ? (
                    <div style={{ marginTop: 12 }}>
                      <ApproveTaskButton taskId={task.id} />
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

      <CreateTaskForm householdId={householdId} members={members} />
    </section>
  );
}
