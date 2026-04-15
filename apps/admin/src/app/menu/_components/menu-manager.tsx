"use client";

import { useEffect, useState } from "react";
import { OrbitSelect } from "../../_components/orbit-select";
import { BatchMenuItemToggleForm } from "./batch-menu-item-toggle-form";
import { CreateCategoryForm } from "./create-category-form";
import { CreateMenuItemForm } from "./create-menu-item-form";
import { EditCategoryForm } from "./edit-category-form";
import { EditMenuItemForm } from "./edit-menu-item-form";

export type MenuCategoryRow = {
  id: string;
  name: string;
  sort_order: number | null;
  is_active: boolean | null;
};

export type MenuItemRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price_points: number | null;
  image_url: string | null;
  is_available: boolean | null;
  sort_order: number | null;
  is_featured: boolean | null;
};

type MenuData = {
  categories: MenuCategoryRow[];
  items: MenuItemRow[];
};

const statusOptions = [
  { value: "all", label: "全部状态" },
  { value: "available", label: "已上架" },
  { value: "unavailable", label: "已下架" }
];

const featuredOptions = [
  { value: "all", label: "全部推荐状态" },
  { value: "featured", label: "仅今日推荐" },
  { value: "normal", label: "仅普通菜品" }
];

export function MenuManager({
  householdId,
  initialCategories,
  initialItems,
  initialCategoryId = ""
}: {
  householdId: string;
  initialCategories: MenuCategoryRow[];
  initialItems: MenuItemRow[];
  initialCategoryId?: string;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState(initialItems);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialCategories.some((category) => category.id === initialCategoryId)
      ? initialCategoryId
      : (initialCategories[0]?.id ?? "")
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  async function reloadMenu() {
    setSyncing(true);
    setMessage("");
    try {
      const response = await fetch(`/api/menu?householdId=${householdId}`, {
        cache: "no-store"
      });
      const payload = (await response.json()) as Partial<MenuData> & { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "菜单数据同步失败。");
        return;
      }

      const nextCategories = payload.categories ?? [];
      setCategories(nextCategories);
      setItems(payload.items ?? []);
      setSelectedCategoryId((current) =>
        nextCategories.some((category) => category.id === current) ? current : (nextCategories[0]?.id ?? "")
      );
    } catch {
      setMessage("网络异常，菜单数据同步失败。");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    setSelectedCategoryId((current) =>
      categories.some((category) => category.id === current) ? current : (categories[0]?.id ?? "")
    );
  }, [categories]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategoryId) {
      params.set("category", selectedCategoryId);
    }
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    if (featuredFilter !== "all") {
      params.set("featured", featuredFilter);
    }
    if (search.trim()) {
      params.set("q", search.trim());
    }

    const nextUrl = params.toString() ? `/menu?${params.toString()}` : "/menu";
    window.history.replaceState(null, "", nextUrl);
  }, [featuredFilter, search, selectedCategoryId, statusFilter]);

  const categoryOptions = categories.map((category) => ({
    id: category.id,
    name: category.name
  }));
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !search.trim() ||
      item.name.toLowerCase().includes(search.trim().toLowerCase()) ||
      (item.description ?? "").toLowerCase().includes(search.trim().toLowerCase());
    const matchesCategory = selectedCategoryId ? item.category_id === selectedCategoryId : false;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "available" ? Boolean(item.is_available) : !Boolean(item.is_available));
    const matchesFeatured =
      featuredFilter === "all" ||
      (featuredFilter === "featured" ? Boolean(item.is_featured) : !Boolean(item.is_featured));

    return matchesSearch && matchesCategory && matchesStatus && matchesFeatured;
  });

  return (
    <section style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }}>
      <div className="admin-panel" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>当前菜单结构</h2>
            <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
              切换分类时不再重进页面，只更新当前分类里的菜品。
            </p>
            <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: 13 }}>
              {syncing ? "正在同步菜单数据..." : message || "筛选和切换会在当前页面静默完成。"}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索菜品"
              style={filterStyle}
            />
            <div style={{ minWidth: 170 }}>
              <OrbitSelect
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
                placeholder="先创建分类"
                disabled={!categoryOptions.length}
                options={categoryOptions.map((option) => ({ value: option.id, label: option.name }))}
              />
            </div>
            <div style={{ minWidth: 150 }}>
              <OrbitSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
            </div>
            <div style={{ minWidth: 190 }}>
              <OrbitSelect value={featuredFilter} onChange={setFeaturedFilter} options={featuredOptions} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, display: "grid", gap: 16 }}>
          {selectedCategory ? (
            <article
              style={{
                padding: 18,
                borderRadius: 20,
                background: "rgba(255,255,255,0.72)",
                border: "1px solid var(--border)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <strong>{selectedCategory.name}</strong>
                <span style={{ color: "var(--muted)" }}>
                  {selectedCategory.is_active ? "分类启用中" : "分类已停用"} | 排序 {Number(selectedCategory.sort_order ?? 0)}
                </span>
              </div>

              <EditCategoryForm
                id={selectedCategory.id}
                initialName={selectedCategory.name}
                initialSortOrder={Number(selectedCategory.sort_order ?? 0)}
                initialIsActive={Boolean(selectedCategory.is_active)}
                onChanged={reloadMenu}
              />

              <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                {filteredItems.length ? (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: 14,
                        borderRadius: 16,
                        background: "var(--panel-alt)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <strong>{item.name}</strong>
                        <span style={{ color: "var(--muted)" }}>
                          {item.is_available ? "可点" : "已下架"} | {Number(item.price_points)} 积分 | 排序{" "}
                          {Number(item.sort_order ?? 0)} | {item.is_featured ? "今日推荐" : "普通菜品"}
                        </span>
                      </div>
                      <EditMenuItemForm
                        id={item.id}
                        initialValue={{
                          categoryId: item.category_id,
                          name: item.name,
                          description: item.description ?? "",
                          pricePoints: Number(item.price_points ?? 0),
                          imageUrl: item.image_url ?? "",
                          sortOrder: Number(item.sort_order ?? 0),
                          isAvailable: Boolean(item.is_available),
                          isFeatured: Boolean(item.is_featured)
                        }}
                        onChanged={reloadMenu}
                      />
                    </div>
                  ))
                ) : (
                  <div style={{ color: "var(--muted)" }}>当前筛选条件下，这个分类没有菜品。</div>
                )}
              </div>
            </article>
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
        <CreateCategoryForm householdId={householdId} onChanged={reloadMenu} />
        <CreateMenuItemForm
          householdId={householdId}
          categories={categoryOptions}
          defaultCategoryId={selectedCategoryId}
          onChanged={reloadMenu}
        />
        <BatchMenuItemToggleForm
          householdId={householdId}
          items={filteredItems.map((item) => ({
            id: item.id,
            name: item.name,
            isAvailable: Boolean(item.is_available)
          }))}
          onChanged={reloadMenu}
        />
      </div>
    </section>
  );
}

const filterStyle = {
  borderRadius: 999,
  border: "1px solid var(--border)",
  padding: "10px 14px",
  background: "rgba(255,255,255,0.82)"
} satisfies React.CSSProperties;
