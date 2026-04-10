import type { MenuItemPayload } from "@night-food/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  insertAdminAuditLog,
  requireAdminOwnerMembership
} from "../../../../lib/server/household";

const itemSchema = z.object({
  householdId: z.string().uuid("家庭标识无效。"),
  categoryId: z.string().uuid("分类标识无效。"),
  name: z.string().trim().min(1, "请填写菜品名称。").max(40, "菜品名称最多 40 个字。"),
  description: z.string().trim().max(200, "描述最多 200 个字。").optional().or(z.literal("")),
  pricePoints: z.number().int().min(0, "积分价格不能为负数。"),
  imageUrl: z.string().trim().url("图片地址格式不正确。").optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional()
});

export async function POST(request: Request) {
  const raw = (await request.json()) as MenuItemPayload;
  const parsed = itemSchema.safeParse({
    ...raw,
    pricePoints: Number(raw.pricePoints),
    sortOrder: Number(raw.sortOrder ?? 0)
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误。" }, { status: 400 });
  }

  const guard = await requireAdminOwnerMembership(parsed.data.householdId);
  if (guard.response || !guard.user || !guard.membership) {
    return guard.response!;
  }

  const { data: item, error } = await guard.supabase
    .from("menu_items")
    .insert({
      household_id: parsed.data.householdId,
      category_id: parsed.data.categoryId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      price_points: parsed.data.pricePoints,
      image_url: parsed.data.imageUrl || null,
      sort_order: parsed.data.sortOrder ?? 0,
      is_available: parsed.data.isAvailable ?? true,
      is_featured: parsed.data.isFeatured ?? false
    })
    .select("id, name")
    .single();

  if (error || !item) {
    return NextResponse.json({ error: error?.message ?? "创建菜品失败。" }, { status: 500 });
  }

  await insertAdminAuditLog({
    householdId: parsed.data.householdId,
    actorUserId: guard.user.id,
    targetType: "menu_item",
    targetId: item.id as string,
    action: "create",
    detail: `创建菜品：${item.name as string}`
  });

  return NextResponse.json({ ok: true });
}
