import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberStatusLabel, getOrderStatusLabel, getTaskStatusLabel } from "@night-food/lib";
import { adminPrimaryNav } from "@night-food/types";
import { getAdminViewerSummary } from "../lib/auth";
import { createSupabaseServerClient } from "../lib/supabase/server-client";

export default async function AdminHomePage() {
  const viewer = await getAdminViewerSummary();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role === "member") {
    return (
      <main className="admin-shell">
        <section className="admin-panel" style={{ padding: 28, maxWidth: 760, margin: "48px auto 0" }}>
          <div style={{ color: "var(--brand)", fontWeight: 700, fontSize: 14 }}>管理台访问限制</div>
          <h1 style={{ margin: "12px 0 0", fontSize: "clamp(2rem, 4vw, 3rem)" }}>当前账号不是家主</h1>
          <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.7 }}>
            管理台只对家主开放。你已经加入家庭，但当前身份是家庭成员，请前往成员端使用点餐、任务和积分功能。
          </p>
          <Link
            href={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}
            style={{
              display: "inline-flex",
              marginTop: 18,
              borderRadius: 999,
              padding: "12px 18px",
              background: "var(--brand)",
              color: "#fff",
              fontWeight: 700
            }}
          >
            前往成员端
          </Link>
        </section>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const householdId = viewer.householdId ?? null;

  const [{ data: settings }, { data: orders }, { data: tasks }, { data: members }, { data: pointRanks }] =
    householdId
      ? await Promise.all([
          supabase
            .from("household_settings")
            .select("announcement_text, ordering_enabled, task_approval_required")
            .eq("household_id", householdId)
            .limit(1)
            .maybeSingle(),
          supabase
            .from("orders")
            .select("order_number, status, total_points, created_at")
            .eq("household_id", householdId)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("tasks")
            .select("title, status, reward_points")
            .eq("household_id", householdId)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("household_members")
            .select("status")
            .eq("household_id", householdId),
          supabase
            .from("points_accounts")
            .select("balance, profiles:user_id(display_name)")
            .eq("household_id", householdId)
            .order("balance", { ascending: false })
            .limit(5)
        ])
      : [
          { data: null },
          { data: [] as Array<Record<string, unknown>> },
          { data: [] as Array<Record<string, unknown>> },
          { data: [] as Array<Record<string, unknown>> },
          { data: [] as Array<Record<string, unknown>> }
        ];

  const pendingOrders = (orders ?? []).filter((order) => order.status === "submitted").length;
  const pendingTasks = (tasks ?? []).filter((task) => task.status === "submitted").length;
  const activeMembers = (members ?? []).filter((member) => member.status === "active").length;

  return (
    <main className="admin-shell">
      <section
        className="admin-panel"
        style={{
          padding: 28,
          display: "grid",
          gap: 24,
          background: "linear-gradient(145deg, rgba(255,250,241,0.98) 0%, rgba(245,253,246,0.92) 100%)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ color: "var(--brand)", fontWeight: 700 }}>家庭管理台</div>
            <h1 style={{ margin: "14px 0 10px", fontSize: "clamp(2rem, 4vw, 3.4rem)" }}>
              家主统一管理菜单、订单、任务、积分和家庭规则
            </h1>
            <p style={{ margin: 0, lineHeight: 1.7, color: "var(--muted)" }}>
              这里是家庭运营后台，不是商家后台。你可以统一管理每日菜单、订单状态、任务奖励、成员权限和积分规则。
            </p>
          </div>

          <div className="admin-panel" style={{ padding: 18, minWidth: 280, background: "rgba(255,255,255,0.76)" }}>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>当前登录</div>
            <div style={{ marginTop: 8, fontSize: 24, fontWeight: 800 }}>{viewer.roleLabel}</div>
            <div style={{ marginTop: 10, color: "var(--muted)" }}>{viewer.email}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
          {[
            { label: "待确认订单", value: String(pendingOrders), accent: "var(--warn)" },
            { label: "待审批任务", value: String(pendingTasks), accent: "var(--brand)" },
            { label: "活跃成员", value: String(activeMembers), accent: "#ba4f93" },
            {
              label: "点餐状态",
              value: settings?.ordering_enabled === false ? "暂停" : "开放",
              accent: "#6b5bd1"
            }
          ].map((metric) => (
            <div key={metric.label} className="admin-panel" style={{ padding: 18, background: "rgba(255,255,255,0.72)" }}>
              <div style={{ color: "var(--muted)", fontSize: 14 }}>{metric.label}</div>
              <div style={{ marginTop: 10, fontSize: 30, fontWeight: 800, color: metric.accent }}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>

        {!viewer.householdId ? (
          <div
            className="admin-panel"
            style={{
              padding: 18,
              background: "rgba(255,255,255,0.82)",
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "center",
              flexWrap: "wrap"
            }}
          >
            <div>
              <strong>你还没有创建家庭。</strong>
              <div style={{ marginTop: 6, color: "var(--muted)" }}>
                先完成家庭初始化，后续才能邀请家人、设置菜单和管理积分。
              </div>
            </div>
            <Link
              href="/setup/owner"
              style={{
                borderRadius: 999,
                padding: "12px 18px",
                background: "var(--brand)",
                color: "#fff",
                fontWeight: 700
              }}
            >
              创建家庭
            </Link>
          </div>
        ) : null}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 20, marginTop: 20 }}>
        <div className="admin-panel" style={{ padding: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>核心管理模块</h2>
          <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
            这些模块对应新版本家庭平台的主要管理边界：菜单、订单、任务、成员、积分和系统规则。
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
              marginTop: 20
            }}
          >
            {adminPrimaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: 18,
                  borderRadius: 20,
                  background: item.background,
                  border: "1px solid var(--border)"
                }}
              >
                <div style={{ fontWeight: 800 }}>{item.label}</div>
                <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>{item.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          <div className="admin-panel" style={{ padding: 24 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>最近订单与任务</h2>
            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              {(orders ?? []).slice(0, 3).map((order, index) => (
                <div
                  key={`${order.order_number}-${index}`}
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid var(--border)"
                  }}
                >
                  <strong>{String(order.order_number ?? "家庭订单")}</strong>
                  <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 14 }}>
                    {getOrderStatusLabel(String(order.status ?? "submitted") as never)} | {Number(order.total_points ?? 0)} 积分
                  </div>
                </div>
              ))}
              {(tasks ?? []).slice(0, 2).map((task, index) => (
                <div
                  key={`${task.title}-${index}`}
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid var(--border)"
                  }}
                >
                  <strong>{String(task.title ?? "家庭任务")}</strong>
                  <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 14 }}>
                    {getTaskStatusLabel(String(task.status ?? "open") as never)} | 奖励 {Number(task.reward_points ?? 0)} 积分
                  </div>
                </div>
              ))}
              {!orders?.length && !tasks?.length ? (
                <div style={{ color: "var(--muted)" }}>当前还没有订单或任务数据。</div>
              ) : null}
            </div>
          </div>

          <div className="admin-panel" style={{ padding: 24 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>成员积分排行</h2>
            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              {(pointRanks ?? []).length ? (
                (pointRanks ?? []).map((entry, index) => {
                  const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
                  return (
                    <div
                      key={`${index}-${entry.balance}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        paddingBottom: 12,
                        borderBottom: "1px solid var(--border)"
                      }}
                    >
                      <span style={{ color: "var(--muted)" }}>
                        {index + 1}. {(profile?.display_name as string | undefined) ?? "家庭成员"}
                      </span>
                      <strong>{Number(entry.balance ?? 0)} 积分</strong>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: "var(--muted)" }}>当前还没有积分数据。</div>
              )}
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
              家庭公告：{settings?.announcement_text || "当前还没有设置家庭公告。"}
            </div>
            <div style={{ marginTop: 12, color: "var(--muted)", fontSize: 14 }}>
              成员状态摘要：{(members ?? []).map((member) => getMemberStatusLabel(member.status as never)).join("、") || "暂无成员"}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
