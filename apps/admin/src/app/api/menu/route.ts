import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOwnerMembership } from "../../../lib/server/household";

const querySchema = z.object({
  householdId: z.string().uuid("家庭标识无效。")
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    householdId: searchParams.get("householdId")
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误。" }, { status: 400 });
  }

  const guard = await requireAdminOwnerMembership(parsed.data.householdId);
  if (guard.response || !guard.user || !guard.membership) {
    return guard.response!;
  }

  const [{ data: categories, error: categoriesError }, { data: items, error: itemsError }] = await Promise.all([
    guard.supabase
      .from("menu_categories")
      .select("id, name, sort_order, is_active")
      .eq("household_id", parsed.data.householdId)
      .order("sort_order", { ascending: true }),
    guard.supabase
      .from("menu_items")
      .select("id, category_id, name, description, price_points, image_url, is_available, sort_order, is_featured")
      .eq("household_id", parsed.data.householdId)
      .order("sort_order", { ascending: true })
  ]);

  if (categoriesError || itemsError) {
    return NextResponse.json(
      { error: categoriesError?.message ?? itemsError?.message ?? "菜单数据加载失败。" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    categories: categories ?? [],
    items: items ?? []
  });
}
