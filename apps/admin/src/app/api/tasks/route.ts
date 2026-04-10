import type { CreateTaskPayload } from "@night-food/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOwnerMembership, insertAdminAuditLog } from "../../../lib/server/household";

const createTaskSchema = z.object({
  householdId: z.string().uuid("家庭标识无效。"),
  title: z.string().trim().min(1, "请填写任务标题。").max(80, "任务标题最多 80 个字。"),
  description: z.string().trim().max(200, "任务说明最多 200 个字。").optional().or(z.literal("")),
  rewardPoints: z.number().int().min(1, "奖励积分至少为 1。"),
  dueAt: z.string().datetime().optional().or(z.literal(""))
});

export async function POST(request: Request) {
  const raw = (await request.json()) as CreateTaskPayload;
  const parsed = createTaskSchema.safeParse({
    ...raw,
    rewardPoints: Number(raw.rewardPoints)
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误。" }, { status: 400 });
  }

  const guard = await requireAdminOwnerMembership(parsed.data.householdId);
  if (guard.response || !guard.membership || !guard.user) {
    return guard.response!;
  }

  const { data: task, error } = await guard.supabase
    .from("tasks")
    .insert({
      household_id: parsed.data.householdId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      reward_points: parsed.data.rewardPoints,
      due_at: parsed.data.dueAt || null,
      status: "open",
      created_by_user_id: guard.user.id
    })
    .select("id, title")
    .single();

  if (error || !task) {
    return NextResponse.json({ error: error?.message ?? "创建任务失败。" }, { status: 500 });
  }

  await guard.supabase.from("task_logs").insert({
    task_id: task.id,
    from_status: null,
    to_status: "open",
    changed_by_user_id: guard.user.id,
    note: "家主创建任务"
  });

  await insertAdminAuditLog({
    householdId: parsed.data.householdId,
    actorUserId: guard.user.id,
    targetType: "task",
    targetId: task.id as string,
    action: "create",
    detail: `创建任务：${task.title as string}`
  });

  return NextResponse.json({ ok: true, taskId: task.id });
}
