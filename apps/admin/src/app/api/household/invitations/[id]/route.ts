import { NextResponse } from "next/server";
import {
  getAdminSessionUser,
  insertAdminAuditLog,
  requireAdminOwnerMembership
} from "../../../../../lib/server/household";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await getAdminSessionUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }

  const { data: invitation } = await supabase
    .from("household_invitations")
    .select("id, household_id, email, status")
    .eq("id", id)
    .limit(1)
    .maybeSingle();

  if (!invitation) {
    return NextResponse.json({ error: "邀请不存在。" }, { status: 404 });
  }

  const guard = await requireAdminOwnerMembership(invitation.household_id as string);
  if (guard.response || !guard.membership) {
    return guard.response!;
  }

  if (invitation.status !== "pending") {
    return NextResponse.json({ error: "只有待接受的邀请才能撤销。" }, { status: 409 });
  }

  const { error } = await supabase
    .from("household_invitations")
    .update({
      status: "revoked",
      updated_at: new Date().toISOString()
    })
    .eq("id", invitation.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await insertAdminAuditLog({
    householdId: invitation.household_id as string,
    actorUserId: user.id,
    targetType: "invitation",
    targetId: invitation.id as string,
    action: "revoke",
    detail: `撤销邀请：${String(invitation.email)}`
  });

  return NextResponse.json({ ok: true });
}
