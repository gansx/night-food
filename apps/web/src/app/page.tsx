import Link from "next/link";
import { getOrderStatusLabel, getTaskStatusLabel } from "@night-food/lib";
import { webPrimaryNav } from "@night-food/types";
import { LogoutButton } from "./_components/logout-button";
import { getWebViewerSummary } from "../lib/auth";
import { createSupabaseServiceRoleClient } from "../lib/supabase/service-role-client";

export default async function HomePage() {
  const viewer = await getWebViewerSummary();

  const householdId = viewer?.householdId ?? null;

  const [{ data: settings }, { data: myOrders }, { data: myTasks }, { data: account }, { data: featuredItems }] =
    householdId && viewer
      ? await (async () => {
          const supabase = createSupabaseServiceRoleClient();
          return Promise.all([
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
        ]);
        })()
      : [
          { data: null },
          { data: [] as Array<Record<string, unknown>> },
          { data: [] as Array<Record<string, unknown>> },
          { data: null },
          { data: [] as Array<Record<string, unknown>> }
        ];

  return (
    <main className="app-shell">
      <section className="glass-panel shell-hero">
        <div className="shell-head">
          <div style={{ maxWidth: 620 }}>
            <div className="brand-kicker">Family Web3 Home</div>
            <h1 className="hero-title">家宴星球</h1>
            <p className="hero-subtitle">
              一个给家人用的点餐、任务和积分空间。家主维护菜单与规则，家人完成任务赚积分，再把积分换成一顿有仪式感的家庭餐。
            </p>
          </div>

          <div className="identity-card">
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>当前状态</div>
            <div style={{ marginTop: 8, fontSize: 26, fontWeight: 900 }}>
              {viewer ? viewer.roleLabel : "未登录"}
            </div>
            <div style={{ marginTop: 10, color: "var(--text-muted)" }}>
              {viewer ? viewer.displayName || viewer.username || "已登录" : "登录后即可进入你的家庭空间。"}
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
            <div style={{ marginTop: 14 }}>
              {viewer ? (
                <LogoutButton />
              ) : (
                <Link className="primary-button" href="/login">
                  登录进入
                </Link>
              )}
            </div>
          </div>
        </div>

        <nav className="primary-nav">
          {webPrimaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-card"
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
              输入家主给你的家庭邀请码，或自己创建一个新的家庭。
            </div>
          </div>
          <Link
            href="/family"
            style={{
              borderRadius: 999,
              padding: "12px 18px",
              background: "var(--brand)",
              color: "#fff",
              fontWeight: 700
            }}
          >
            进入家庭引导
          </Link>
        </section>
      ) : null}

      <section className="responsive-grid" style={{ marginTop: 20 }}>
        <div className="stack">
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
      </section>
      <nav className="mobile-bottom-nav">
        {webPrimaryNav.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label.replace("家庭", "")}
          </Link>
        ))}
      </nav>
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
