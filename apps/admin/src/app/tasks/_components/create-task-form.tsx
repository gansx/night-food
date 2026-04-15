"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TaskAssigneeOption = {
  id: string;
  label: string;
};

export function CreateTaskForm({
  householdId,
  members
}: {
  householdId: string;
  members: TaskAssigneeOption[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    householdId,
    title: "",
    description: "",
    rewardPoints: 10,
    dueAt: "",
    assignedUserId: ""
  });
  const [message, setMessage] = useState("发布后，公开任务会出现在任务中心；指派任务会直接进入成员的我的任务。");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("正在发布任务...");

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : ""
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "发布任务失败。");
        return;
      }

      setForm((current) => ({
        ...current,
        title: "",
        description: "",
        rewardPoints: 10,
        dueAt: "",
        assignedUserId: ""
      }));
      setMessage("任务已发布。");
      router.refresh();
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-panel" data-testid="create-task-form" style={{ padding: 20 }}>
      <h3 style={{ margin: 0, fontSize: 18 }}>发布任务</h3>
      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>任务标题</span>
          <input
            data-testid="create-task-title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="例如：饭后洗碗"
            style={inputStyle}
          />
        </label>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>任务说明</span>
          <textarea
            data-testid="create-task-description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="补充完成标准、时间要求等"
            style={{ ...inputStyle, minHeight: 96, resize: "vertical" }}
          />
        </label>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>指派成员</span>
          <select
            data-testid="create-task-assignee"
            value={form.assignedUserId}
            onChange={(event) => setForm((current) => ({ ...current, assignedUserId: event.target.value }))}
            style={inputStyle}
          >
            <option value="">不指定，公开领取</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>奖励积分</span>
          <input
            data-testid="create-task-reward"
            type="number"
            min={1}
            value={form.rewardPoints}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                rewardPoints: Number(event.target.value)
              }))
            }
            style={inputStyle}
          />
        </label>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>截止时间</span>
          <input
            data-testid="create-task-due-at"
            type="datetime-local"
            value={form.dueAt}
            onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))}
            style={inputStyle}
          />
        </label>
      </div>

      <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>{message}</p>

      <button type="submit" data-testid="create-task-submit" disabled={loading} style={buttonStyle}>
        {loading ? "发布中..." : "发布任务"}
      </button>
    </form>
  );
}

const inputStyle = {
  borderRadius: 16,
  border: "1px solid var(--border)",
  padding: "14px 16px",
  fontSize: 16,
  outline: "none",
  background: "rgba(255,255,255,0.86)"
} satisfies React.CSSProperties;

const buttonStyle = {
  marginTop: 8,
  border: 0,
  borderRadius: 999,
  padding: "12px 18px",
  background: "var(--brand)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 800
} satisfies React.CSSProperties;
