"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImageUploadField } from "./image-upload-field";

export function EditMenuItemForm({
  id,
  initialValue,
  onChanged
}: {
  id: string;
  onChanged?: () => void;
  initialValue: {
    categoryId: string;
    name: string;
    description: string;
    pricePoints: number;
    imageUrl: string;
    sortOrder: number;
    isAvailable: boolean;
    isFeatured: boolean;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initialValue);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    setMessage("正在保存菜品...");

    try {
      const response = await fetch(`/api/menu/items/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "保存失败。");
        return;
      }

      setMessage("菜品已更新。");
      if (onChanged) {
        onChanged();
      } else {
        router.refresh();
      }
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("确认删除这个菜品吗？")) {
      return;
    }

    setLoading(true);
    setMessage("正在删除菜品...");

    try {
      const response = await fetch(`/api/menu/items/${id}`, {
        method: "DELETE"
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "删除失败。");
        return;
      }

      if (onChanged) {
        onChanged();
      } else {
        router.refresh();
      }
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 100px 100px", gap: 10 }}>
        <input
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          style={inputStyle}
        />
        <input
          type="number"
          min={0}
          value={form.pricePoints}
          onChange={(event) =>
            setForm((current) => ({ ...current, pricePoints: Number(event.target.value) }))
          }
          style={inputStyle}
        />
        <input
          type="number"
          min={0}
          value={form.sortOrder}
          onChange={(event) =>
            setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))
          }
          style={inputStyle}
        />
      </div>

      <textarea
        value={form.description}
        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
        placeholder="菜品描述"
        style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
      />

      <ImageUploadField
        value={form.imageUrl}
        onChange={(imageUrl) => setForm((current) => ({ ...current, imageUrl }))}
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <label style={toggleStyle}>
          <input
            type="checkbox"
            checked={form.isAvailable}
            onChange={(event) =>
              setForm((current) => ({ ...current, isAvailable: event.target.checked }))
            }
          />
          <span>{form.isAvailable ? "已上架" : "已下架"}</span>
        </label>
        <label style={toggleStyle}>
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(event) =>
              setForm((current) => ({ ...current, isFeatured: event.target.checked }))
            }
          />
          <span>{form.isFeatured ? "今日推荐" : "普通菜品"}</span>
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={handleSave} disabled={loading} style={primaryButtonStyle}>
          {loading ? "处理中..." : "保存菜品"}
        </button>
        <button type="button" onClick={handleDelete} disabled={loading} style={dangerButtonStyle}>
          删除菜品
        </button>
      </div>
      {message ? <div style={{ color: "var(--muted)", fontSize: 14 }}>{message}</div> : null}
    </div>
  );
}

const inputStyle = {
  borderRadius: 14,
  border: "1px solid var(--border)",
  padding: "10px 12px",
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

const primaryButtonStyle = {
  border: 0,
  borderRadius: 999,
  padding: "10px 14px",
  background: "var(--brand)",
  color: "#fff",
  cursor: "pointer"
} satisfies React.CSSProperties;

const dangerButtonStyle = {
  border: 0,
  borderRadius: 999,
  padding: "10px 14px",
  background: "#b44d2a",
  color: "#fff",
  cursor: "pointer"
} satisfies React.CSSProperties;
