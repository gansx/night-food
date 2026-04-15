"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCancel() {
    if (!window.confirm("确定要取消这个订单吗？积分会自动退回。")) {
      return;
    }

    setLoading(true);
    setMessage("正在取消订单...");

    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST"
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "取消订单失败。");
        return;
      }

      setMessage("订单已取消，积分已退回。");
      router.refresh();
    } catch {
      setMessage("网络异常，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button
        type="button"
        data-testid="cancel-order-button"
        onClick={handleCancel}
        disabled={loading}
        style={{
          border: "1px solid rgba(255, 129, 77, 0.48)",
          borderRadius: 999,
          padding: "10px 14px",
          background: "rgba(255, 129, 77, 0.12)",
          color: "var(--accent)",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: 800
        }}
      >
        {loading ? "取消中..." : "取消订单"}
      </button>
      {message ? <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{message}</span> : null}
    </div>
  );
}
