"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchAppPath } from "../../../lib/base-path";

export function ProfileForm({
  initialDisplayName,
  initialPhone
}: {
  initialDisplayName: string;
  initialPhone: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [phone, setPhone] = useState(initialPhone);
  const [message, setMessage] = useState("更新后会同步到家庭成员视图里。");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("正在保存个人资料...");

    try {
      const response = await fetchAppPath("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          displayName,
          phone
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "保存失败");
        return;
      }

      setMessage("个人资料已更新。");
      router.refresh();
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: 24 }}>
      <h2 className="section-title">编辑个人资料</h2>
      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--text-muted)", fontSize: 14 }}>昵称</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="给自己起一个家庭内显示的名字"
            style={inputStyle}
          />
        </label>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--text-muted)", fontSize: 14 }}>手机号</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="可选，用于家庭联系"
            style={inputStyle}
          />
        </label>
      </div>

      <p style={{ margin: "14px 0 0", color: "var(--text-muted)", lineHeight: 1.6 }}>{message}</p>

      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? "保存中..." : "保存资料"}
      </button>
    </form>
  );
}

const inputStyle = {
  borderRadius: 16,
  border: "1px solid var(--border-soft)",
  padding: "14px 16px",
  background: "rgba(255,255,255,0.82)",
  outline: "none"
} satisfies React.CSSProperties;

const buttonStyle = {
  marginTop: 12,
  border: 0,
  borderRadius: 999,
  padding: "12px 18px",
  background: "var(--brand)",
  color: "#fff",
  cursor: "pointer"
} satisfies React.CSSProperties;
