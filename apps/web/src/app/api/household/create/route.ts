import { buildDisplayNameFallback, createFamilyCode } from "@night-food/lib";
import type { HouseholdCreatePayload } from "@night-food/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "../../../../lib/supabase/server-client";
import { createSupabaseServiceRoleClient } from "../../../../lib/supabase/service-role-client";

const createHouseholdSchema = z.object({
  householdName: z.string().trim().min(2, "家庭名称至少 2 个字符").max(40, "家庭名称不要超过 40 个字符")
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }

  const payload = (await request.json()) as HouseholdCreatePayload;
  const parsed = createHouseholdSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const serviceSupabase = createSupabaseServiceRoleClient();
  const { data: existingMembership } = await serviceSupabase
    .from("household_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (existingMembership) {
    return NextResponse.json({ error: "你已经加入了一个家庭，不能重复创建。", redirectTo: "/" }, { status: 409 });
  }

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

  let household: { id: string; family_code: string } | null = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const familyCode = createFamilyCode();
    const { data, error } = await serviceSupabase
      .from("households")
      .insert({
        name: parsed.data.householdName,
        slug: familyCode,
        owner_user_id: user.id,
        family_code: familyCode,
        family_code_status: "active",
        family_code_updated_at: new Date().toISOString()
      })
      .select("id, family_code")
      .single();

    if (!error && data) {
      household = data as { id: string; family_code: string };
      break;
    }

    if (error?.message.toLowerCase().includes("family_code")) {
      const { data: fallbackData, error: fallbackError } = await serviceSupabase
        .from("households")
        .insert({
          name: parsed.data.householdName,
          slug: familyCode,
          owner_user_id: user.id
        })
        .select("id, slug")
        .single();

      if (!fallbackError && fallbackData) {
        household = { id: fallbackData.id as string, family_code: fallbackData.slug as string };
        break;
      }

      lastError = fallbackError?.message ?? "创建家庭失败";
      continue;
    }

    lastError = error?.message ?? "创建家庭失败";
  }

  if (!household) {
    return NextResponse.json({ error: lastError ?? "创建家庭失败" }, { status: 500 });
  }

  const householdId = household.id;

  const { error: memberError } = await serviceSupabase.from("household_members").insert({
    household_id: householdId,
    user_id: user.id,
    role: "owner",
    status: "active"
  });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  await serviceSupabase.from("household_settings").upsert({ household_id: householdId }, { onConflict: "household_id" });
  await serviceSupabase.from("points_accounts").upsert(
    {
      household_id: householdId,
      user_id: user.id,
      balance: 0
    },
    { onConflict: "household_id,user_id" }
  );
  await serviceSupabase.from("household_bootstrap_logs").insert({
    household_id: householdId,
    owner_user_id: user.id
  });

  return NextResponse.json({ householdId, familyCode: household.family_code, redirectTo: "/" });
}
