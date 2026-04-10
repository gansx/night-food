import { getOrderStatusLabel } from "@night-food/lib";
import type { OrderStatus } from "@night-food/types";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberShell } from "../_components/member-shell";
import { getWebViewerSummary } from "../../lib/auth";
import { createSupabaseServerClient } from "../../lib/supabase/server-client";

export default async function OrdersPage() {
  const viewer = await getWebViewerSummary();

  if (!viewer) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, total_points, created_at")
    .eq("member_user_id", viewer.userId)
    .order("created_at", { ascending: false });

  return (
    <MemberShell
      title="我的订单"
      description="查看自己的点餐记录、订单状态和积分消耗。"
    >
      <section className="glass-panel" style={{ padding: 24 }}>
        <h2 className="section-title">最近订单</h2>
        <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
          {(orders ?? []).length ? (
            orders?.map((order) => (
              <article
                key={order.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
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
                  </div>
                </div>
                <div style={{ color: "var(--text-muted)" }}>
                  {getOrderStatusLabel(order.status as OrderStatus)}
                </div>
                <div style={{ color: "var(--brand-dark)", fontWeight: 800 }}>
                  {Number(order.total_points)} 积分
                </div>
              </article>
            ))
          ) : (
            <div style={{ color: "var(--text-muted)" }}>你还没有提交过订单。</div>
          )}
        </div>
      </section>
    </MemberShell>
  );
}
