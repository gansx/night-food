import Link from "next/link";
import { redirect } from "next/navigation";
import { BatchMenuItemToggleForm } from "./_components/batch-menu-item-toggle-form";
import { CreateCategoryForm } from "./_components/create-category-form";
import { CreateMenuItemForm } from "./_components/create-menu-item-form";
import { EditCategoryForm } from "./_components/edit-category-form";
import { EditMenuItemForm } from "./_components/edit-menu-item-form";
import { AdminShell } from "../_components/admin-shell";
import { OrbitFormSelect } from "../_components/orbit-select";
import { getAdminViewerSummary } from "../../lib/auth";
import { createSupabaseServiceRoleClient } from "../../lib/supabase/service-role-client";

export default async function MenuPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string; featured?: string }>;
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

  const { q, category, status, featured } = await searchParams;
  const search = (q ?? "").trim().toLowerCase();
  const categoryFilter = category ?? "all";
  const statusFilter = status ?? "all";
  const featuredFilter = featured ?? "all";

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

  const categoryOptions = (categories ?? []).map((categoryItem) => ({
    id: categoryItem.id as string,
    name: categoryItem.name as string
  }));

  const filteredItems = (items ?? []).filter((item) => {
    const matchesSearch =
      !search ||
      String(item.name).toLowerCase().includes(search) ||
      String(item.description ?? "")
        .toLowerCase()
        .includes(search);
    const matchesCategory = categoryFilter === "all" || item.category_id === categoryFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "available" ? Boolean(item.is_available) : !Boolean(item.is_available));
    const matchesFeatured =
      featuredFilter === "all" ||
      (featuredFilter === "featured" ? Boolean(item.is_featured) : !Boolean(item.is_featured));

    return matchesSearch && matchesCategory && matchesStatus && matchesFeatured;
  });

  return (
    <AdminShell
      title="菜单管理"
      description="维护分类、推荐菜、搜索筛选和批量上下架。"
      activeHref="/menu"
    >
      <section style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }}>
        <div className="admin-panel" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>当前菜单结构</h2>
              <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
                支持搜索、按分类筛选、查看推荐菜和批量上下架。
              </p>
            </div>
            <form style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input name="q" defaultValue={search} placeholder="搜索菜品" style={filterStyle} />
              <div style={{ minWidth: 170 }}>
                <OrbitFormSelect
                  name="category"
                  defaultValue={categoryFilter}
                  options={[
                    { value: "all", label: "全部分类" },
                    ...categoryOptions.map((option) => ({ value: option.id, label: option.name }))
                  ]}
                />
              </div>
              <div style={{ minWidth: 150 }}>
                <OrbitFormSelect
                  name="status"
                  defaultValue={statusFilter}
                  options={[
                    { value: "all", label: "全部状态" },
                    { value: "available", label: "已上架" },
                    { value: "unavailable", label: "已下架" }
                  ]}
                />
              </div>
              <div style={{ minWidth: 190 }}>
                <OrbitFormSelect
                  name="featured"
                  defaultValue={featuredFilter}
                  options={[
                    { value: "all", label: "全部推荐状态" },
                    { value: "featured", label: "仅今日推荐" },
                    { value: "normal", label: "仅普通菜品" }
                  ]}
                />
              </div>
              <button type="submit" style={filterButtonStyle}>
                筛选
              </button>
            </form>
          </div>

          <div style={{ marginTop: 18, display: "grid", gap: 16 }}>
            {(categories ?? []).length ? (
              categories?.map((categoryItem) => {
                const categoryItems = filteredItems.filter((item) => item.category_id === categoryItem.id);
                return (
                  <article
                    key={categoryItem.id}
                    style={{
                      padding: 18,
                      borderRadius: 20,
                      background: "rgba(255,255,255,0.72)",
                      border: "1px solid var(--border)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <strong>{categoryItem.name as string}</strong>
                      <span style={{ color: "var(--muted)" }}>
                        {categoryItem.is_active ? "分类启用中" : "分类已停用"} | 排序 {Number(categoryItem.sort_order)}
                      </span>
                    </div>

                    <EditCategoryForm
                      id={categoryItem.id as string}
                      initialName={categoryItem.name as string}
                      initialSortOrder={Number(categoryItem.sort_order ?? 0)}
                      initialIsActive={Boolean(categoryItem.is_active)}
                    />

                    <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                      {categoryItems.length ? (
                        categoryItems.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              padding: 14,
                              borderRadius: 16,
                              background: "var(--panel-alt)"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                              <strong>{item.name as string}</strong>
                              <span style={{ color: "var(--muted)" }}>
                                {item.is_available ? "可点" : "已下架"} | {Number(item.price_points)} 积分 | 排序{" "}
                                {Number(item.sort_order ?? 0)} | {item.is_featured ? "今日推荐" : "普通菜品"}
                              </span>
                            </div>
                            <EditMenuItemForm
                              id={item.id as string}
                              categories={categoryOptions}
                              initialValue={{
                                categoryId: item.category_id as string,
                                name: item.name as string,
                                description: (item.description as string | null) ?? "",
                                pricePoints: Number(item.price_points ?? 0),
                                imageUrl: (item.image_url as string | null) ?? "",
                                sortOrder: Number(item.sort_order ?? 0),
                                isAvailable: Boolean(item.is_available),
                                isFeatured: Boolean(item.is_featured)
                              }}
                            />
                          </div>
                        ))
                      ) : (
                        <div style={{ color: "var(--muted)" }}>当前筛选条件下，这个分类没有菜品。</div>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <div
                style={{
                  padding: 18,
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.72)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)"
                }}
              >
                还没有任何菜单分类，先从右侧创建第一个分类。
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          <CreateCategoryForm householdId={viewer.householdId} />
          <CreateMenuItemForm householdId={viewer.householdId} categories={categoryOptions} />
          <BatchMenuItemToggleForm
            householdId={viewer.householdId}
            items={filteredItems.map((item) => ({
              id: item.id as string,
              name: item.name as string,
              isAvailable: Boolean(item.is_available)
            }))}
          />
        </div>
      </section>
    </AdminShell>
  );
}

const filterStyle = {
  borderRadius: 999,
  border: "1px solid var(--border)",
  padding: "10px 14px",
  background: "rgba(255,255,255,0.82)"
} satisfies React.CSSProperties;

const filterButtonStyle = {
  border: 0,
  borderRadius: 999,
  padding: "10px 14px",
  background: "var(--brand)",
  color: "#fff",
  cursor: "pointer"
} satisfies React.CSSProperties;
