"use client";

import { useState } from "react";
import { z } from "zod";
import { hasPublicSupabaseEnv } from "../../../lib/env";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser-client";

const loginSchema = z.object({
  email: z.string().email("请输入有效邮箱地址")
});

export function AdminLoginCard({ redirectTo }: { redirectTo: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("输入家主邮箱后发送登录链接。");
  const [loading, setLoading] = useState(false);

  const envReady = hasPublicSupabaseEnv();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = loginSchema.safeParse({ email });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "邮箱格式不正确");
      return;
    }

    if (!envReady) {
      setMessage("尚未配置 Supabase 环境变量，当前表单处于演示模式。");
      return;
    }

    try {
      setLoading(true);
      setMessage("正在发送管理台登录链接...");
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.data.email,
        options: {
          emailRedirectTo: redirectTo
        }
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("管理台登录链接已发送，请检查邮箱。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-panel" style={{ padding: 20 }}>
      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ color: "var(--muted)", fontSize: 14 }}>家主邮箱</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="owner@example.com"
          style={{
            borderRadius: 16,
            border: "1px solid var(--border)",
            padding: "14px 16px",
            fontSize: 16,
            outline: "none",
            background: "rgba(255,255,255,0.86)"
          }}
        />
      </label>
      <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>{message}</p>
      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 8,
          border: 0,
          borderRadius: 999,
          padding: "12px 18px",
          background: loading ? "#8bb8a4" : "var(--brand)",
          color: "#fff",
          cursor: "pointer"
        }}
      >
        {loading ? "发送中..." : "发送登录链接"}
      </button>
    </form>
  );
}
