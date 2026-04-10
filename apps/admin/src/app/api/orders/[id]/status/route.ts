import { canTransitionOrderStatus, getOrderStatusLabel } from "@night-food/lib";
import type { OrderStatus } from "@night-food/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server-client";

const updateOrderStatusSchema = z.object({
  status: z.enum(["confirmed", "preparing", "completed", "cancelled"]),
  note: z.string().trim().max(200).optional().or(z.literal(""))
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }

  const raw = (await request.json()) as { status?: OrderStatus; note?: string };
  const parsed = updateOrderStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
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

  const { data: membership } = await supabase
    .from("household_members")
    .select("role")
    .eq("household_id", order.household_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "只有家主可以更新订单状态。" }, { status: 403 });
  }

  const currentStatus = order.status as OrderStatus;
  const targetStatus = parsed.data.status;

  if (!canTransitionOrderStatus(currentStatus, targetStatus)) {
    return NextResponse.json(
      { error: `订单当前为${getOrderStatusLabel(currentStatus)}，不能更新为${getOrderStatusLabel(targetStatus)}。` },
      { status: 409 }
    );
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: targetStatus,
      updated_at: new Date().toISOString()
    })
    .eq("id", order.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from("order_status_logs").insert({
    order_id: order.id,
    from_status: currentStatus,
    to_status: targetStatus,
    changed_by_user_id: user.id,
    note: parsed.data.note || `家主将订单更新为${getOrderStatusLabel(targetStatus)}`
  });

  if (targetStatus === "cancelled") {
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

      const nextBalance = Number(account?.balance ?? 0) + Number(order.total_points);

      await supabase.from("points_accounts").upsert(
        {
          household_id: order.household_id,
          user_id: order.member_user_id,
          balance: nextBalance,
          updated_at: new Date().toISOString()
        },
        { onConflict: "household_id,user_id" }
      );

      await supabase.from("points_transactions").insert({
        household_id: order.household_id,
        user_id: order.member_user_id,
        source_type: "order",
        source_id: order.id,
        direction: "credit",
        amount: Number(order.total_points),
        balance_after: nextBalance,
        description: `订单 ${order.order_number} 已取消，积分退回`
      });
    }
  }

  await supabase.from("audit_logs").insert({
    household_id: order.household_id,
    actor_user_id: user.id,
    target_type: "order",
    target_id: order.id,
    action: `status_${targetStatus}`,
    detail: parsed.data.note || null
  });

  return NextResponse.json({ ok: true });
}
