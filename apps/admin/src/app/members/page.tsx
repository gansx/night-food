import { formatDateTime, getMemberStatusLabel, getRoleDisplayName } from "@night-food/lib";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { getAdminViewerSummary } from "../../lib/auth";
import { createSupabaseServiceRoleClient } from "../../lib/supabase/service-role-client";
import { RefreshFamilyCodeButton } from "../settings/_components/refresh-family-code-button";
import { MemberAccessForm } from "./_components/member-access-form";

export default async function MembersPage() {
  const viewer = await getAdminViewerSummary();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "owner") {
    redirect("/");
  }

  if (!viewer.householdId) {
    return (
      <AdminShell title="成员管理" description="你还没有家庭空间，先完成家庭初始化后再邀请家人。">
        <section className="admin-panel" style={{ padding: 24 }}>
          <Link href="/setup/owner" style={{ color: "var(--brand)", fontWeight: 700 }}>
            立即创建家庭
          </Link>
        </section>
      </AdminShell>
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const [membersResult, householdResult] = await Promise.all([
    supabase
      .from("household_members")
      .select("id, role, status, user_id, joined_at, profiles(display_name, username, phone)")
      .eq("household_id", viewer.householdId)
      .order("created_at", { ascending: true }),
    supabase
      .from("households")
      .select("name, family_code, family_code_updated_at")
      .eq("id", viewer.householdId)
      .limit(1)
      .maybeSingle()
  ]);
  let members: Array<Record<string, any>> | null = membersResult.data;
  if (membersResult.error?.message.toLowerCase().includes("username")) {
    const { data: fallbackMembers } = await supabase
      .from("household_members")
      .select("id, role, status, user_id, joined_at, profiles(display_name, phone)")
      .eq("household_id", viewer.householdId)
      .order("created_at", { ascending: true });
    members = fallbackMembers;
  }
  let household: Record<string, any> | null = householdResult.data;

  if (householdResult.error?.message.toLowerCase().includes("family_code")) {
    const { data: fallbackHousehold } = await supabase
      .from("households")
      .select("name, slug")
      .eq("id", viewer.householdId)
      .limit(1)
      .maybeSingle();
    household = fallbackHousehold
      ? { ...fallbackHousehold, family_code: fallbackHousehold.slug, family_code_updated_at: null }
      : null;
  }

  return (
    <AdminShell
      title="成员管理"
      description="通过家庭邀请码让家人加入，并在这里调整角色与访问状态。"
    >
      <section style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
        <div className="admin-panel" style={{ padding: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>成员列表</h2>
          <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
            {(members ?? []).length ? (
              members?.map((member) => {
                const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
                const displayName = (profile?.display_name as string | undefined) ?? "未命名成员";
                const username = (profile?.username as string | undefined) ?? "未设置账号";
                const phone = (profile?.phone as string | undefined) ?? "未填写手机号";
                return (
                  <article
                    key={member.id as string}
                    style={{
                      padding: 16,
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.72)",
                      border: "1px solid var(--border)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <strong>{displayName}</strong>
                      <span style={{ color: "var(--brand)", fontWeight: 700 }}>
                        {getRoleDisplayName(member.role as "owner" | "member")}
                      </span>
                    </div>
                    <div style={{ marginTop: 8, color: "var(--muted)", lineHeight: 1.7 }}>
                      账号：{username}
                      <br />
                      状态：{getMemberStatusLabel(member.status as "active" | "inactive" | "removed")}
                      <br />
                      手机：{phone}
                      <br />
                      加入时间：{formatDateTime(member.joined_at as string)}
                    </div>
                    <MemberAccessForm
                      memberId={member.id as string}
                      initialRole={member.role as "owner" | "member"}
                      initialStatus={member.status as "active" | "inactive" | "removed"}
                    />
                  </article>
                );
              })
            ) : (
              <div
                style={{
                  padding: 16,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.72)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)"
                }}
              >
                当前家庭还没有成员。
              </div>
            )}
          </div>
        </div>

        <aside className="admin-panel" style={{ padding: 24, alignSelf: "start" }}>
          <div style={{ color: "var(--brand)", fontWeight: 700 }}>家庭邀请码</div>
          <h2 style={{ margin: "10px 0 0", fontSize: 20 }}>{household?.name ?? "当前家庭"}</h2>
          <div
            style={{
              marginTop: 18,
              padding: 18,
              borderRadius: 20,
              background: "rgba(255,255,255,0.78)",
              border: "1px solid var(--border)"
            }}
          >
            <div style={{ color: "var(--muted)", fontSize: 14 }}>把这个码发给家人</div>
            <div style={{ marginTop: 8, fontSize: 34, fontWeight: 900, letterSpacing: "0.14em" }}>
              {(household?.family_code as string | null) ?? "未生成"}
            </div>
            <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.7 }}>
              家人注册账号后，打开成员端的家庭引导页，输入这个邀请码即可加入。刷新后旧邀请码会失效。
            </p>
          </div>
          <div style={{ marginTop: 16 }}>
            <RefreshFamilyCodeButton />
          </div>
        </aside>
      </section>
    </AdminShell>
  );
}
