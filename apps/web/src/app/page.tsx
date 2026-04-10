import Link from "next/link";
import { getOrderStatusLabel, getTaskStatusLabel } from "@night-food/lib";
import { householdQuickActions, webPrimaryNav } from "@night-food/types";
import { getWebViewerSummary } from "../lib/auth";
import { createSupabaseServerClient } from "../lib/supabase/server-client";

export default async function HomePage() {
  const viewer = await getWebViewerSummary();
  const supabase = await createSupabaseServerClient();

  const householdId = viewer?.householdId ?? null;

  const [{ data: settings }, { data: myOrders }, { data: myTasks }, { data: account }, { data: featuredItems }] =
    householdId && viewer
      ? await Promise.all([
          supabase
            .from("household_settings")
            .select("announcement_text, ordering_enabled")
            .eq("household_id", householdId)
            .limit(1)
            .maybeSingle(),
          supabase
            .from("orders")
            .select("order_number, status, total_points, created_at")
            .eq("household_id", householdId)
            .eq("member_user_id", viewer.userId)
            .order("created_at", { ascending: false })
            .limit(3),
          supabase
            .from("tasks")
            .select("title, reward_points, status")
            .eq("household_id", householdId)
            .or(`assigned_user_id.eq.${viewer.userId},status.eq.open`)
            .order("created_at", { ascending: false })
            .limit(4),
          supabase
            .from("points_accounts")
            .select("balance")
            .eq("household_id", householdId)
            .eq("user_id", viewer.userId)
            .limit(1)
            .maybeSingle(),
          supabase
            .from("menu_items")
            .select("id, name, price_points")
            .eq("household_id", householdId)
            .eq("is_available", true)
            .eq("is_featured", true)
            .order("sort_order", { ascending: true })
            .limit(4)
        ])
      : [
          { data: null },
          { data: [] as Array<Record<string, unknown>> },
          { data: [] as Array<Record<string, unknown>> },
          { data: null },
          { data: [] as Array<Record<string, unknown>> }
        ];

  return (
    <main className="app-shell">
      <section
        className="glass-panel"
        style={{
          padding: 28,
          display: "grid",
          gap: 24,
          background:
            "linear-gradient(140deg, rgba(255,248,234,0.96) 0%, rgba(255,245,229,0.88) 42%, rgba(236,252,243,0.86) 100%)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 24,
            alignItems: "flex-start",
            flexWrap: "wrap"
          }}
        >
          <div style={{ maxWidth: 620 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 999,
                padding: "8px 14px",
                background: "rgba(255,255,255,0.7)",
                border: "1px solid var(--border-soft)",
                color: "var(--text-muted)"
              }}
            >
              家庭模式
            </div>
            <h1 style={{ margin: "18px 0 12px", fontSize: "clamp(2rem, 4vw, 3.8rem)", lineHeight: 1.05 }}>
              把点餐、任务、积分和家庭协作放进同一个家用平台
            </h1>
            <p
              style={{
                margin: 0,
                maxWidth: 560,
                color: "var(--text-muted)",
                lineHeight: 1.7,
                fontSize: "1rem"
              }}
            >
              家主维护菜单和规则，家人领取任务赚积分，再用积分点餐。整个平台围绕家庭运转，而不是围绕商家经营。
            </p>
          </div>

          <div className="glass-panel" style={{ padding: 18, minWidth: 280, background: "rgba(255,255,255,0.72)" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>当前状态</div>
            <div style={{ marginTop: 8, fontSize: 26, fontWeight: 700 }}>
              {viewer ? viewer.roleLabel : "未登录"}
            </div>
            <div style={{ marginTop: 10, color: "var(--text-muted)" }}>
              {viewer ? viewer.email : "登录后即可进入你的家庭空间。"}
            </div>
            <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
              <StatRow label="当前积分" value={String(account?.balance ?? 0)} accent="var(--brand)" />
              <StatRow
                label="点餐状态"
                value={settings?.ordering_enabled === false ? "已暂停" : "开放中"}
                accent="var(--accent)"
              />
              <StatRow label="最近订单" value={String((myOrders ?? []).length)} accent="#7a57c8" />
            </div>
          </div>
        </div>

        <nav style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {webPrimaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="glass-panel"
              style={{ padding: 16, borderRadius: 20, background: "rgba(255,255,255,0.68)" }}
            >
              <div style={{ fontWeight: 700 }}>{item.label}</div>
              <div style={{ marginTop: 6, color: "var(--text-muted)", fontSize: 14 }}>{item.description}</div>
            </Link>
          ))}
        </nav>
      </section>

      {viewer && !viewer.householdId ? (
        <section
          className="glass-panel"
          style={{
            padding: 20,
            marginTop: 20,
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >
          <div>
            <strong>你还没有加入任何家庭。</strong>
            <div style={{ marginTop: 6, color: "var(--text-muted)" }}>
              让家主发送邀请链接给你，或先确认你已使用正确邮箱登录。
            </div>
          </div>
          <Link
            href="/login"
            style={{
              borderRadius: 999,
              padding: "12px 18px",
              background: "var(--brand)",
              color: "#fff",
              fontWeight: 700
            }}
          >
            查看登录入口
          </Link>
        </section>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginTop: 20 }}>
        <div className="glass-panel" style={{ padding: 24 }}>
          <h2 className="section-title">家庭快捷入口</h2>
          <p className="section-copy">
            保留原项目的核心路径，但重构成更适合家庭协作的网页版体验。
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginTop: 20
            }}
          >
            {householdQuickActions.map((action) => (
              <article
                key={action.href}
                style={{
                  padding: 18,
                  borderRadius: 24,
                  background: action.background,
                  border: "1px solid rgba(50,35,18,0.08)"
                }}
              >
                <div style={{ fontSize: 14, color: "var(--text-muted)" }}>{action.kicker}</div>
                <div style={{ marginTop: 10, fontWeight: 800, fontSize: 22 }}>{action.label}</div>
                <p style={{ margin: "10px 0 0", lineHeight: 1.6, color: "var(--text-muted)" }}>
                  {action.description}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          <div className="glass-panel" style={{ padding: 24 }}>
            <h2 className="section-title">家庭公告</h2>
            <div style={{ marginTop: 16, color: "var(--text-muted)", lineHeight: 1.7 }}>
              {settings?.announcement_text || "当前还没有家庭公告。"}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 24 }}>
            <h2 className="section-title">今日推荐</h2>
            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              {(featuredItems ?? []).length ? (
                (featuredItems ?? []).map((item) => (
                  <div
                    key={item.id as string}
                    style={{
                      padding: 14,
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.72)",
                      border: "1px solid var(--border-soft)",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12
                    }}
                  >
                    <strong>{item.name as string}</strong>
                    <span>{Number(item.price_points)} 积分</span>
                  </div>
                ))
              ) : (
                <div style={{ color: "var(--text-muted)" }}>家主还没有设置今日推荐菜品。</div>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 24 }}>
            <h2 className="section-title">最近任务与订单</h2>
            <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
              {(myTasks ?? []).slice(0, 2).map((task, index) => (
                <div
                  key={`${task.title}-${index}`}
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid var(--border-soft)"
                  }}
                >
                  <strong>{String(task.title ?? "家庭任务")}</strong>
                  <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 14 }}>
                    {getTaskStatusLabel(String(task.status ?? "open") as never)} | 奖励{" "}
                    {Number(task.reward_points ?? 0)} 积分
                  </div>
                </div>
              ))}
              {(myOrders ?? []).slice(0, 2).map((order, index) => (
                <div
                  key={`${order.order_number}-${index}`}
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid var(--border-soft)"
                  }}
                >
                  <strong>{String(order.order_number ?? "家庭订单")}</strong>
                  <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 14 }}>
                    {getOrderStatusLabel(String(order.status ?? "submitted") as never)} |{" "}
                    {Number(order.total_points ?? 0)} 积分
                  </div>
                </div>
              ))}
              {!myTasks?.length && !myOrders?.length ? (
                <div style={{ color: "var(--text-muted)" }}>当前还没有可展示的任务或订单。</div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatRow({
  label,
  value,
  accent
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 12,
        borderBottom: "1px solid var(--border-soft)"
      }}
    >
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ color: accent, fontSize: 22, fontWeight: 800 }}>{value}</span>
    </div>
  );
}
