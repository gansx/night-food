import { formatDateTime, getInvitationStatusLabel, getMemberStatusLabel, getRoleDisplayName } from "@night-food/lib";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "../_components/admin-shell";
import { getAdminViewerSummary } from "../../lib/auth";
import { createSupabaseServerClient } from "../../lib/supabase/server-client";
import { InviteMemberForm } from "./_components/invite-member-form";
import { MemberAccessForm } from "./_components/member-access-form";
import { RevokeInvitationButton } from "./_components/revoke-invitation-button";

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

  const supabase = await createSupabaseServerClient();
  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase
      .from("household_members")
      .select("id, role, status, user_id, joined_at, profiles(display_name, phone)")
      .eq("household_id", viewer.householdId)
      .order("created_at", { ascending: true }),
    supabase
      .from("household_invitations")
      .select("id, email, role, status, expires_at")
      .eq("household_id", viewer.householdId)
      .order("created_at", { ascending: false })
      .limit(10)
  ]);

  return (
    <AdminShell
      title="成员管理"
      description="邀请家人、调整角色与状态，并管理待接受邀请。"
    >
      <section style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
        <div className="admin-panel" style={{ padding: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>成员列表</h2>
          <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
            {(members ?? []).length ? (
              members?.map((member) => {
                const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
                const displayName = (profile?.display_name as string | undefined) ?? "未命名成员";
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

          <h2 style={{ margin: "24px 0 0", fontSize: 20 }}>最近邀请</h2>
          <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
            {(invitations ?? []).length ? (
              invitations?.map((invitation) => (
                <div
                  key={invitation.id as string}
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid var(--border)",
                    display: "grid",
                    gap: 10
                  }}
                >
                  <div style={{ lineHeight: 1.7 }}>
                    {invitation.email as string} | {getRoleDisplayName(invitation.role as "owner" | "member")} |{" "}
                    {getInvitationStatusLabel(invitation.status as never)} | 截止{" "}
                    {formatDateTime(invitation.expires_at as string)}
                  </div>
                  {invitation.status === "pending" ? (
                    <RevokeInvitationButton invitationId={invitation.id as string} />
                  ) : null}
                </div>
              ))
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
                还没有发出邀请。
              </div>
            )}
          </div>
        </div>

        <InviteMemberForm householdId={viewer.householdId} />
      </section>
    </AdminShell>
  );
}
