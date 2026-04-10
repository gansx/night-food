"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ClaimTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleClaim() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/tasks/${taskId}/claim`, {
        method: "POST"
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "领取失败。");
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
        onClick={handleClaim}
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
        {loading ? "领取中..." : "领取任务"}
      </button>
      {message ? <span style={{ color: "var(--brand-dark)", fontSize: 14 }}>{message}</span> : null}
    </div>
  );
}
