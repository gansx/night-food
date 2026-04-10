"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateTaskCard({ householdId }: { householdId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    householdId,
    title: "",
    description: "",
    rewardPoints: 10,
    dueAt: ""
  });
  const [message, setMessage] = useState("家主发布后，任务会立即出现在成员端任务中心。");
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

      setMessage("任务发布成功。");
      router.push("/tasks");
      router.refresh();
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="glass-panel" onSubmit={handleSubmit} style={{ padding: 24, display: "grid", gap: 14 }}>
      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 14 }}>任务标题</span>
        <input
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder="例如：倒垃圾"
          style={inputStyle}
        />
      </label>

      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 14 }}>任务说明</span>
        <textarea
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="简单说明完成标准"
          style={{ ...inputStyle, minHeight: 96, resize: "vertical" }}
        />
      </label>

      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 14 }}>奖励积分</span>
        <input
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
        <span style={{ color: "var(--text-muted)", fontSize: 14 }}>截止时间</span>
        <input
          type="datetime-local"
          value={form.dueAt}
          onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))}
          style={inputStyle}
        />
      </label>

      <p className="section-copy">{message}</p>

      <button
        type="submit"
        disabled={loading}
        style={{
          border: 0,
          borderRadius: 999,
          padding: "12px 18px",
          background: "var(--brand)",
          color: "#fff",
          cursor: "pointer"
        }}
      >
        {loading ? "发布中..." : "发布任务"}
      </button>
    </form>
  );
}

const inputStyle = {
  borderRadius: 16,
  border: "1px solid var(--border-soft)",
  padding: "14px 16px",
  fontSize: 16,
  outline: "none",
  background: "rgba(255,255,255,0.82)"
} satisfies React.CSSProperties;
