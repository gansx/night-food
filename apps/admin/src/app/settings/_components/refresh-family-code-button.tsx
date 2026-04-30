"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchAppPath } from "../../../lib/base-path";

export function RefreshFamilyCodeButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    setMessage("正在刷新邀请码...");

    try {
      const response = await fetchAppPath("/api/household/code/refresh", {
        method: "POST"
      });
      const payload = (await response.json()) as { error?: string; familyCode?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "刷新邀请码失败");
        return;
      }

      setMessage(`新邀请码：${payload.familyCode ?? "已刷新"}`);
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
        disabled={loading}
        onClick={handleClick}
        style={{
          border: 0,
          borderRadius: 999,
          padding: "10px 14px",
          background: loading ? "#93b2a4" : "var(--brand)",
          color: "#fff",
          cursor: "pointer",
          fontWeight: 700
        }}
      >
        {loading ? "刷新中..." : "刷新邀请码"}
      </button>
      {message ? <div style={{ color: "var(--muted)", fontSize: 13 }}>{message}</div> : null}
    </div>
  );
}
