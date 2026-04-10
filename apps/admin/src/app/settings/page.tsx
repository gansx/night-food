import { formatOrderingWindow } from "@night-food/lib";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { getAdminViewerSummary } from "../../lib/auth";
import { createSupabaseServerClient } from "../../lib/supabase/server-client";
import { HouseholdSettingsForm } from "./_components/household-settings-form";

export default async function SettingsPage() {
  const viewer = await getAdminViewerSummary();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "owner") {
    redirect("/");
  }

  if (!viewer.householdId) {
    return (
      <AdminShell title="规则设置" description="你还没有家庭空间，先完成家庭初始化。">
        <section className="admin-panel" style={{ padding: 24 }}>
          <Link href="/setup/owner" style={{ color: "var(--brand)", fontWeight: 700 }}>
            立即创建家庭
          </Link>
        </section>
      </AdminShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: settings }, { data: household }] = await Promise.all([
    supabase
      .from("household_settings")
      .select(
        "ordering_enabled, task_approval_required, allow_negative_points, points_exchange_rate, announcement_text, ordering_window_start, ordering_window_end"
      )
      .eq("household_id", viewer.householdId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("households")
      .select("name, timezone")
      .eq("id", viewer.householdId)
      .limit(1)
      .maybeSingle()
  ]);

  const orderingWindowLabel = formatOrderingWindow(
    settings?.ordering_window_start as string | null | undefined,
    settings?.ordering_window_end as string | null | undefined
  );

  return (
    <AdminShell
      title="规则设置"
      description="配置点餐开关、时间窗、任务审核、积分规则和家庭公告。"
    >
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 20 }}>
        <div className="admin-panel" style={{ padding: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>当前生效规则</h2>
          <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
            {[
              `家庭空间：${household?.name ?? "未命名家庭"}`,
              `家庭时区：${household?.timezone ?? "Asia/Shanghai"}`,
              `点餐开关：${settings?.ordering_enabled === false ? "关闭" : "开启"}`,
              `点餐时间窗：${orderingWindowLabel}`,
              `积分兑换比例：1 积分 = ${settings?.points_exchange_rate ?? 1} 点额度`,
              `任务完成审核：${settings?.task_approval_required === false ? "自动到账" : "家主审批后到账"}`,
              `允许负积分：${settings?.allow_negative_points ? "开启" : "关闭"}`
            ].map((row) => (
              <div
                key={row}
                style={{
                  padding: 16,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.72)",
                  border: "1px solid var(--border)"
                }}
              >
                {row}
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 18,
              background: "var(--panel-alt)",
              color: "var(--muted)",
              lineHeight: 1.7
            }}
          >
            {settings?.announcement_text || "当前还没有设置家庭公告。"}
          </div>
        </div>

        <HouseholdSettingsForm
          householdId={viewer.householdId}
          initialValues={{
            orderingEnabled: settings?.ordering_enabled ?? true,
            taskApprovalRequired: settings?.task_approval_required ?? true,
            allowNegativePoints: settings?.allow_negative_points ?? false,
            pointsExchangeRate: Number(settings?.points_exchange_rate ?? 1),
            announcementText: (settings?.announcement_text as string | null) ?? "",
            orderingWindowStart: ((settings?.ordering_window_start as string | null) ?? "").slice(0, 5),
            orderingWindowEnd: ((settings?.ordering_window_end as string | null) ?? "").slice(0, 5)
          }}
        />
      </section>
    </AdminShell>
  );
}
