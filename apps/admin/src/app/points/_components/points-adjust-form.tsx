"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchAppPath } from "../../../lib/base-path";
import { OrbitSelect } from "../../_components/orbit-select";

export function PointsAdjustForm({
  householdId,
  members
}: {
  householdId: string;
  members: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [userId, setUserId] = useState(members[0]?.id ?? "");
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState(10);
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("家主可以在这里手动补发或扣减积分。");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("正在调整积分...");

    try {
      const response = await fetchAppPath("/api/points/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          householdId,
          userId,
          direction,
          amount,
          description
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "调整失败");
        return;
      }

      setDescription("");
      setMessage("积分已调整。");
      router.refresh();
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-panel" style={{ padding: 20 }}>
      <h3 style={{ margin: 0, fontSize: 18 }}>手动调整积分</h3>
      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        <OrbitSelect
          value={userId}
          onChange={setUserId}
          placeholder="暂无可调整成员"
          options={members.map((member) => ({ value: member.id, label: member.label }))}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <OrbitSelect
            value={direction}
            onChange={(nextDirection) => setDirection(nextDirection as "credit" | "debit")}
            options={[
              { value: "credit", label: "增加积分" },
              { value: "debit", label: "扣减积分" }
            ]}
          />
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            style={inputStyle}
          />
        </div>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="填写调整原因，例如：周末大扫除奖励"
          style={{ ...inputStyle, minHeight: 88, resize: "vertical" }}
        />
      </div>

      <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>{message}</p>

      <button type="submit" disabled={loading || !members.length} style={buttonStyle}>
        {loading ? "提交中..." : "提交调整"}
      </button>
    </form>
  );
}

const inputStyle = {
  borderRadius: 18,
  border: "1px solid var(--border)",
  padding: "14px 16px",
  background: "rgba(255,255,255,0.86)"
} satisfies React.CSSProperties;

const buttonStyle = {
  marginTop: 10,
  border: 0,
  borderRadius: 999,
  padding: "12px 18px",
  background: "var(--brand)",
  color: "#fff",
  cursor: "pointer"
} satisfies React.CSSProperties;
