"use client";

import type { HouseholdCreatePayload } from "@night-food/types";
import { useState } from "react";

export function CreateHouseholdForm() {
  const [form, setForm] = useState<HouseholdCreatePayload>({ householdName: "" });
  const [message, setMessage] = useState("如果你是家主，可以先创建家庭，系统会生成邀请码。");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("正在创建家庭...");

    try {
      const response = await fetch("/api/household/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const payload = (await response.json()) as { error?: string; familyCode?: string; redirectTo?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "创建家庭失败");
        return;
      }

      setMessage(`家庭创建成功，邀请码是 ${payload.familyCode ?? "已生成"}，正在进入首页...`);
      window.location.href = payload.redirectTo ?? "/";
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: 20 }}>
      <h2 className="section-title">创建家庭</h2>
      <label style={{ display: "grid", gap: 8, marginTop: 16 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 14 }}>家庭名称</span>
        <input
          value={form.householdName}
          onChange={(event) => setForm({ householdName: event.target.value })}
          placeholder="例如 夜食坊之家"
          style={inputStyle}
        />
      </label>
      <p className="section-copy">{message}</p>
      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? "创建中..." : "创建家庭"}
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

const buttonStyle = {
  marginTop: 8,
  border: 0,
  borderRadius: 999,
  padding: "12px 18px",
  background: "var(--brand)",
  color: "#fff",
  cursor: "pointer"
} satisfies React.CSSProperties;
