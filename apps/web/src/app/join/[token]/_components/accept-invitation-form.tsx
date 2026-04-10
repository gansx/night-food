"use client";

import { useState } from "react";

export function AcceptInvitationForm({
  token,
  suggestedName
}: {
  token: string;
  suggestedName: string;
}) {
  const [displayName, setDisplayName] = useState(suggestedName);
  const [message, setMessage] = useState("确认后将加入对应家庭。");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("正在加入家庭...");

    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          displayName
        })
      });

      const payload = (await response.json()) as { error?: string; redirectTo?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "加入家庭失败");
        return;
      }

      setMessage("已成功加入家庭，正在返回首页...");
      window.location.href = payload.redirectTo ?? "/";
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: 20 }}>
      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 14 }}>显示名称</span>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="例如：妈妈"
          style={{
            borderRadius: 16,
            border: "1px solid var(--border-soft)",
            padding: "14px 16px",
            fontSize: 16,
            outline: "none",
            background: "rgba(255,255,255,0.82)"
          }}
        />
      </label>

      <p className="section-copy">{message}</p>

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 8,
          border: 0,
          borderRadius: 999,
          padding: "12px 18px",
          background: loading ? "#b9896a" : "var(--brand)",
          color: "#fff",
          cursor: "pointer"
        }}
      >
        {loading ? "加入中..." : "确认加入家庭"}
      </button>
    </form>
  );
}

