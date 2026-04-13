import { buildDisplayNameFallback, normalizeFamilyCode } from "@night-food/lib";
import type { JoinHouseholdByCodePayload } from "@night-food/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "../../../../lib/supabase/server-client";
import { createSupabaseServiceRoleClient } from "../../../../lib/supabase/service-role-client";

const joinSchema = z.object({
  familyCode: z
    .string()
    .trim()
    .min(6, "请输入家庭邀请码")
    .max(12, "邀请码长度不正确")
    .transform(normalizeFamilyCode)
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }

  const payload = (await request.json()) as JoinHouseholdByCodePayload;
  const parsed = joinSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const serviceSupabase = createSupabaseServiceRoleClient();
  const { data: existingMembership } = await serviceSupabase
    .from("household_members")
    .select("id, household_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (existingMembership) {
    return NextResponse.json({ error: "你已经加入了一个家庭，不能重复加入。", redirectTo: "/" }, { status: 409 });
  }

  const { data: householdByFamilyCode, error: householdError } = await serviceSupabase
    .from("households")
    .select("id, status")
    .eq("family_code", parsed.data.familyCode)
    .eq("family_code_status", "active")
    .limit(1)
    .maybeSingle();

  let household = householdByFamilyCode;
  if (householdError && householdError.message.toLowerCase().includes("family_code")) {
    const { data: householdBySlug, error: slugError } = await serviceSupabase
      .from("households")
      .select("id, status")
      .eq("slug", parsed.data.familyCode)
      .limit(1)
      .maybeSingle();

    if (slugError) {
      return NextResponse.json({ error: slugError.message }, { status: 500 });
    }

    household = householdBySlug;
  } else if (householdError) {
    return NextResponse.json({ error: householdError.message }, { status: 500 });
  }

  if (!household || household.status !== "active") {
    return NextResponse.json({ error: "家庭邀请码不存在或已失效。" }, { status: 404 });
  }

  const householdId = household.id as string;
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("username, display_name")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const profileRecord = {
    user_id: user.id,
    username: (profile?.username as string | null) ?? `member_${user.id.replace(/-/g, "").slice(0, 8)}`,
    display_name: (profile?.display_name as string | null) ?? buildDisplayNameFallback(user.id)
  };
  const { error: profileUpsertError } = await serviceSupabase.from("profiles").upsert(profileRecord, {
    onConflict: "user_id"
  });

  if (profileUpsertError && profileUpsertError.message.toLowerCase().includes("username")) {
    const { error: fallbackProfileError } = await serviceSupabase.from("profiles").upsert(
      {
        user_id: user.id,
        display_name: profileRecord.display_name
      },
      { onConflict: "user_id" }
    );
    if (fallbackProfileError) {
      return NextResponse.json({ error: fallbackProfileError.message }, { status: 500 });
    }
  } else if (profileUpsertError) {
    return NextResponse.json({ error: profileUpsertError.message }, { status: 500 });
  }

  const { error: memberError } = await serviceSupabase.from("household_members").insert({
    household_id: householdId,
    user_id: user.id,
    role: "member",
    status: "active"
  });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  await serviceSupabase.from("points_accounts").upsert(
    {
      household_id: householdId,
      user_id: user.id,
      balance: 0
    },
    { onConflict: "household_id,user_id" }
  );

  return NextResponse.json({ householdId, redirectTo: "/" });
}
