"use client";

import { createAuthEmailFromUsername, isValidUsername, normalizeUsername } from "@night-food/lib";
import type { RegisterAccountPayload } from "@night-food/types";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser-client";

const registerSchema = z.object({
  username: z.string().trim().refine(isValidUsername, "账号只能包含小写字母、数字和下划线，长度 3-24 位"),
  password: z.string().min(6, "密码至少 6 位"),
  displayName: z.string().trim().min(1, "请填写昵称").max(24, "昵称不要超过 24 个字符")
});

export function AdminRegisterCard() {
  const [form, setForm] = useState<RegisterAccountPayload>({
    username: "",
    password: "",
    displayName: ""
  });
  const [message, setMessage] = useState("注册后会自动登录，然后进入创建家庭页面。");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "请检查注册信息");
      return;
    }

    try {
      setLoading(true);
      setMessage("正在创建家主账号...");

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(parsed.data)
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "注册失败");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: createAuthEmailFromUsername(parsed.data.username),
        password: parsed.data.password
      });

      if (error) {
        setMessage("账号已创建，请返回登录页手动登录。");
        return;
      }

      setMessage("注册成功，正在进入家庭创建...");
      window.location.href = "/setup/owner";
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-panel" data-testid="admin-register-form" style={{ padding: 20 }}>
      <div style={{ display: "grid", gap: 14 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>账号</span>
          <input
            data-testid="admin-register-username"
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: normalizeUsername(event.target.value) }))}
            placeholder="3-24 位，小写字母/数字/下划线"
            autoComplete="username"
            style={inputStyle}
          />
        </label>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>昵称</span>
          <input
            data-testid="admin-register-display-name"
            value={form.displayName}
            onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
            placeholder="例如 爸爸"
            autoComplete="name"
            style={inputStyle}
          />
        </label>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>密码</span>
          <input
            data-testid="admin-register-password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="至少 6 位"
            type="password"
            autoComplete="new-password"
            style={inputStyle}
          />
        </label>
      </div>

      <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>{message}</p>
      <button type="submit" data-testid="admin-register-submit" disabled={loading} style={buttonStyle}>
        {loading ? "注册中..." : "注册家主账号"}
      </button>
      <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 14 }}>
        已经有账号？{" "}
        <Link href="/login" style={{ color: "var(--brand)", fontWeight: 700 }}>
          去登录
        </Link>
      </div>
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
