"use client";

import { createAuthEmailFromUsername, isValidUsername, normalizeUsername } from "@night-food/lib";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { navigateToAppPath } from "../../../lib/base-path";
import { hasPublicSupabaseEnv } from "../../../lib/env";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser-client";

const loginSchema = z.object({
  username: z.string().trim().refine(isValidUsername, "账号只能包含小写字母、数字和下划线，长度 3-24 位"),
  password: z.string().min(1, "请输入密码")
});

export function AdminLoginCard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("家主使用账号和密码登录，不再发送邮箱登录链接。");
  const [loading, setLoading] = useState(false);

  const envReady = hasPublicSupabaseEnv();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = loginSchema.safeParse({ username, password });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "请检查账号和密码");
      return;
    }

    if (!envReady) {
      setMessage("尚未配置 Supabase 环境变量，当前表单无法登录。");
      return;
    }

    try {
      setLoading(true);
      setMessage("正在登录管理台...");
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: createAuthEmailFromUsername(parsed.data.username),
        password: parsed.data.password
      });

      if (error) {
        setMessage("账号或密码不正确。");
        return;
      }

      setMessage("登录成功，正在进入管理台...");
      navigateToAppPath("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-panel" style={{ padding: 20 }}>
      <div style={{ display: "grid", gap: 14 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>账号</span>
          <input
            value={username}
            onChange={(event) => setUsername(normalizeUsername(event.target.value))}
            placeholder="例如 owner_01"
            autoComplete="username"
            style={inputStyle}
          />
        </label>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>密码</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="请输入密码"
            type="password"
            autoComplete="current-password"
            style={inputStyle}
          />
        </label>
      </div>
      <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>{message}</p>
      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? "登录中..." : "登录管理台"}
      </button>
      <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 14 }}>
        还没有家主账号？{" "}
        <Link href="/register" style={{ color: "var(--brand)", fontWeight: 700 }}>
          先注册
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
