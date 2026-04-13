"use client";

import type { HouseholdBootstrapPayload } from "@night-food/types";
import { useState } from "react";

export function OwnerBootstrapForm() {
  const [form, setForm] = useState<HouseholdBootstrapPayload>({
    householdName: "",
    displayName: ""
  });
  const [message, setMessage] = useState("创建完成后，你会成为该家庭的家主，并获得家庭邀请码。");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("正在创建家庭...");

    try {
      const response = await fetch("/api/household/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as { error?: string; redirectTo?: string; familyCode?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "创建家庭失败");
        return;
      }

      setMessage(`家庭创建成功，邀请码是 ${payload.familyCode ?? "已生成"}，正在跳转到成员管理...`);
      window.location.href = payload.redirectTo ?? "/members";
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
          <span style={{ color: "var(--muted)", fontSize: 14 }}>家庭名称</span>
          <input
            value={form.householdName}
            onChange={(event) => setForm((current) => ({ ...current, householdName: event.target.value }))}
            placeholder="例如：夜食坊之家"
            style={inputStyle}
          />
        </label>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>你的显示名称</span>
          <input
            value={form.displayName ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
            placeholder="例如：爸爸"
            style={inputStyle}
          />
        </label>
      </div>

      <p style={{ margin: "14px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>{message}</p>

      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? "创建中..." : "创建我的家庭"}
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
  cursor: "pointer"
} satisfies React.CSSProperties;
