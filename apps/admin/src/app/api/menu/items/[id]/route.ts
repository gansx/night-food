import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAdminSessionUser,
  insertAdminAuditLog,
  requireAdminOwnerMembership
} from "../../../../../lib/server/household";

const updateItemSchema = z.object({
  categoryId: z.string().uuid("分类标识无效。"),
  name: z.string().trim().min(1, "请填写菜品名称。").max(40, "菜品名称最多 40 个字。"),
  description: z.string().trim().max(200, "描述最多 200 个字。").optional().or(z.literal("")),
  pricePoints: z.number().int().min(0, "积分价格不能为负数。"),
  imageUrl: z.string().trim().url("图片地址格式不正确。").optional().or(z.literal("")),
  sortOrder: z.number().int().min(0, "排序值不能小于 0。"),
  isAvailable: z.boolean(),
  isFeatured: z.boolean()
});

async function loadItemForOwner(itemId: string) {
  const { supabase, user } = await getAdminSessionUser();

  if (!user) {
    return { supabase, user: null, item: null, response: NextResponse.json({ error: "请先登录。" }, { status: 401 }) };
  }

  const { data: item } = await supabase
    .from("menu_items")
    .select("id, household_id, name")
    .eq("id", itemId)
    .limit(1)
    .maybeSingle();

  if (!item) {
    return { supabase, user, item: null, response: NextResponse.json({ error: "菜品不存在。" }, { status: 404 }) };
  }

  const guard = await requireAdminOwnerMembership(item.household_id as string);
  if (guard.response || !guard.membership) {
    return { supabase, user, item: null, response: guard.response };
  }

  return { supabase, user, item, response: null };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const loaded = await loadItemForOwner(id);
  if (loaded.response || !loaded.user || !loaded.item) {
    return loaded.response!;
  }

  const raw = (await request.json()) as {
    categoryId?: string;
    name?: string;
    description?: string;
    pricePoints?: number;
    imageUrl?: string;
    sortOrder?: number;
    isAvailable?: boolean;
    isFeatured?: boolean;
  };
  const parsed = updateItemSchema.safeParse({
    ...raw,
    pricePoints: Number(raw.pricePoints),
    sortOrder: Number(raw.sortOrder)
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误。" }, { status: 400 });
  }

  const { error } = await loaded.supabase
    .from("menu_items")
    .update({
      category_id: parsed.data.categoryId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      price_points: parsed.data.pricePoints,
      image_url: parsed.data.imageUrl || null,
      sort_order: parsed.data.sortOrder,
      is_available: parsed.data.isAvailable,
      is_featured: parsed.data.isFeatured,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await insertAdminAuditLog({
    householdId: loaded.item.household_id as string,
    actorUserId: loaded.user.id,
    targetType: "menu_item",
    targetId: id,
    action: "update",
    detail: `更新菜品：${parsed.data.name}`
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const loaded = await loadItemForOwner(id);
  if (loaded.response || !loaded.user || !loaded.item) {
    return loaded.response!;
  }

  const { error } = await loaded.supabase.from("menu_items").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await insertAdminAuditLog({
    householdId: loaded.item.household_id as string,
    actorUserId: loaded.user.id,
    targetType: "menu_item",
    targetId: id,
    action: "delete",
    detail: `删除菜品：${String(loaded.item.name)}`
  });

  return NextResponse.json({ ok: true });
}
