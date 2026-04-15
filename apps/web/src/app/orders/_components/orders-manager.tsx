"use client";

import { canMemberCancelOrder, getOrderStatusLabel } from "@night-food/lib";
import type { OrderStatus } from "@night-food/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { OrbitSelect } from "../../_components/orbit-select";
import { CancelOrderButton } from "./cancel-order-button";

export type MemberOrderRow = {
  id: string;
  order_number: string;
  status: string;
  total_points: number | null;
  created_at: string;
};

const orderStatusOptions = ["all", "submitted", "confirmed", "preparing", "completed", "cancelled"] as const;

export function OrdersManager({ initialOrders }: { initialOrders: MemberOrderRow[] }) {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<(typeof orderStatusOptions)[number]>("all");

  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword.trim()) {
      params.set("q", keyword.trim());
    }
    if (status !== "all") {
      params.set("status", status);
    }
    window.history.replaceState(null, "", params.toString() ? `/orders?${params.toString()}` : "/orders");
  }, [keyword, status]);

  const filteredOrders = initialOrders.filter((order) => {
    const matchesStatus = status === "all" || order.status === status;
    const matchesKeyword = !keyword.trim() || order.order_number.toLowerCase().includes(keyword.trim().toLowerCase());
    return matchesStatus && matchesKeyword;
  });

  return (
    <section className="glass-panel" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 className="section-title">订单记录</h2>
          <p style={{ margin: "8px 0 0", color: "var(--text-muted)", lineHeight: 1.6 }}>
            筛选会在当前页面静默完成，待确认和已确认订单可以主动取消。
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索订单号"
            style={filterInputStyle}
          />
          <div style={{ minWidth: 160 }}>
            <OrbitSelect
              value={status}
              onChange={(nextStatus) => setStatus(nextStatus as (typeof orderStatusOptions)[number])}
              options={orderStatusOptions.map((option) => ({
                value: option,
                label: option === "all" ? "全部状态" : getOrderStatusLabel(option)
              }))}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
        {filteredOrders.length ? (
          filteredOrders.map((order) => {
            const statusValue = order.status as OrderStatus;
            const canCancel = canMemberCancelOrder(statusValue);

            return (
              <article
                key={order.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 16,
                  alignItems: "center",
                  padding: 16,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.72)",
                  border: "1px solid var(--border-soft)"
                }}
              >
                <div>
                  <Link href={`/orders/${order.id}`} style={{ fontWeight: 800 }}>
                    {order.order_number}
                  </Link>
                  <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7 }}>
                    下单时间：{new Date(order.created_at).toLocaleString("zh-CN")}
                    <br />
                    状态：{getOrderStatusLabel(statusValue)} | 合计：{Number(order.total_points)} 积分
                  </div>
                </div>
                {canCancel ? <CancelOrderButton orderId={order.id} /> : null}
              </article>
            );
          })
        ) : (
          <div style={{ color: "var(--text-muted)" }}>当前筛选条件下还没有订单。</div>
        )}
      </div>
    </section>
  );
}

const filterInputStyle = {
  borderRadius: 999,
  border: "1px solid var(--border-soft)",
  padding: "10px 14px",
  background: "rgba(255,255,255,0.82)"
} satisfies React.CSSProperties;
