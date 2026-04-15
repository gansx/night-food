import { canMemberCancelOrder, getOrderStatusLabel } from "@night-food/lib";
import type { OrderStatus } from "@night-food/types";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberShell } from "../_components/member-shell";
import { getWebViewerSummary } from "../../lib/auth";
import { createSupabaseServiceRoleClient } from "../../lib/supabase/service-role-client";
import { CancelOrderButton } from "./_components/cancel-order-button";

const orderStatusOptions = ["all", "submitted", "confirmed", "preparing", "completed", "cancelled"] as const;

export default async function OrdersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const viewer = await getWebViewerSummary();

  if (!viewer) {
    redirect("/login");
  }

  const { q, status } = await searchParams;
  const keyword = (q ?? "").trim().toLowerCase();
  const currentStatus = orderStatusOptions.includes((status ?? "all") as never)
    ? ((status ?? "all") as (typeof orderStatusOptions)[number])
    : "all";

  const supabase = createSupabaseServiceRoleClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, total_points, created_at")
    .eq("member_user_id", viewer.userId)
    .order("created_at", { ascending: false });

  const filteredOrders = (orders ?? []).filter((order) => {
    const matchesStatus = currentStatus === "all" || order.status === currentStatus;
    const matchesKeyword = !keyword || String(order.order_number).toLowerCase().includes(keyword);
    return matchesStatus && matchesKeyword;
  });

  return (
    <MemberShell
      title="我的订单"
      description="按状态和订单号查找点餐记录，也可以在家主开始制作前取消自己的订单。"
      activeHref="/orders"
    >
      <section className="glass-panel" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 className="section-title">订单记录</h2>
            <p style={{ margin: "8px 0 0", color: "var(--text-muted)", lineHeight: 1.6 }}>
              待确认和已确认的订单可以由你主动取消，积分会自动退回。
            </p>
          </div>

          <form style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="搜索订单号"
              style={filterInputStyle}
            />
            <select name="status" defaultValue={currentStatus} style={filterInputStyle}>
              {orderStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "全部状态" : getOrderStatusLabel(option)}
                </option>
              ))}
            </select>
            <button type="submit" style={filterButtonStyle}>
              筛选
            </button>
          </form>
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
                    <Link href={`/orders/${order.id as string}`} style={{ fontWeight: 800 }}>
                      {order.order_number as string}
                    </Link>
                    <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7 }}>
                      下单时间：{new Date(order.created_at as string).toLocaleString("zh-CN")}
                      <br />
                      状态：{getOrderStatusLabel(statusValue)} | 合计：{Number(order.total_points)} 积分
                    </div>
                  </div>
                  {canCancel ? <CancelOrderButton orderId={order.id as string} /> : null}
                </article>
              );
            })
          ) : (
            <div style={{ color: "var(--text-muted)" }}>当前筛选条件下还没有订单。</div>
          )}
        </div>
      </section>
    </MemberShell>
  );
}

const filterInputStyle = {
  borderRadius: 999,
  border: "1px solid var(--border-soft)",
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
