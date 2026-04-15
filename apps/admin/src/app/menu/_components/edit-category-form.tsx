"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EditCategoryForm({
  id,
  initialName,
  initialSortOrder,
  initialIsActive,
  onChanged
}: {
  id: string;
  initialName: string;
  initialSortOrder: number;
  initialIsActive: boolean;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    setMessage("正在保存分类...");

    try {
      const response = await fetch(`/api/menu/categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          sortOrder,
          isActive
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "保存失败。");
        return;
      }

      setMessage("分类已更新。");
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
    if (!window.confirm("确认删除这个分类吗？分类下有菜品时会阻止删除。")) {
      return;
    }

    setLoading(true);
    setMessage("正在删除分类...");

    try {
      const response = await fetch(`/api/menu/categories/${id}`, {
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
    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 110px auto", gap: 10 }}>
        <input value={name} onChange={(event) => setName(event.target.value)} style={inputStyle} />
        <input
          type="number"
          min={0}
          value={sortOrder}
          onChange={(event) => setSortOrder(Number(event.target.value))}
          style={inputStyle}
        />
        <label style={toggleStyle}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          <span>{isActive ? "分类启用中" : "分类已停用"}</span>
        </label>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={handleSave} disabled={loading} style={primaryButtonStyle}>
          {loading ? "处理中..." : "保存分类"}
        </button>
        <button type="button" onClick={handleDelete} disabled={loading} style={dangerButtonStyle}>
          删除分类
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
