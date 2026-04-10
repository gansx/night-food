"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ImageUploadField } from "./image-upload-field";

type MenuCategoryOption = {
  id: string;
  name: string;
};

export function CreateMenuItemForm({
  householdId,
  categories
}: {
  householdId: string;
  categories: MenuCategoryOption[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    householdId,
    categoryId: categories[0]?.id ?? "",
    name: "",
    description: "",
    pricePoints: 0,
    imageUrl: "",
    sortOrder: 0,
    isAvailable: true,
    isFeatured: false
  });
  const [message, setMessage] = useState("菜品创建后会立刻进入家庭菜单。");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!form.categoryId && categories[0]?.id) {
      setForm((current) => ({ ...current, categoryId: categories[0].id }));
    }
  }, [categories, form.categoryId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("正在创建菜品...");

    try {
      const response = await fetch("/api/menu/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "创建菜品失败。");
        return;
      }

      setForm((current) => ({
        ...current,
        categoryId: categories[0]?.id ?? current.categoryId,
        name: "",
        description: "",
        pricePoints: 0,
        imageUrl: "",
        sortOrder: 0,
        isAvailable: true,
        isFeatured: false
      }));
      setMessage("菜品创建成功。");
      router.refresh();
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-panel" style={{ padding: 20 }}>
      <h3 style={{ margin: 0, fontSize: 18 }}>新建菜品</h3>
      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>分类</span>
          <select
            value={form.categoryId}
            onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
            style={inputStyle}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>菜品名称</span>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="例如：照烧鸡腿饭"
            style={inputStyle}
          />
        </label>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>描述</span>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="简单介绍一下这道家庭菜品"
            style={{ ...inputStyle, minHeight: 96, resize: "vertical" }}
          />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>积分价格</span>
            <input
              type="number"
              min={0}
              value={form.pricePoints}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  pricePoints: Number(event.target.value)
                }))
              }
              style={inputStyle}
            />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>排序</span>
            <input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sortOrder: Number(event.target.value)
                }))
              }
              style={inputStyle}
            />
          </label>
        </div>
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>图片地址</span>
          <ImageUploadField
            value={form.imageUrl}
            onChange={(imageUrl) => setForm((current) => ({ ...current, imageUrl }))}
          />
        </label>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label style={toggleStyle}>
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(event) =>
                setForm((current) => ({ ...current, isAvailable: event.target.checked }))
              }
            />
            <span>创建后直接上架</span>
          </label>
          <label style={toggleStyle}>
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) =>
                setForm((current) => ({ ...current, isFeatured: event.target.checked }))
              }
            />
            <span>设为今日推荐</span>
          </label>
        </div>
      </div>

      <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>{message}</p>

      <button
        type="submit"
        disabled={loading || !categories.length}
        style={{
          ...buttonStyle,
          background: !categories.length ? "#c6c1b8" : "var(--brand)"
        }}
      >
        {loading ? "创建中..." : "创建菜品"}
      </button>
    </form>
  );
}

const inputStyle = {
  borderRadius: 16,
  border: "1px solid var(--border)",
  padding: "14px 16px",
  fontSize: 16,
  outline: "none",
  background: "rgba(255,255,255,0.86)"
} satisfies React.CSSProperties;

const toggleStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: 14,
  border: "1px solid var(--border)",
  padding: "10px 12px",
  background: "rgba(255,255,255,0.72)"
} satisfies React.CSSProperties;

const buttonStyle = {
  marginTop: 8,
  border: 0,
  borderRadius: 999,
  padding: "12px 18px",
  color: "#fff",
  cursor: "pointer"
} satisfies React.CSSProperties;
