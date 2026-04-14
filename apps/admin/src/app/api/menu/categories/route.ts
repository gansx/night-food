import type { MenuCategoryPayload } from "@night-food/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOwnerMembership } from "../../../../lib/server/household";

const categorySchema = z.object({
  householdId: z.string().uuid("家庭标识无效"),
  name: z.string().trim().min(1, "请填写分类名称").max(24)
});

export async function POST(request: Request) {
  const parsed = categorySchema.safeParse((await request.json()) as MenuCategoryPayload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const guard = await requireAdminOwnerMembership(parsed.data.householdId);
  if (guard.response || !guard.user || !guard.membership) {
    return guard.response!;
  }

  const { error } = await guard.supabase.from("menu_categories").insert({
    household_id: parsed.data.householdId,
    name: parsed.data.name
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
