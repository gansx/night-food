"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdateTaskStatusForm({
  taskId,
  nextStatus,
  label
}: {
  taskId: string;
  nextStatus: "open" | "cancelled";
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleClick() {
    const note =
      window.prompt(nextStatus === "cancelled" ? "请输入取消原因（可选）" : "请输入重开备注（可选）") ?? "";

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: nextStatus, note })
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "操作失败。");
        return;
      }
      router.refresh();
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          border: 0,
          borderRadius: 999,
          padding: "10px 14px",
          background: nextStatus === "cancelled" ? "var(--warn)" : "var(--brand-dark)",
          color: "#fff",
          cursor: "pointer"
        }}
      >
        {loading ? "提交中..." : label}
      </button>
      {message ? <span style={{ color: "var(--warn)", fontSize: 14 }}>{message}</span> : null}
    </div>
  );
}
