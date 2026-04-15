import { canMemberCancelOrder, getOrderStatusLabel } from "@night-food/lib";
import type { OrderStatus } from "@night-food/types";
import { NextResponse } from "next/server";
import {
  getWebSessionUser,
  insertWebAuditLog,
  requireWebMembership
} from "../../../../../lib/server/household";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await getWebSessionUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, household_id, member_user_id, order_number, status, total_points")
    .eq("id", id)
    .limit(1)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "订单不存在。" }, { status: 404 });
  }

  if (order.member_user_id !== user.id) {
    return NextResponse.json({ error: "只能取消自己的订单。" }, { status: 403 });
  }

  const membershipGuard = await requireWebMembership(order.household_id as string);
  if (membershipGuard.response || !membershipGuard.membership) {
    return membershipGuard.response!;
  }

  const currentStatus = order.status as OrderStatus;
  if (!canMemberCancelOrder(currentStatus)) {
    return NextResponse.json(
      { error: `订单当前为${getOrderStatusLabel(currentStatus)}，已经不能由成员取消。` },
      { status: 409 }
    );
  }

  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString()
    })
    .eq("id", order.id)
    .eq("status", currentStatus)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updatedOrder) {
    return NextResponse.json({ error: "订单状态已经变化，请刷新后再操作。" }, { status: 409 });
  }

  await supabase.from("order_status_logs").insert({
    order_id: order.id,
    from_status: currentStatus,
    to_status: "cancelled",
    changed_by_user_id: user.id,
    note: "成员取消订单"
  });

  const refundPoints = Number(order.total_points);
  if (refundPoints > 0) {
    const { data: existingRefund } = await supabase
      .from("points_transactions")
      .select("id")
      .eq("source_type", "order")
      .eq("source_id", order.id)
      .eq("direction", "credit")
      .limit(1)
      .maybeSingle();

    if (!existingRefund) {
      const { data: account } = await supabase
        .from("points_accounts")
        .select("balance")
        .eq("household_id", order.household_id)
        .eq("user_id", order.member_user_id)
        .limit(1)
        .maybeSingle();

      const nextBalance = Number(account?.balance ?? 0) + refundPoints;
      const { error: refundInsertError } = await supabase.from("points_transactions").insert({
        household_id: order.household_id,
        user_id: order.member_user_id,
        source_type: "order",
        source_id: order.id,
        direction: "credit",
        amount: refundPoints,
        balance_after: nextBalance,
        description: `订单 ${order.order_number} 已取消，积分退回`
      });

      if (refundInsertError && refundInsertError.code !== "23505") {
        return NextResponse.json({ error: refundInsertError.message }, { status: 500 });
      }

      if (!refundInsertError) {
        await supabase.from("points_accounts").upsert(
          {
            household_id: order.household_id,
            user_id: order.member_user_id,
            balance: nextBalance,
            updated_at: new Date().toISOString()
          },
          { onConflict: "household_id,user_id" }
        );
      }
    }
  }

  await insertWebAuditLog({
    householdId: order.household_id as string,
    actorUserId: user.id,
    targetType: "order",
    targetId: order.id as string,
    action: "member_cancel",
    detail: `成员取消订单：${String(order.order_number)}`
  });

  return NextResponse.json({ ok: true });
}
