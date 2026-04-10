"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RevokeInvitationButton({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleClick() {
    if (!window.confirm("确认撤销这个邀请吗？撤销后原链接将失效。")) {
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/household/invitations/${invitationId}`, {
        method: "PATCH"
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "撤销失败。");
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
          border: "1px solid var(--border)",
          borderRadius: 999,
          padding: "8px 12px",
          background: "#fff",
          cursor: "pointer"
        }}
      >
        {loading ? "撤销中..." : "撤销邀请"}
      </button>
      {message ? <span style={{ color: "var(--warn)", fontSize: 14 }}>{message}</span> : null}
    </div>
  );
}
