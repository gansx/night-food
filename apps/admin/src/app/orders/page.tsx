import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { getAdminViewerSummary } from "../../lib/auth";
import { createSupabaseServiceRoleClient } from "../../lib/supabase/service-role-client";
import { OrdersManager, type AdminOrderItemRow, type AdminOrderRow } from "./_components/orders-manager";

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
      <AdminShell title="订单管理" description="你还没有家庭空间，先完成家庭初始化。" activeHref="/orders">
        <section className="admin-panel" style={{ padding: 24 }}>
          <Link href="/setup/owner" style={{ color: "var(--brand)", fontWeight: 700 }}>
            立即创建家庭
          </Link>
        </section>
      </AdminShell>
    );
  }

  const supabase = createSupabaseServiceRoleClient();
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

  const normalizedOrderItems: AdminOrderItemRow[] = (orderItems ?? []).map((item) => {
    const menuItem = Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items;
    return {
      id: item.id as string,
      orderId: item.order_id as string,
      quantity: Number(item.quantity),
      subtotalPoints: Number(item.subtotal_points),
      name: (menuItem?.name as string | undefined) ?? "已删除菜品"
    };
  });

  return (
    <AdminShell
      title="订单管理"
      description="按状态、订单号、备注和日期筛选订单，并推进确认、制作、完成与取消。"
      activeHref="/orders"
    >
      <OrdersManager initialOrders={(orders ?? []) as AdminOrderRow[]} initialOrderItems={normalizedOrderItems} />
    </AdminShell>
  );
}
