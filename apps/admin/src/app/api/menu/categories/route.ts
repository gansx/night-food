import type { MenuCategoryPayload } from "@night-food/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "../../../../lib/supabase/server-client";

const categorySchema = z.object({
  householdId: z.string().uuid("家庭标识无效"),
  name: z.string().trim().min(1, "请填写分类名称").max(24)
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }

  const parsed = categorySchema.safeParse((await request.json()) as MenuCategoryPayload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("household_members")
    .select("role")
    .eq("household_id", parsed.data.householdId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "只有家主可以创建菜单分类。" }, { status: 403 });
  }

  const { error } = await supabase.from("menu_categories").insert({
    household_id: parsed.data.householdId,
    name: parsed.data.name
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

