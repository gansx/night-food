import { createFamilyCode } from "@night-food/lib";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server-client";
import { createSupabaseServiceRoleClient } from "../../../../../lib/supabase/service-role-client";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }

  const serviceSupabase = createSupabaseServiceRoleClient();
  const { data: membership } = await serviceSupabase
    .from("household_members")
    .select("household_id, role, status")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "只有家主可以刷新家庭邀请码。" }, { status: 403 });
  }

  const householdId = membership.household_id as string;
  let familyCode: string | null = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const nextCode = createFamilyCode();
    const { data, error } = await serviceSupabase
      .from("households")
      .update({
        slug: nextCode,
        family_code: nextCode,
        family_code_status: "active",
        family_code_updated_at: new Date().toISOString()
      })
      .eq("id", householdId)
      .select("family_code")
      .single();

    if (!error && data) {
      familyCode = data.family_code as string;
      break;
    }

    if (error?.message.toLowerCase().includes("family_code")) {
      const { data: fallbackData, error: fallbackError } = await serviceSupabase
        .from("households")
        .update({
          slug: nextCode
        })
        .eq("id", householdId)
        .select("slug")
        .single();

      if (!fallbackError && fallbackData) {
        familyCode = fallbackData.slug as string;
        break;
      }

      lastError = fallbackError?.message ?? "刷新邀请码失败";
      continue;
    }

    lastError = error?.message ?? "刷新邀请码失败";
  }

  if (!familyCode) {
    return NextResponse.json({ error: lastError ?? "刷新邀请码失败" }, { status: 500 });
  }

  return NextResponse.json({ familyCode });
}
