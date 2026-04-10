"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdateOrderStatusButton({
  orderId,
  targetStatus,
  label,
  tone = "primary"
}: {
  orderId: string;
  targetStatus: "confirmed" | "preparing" | "completed" | "cancelled";
  label: string;
  tone?: "primary" | "danger" | "neutral";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    const note =
      targetStatus === "cancelled"
        ? window.prompt("请输入取消原因，方便成员查看。", "家主取消订单") ?? ""
        : window.prompt("可选：补充这次状态变更备注。", "") ?? "";

    if (targetStatus === "cancelled" && !window.confirm("确认要取消这个订单吗？积分会退回给成员。")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: targetStatus,
          note
        })
      });

      if (response.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{
        border: tone === "neutral" ? "1px solid var(--border)" : 0,
        borderRadius: 999,
        padding: "10px 14px",
        background:
          tone === "danger"
            ? "#b44d2a"
            : tone === "neutral"
              ? "rgba(255,255,255,0.8)"
              : "var(--brand)",
        color: tone === "neutral" ? "var(--text)" : "#fff",
        cursor: "pointer"
      }}
    >
      {loading ? "处理中..." : label}
    </button>
  );
}
