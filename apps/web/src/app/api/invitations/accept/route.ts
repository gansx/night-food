import { buildDisplayNameFallback, normalizeEmail } from "@night-food/lib";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "../../../../lib/supabase/server-client";
import { insertWebAuditLog } from "../../../../lib/server/household";

const acceptInvitationSchema = z.object({
  token: z.string().uuid("邀请标识无效。"),
  displayName: z.string().trim().min(1, "请填写显示名称。").max(24).optional()
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录后再接受邀请。" }, { status: 401 });
  }

  const parsed = acceptInvitationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误。" }, { status: 400 });
  }

  const { data: invitation } = await supabase
    .from("household_invitations")
    .select("id, email, role, status, expires_at, household_id")
    .eq("token", parsed.data.token)
    .limit(1)
    .maybeSingle();

  if (!invitation) {
    return NextResponse.json({ error: "邀请不存在。" }, { status: 404 });
  }

  if (invitation.status !== "pending") {
    return NextResponse.json({ error: "这个邀请已经失效或已被使用。" }, { status: 409 });
  }

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    await supabase
      .from("household_invitations")
      .update({
        status: "expired",
        updated_at: new Date().toISOString()
      })
      .eq("id", invitation.id);

    return NextResponse.json({ error: "邀请已过期，请让家主重新发送。" }, { status: 410 });
  }

  const userEmail = normalizeEmail(user.email ?? "");
  if (userEmail !== normalizeEmail(invitation.email)) {
    return NextResponse.json({ error: "当前登录邮箱和邀请邮箱不一致。" }, { status: 403 });
  }

  const displayName = parsed.data.displayName?.trim() || buildDisplayNameFallback(userEmail);

  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      display_name: displayName
    },
    { onConflict: "user_id" }
  );

  const { data: existingMembership } = await supabase
    .from("household_members")
    .select("id, status")
    .eq("household_id", invitation.household_id)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!existingMembership) {
    const { error: memberError } = await supabase.from("household_members").insert({
      household_id: invitation.household_id,
      user_id: user.id,
      role: invitation.role,
      status: "active"
    });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }
  } else if (existingMembership.status !== "active") {
    const { error: memberError } = await supabase
      .from("household_members")
      .update({
        role: invitation.role,
        status: "active",
        updated_at: new Date().toISOString()
      })
      .eq("id", existingMembership.id);

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }
  }

  await supabase.from("points_accounts").upsert(
    {
      household_id: invitation.household_id,
      user_id: user.id,
      balance: 0
    },
    { onConflict: "household_id,user_id" }
  );

  await supabase
    .from("household_invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", invitation.id);

  await insertWebAuditLog({
    householdId: invitation.household_id as string,
    actorUserId: user.id,
    targetType: "invitation",
    targetId: invitation.id as string,
    action: "accept",
    detail: `接受邀请：${String(invitation.email)}`
  });

  return NextResponse.json({ redirectTo: "/" });
}
