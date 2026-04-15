import { redirect } from "next/navigation";
import { MemberShell } from "../_components/member-shell";
import { getWebViewerSummary } from "../../lib/auth";
import { createSupabaseServiceRoleClient } from "../../lib/supabase/service-role-client";
import { OrdersManager, type MemberOrderRow } from "./_components/orders-manager";

export default async function OrdersPage() {
  const viewer = await getWebViewerSummary();

  if (!viewer) {
    redirect("/login");
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, total_points, created_at")
    .eq("member_user_id", viewer.userId)
    .order("created_at", { ascending: false });

  return (
    <MemberShell
      title="我的订单"
      description="按状态和订单号查看点餐记录，也可以在家主开始制作前取消自己的订单。"
      activeHref="/orders"
    >
      <OrdersManager initialOrders={(orders ?? []) as MemberOrderRow[]} />
    </MemberShell>
  );
}
