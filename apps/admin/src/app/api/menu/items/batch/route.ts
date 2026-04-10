import { NextResponse } from "next/server";
import { z } from "zod";
import {
  insertAdminAuditLog,
  requireAdminOwnerMembership
} from "../../../../../lib/server/household";

const batchSchema = z.object({
  householdId: z.string().uuid("家庭标识无效。"),
  itemIds: z.array(z.string().uuid()).min(1, "请至少选择一个菜品。"),
  isAvailable: z.boolean()
});

export async function POST(request: Request) {
  const parsed = batchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误。" }, { status: 400 });
  }

  const guard = await requireAdminOwnerMembership(parsed.data.householdId);
  if (guard.response || !guard.user || !guard.membership) {
    return guard.response!;
  }

  const { error } = await guard.supabase
    .from("menu_items")
    .update({
      is_available: parsed.data.isAvailable,
      updated_at: new Date().toISOString()
    })
    .eq("household_id", parsed.data.householdId)
    .in("id", parsed.data.itemIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await insertAdminAuditLog({
    householdId: parsed.data.householdId,
    actorUserId: guard.user.id,
    targetType: "menu_item",
    action: parsed.data.isAvailable ? "batch_enable" : "batch_disable",
    detail: `${parsed.data.itemIds.length} 个菜品`
  });

  return NextResponse.json({ ok: true });
}
