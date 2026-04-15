import { getAllowedOrderTransitions, getOrderStatusLabel } from "@night-food/lib";
import type { OrderStatus } from "@night-food/types";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { OrbitFormSelect } from "../_components/orbit-select";
import { getAdminViewerSummary } from "../../lib/auth";
import { createSupabaseServiceRoleClient } from "../../lib/supabase/service-role-client";
import { UpdateOrderStatusButton } from "./_components/update-order-status-button";

type OrderItemSummary = {
  id: string;
  orderId: string;
  quantity: number;
  subtotalPoints: number;
  name: string;
};

const orderStatusOptions = ["all", "submitted", "confirmed", "preparing", "completed", "cancelled"] as const;

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; from?: string; to?: string }>;
}) {
  const viewer = await getAdminViewerSummary();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "owner") {
    redirect("/");
  }

  if (!viewer.householdId) {
    return (
      <AdminShell title="订单管理" description="你还没有家庭空间，先完成家庭初始化。" activeHref="/orders">
        <section className="admin-panel" style={{ padding: 24 }}>
          <Link href="/setup/owner" style={{ color: "var(--brand)", fontWeight: 700 }}>
            立即创建家庭
          </Link>
        </section>
      </AdminShell>
    );
  }

  const { q, status, from, to } = await searchParams;
  const keyword = (q ?? "").trim().toLowerCase();
  const currentStatus = orderStatusOptions.includes((status ?? "all") as never)
    ? ((status ?? "all") as (typeof orderStatusOptions)[number])
    : "all";

  const supabase = createSupabaseServiceRoleClient();
  let orderQuery = supabase
    .from("orders")
    .select("id, order_number, status, total_points, created_at, remark")
    .eq("household_id", viewer.householdId)
    .order("created_at", { ascending: false });

  if (currentStatus !== "all") {
    orderQuery = orderQuery.eq("status", currentStatus);
  }

  if (from) {
    orderQuery = orderQuery.gte("created_at", new Date(`${from}T00:00:00`).toISOString());
  }

  if (to) {
    orderQuery = orderQuery.lte("created_at", new Date(`${to}T23:59:59`).toISOString());
  }

  const { data: orders } = await orderQuery;
  const filteredOrders = (orders ?? []).filter((order) => {
    if (!keyword) {
      return true;
    }

    return (
      String(order.order_number).toLowerCase().includes(keyword) ||
      String(order.remark ?? "").toLowerCase().includes(keyword)
    );
  });

  const orderIds = filteredOrders.map((order) => order.id as string);
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
      description="按状态、订单号、备注和日期筛选订单，并推进确认、制作、完成与取消。"
      activeHref="/orders"
    >
      <section className="admin-panel" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>订单队列</h2>
            <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
              可以用筛选快速定位待处理订单，取消订单时会自动退回积分。
            </p>
          </div>

          <form style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input name="q" defaultValue={q ?? ""} placeholder="订单号或备注" style={filterStyle} />
            <div style={{ minWidth: 160 }}>
              <OrbitFormSelect
                name="status"
                defaultValue={currentStatus}
                options={orderStatusOptions.map((option) => ({
                  value: option,
                  label: option === "all" ? "全部状态" : getOrderStatusLabel(option)
                }))}
              />
            </div>
            <input name="from" type="date" defaultValue={from ?? ""} style={filterStyle} />
            <input name="to" type="date" defaultValue={to ?? ""} style={filterStyle} />
            <button type="submit" style={filterButtonStyle}>
              筛选
            </button>
          </form>
        </div>

        <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
          {filteredOrders.length ? (
            filteredOrders.map((order) => {
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
                          orderId={order.id as string}
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
    </AdminShell>
  );
}

const filterStyle = {
  borderRadius: 999,
  border: "1px solid var(--border)",
  padding: "10px 14px",
  background: "rgba(255,255,255,0.82)"
} satisfies React.CSSProperties;

const filterButtonStyle = {
  border: 0,
  borderRadius: 999,
  padding: "10px 16px",
  background: "var(--brand)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 800
} satisfies React.CSSProperties;
