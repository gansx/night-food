import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "../supabase/service-role-client";
import { createSupabaseServerClient } from "../supabase/server-client";

export type WebMembership = {
  householdId: string;
  userId: string;
  role: "owner" | "member";
};

export async function getWebSessionUser() {
  const authSupabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await authSupabase.auth.getUser();
  const supabase = createSupabaseServiceRoleClient();

  return { supabase, user };
}

export async function requireWebMembership(householdId: string) {
  const { supabase, user } = await getWebSessionUser();

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

  return {
    supabase,
    user,
    membership: {
      householdId: membership.household_id as string,
      role: membership.role as "owner" | "member",
      userId: user.id
    } satisfies WebMembership,
    response: null
  };
}

export async function requireWebOwnerMembership(householdId: string) {
  const guard = await requireWebMembership(householdId);
  if (guard.response) {
    return guard;
  }

  if (guard.membership?.role !== "owner") {
    return {
      ...guard,
      membership: null,
      response: NextResponse.json({ error: "只有家主可以执行这个操作。" }, { status: 403 })
    };
  }

  return guard;
}

export async function insertWebAuditLog(input: {
  householdId: string;
  actorUserId: string;
  targetType: string;
  targetId?: string | null;
  action: string;
  detail?: string | null;
}) {
  const supabase = createSupabaseServiceRoleClient();
  await supabase.from("audit_logs").insert({
    household_id: input.householdId,
    actor_user_id: input.actorUserId,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    action: input.action,
    detail: input.detail ?? null
  });
}
