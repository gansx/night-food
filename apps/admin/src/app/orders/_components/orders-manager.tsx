"use client";

import { getAllowedOrderTransitions, getOrderStatusLabel } from "@night-food/lib";
import type { OrderStatus } from "@night-food/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { OrbitSelect } from "../../_components/orbit-select";
import { UpdateOrderStatusButton } from "./update-order-status-button";

export type AdminOrderRow = {
  id: string;
  order_number: string;
  status: string;
  total_points: number | null;
  created_at: string;
  remark: string | null;
};

export type AdminOrderItemRow = {
  id: string;
  orderId: string;
  quantity: number;
  subtotalPoints: number;
  name: string;
};

const orderStatusOptions = ["all", "submitted", "confirmed", "preparing", "completed", "cancelled"] as const;

export function OrdersManager({
  initialOrders,
  initialOrderItems
}: {
  initialOrders: AdminOrderRow[];
  initialOrderItems: AdminOrderItemRow[];
}) {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<(typeof orderStatusOptions)[number]>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword.trim()) {
      params.set("q", keyword.trim());
    }
    if (status !== "all") {
      params.set("status", status);
    }
    if (from) {
      params.set("from", from);
    }
    if (to) {
      params.set("to", to);
    }
    window.history.replaceState(null, "", params.toString() ? `/orders?${params.toString()}` : "/orders");
  }, [from, keyword, status, to]);

  const orderItemMap = useMemo(() => {
    const map = new Map<string, AdminOrderItemRow[]>();
    for (const item of initialOrderItems) {
      const current = map.get(item.orderId) ?? [];
      current.push(item);
      map.set(item.orderId, current);
    }
    return map;
  }, [initialOrderItems]);

  const filteredOrders = initialOrders.filter((order) => {
    const createdAt = new Date(order.created_at).getTime();
    const matchesKeyword =
      !keyword.trim() ||
      order.order_number.toLowerCase().includes(keyword.trim().toLowerCase()) ||
      (order.remark ?? "").toLowerCase().includes(keyword.trim().toLowerCase());
    const matchesStatus = status === "all" || order.status === status;
    const matchesFrom = !from || createdAt >= new Date(`${from}T00:00:00`).getTime();
    const matchesTo = !to || createdAt <= new Date(`${to}T23:59:59`).getTime();

    return matchesKeyword && matchesStatus && matchesFrom && matchesTo;
  });

  return (
    <section className="admin-panel" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>订单队列</h2>
          <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
            筛选会在当前页面静默完成，不会重新进入页面。
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="订单号或备注"
            style={filterStyle}
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
          <input value={from} onChange={(event) => setFrom(event.target.value)} type="date" style={filterStyle} />
          <input value={to} onChange={(event) => setTo(event.target.value)} type="date" style={filterStyle} />
        </div>
      </div>

      <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
        {filteredOrders.length ? (
          filteredOrders.map((order) => {
            const transitions = getAllowedOrderTransitions(order.status as OrderStatus);
            const items = orderItemMap.get(order.id) ?? [];

            return (
              <article
                key={order.id}
                style={{
                  padding: 16,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.72)",
                  border: "1px solid var(--border)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <Link href={`/orders/${order.id}`} style={{ fontWeight: 700, color: "var(--text)" }}>
                    {order.order_number}
                  </Link>
                  <span style={{ color: "var(--brand)", fontWeight: 700 }}>
                    {getOrderStatusLabel(order.status as OrderStatus)}
                  </span>
                </div>

                <div style={{ marginTop: 8, color: "var(--muted)", lineHeight: 1.7 }}>
                  合计：{Number(order.total_points)} 积分
                  <br />
                  下单时间：{new Date(order.created_at).toLocaleString("zh-CN")}
                  {order.remark ? (
                    <>
                      <br />
                      备注：{order.remark}
                    </>
                  ) : null}
                </div>

                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  {items.length ? (
                    items.map((item) => (
                      <div key={item.id} style={{ padding: 12, borderRadius: 14, background: "var(--panel-alt)" }}>
                        {item.name} x {item.quantity} | {item.subtotalPoints} 积分
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "var(--muted)" }}>暂无订单明细。</div>
                  )}
                </div>

                {transitions.length ? (
                  <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {transitions.map((nextStatus) => (
                      <UpdateOrderStatusButton
                        key={nextStatus}
                        orderId={order.id}
                        targetStatus={nextStatus as "confirmed" | "preparing" | "completed" | "cancelled"}
                        label={
                          nextStatus === "confirmed"
                            ? "确认订单"
                            : nextStatus === "preparing"
                              ? "开始制作"
                              : nextStatus === "completed"
                                ? "完成订单"
                                : "取消订单"
                        }
                        tone={nextStatus === "cancelled" ? "danger" : "primary"}
                      />
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })
        ) : (
          <div style={{ color: "var(--muted)" }}>当前筛选条件下没有订单。</div>
        )}
      </div>
    </section>
  );
}

const filterStyle = {
  borderRadius: 999,
  border: "1px solid var(--border)",
  padding: "10px 14px",
  background: "rgba(255,255,255,0.82)"
} satisfies React.CSSProperties;
