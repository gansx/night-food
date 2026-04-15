"use client";

import type { HouseholdMemberStatus, HouseholdRole } from "@night-food/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OrbitSelect } from "../../_components/orbit-select";

export function MemberAccessForm({
  memberId,
  initialRole,
  initialStatus
}: {
  memberId: string;
  initialRole: HouseholdRole;
  initialStatus: HouseholdMemberStatus;
}) {
  const router = useRouter();
  const [role, setRole] = useState<HouseholdRole>(initialRole);
  const [status, setStatus] = useState<HouseholdMemberStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setLoading(true);
    setMessage("正在保存成员权限...");

    try {
      const response = await fetch(`/api/household/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          memberId,
          role,
          status
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "保存失败");
        return;
      }

      setMessage("成员权限已更新。");
      router.refresh();
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10 }}>
        <OrbitSelect
          value={role}
          onChange={(nextRole) => setRole(nextRole as HouseholdRole)}
          options={[
            { value: "member", label: "家庭成员" },
            { value: "owner", label: "家主" }
          ]}
        />
        <OrbitSelect
          value={status}
          onChange={(nextStatus) => setStatus(nextStatus as HouseholdMemberStatus)}
          options={[
            { value: "active", label: "正常" },
            { value: "inactive", label: "停用" },
            { value: "removed", label: "移除" }
          ]}
        />
        <button type="button" onClick={handleSave} disabled={loading} style={buttonStyle}>
          {loading ? "保存中..." : "保存"}
        </button>
      </div>
      {message ? <div style={{ color: "var(--muted)", fontSize: 14 }}>{message}</div> : null}
    </div>
  );
}

const buttonStyle = {
  border: 0,
  borderRadius: 999,
  padding: "10px 14px",
  background: "var(--brand)",
  color: "#fff",
  cursor: "pointer"
} satisfies React.CSSProperties;
