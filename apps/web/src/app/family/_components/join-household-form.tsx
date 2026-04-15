"use client";

import { normalizeFamilyCode } from "@night-food/lib";
import type { JoinHouseholdByCodePayload } from "@night-food/types";
import { useState } from "react";

export function JoinHouseholdForm() {
  const [form, setForm] = useState<JoinHouseholdByCodePayload>({ familyCode: "" });
  const [message, setMessage] = useState("向家主索要家庭邀请码，输入后即可加入家庭。");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("正在加入家庭...");

    try {
      const response = await fetch("/api/household/join-by-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const payload = (await response.json()) as { error?: string; redirectTo?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "加入家庭失败");
        return;
      }

      setMessage("加入成功，正在进入家庭首页...");
      window.location.href = payload.redirectTo ?? "/";
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel" data-testid="join-household-form" style={{ padding: 20 }}>
      <h2 className="section-title">输入家庭邀请码</h2>
      <label style={{ display: "grid", gap: 8, marginTop: 16 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 14 }}>家庭邀请码</span>
        <input
          data-testid="join-family-code"
          value={form.familyCode}
          onChange={(event) => setForm({ familyCode: normalizeFamilyCode(event.target.value) })}
          placeholder="例如 8H2K9PQA"
          style={{ ...inputStyle, letterSpacing: "0.12em", textTransform: "uppercase" }}
        />
      </label>
      <p className="section-copy">{message}</p>
      <button type="submit" data-testid="join-household-submit" disabled={loading} style={buttonStyle}>
        {loading ? "加入中..." : "加入家庭"}
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
