import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminViewerSummary } from "../../lib/auth";
import { createSupabaseServiceRoleClient } from "../../lib/supabase/service-role-client";
import { AdminShell } from "../_components/admin-shell";
import { PointsAdjustForm } from "./_components/points-adjust-form";

export default async function PointsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const viewer = await getAdminViewerSummary();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "owner") {
    redirect("/");
  }

  if (!viewer.householdId) {
    return (
      <AdminShell title="积分管理" description="你还没有家庭空间，先完成家庭初始化。">
        <section className="admin-panel" style={{ padding: 24 }}>
          <Link href="/setup/owner" style={{ color: "var(--brand)", fontWeight: 700 }}>
            立即创建家庭
          </Link>
        </section>
      </AdminShell>
    );
  }

  const { page } = await searchParams;
  const currentPage = Math.max(Number(page ?? "1"), 1);
  const pageSize = 10;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createSupabaseServiceRoleClient();
  const [{ data: members }, { data: transactions, count }] = await Promise.all([
    supabase
      .from("household_members")
      .select("user_id, profiles(display_name), points_accounts(balance)")
      .eq("household_id", viewer.householdId)
      .eq("status", "active"),
    supabase
      .from("points_transactions")
      .select("id, direction, amount, description, user_id, created_at", { count: "exact" })
      .eq("household_id", viewer.householdId)
      .order("created_at", { ascending: false })
      .range(from, to)
  ]);

  const totalPages = Math.max(Math.ceil((count ?? 0) / pageSize), 1);

  return (
    <AdminShell
      title="积分管理"
      description="查看家庭积分统计、核对流水，并支持家主手动加减积分。"
    >
      <section style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 20 }}>
        <div className="admin-panel" style={{ padding: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>成员积分统计</h2>
          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            {(members ?? []).map((member, index) => {
              const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
              const account = Array.isArray(member.points_accounts)
                ? member.points_accounts[0]
                : member.points_accounts;
              return (
                <div
                  key={`${member.user_id}-${index}`}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12
                  }}
                >
                  <strong>{(profile?.display_name as string | undefined) ?? "家庭成员"}</strong>
                  <span>{Number(account?.balance ?? 0)} 积分</span>
                </div>
              );
            })}
          </div>

          <h2 style={{ margin: "24px 0 0", fontSize: 20 }}>积分流水</h2>
          <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
            {(transactions ?? []).length ? (
              (transactions ?? []).map((transaction) => (
                <div
                  key={transaction.id as string}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid var(--border)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <strong>{transaction.description as string}</strong>
                    <span
                      style={{
                        color: transaction.direction === "credit" ? "var(--brand)" : "var(--warn)",
                        fontWeight: 700
                      }}
                    >
                      {transaction.direction === "credit" ? "+" : "-"}
                      {Number(transaction.amount)} 积分
                    </span>
                  </div>
                  <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 14 }}>
                    {new Date(transaction.created_at as string).toLocaleString("zh-CN")}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--muted)" }}>当前还没有积分流水。</div>
            )}
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href={`/points?page=${Math.max(currentPage - 1, 1)}`} style={pagerStyle}>
              上一页
            </Link>
            <span style={{ alignSelf: "center", color: "var(--muted)" }}>
              第 {currentPage} / {totalPages} 页
            </span>
            <Link href={`/points?page=${Math.min(currentPage + 1, totalPages)}`} style={pagerStyle}>
              下一页
            </Link>
          </div>
        </div>

        <PointsAdjustForm
          householdId={viewer.householdId}
          members={(members ?? []).map((member, index) => {
            const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
            return {
              id: member.user_id as string,
              label: (profile?.display_name as string | undefined) ?? `成员 ${index + 1}`
            };
          })}
        />
      </section>
    </AdminShell>
  );
}

const pagerStyle = {
  display: "inline-flex",
  borderRadius: 999,
  padding: "10px 14px",
  background: "rgba(255,255,255,0.76)",
  border: "1px solid var(--border)"
} satisfies React.CSSProperties;
