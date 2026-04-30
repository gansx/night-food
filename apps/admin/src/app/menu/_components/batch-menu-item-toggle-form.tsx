"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchAppPath } from "../../../lib/base-path";

type BatchItem = {
  id: string;
  name: string;
  isAvailable: boolean;
};

export function BatchMenuItemToggleForm({
  householdId,
  items,
  onChanged
}: {
  householdId: string;
  items: BatchItem[];
  onChanged?: () => void;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function toggleItem(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  async function submit(isAvailable: boolean) {
    if (!selectedIds.length) {
      setMessage("请先选择要操作的菜品。");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetchAppPath("/api/menu/items/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          householdId,
          itemIds: selectedIds,
          isAvailable
        })
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "批量操作失败。");
        return;
      }
      setSelectedIds([]);
      setMessage(isAvailable ? "已批量上架。" : "已批量下架。");
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
    <div className="admin-panel" style={{ padding: 20 }}>
      <h3 style={{ margin: 0, fontSize: 18 }}>批量上下架</h3>
      <div style={{ marginTop: 14, display: "grid", gap: 10, maxHeight: 240, overflow: "auto" }}>
        {items.length ? (
          items.map((item) => (
            <label
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 10,
                borderRadius: 14,
                background: "rgba(255,255,255,0.72)",
                border: "1px solid var(--border)"
              }}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={() => toggleItem(item.id)}
              />
              <span style={{ flex: 1 }}>{item.name}</span>
              <span style={{ color: "var(--muted)", fontSize: 14 }}>
                {item.isAvailable ? "已上架" : "已下架"}
              </span>
            </label>
          ))
        ) : (
          <div style={{ color: "var(--muted)" }}>当前筛选结果下没有菜品。</div>
        )}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" disabled={loading} onClick={() => submit(true)} style={primaryStyle}>
          批量上架
        </button>
        <button type="button" disabled={loading} onClick={() => submit(false)} style={secondaryStyle}>
          批量下架
        </button>
      </div>

      {message ? <div style={{ marginTop: 12, color: "var(--muted)", fontSize: 14 }}>{message}</div> : null}
    </div>
  );
}

const primaryStyle = {
  border: 0,
  borderRadius: 999,
  padding: "10px 14px",
  background: "var(--brand)",
  color: "#fff",
  cursor: "pointer"
} satisfies React.CSSProperties;

const secondaryStyle = {
  border: 0,
  borderRadius: 999,
  padding: "10px 14px",
  background: "#b44d2a",
  color: "#fff",
  cursor: "pointer"
} satisfies React.CSSProperties;
