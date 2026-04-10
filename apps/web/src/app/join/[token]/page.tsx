import { buildDisplayNameFallback } from "@night-food/lib";
import Link from "next/link";
import { AcceptInvitationForm } from "./_components/accept-invitation-form";
import { createSupabaseServerClient } from "../../../lib/supabase/server-client";

export default async function JoinHouseholdPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let invitation:
    | {
        email: string;
        role: string;
        status: string;
        expires_at: string;
        households: { name: string } | { name: string }[] | null;
      }
    | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("household_invitations")
      .select("email, role, status, expires_at, households(name)")
      .eq("token", token)
      .limit(1)
      .maybeSingle();

    invitation = data;
  } catch {
    invitation = null;
  }

  const household = Array.isArray(invitation?.households)
    ? invitation?.households[0]
    : invitation?.households;

  return (
    <main className="app-shell">
      <section
        className="glass-panel"
        style={{
          padding: 28,
          display: "grid",
          gap: 20,
          maxWidth: 760,
          margin: "48px auto 0"
        }}
      >
        <div>
          <div style={{ color: "var(--brand-dark)", fontWeight: 700, fontSize: 14 }}>
            家庭邀请
          </div>
          <h1 style={{ margin: "12px 0 0", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            加入家庭空间
          </h1>
          <p className="section-copy">
            家主为家庭成员生成邀请链接后，家人通过这个页面完成加入。
          </p>
        </div>

        {invitation ? (
          <>
            <div
              className="glass-panel"
              style={{ padding: 20, background: "rgba(255,255,255,0.72)" }}
            >
              <div style={{ color: "var(--text-muted)", fontSize: 14 }}>受邀邮箱</div>
              <div style={{ marginTop: 6, fontWeight: 800 }}>{invitation.email}</div>
              <div style={{ marginTop: 14, color: "var(--text-muted)", fontSize: 14 }}>
                家庭：{household?.name ?? "夜食坊之家"} · 角色：{invitation.role}
              </div>
              <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 14 }}>
                状态：{invitation.status} · 过期时间：{invitation.expires_at}
              </div>
            </div>

            <AcceptInvitationForm
              token={token}
              suggestedName={buildDisplayNameFallback(invitation.email)}
            />
          </>
        ) : (
          <div className="glass-panel" style={{ padding: 20 }}>
            <p className="section-copy">未找到有效邀请。你可以先回到登录页，或让家主重新生成邀请链接。</p>
            <Link href="/login" style={{ color: "var(--brand)", fontWeight: 700 }}>
              前往登录
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

