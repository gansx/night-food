import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "../_components/logout-button";
import { MemberShell } from "../_components/member-shell";
import { getWebViewerSummary } from "../../lib/auth";
import { createSupabaseServiceRoleClient } from "../../lib/supabase/service-role-client";
import { ProfileForm } from "./_components/profile-form";

export default async function MePage({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const viewer = await getWebViewerSummary();

  if (!viewer) {
    redirect("/login");
  }

  const { page } = await searchParams;
  const currentPage = Math.max(Number(page ?? "1"), 1);
  const pageSize = 10;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createSupabaseServiceRoleClient();
  const [
    profileResult,
    { data: account },
    { data: transactions, count },
    householdResult,
    { data: settings },
    { data: recentOrders }
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, phone")
      .eq("user_id", viewer.userId)
      .limit(1)
      .maybeSingle(),
    viewer.householdId
      ? supabase
          .from("points_accounts")
          .select("balance")
          .eq("household_id", viewer.householdId)
          .eq("user_id", viewer.userId)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    viewer.householdId
      ? supabase
          .from("points_transactions")
          .select("id, direction, amount, description, created_at", { count: "exact" })
          .eq("household_id", viewer.householdId)
          .eq("user_id", viewer.userId)
          .order("created_at", { ascending: false })
          .range(from, to)
      : Promise.resolve({ data: [], count: 0 }),
    viewer.householdId
      ? supabase
          .from("households")
          .select("name, family_code")
          .eq("id", viewer.householdId)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    viewer.householdId
      ? supabase
          .from("household_settings")
          .select("ordering_enabled")
          .eq("household_id", viewer.householdId)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    viewer.householdId
      ? supabase
          .from("orders")
          .select("id, order_number, status, total_points, created_at")
          .eq("household_id", viewer.householdId)
          .eq("member_user_id", viewer.userId)
          .order("created_at", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> })
  ]);
  let profile: Record<string, any> | null = profileResult.data;
  if (profileResult.error?.message.toLowerCase().includes("username")) {
    const { data: fallbackProfile } = await supabase
      .from("profiles")
      .select("display_name, phone")
      .eq("user_id", viewer.userId)
      .limit(1)
      .maybeSingle();
    profile = fallbackProfile;
  }

  let household: Record<string, any> | null = householdResult.data;
  const householdErrorMessage = "error" in householdResult ? householdResult.error?.message : undefined;
  if (householdErrorMessage?.toLowerCase().includes("family_code") && viewer.householdId) {
    const { data: fallbackHousehold } = await supabase
      .from("households")
      .select("name, slug")
      .eq("id", viewer.householdId)
      .limit(1)
      .maybeSingle();
    household = fallbackHousehold ? { ...fallbackHousehold, family_code: fallbackHousehold.slug } : null;
  }

  const totalPages = Math.max(Math.ceil((count ?? 0) / pageSize), 1);
  const familyStatusLabel =
    viewer.householdStatus === "active"
      ? "已加入家庭"
      : viewer.householdStatus === "inactive"
        ? "已被停用"
        : viewer.householdStatus === "removed"
          ? "已移出家庭"
          : "未加入家庭";

  return (
    <MemberShell
      title="我的"
      description="查看个人资料、家庭身份、积分余额和完整积分流水。"
      activeHref="/me"
    >
      {!viewer.householdId ? (
        <section
          className="glass-panel"
          style={{
            padding: 20,
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >
          <div>
            <strong>当前账号还没有加入家庭。</strong>
            <div style={{ marginTop: 6, color: "var(--text-muted)" }}>输入家庭邀请码后才能点餐、领取任务和使用积分。</div>
          </div>
          <Link href="/family" style={primaryLinkStyle}>
            输入邀请码
          </Link>
        </section>
      ) : null}

      <section className="glass-panel" style={{ padding: 24, marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 18,
            alignItems: "flex-start",
            flexWrap: "wrap"
          }}
        >
          <div>
            <div className="brand-kicker">My Orbit</div>
            <h2 className="section-title" style={{ marginTop: 10 }}>
              当前状态
            </h2>
            <div style={{ marginTop: 8, color: "var(--text-muted)" }}>
              {(profile?.display_name as string | undefined) || viewer.displayName || viewer.username || "家庭成员"}
            </div>
          </div>
          <LogoutButton />
        </div>

        <div
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12
          }}
        >
          <StatusTile label="当前身份" value={viewer.roleLabel} />
          <StatusTile label="当前积分" value={String(account?.balance ?? 0)} accent="var(--brand)" />
          <StatusTile
            label="点餐状态"
            value={settings?.ordering_enabled === false ? "已暂停" : "开放中"}
            accent="var(--accent)"
          />
          <StatusTile label="最近订单" value={String((recentOrders ?? []).length)} accent="#9f7aea" />
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ display: "grid", gap: 20 }}>
          <div className="glass-panel" style={{ padding: 24 }}>
            <h2 className="section-title">个人信息</h2>
            <div style={{ marginTop: 16, display: "grid", gap: 10, color: "var(--text-muted)" }}>
              <div>账号：{(profile?.username as string | undefined) ?? viewer.username ?? "未设置"}</div>
              <div>昵称：{(profile?.display_name as string | undefined) ?? "未设置"}</div>
              <div>手机号：{(profile?.phone as string | undefined) ?? "未绑定"}</div>
              <div>当前身份：{viewer.roleLabel}</div>
              <div>家庭状态：{familyStatusLabel}</div>
              <div>当前家庭：{(household?.name as string | undefined) ?? "未加入家庭"}</div>
              {viewer.role === "owner" && household?.family_code ? (
                <div>家庭邀请码：{household.family_code as string}</div>
              ) : null}
            </div>
          </div>

          <ProfileForm
            initialDisplayName={(profile?.display_name as string | undefined) ?? ""}
            initialPhone={(profile?.phone as string | undefined) ?? ""}
          />
        </div>

        <div className="glass-panel" style={{ padding: 24 }}>
          <h2 className="section-title">积分与奖励</h2>
          <div style={{ marginTop: 16, fontSize: 34, fontWeight: 800 }}>{account?.balance ?? 0}</div>
          <div style={{ marginTop: 8, color: "var(--text-muted)" }}>当前积分余额</div>
          <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
            {(transactions ?? []).length ? (
              transactions?.map((transaction) => (
                <div
                  key={transaction.id as string}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid var(--border-soft)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span>{(transaction.description as string | null) || "积分变动"}</span>
                    <strong
                      style={{
                        color: transaction.direction === "credit" ? "var(--accent)" : "var(--brand-dark)"
                      }}
                    >
                      {transaction.direction === "credit" ? "+" : "-"}
                      {Number(transaction.amount)}
                    </strong>
                  </div>
                  <div style={{ marginTop: 6, color: "var(--text-muted)", fontSize: 14 }}>
                    {new Date(transaction.created_at as string).toLocaleString("zh-CN")}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--text-muted)" }}>还没有积分流水。</div>
            )}
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href={`/me?page=${Math.max(currentPage - 1, 1)}`} style={pagerStyle}>
              上一页
            </Link>
            <span style={{ alignSelf: "center", color: "var(--text-muted)" }}>
              第 {currentPage} / {totalPages} 页
            </span>
            <Link href={`/me?page=${Math.min(currentPage + 1, totalPages)}`} style={pagerStyle}>
              下一页
            </Link>
          </div>
        </div>
      </section>
    </MemberShell>
  );
}

const primaryLinkStyle = {
  borderRadius: 999,
  padding: "12px 18px",
  background: "var(--brand)",
  color: "#fff",
  fontWeight: 700
} satisfies React.CSSProperties;

const pagerStyle = {
  display: "inline-flex",
  borderRadius: 999,
  padding: "10px 14px",
  background: "rgba(255,255,255,0.76)",
  border: "1px solid var(--border-soft)"
} satisfies React.CSSProperties;

function StatusTile({
  label,
  value,
  accent = "var(--text-strong)"
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        borderRadius: 20,
        padding: "16px 18px",
        background: "rgba(255,255,255,0.72)",
        border: "1px solid var(--border-soft)"
      }}
    >
      <div style={{ color: "var(--text-muted)", fontSize: 14 }}>{label}</div>
      <div style={{ marginTop: 8, color: accent, fontSize: 24, fontWeight: 900 }}>{value}</div>
    </div>
  );
}
