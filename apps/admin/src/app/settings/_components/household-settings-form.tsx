"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type HouseholdSettingsFormProps = {
  householdId: string;
  initialValues: {
    orderingEnabled: boolean;
    taskApprovalRequired: boolean;
    allowNegativePoints: boolean;
    pointsExchangeRate: number;
    announcementText: string;
    orderingWindowStart: string;
    orderingWindowEnd: string;
  };
};

export function HouseholdSettingsForm({
  householdId,
  initialValues
}: HouseholdSettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    householdId,
    ...initialValues
  });
  const [message, setMessage] = useState("修改后会立即作用到点餐和任务流程。");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("正在保存家庭规则...");

    try {
      const response = await fetch("/api/settings/household", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "保存失败");
        return;
      }

      setMessage("家庭规则已更新。");
      router.refresh();
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-panel" style={{ padding: 24 }}>
      <h2 style={{ margin: 0, fontSize: 20 }}>编辑家庭规则</h2>
      <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
        <ToggleRow
          label="开放点餐"
          description="关闭后成员仍可浏览菜单，但不能提交新订单。"
          checked={form.orderingEnabled}
          onChange={(checked) => setForm((current) => ({ ...current, orderingEnabled: checked }))}
        />
        <ToggleRow
          label="任务需要家主审批"
          description="关闭后成员提交任务会直接到账积分。"
          checked={form.taskApprovalRequired}
          onChange={(checked) =>
            setForm((current) => ({ ...current, taskApprovalRequired: checked }))
          }
        />
        <ToggleRow
          label="允许负积分点餐"
          description="开启后成员积分不足时也可以继续下单。"
          checked={form.allowNegativePoints}
          onChange={(checked) =>
            setForm((current) => ({ ...current, allowNegativePoints: checked }))
          }
        />

        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>积分兑换比例</span>
          <input
            type="number"
            min={1}
            value={form.pointsExchangeRate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                pointsExchangeRate: Number(event.target.value || 1)
              }))
            }
            style={inputStyle}
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>点餐开始时间</span>
            <input
              type="time"
              value={form.orderingWindowStart}
              onChange={(event) =>
                setForm((current) => ({ ...current, orderingWindowStart: event.target.value }))
              }
              style={inputStyle}
            />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>点餐结束时间</span>
            <input
              type="time"
              value={form.orderingWindowEnd}
              onChange={(event) =>
                setForm((current) => ({ ...current, orderingWindowEnd: event.target.value }))
              }
              style={inputStyle}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() =>
            setForm((current) => ({
              ...current,
              orderingWindowStart: "",
              orderingWindowEnd: ""
            }))
          }
          style={secondaryButtonStyle}
        >
          清空时间限制
        </button>

        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>家庭公告</span>
          <textarea
            value={form.announcementText}
            onChange={(event) =>
              setForm((current) => ({ ...current, announcementText: event.target.value }))
            }
            placeholder="例如：今晚 19:30 后统一出餐，做完作业再点心夜宵。"
            style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
          />
        </label>
      </div>

      <p style={{ margin: "14px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>{message}</p>

      <button type="submit" disabled={loading} style={primaryButtonStyle}>
        {loading ? "保存中..." : "保存规则"}
      </button>
    </form>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "flex-start",
        padding: 16,
        borderRadius: 18,
        background: "rgba(255,255,255,0.72)",
        border: "1px solid var(--border)"
      }}
    >
      <span style={{ display: "grid", gap: 6 }}>
        <strong>{label}</strong>
        <span style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        style={{ width: 18, height: 18, marginTop: 4 }}
      />
    </label>
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

const primaryButtonStyle = {
  marginTop: 10,
  border: 0,
  borderRadius: 999,
  padding: "12px 18px",
  background: "var(--brand)",
  color: "#fff",
  cursor: "pointer"
} satisfies React.CSSProperties;

const secondaryButtonStyle = {
  justifySelf: "start",
  borderRadius: 999,
  border: "1px solid var(--border)",
  padding: "10px 14px",
  background: "rgba(255,255,255,0.72)",
  color: "var(--text)",
  cursor: "pointer"
} satisfies React.CSSProperties;
