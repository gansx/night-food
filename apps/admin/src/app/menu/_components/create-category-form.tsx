"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateCategoryForm({ householdId, onChanged }: { householdId: string; onChanged?: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("先创建分类，再把家庭菜品放进去。");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("正在创建分类...");

    try {
      const response = await fetch("/api/menu/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          householdId,
          name
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "创建分类失败。");
        return;
      }

      setName("");
      setMessage("分类创建成功。");
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
    <form onSubmit={handleSubmit} className="admin-panel" data-testid="create-category-form" style={{ padding: 20 }}>
      <h3 style={{ margin: 0, fontSize: 18 }}>新建分类</h3>
      <label style={{ display: "grid", gap: 8, marginTop: 14 }}>
        <span style={{ color: "var(--muted)", fontSize: 14 }}>分类名称</span>
        <input
          data-testid="create-category-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="例如：晚饭主食"
          style={inputStyle}
        />
      </label>

      <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>{message}</p>

      <button type="submit" data-testid="create-category-submit" disabled={loading} style={buttonStyle}>
        {loading ? "创建中..." : "创建分类"}
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

const buttonStyle = {
  marginTop: 8,
  border: 0,
  borderRadius: 999,
  padding: "12px 18px",
  background: "var(--brand)",
  color: "#fff",
  cursor: "pointer"
} satisfies React.CSSProperties;
