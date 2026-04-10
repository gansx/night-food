import { buildDisplayNameFallback, createHouseholdSlug } from "@night-food/lib";
import type { HouseholdBootstrapPayload } from "@night-food/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "../../../../lib/supabase/server-client";

const bootstrapSchema = z.object({
  householdName: z.string().trim().min(2, "家庭名称至少 2 个字符").max(40),
  displayName: z.string().trim().min(1, "请填写显示名称").max(24)
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }

  const payload = (await request.json()) as HouseholdBootstrapPayload;
  const parsed = bootstrapSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const { data: existingMembership } = await supabase
    .from("household_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (existingMembership) {
    return NextResponse.json(
      { error: "你已经加入了一个家庭，无需重复创建。", redirectTo: "/members" },
      { status: 409 }
    );
  }

  const email = user.email ?? "";
  const profileDisplayName = parsed.data.displayName || buildDisplayNameFallback(email);

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      display_name: profileDisplayName
    },
    {
      onConflict: "user_id"
    }
  );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const slug = createHouseholdSlug(parsed.data.householdName);
  const { data: household, error: householdError } = await supabase
    .from("households")
    .insert({
      name: parsed.data.householdName,
      slug,
      owner_user_id: user.id
    })
    .select("id")
    .single();

  if (householdError || !household) {
    return NextResponse.json({ error: householdError?.message ?? "创建家庭失败" }, { status: 500 });
  }

  const householdId = household.id as string;

  const { error: memberError } = await supabase.from("household_members").insert({
    household_id: householdId,
    user_id: user.id,
    role: "owner",
    status: "active"
  });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  await supabase.from("household_settings").upsert({ household_id: householdId }, { onConflict: "household_id" });
  await supabase.from("points_accounts").upsert(
    {
      household_id: householdId,
      user_id: user.id,
      balance: 0
    },
    { onConflict: "household_id,user_id" }
  );
  await supabase.from("household_bootstrap_logs").insert({
    household_id: householdId,
    owner_user_id: user.id
  });

  return NextResponse.json({ householdId, redirectTo: "/members" });
}
