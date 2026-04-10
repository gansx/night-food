import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberShell } from "../_components/member-shell";
import { getWebViewerSummary } from "../../lib/auth";
import { createSupabaseServerClient } from "../../lib/supabase/server-client";
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

  const supabase = await createSupabaseServerClient();
  const [{ data: profile }, { data: account }, { data: transactions, count }] = await Promise.all([
    supabase.from("profiles").select("display_name, phone").eq("user_id", viewer.userId).limit(1).maybeSingle(),
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
  ]);

  const totalPages = Math.max(Math.ceil((count ?? 0) / pageSize), 1);

  return (
    <MemberShell
      title="我的"
      description="查看个人资料、家庭身份、积分余额和完整积分流水。"
    >
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ display: "grid", gap: 20 }}>
          <div className="glass-panel" style={{ padding: 24 }}>
            <h2 className="section-title">个人信息</h2>
            <div style={{ marginTop: 16, display: "grid", gap: 10, color: "var(--text-muted)" }}>
              <div>昵称：{(profile?.display_name as string | undefined) ?? "未设置"}</div>
              <div>手机号：{(profile?.phone as string | undefined) ?? "未绑定"}</div>
              <div>当前身份：{viewer.roleLabel}</div>
              <div>登录邮箱：{viewer.email || "未获取到邮箱"}</div>
              <div>
                家庭状态：
                {viewer.householdStatus === "active"
                  ? "已加入家庭"
                  : viewer.householdStatus === "inactive"
                    ? "已被停用"
                    : viewer.householdStatus === "removed"
                      ? "已移出家庭"
                      : "未加入家庭"}
              </div>
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

const pagerStyle = {
  display: "inline-flex",
  borderRadius: 999,
  padding: "10px 14px",
  background: "rgba(255,255,255,0.76)",
  border: "1px solid var(--border-soft)"
} satisfies React.CSSProperties;
