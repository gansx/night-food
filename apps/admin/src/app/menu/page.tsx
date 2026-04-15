import Link from "next/link";
import { redirect } from "next/navigation";
import { MenuManager, type MenuCategoryRow, type MenuItemRow } from "./_components/menu-manager";
import { AdminShell } from "../_components/admin-shell";
import { getAdminViewerSummary } from "../../lib/auth";
import { createSupabaseServiceRoleClient } from "../../lib/supabase/service-role-client";

export default async function MenuPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const viewer = await getAdminViewerSummary();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "owner") {
    redirect("/");
  }

  if (!viewer.householdId) {
    return (
      <AdminShell title="菜单管理" description="你还没有家庭空间，先完成家庭初始化。" activeHref="/menu">
        <section className="admin-panel" style={{ padding: 24 }}>
          <Link href="/setup/owner" style={{ color: "var(--brand)", fontWeight: 700 }}>
            立即创建家庭
          </Link>
        </section>
      </AdminShell>
    );
  }

  const { category } = await searchParams;

  const supabase = createSupabaseServiceRoleClient();
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, sort_order, is_active")
      .eq("household_id", viewer.householdId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_items")
      .select(
        "id, category_id, name, description, price_points, image_url, is_available, sort_order, is_featured"
      )
      .eq("household_id", viewer.householdId)
      .order("sort_order", { ascending: true })
  ]);

  return (
    <AdminShell
      title="菜单管理"
      description="维护分类、推荐菜、搜索筛选和批量上下架。"
      activeHref="/menu"
    >
      <MenuManager
        householdId={viewer.householdId}
        initialCategories={(categories ?? []) as MenuCategoryRow[]}
        initialItems={(items ?? []) as MenuItemRow[]}
        initialCategoryId={category ?? ""}
      />
    </AdminShell>
  );
}
