"use client";

import { useState } from "react";
import type { HouseholdInvitationPayload, HouseholdRole } from "@night-food/types";

export function InviteMemberForm({ householdId }: { householdId: string }) {
  const [form, setForm] = useState<HouseholdInvitationPayload>({
    householdId,
    email: "",
    role: "member"
  });
  const [message, setMessage] = useState("邀请链接会直接显示在这里，后面可以再接邮件或微信通知。");
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setInviteLink("");
    setMessage("正在生成邀请链接...");

    try {
      const response = await fetch("/api/household/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as {
        error?: string;
        inviteUrl?: string;
        message?: string;
      };

      if (!response.ok) {
        setMessage(payload.error ?? "邀请失败。");
        return;
      }

      setInviteLink(payload.inviteUrl ?? "");
      setMessage(payload.message ?? "邀请已创建。");
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-panel" style={{ padding: 20 }}>
      <div style={{ display: "grid", gap: 14 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>家人邮箱</span>
          <input
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="family@example.com"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>角色</span>
          <select
            value={form.role}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                role: event.target.value as HouseholdRole
              }))
            }
            style={inputStyle}
          >
            <option value="member">家庭成员</option>
            <option value="owner">共同家主</option>
          </select>
        </label>
      </div>

      <p style={{ margin: "14px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>{message}</p>

      {inviteLink ? (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 16,
            background: "rgba(255,255,255,0.76)",
            border: "1px solid var(--border)",
            wordBreak: "break-all",
            color: "var(--text)"
          }}
        >
          {inviteLink}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 12,
          border: 0,
          borderRadius: 999,
          padding: "12px 18px",
          background: loading ? "#93b2a4" : "var(--brand)",
          color: "#fff",
          cursor: "pointer"
        }}
      >
        {loading ? "生成中..." : "生成邀请链接"}
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
