import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../supabase/server-client";

export type AdminMembership = {
  householdId: string;
  userId: string;
  role: "owner" | "member";
};

export async function getAdminSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function requireAdminOwnerMembership(householdId: string) {
  const { supabase, user } = await getAdminSessionUser();

  if (!user) {
    return {
      supabase,
      user: null,
      membership: null,
      response: NextResponse.json({ error: "请先登录。" }, { status: 401 })
    };
  }

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role, status")
    .eq("household_id", householdId)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership || membership.status !== "active") {
    return {
      supabase,
      user,
      membership: null,
      response: NextResponse.json({ error: "当前账号没有这个家庭的有效访问权限。" }, { status: 403 })
    };
  }

  if (membership.role !== "owner") {
    return {
      supabase,
      user,
      membership: null,
      response: NextResponse.json({ error: "只有家主可以执行这个操作。" }, { status: 403 })
    };
  }

  return {
    supabase,
    user,
    membership: {
      householdId: membership.household_id as string,
      role: membership.role as "owner" | "member",
      userId: user.id
    } satisfies AdminMembership,
    response: null
  };
}

export async function insertAdminAuditLog(input: {
  householdId: string;
  actorUserId: string;
  targetType: string;
  targetId?: string | null;
  action: string;
  detail?: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("audit_logs").insert({
    household_id: input.householdId,
    actor_user_id: input.actorUserId,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    action: input.action,
    detail: input.detail ?? null
  });
}
