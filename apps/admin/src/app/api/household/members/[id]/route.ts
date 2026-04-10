import type { UpdateHouseholdMemberPayload } from "@night-food/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server-client";

const updateMemberSchema = z.object({
  memberId: z.string().uuid("成员标识无效"),
  role: z.enum(["owner", "member"]),
  status: z.enum(["active", "inactive", "removed"])
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }

  const raw = (await request.json()) as UpdateHouseholdMemberPayload;
  const parsed = updateMemberSchema.safeParse({
    ...raw,
    memberId: raw.memberId || id
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const { data: targetMember } = await supabase
    .from("household_members")
    .select("id, household_id, user_id, role, status")
    .eq("id", parsed.data.memberId)
    .limit(1)
    .maybeSingle();

  if (!targetMember) {
    return NextResponse.json({ error: "成员不存在。" }, { status: 404 });
  }

  const { data: actingMembership } = await supabase
    .from("household_members")
    .select("role")
    .eq("household_id", targetMember.household_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!actingMembership || actingMembership.role !== "owner") {
    return NextResponse.json({ error: "只有家主可以管理成员权限。" }, { status: 403 });
  }

  const isExistingActiveOwner =
    targetMember.role === "owner" && targetMember.status === "active";
  const willStopBeingActiveOwner =
    isExistingActiveOwner &&
    (parsed.data.role !== "owner" || parsed.data.status !== "active");

  if (willStopBeingActiveOwner) {
    const { count } = await supabase
      .from("household_members")
      .select("id", { count: "exact", head: true })
      .eq("household_id", targetMember.household_id)
      .eq("role", "owner")
      .eq("status", "active");

    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: "家庭里至少需要保留一位正常状态的家主。" }, { status: 409 });
    }
  }

  const { error: updateError } = await supabase
    .from("household_members")
    .update({
      role: parsed.data.role,
      status: parsed.data.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", parsed.data.memberId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (parsed.data.role === "owner" && parsed.data.status === "active") {
    await supabase
      .from("households")
      .update({
        owner_user_id: targetMember.user_id,
        updated_at: new Date().toISOString()
      })
      .eq("id", targetMember.household_id);
  }

  return NextResponse.json({ ok: true });
}
