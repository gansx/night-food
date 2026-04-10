import { buildHouseholdInviteExpiry, normalizeEmail } from "@night-food/lib";
import type { HouseholdInvitationPayload } from "@night-food/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  insertAdminAuditLog,
  requireAdminOwnerMembership
} from "../../../../lib/server/household";

const invitationSchema = z.object({
  householdId: z.string().uuid("家庭标识无效。"),
  email: z.string().email("请输入有效邮箱地址。"),
  role: z.enum(["owner", "member"])
});

export async function POST(request: Request) {
  const payload = (await request.json()) as HouseholdInvitationPayload;
  const parsed = invitationSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误。" }, { status: 400 });
  }

  const guard = await requireAdminOwnerMembership(parsed.data.householdId);
  if (guard.response || !guard.user || !guard.membership) {
    return guard.response!;
  }

  const email = normalizeEmail(parsed.data.email);

  const { data: pendingInvite } = await guard.supabase
    .from("household_invitations")
    .select("id, token, expires_at")
    .eq("household_id", parsed.data.householdId)
    .eq("email", email)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (pendingInvite) {
    return NextResponse.json({
      inviteUrl: `${baseUrl}/join/${pendingInvite.token}`,
      message: "这个邮箱已经有待接受邀请，已返回现有邀请链接。"
    });
  }

  const expiresAt = buildHouseholdInviteExpiry(
    Number(process.env.OWNER_INVITE_EXPIRY_HOURS ?? "48")
  ).toISOString();

  const { data: invitation, error } = await guard.supabase
    .from("household_invitations")
    .insert({
      household_id: parsed.data.householdId,
      email,
      invited_by_user_id: guard.user.id,
      role: parsed.data.role,
      expires_at: expiresAt
    })
    .select("id, token, email")
    .single();

  if (error || !invitation) {
    return NextResponse.json({ error: error?.message ?? "创建邀请失败。" }, { status: 500 });
  }

  await insertAdminAuditLog({
    householdId: parsed.data.householdId,
    actorUserId: guard.user.id,
    targetType: "invitation",
    targetId: invitation.id as string,
    action: "create",
    detail: `邀请 ${invitation.email as string}`
  });

  return NextResponse.json({
    inviteUrl: `${baseUrl}/join/${invitation.token}`,
    message: `已为 ${invitation.email} 创建邀请链接。`
  });
}
