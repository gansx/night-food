import { canMemberCancelOrder, formatDateTime, getOrderStatusLabel } from "@night-food/lib";
import type { OrderStatus } from "@night-food/types";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberShell } from "../../_components/member-shell";
import { getWebViewerSummary } from "../../../lib/auth";
import { createSupabaseServiceRoleClient } from "../../../lib/supabase/service-role-client";
import { CancelOrderButton } from "../_components/cancel-order-button";

export default async function OrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await getWebViewerSummary();
  if (!viewer) {
    redirect("/login");
  }

  const { id } = await params;
  const supabase = createSupabaseServiceRoleClient();
  const [{ data: order }, { data: items }, { data: logs }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, status, total_points, subtotal_points, remark, created_at")
      .eq("id", id)
      .eq("member_user_id", viewer.userId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("order_items")
      .select("id, quantity, subtotal_points, unit_points, menu_items(name)")
      .eq("order_id", id),
    supabase
      .from("order_status_logs")
      .select("id, from_status, to_status, note, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: false })
  ]);

  if (!order) {
    return (
      <MemberShell title="订单详情" description="没有找到这个订单。" activeHref="/orders">
        <section className="glass-panel" style={{ padding: 24 }}>
          <Link href="/orders" style={{ color: "var(--brand)", fontWeight: 700 }}>
            返回订单列表
          </Link>
        </section>
      </MemberShell>
    );
  }

  const statusValue = order.status as OrderStatus;

  return (
    <MemberShell title="订单详情" description="查看订单明细、状态变化和家主备注。" activeHref="/orders">
      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.95fr)", gap: 20 }}>
        <div className="glass-panel" style={{ padding: 24 }}>
          <Link href="/orders" style={{ color: "var(--brand)", fontWeight: 700 }}>
            返回订单列表
          </Link>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h2 className="section-title" style={{ fontSize: 24 }}>
                {order.order_number}
              </h2>
              <div style={{ marginTop: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                状态：{getOrderStatusLabel(statusValue)}
                <br />
                小计：{Number(order.subtotal_points)} 积分
                <br />
                合计：{Number(order.total_points)} 积分
                <br />
                下单时间：{formatDateTime(order.created_at as string)}
                <br />
                备注：{(order.remark as string | null) || "无"}
              </div>
            </div>
            {canMemberCancelOrder(statusValue) ? <CancelOrderButton orderId={order.id as string} /> : null}
          </div>

          <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
            {(items ?? []).map((item) => {
              const menuItem = Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items;
              return (
                <div
                  key={item.id as string}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid var(--border-soft)"
                  }}
                >
                  {(menuItem?.name as string | undefined) ?? "已删除菜品"} x {Number(item.quantity)} | 单价{" "}
                  {Number(item.unit_points)} | 小计 {Number(item.subtotal_points)}
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 24 }}>
          <h2 className="section-title">状态日志</h2>
          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            {(logs ?? []).length ? (
              (logs ?? []).map((log) => (
                <div
                  key={log.id as string}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid var(--border-soft)"
                  }}
                >
                  <strong>
                    {(log.from_status as string | null) || "初始"}
                    {" -> "}
                    {String(log.to_status)}
                  </strong>
                  <div style={{ marginTop: 8, color: "var(--text-muted)", lineHeight: 1.7 }}>
                    {(log.note as string | null) || "无备注"}
                    <br />
                    {formatDateTime(log.created_at as string)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--text-muted)" }}>当前还没有状态日志。</div>
            )}
          </div>
        </div>
      </section>
    </MemberShell>
  );
}
