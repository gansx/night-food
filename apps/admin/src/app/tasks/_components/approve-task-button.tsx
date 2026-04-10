"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApproveTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleApprove() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/tasks/${taskId}/approve`, {
        method: "POST"
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "审批失败。");
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
        onClick={handleApprove}
        disabled={loading}
        style={{
          border: 0,
          borderRadius: 999,
          padding: "10px 14px",
          background: "var(--brand)",
          color: "#fff",
          cursor: "pointer"
        }}
      >
        {loading ? "审批中..." : "审批完成"}
      </button>
      {message ? <span style={{ color: "var(--warn)", fontSize: 14 }}>{message}</span> : null}
    </div>
  );
}
