import type { HouseholdSettingsPayload } from "@night-food/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOwnerMembership } from "../../../../lib/server/household";

const timeValue = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}$/, "点餐时间格式应为 HH:mm")
  .optional()
  .or(z.literal(""));

const settingsSchema = z
  .object({
    householdId: z.string().uuid("家庭标识无效"),
    orderingEnabled: z.boolean(),
    taskApprovalRequired: z.boolean(),
    allowNegativePoints: z.boolean(),
    pointsExchangeRate: z.number().int().min(1, "积分兑换比例至少为 1"),
    announcementText: z.string().trim().max(300).optional().or(z.literal("")),
    orderingWindowStart: timeValue,
    orderingWindowEnd: timeValue
  })
  .superRefine((value, context) => {
    const hasStart = Boolean(value.orderingWindowStart);
    const hasEnd = Boolean(value.orderingWindowEnd);

    if (hasStart !== hasEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "点餐时间窗需要同时填写开始和结束时间",
        path: hasStart ? ["orderingWindowEnd"] : ["orderingWindowStart"]
      });
    }
  });

export async function POST(request: Request) {
  const raw = (await request.json()) as HouseholdSettingsPayload;
  const parsed = settingsSchema.safeParse({
    ...raw,
    pointsExchangeRate: Number(raw.pointsExchangeRate)
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const guard = await requireAdminOwnerMembership(parsed.data.householdId);
  if (guard.response || !guard.user || !guard.membership) {
    return guard.response!;
  }

  const { error } = await guard.supabase.from("household_settings").upsert(
    {
      household_id: parsed.data.householdId,
      ordering_enabled: parsed.data.orderingEnabled,
      task_approval_required: parsed.data.taskApprovalRequired,
      allow_negative_points: parsed.data.allowNegativePoints,
      points_exchange_rate: parsed.data.pointsExchangeRate,
      announcement_text: parsed.data.announcementText || null,
      ordering_window_start: parsed.data.orderingWindowStart || null,
      ordering_window_end: parsed.data.orderingWindowEnd || null,
      updated_at: new Date().toISOString()
    },
    { onConflict: "household_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
