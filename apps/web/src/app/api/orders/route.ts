import { createOrderNumber, formatOrderingWindow, isCurrentTimeWithinWindow } from "@night-food/lib";
import type { CreateOrderPayload } from "@night-food/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "../../../lib/supabase/server-client";

const createOrderSchema = z.object({
  householdId: z.string().uuid("家庭标识无效"),
  remark: z.string().trim().max(200).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid("菜品标识无效"),
        quantity: z.number().int().min(1, "数量至少为 1")
      })
    )
    .min(1, "至少选择一个菜品")
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录后再下单。" }, { status: 401 });
  }

  const raw = (await request.json()) as CreateOrderPayload;
  const parsed = createOrderSchema.safeParse({
    ...raw,
    items: raw.items?.map((item) => ({
      ...item,
      quantity: Number(item.quantity)
    }))
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const { householdId } = parsed.data;

  const { data: membership } = await supabase
    .from("household_members")
    .select("role")
    .eq("household_id", householdId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "你还没有加入该家庭。" }, { status: 403 });
  }

  const [{ data: settings }, { data: household }] = await Promise.all([
    supabase
      .from("household_settings")
      .select("allow_negative_points, ordering_enabled, ordering_window_start, ordering_window_end")
      .eq("household_id", householdId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("households")
      .select("timezone")
      .eq("id", householdId)
      .limit(1)
      .maybeSingle()
  ]);

  if (settings?.ordering_enabled === false) {
    return NextResponse.json({ error: "当前家庭已暂停点餐。" }, { status: 409 });
  }

  const timezone = (household?.timezone as string | undefined) ?? "Asia/Shanghai";
  const isOpenNow = isCurrentTimeWithinWindow(
    timezone,
    settings?.ordering_window_start as string | null | undefined,
    settings?.ordering_window_end as string | null | undefined
  );

  if (!isOpenNow) {
    return NextResponse.json(
      {
        error: `当前不在点餐时间窗内，可点时段为 ${formatOrderingWindow(
          settings?.ordering_window_start as string | null | undefined,
          settings?.ordering_window_end as string | null | undefined
        )}。`
      },
      { status: 409 }
    );
  }

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("id, name, price_points, is_available")
    .eq("household_id", householdId)
    .in(
      "id",
      parsed.data.items.map((item) => item.menuItemId)
    );

  if (!menuItems?.length) {
    return NextResponse.json({ error: "未找到有效菜品。" }, { status: 404 });
  }

  const menuItemMap = new Map(menuItems.map((item) => [item.id as string, item]));
  const invalidItem = parsed.data.items.find((item) => {
    const match = menuItemMap.get(item.menuItemId);
    return !match || !match.is_available;
  });

  if (invalidItem) {
    return NextResponse.json({ error: "存在无效或已下架的菜品。" }, { status: 409 });
  }

  const subtotal = parsed.data.items.reduce((sum, item) => {
    const match = menuItemMap.get(item.menuItemId)!;
    return sum + Number(match.price_points) * item.quantity;
  }, 0);

  const { data: account } = await supabase
    .from("points_accounts")
    .select("id, balance")
    .eq("household_id", householdId)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const currentBalance = Number(account?.balance ?? 0);
  const nextBalance = currentBalance - subtotal;
  if (!settings?.allow_negative_points && nextBalance < 0) {
    return NextResponse.json({ error: "积分不足，当前规则不允许负积分下单。" }, { status: 409 });
  }

  const orderNumber = createOrderNumber();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      household_id: householdId,
      member_user_id: user.id,
      order_number: orderNumber,
      status: "submitted",
      subtotal_points: subtotal,
      discount_points: 0,
      total_points: subtotal,
      remark: parsed.data.remark || null
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? "创建订单失败" }, { status: 500 });
  }

  const orderId = order.id as string;
  const orderItems = parsed.data.items.map((item) => {
    const match = menuItemMap.get(item.menuItemId)!;
    const unitPoints = Number(match.price_points);
    return {
      order_id: orderId,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      unit_points: unitPoints,
      subtotal_points: unitPoints * item.quantity
    };
  });

  const { error: itemError } = await supabase.from("order_items").insert(orderItems);
  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 });
  }

  await supabase.from("order_status_logs").insert({
    order_id: orderId,
    from_status: null,
    to_status: "submitted",
    changed_by_user_id: user.id,
    note: "成员创建订单"
  });

  await supabase.from("points_accounts").upsert(
    {
      household_id: householdId,
      user_id: user.id,
      balance: nextBalance,
      updated_at: new Date().toISOString()
    },
    { onConflict: "household_id,user_id" }
  );

  await supabase.from("points_transactions").insert({
    household_id: householdId,
    user_id: user.id,
    source_type: "order",
    source_id: orderId,
    direction: "debit",
    amount: subtotal,
    balance_after: nextBalance,
    description: `家庭点餐订单 ${orderNumber}`
  });

  return NextResponse.json({ orderId, orderNumber });
}
