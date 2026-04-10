import { getAllowedOrderTransitions, getOrderStatusLabel } from "@night-food/lib";
import type { OrderStatus } from "@night-food/types";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { getAdminViewerSummary } from "../../lib/auth";
import { createSupabaseServerClient } from "../../lib/supabase/server-client";
import { UpdateOrderStatusButton } from "./_components/update-order-status-button";

type OrderItemSummary = {
  id: string;
  orderId: string;
  quantity: number;
  subtotalPoints: number;
  name: string;
};

export default async function AdminOrdersPage() {
  const viewer = await getAdminViewerSummary();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "owner") {
    redirect("/");
  }

  if (!viewer.householdId) {
    return (
      <AdminShell title="订单管理" description="你还没有家庭空间，先完成家庭初始化。">
        <section className="admin-panel" style={{ padding: 24 }}>
          <Link href="/setup/owner" style={{ color: "var(--brand)", fontWeight: 700 }}>
            立即创建家庭
          </Link>
        </section>
      </AdminShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, total_points, created_at, remark")
    .eq("household_id", viewer.householdId)
    .order("created_at", { ascending: false });

  const orderIds = (orders ?? []).map((order) => order.id as string);
  const { data: orderItems } = orderIds.length
    ? await supabase
        .from("order_items")
        .select("id, order_id, quantity, subtotal_points, menu_items(name)")
        .in("order_id", orderIds)
    : { data: [] as Array<Record<string, unknown>> };

  const orderItemMap = new Map<string, OrderItemSummary[]>();
  for (const item of orderItems ?? []) {
    const orderId = item.order_id as string;
    const menuItem = Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items;
    const current = orderItemMap.get(orderId) ?? [];
    current.push({
      id: item.id as string,
      orderId,
      quantity: Number(item.quantity),
      subtotalPoints: Number(item.subtotal_points),
      name: (menuItem?.name as string | undefined) ?? "已删除菜品"
    });
    orderItemMap.set(orderId, current);
  }

  return (
    <AdminShell
      title="订单管理"
      description="查看全部家庭订单，并推进确认、制作、完成与取消等状态。"
    >
      <section className="admin-panel" style={{ padding: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>待处理订单</h2>
        <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
          {(orders ?? []).length ? (
            orders?.map((order) => {
              const transitions = getAllowedOrderTransitions(order.status as OrderStatus);
              const items = orderItemMap.get(order.id as string) ?? [];

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
                    <Link href={`/orders/${order.id as string}`} style={{ fontWeight: 700, color: "var(--text)" }}>
                      {order.order_number as string}
                    </Link>
                    <span style={{ color: "var(--brand)", fontWeight: 700 }}>
                      {getOrderStatusLabel(order.status as OrderStatus)}
                    </span>
                  </div>

                  <div style={{ marginTop: 8, color: "var(--muted)", lineHeight: 1.7 }}>
                    合计：{Number(order.total_points)} 积分
                    <br />
                    下单时间：{new Date(order.created_at as string).toLocaleString("zh-CN")}
                    {order.remark ? (
                      <>
                        <br />
                        备注：{order.remark as string}
                      </>
                    ) : null}
                  </div>

                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {items.length ? (
                      items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            padding: 12,
                            borderRadius: 14,
                            background: "var(--panel-alt)"
                          }}
                        >
                          {item.name} x {item.quantity} | {item.subtotalPoints} 积分
                        </div>
                      ))
                    ) : (
                      <div style={{ color: "var(--muted)" }}>暂无订单明细。</div>
                    )}
                  </div>

                  {transitions.length ? (
                    <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {transitions.map((status) => (
                        <UpdateOrderStatusButton
                          key={status}
                          orderId={order.id as string}
                          targetStatus={status as "confirmed" | "preparing" | "completed" | "cancelled"}
                          label={
                            status === "confirmed"
                              ? "确认订单"
                              : status === "preparing"
                                ? "开始制作"
                                : status === "completed"
                                  ? "完成订单"
                                  : "取消订单"
                          }
                          tone={status === "cancelled" ? "danger" : "primary"}
                        />
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })
          ) : (
            <div style={{ color: "var(--muted)" }}>当前家庭还没有订单。</div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
