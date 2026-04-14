import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSessionUser } from "../../../../../lib/server/household";

const updateCategorySchema = z.object({
  name: z.string().trim().min(1, "请填写分类名称").max(24, "分类名称不要超过 24 个字符"),
  sortOrder: z.number().int().min(0, "排序值不能小于 0"),
  isActive: z.boolean()
});

async function requireOwner(categoryId: string) {
  const { supabase, user } = await getAdminSessionUser();

  if (!user) {
    return { supabase, error: NextResponse.json({ error: "请先登录。" }, { status: 401 }) };
  }

  const { data: category } = await supabase
    .from("menu_categories")
    .select("id, household_id")
    .eq("id", categoryId)
    .limit(1)
    .maybeSingle();

  if (!category) {
    return { supabase, error: NextResponse.json({ error: "分类不存在。" }, { status: 404 }) };
  }

  const { data: membership } = await supabase
    .from("household_members")
    .select("role")
    .eq("household_id", category.household_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership || membership.role !== "owner") {
    return { supabase, error: NextResponse.json({ error: "只有家主可以维护菜单分类。" }, { status: 403 }) };
  }

  return { supabase, category };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireOwner(id);
  if ("error" in guard && guard.error) {
    return guard.error;
  }

  const raw = (await request.json()) as {
    name?: string;
    sortOrder?: number;
    isActive?: boolean;
  };
  const parsed = updateCategorySchema.safeParse({
    ...raw,
    sortOrder: Number(raw.sortOrder)
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const { error } = await guard.supabase
    .from("menu_categories")
    .update({
      name: parsed.data.name,
      sort_order: parsed.data.sortOrder,
      is_active: parsed.data.isActive,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireOwner(id);
  if ("error" in guard && guard.error) {
    return guard.error;
  }

  const { count } = await guard.supabase
    .from("menu_items")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "该分类下仍有菜品，请先调整或删除菜品后再删除分类。" }, { status: 409 });
  }

  const { error } = await guard.supabase.from("menu_categories").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
