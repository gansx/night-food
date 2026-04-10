import { canTransitionTaskStatus, getTaskStatusLabel } from "@night-food/lib";
import type { TaskStatus } from "@night-food/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAdminSessionUser,
  insertAdminAuditLog,
  requireAdminOwnerMembership
} from "../../../../../lib/server/household";

const updateTaskStatusSchema = z.object({
  status: z.enum(["open", "cancelled"]),
  note: z.string().trim().max(200).optional().or(z.literal(""))
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await getAdminSessionUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }

  const raw = (await request.json()) as { status?: TaskStatus; note?: string };
  const parsed = updateTaskStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误。" }, { status: 400 });
  }

  const { data: task } = await supabase
    .from("tasks")
    .select("id, household_id, status, title")
    .eq("id", id)
    .limit(1)
    .maybeSingle();

  if (!task) {
    return NextResponse.json({ error: "任务不存在。" }, { status: 404 });
  }

  const guard = await requireAdminOwnerMembership(task.household_id as string);
  if (guard.response || !guard.membership) {
    return guard.response!;
  }

  const fromStatus = task.status as TaskStatus;
  const toStatus = parsed.data.status as TaskStatus;

  if (!canTransitionTaskStatus(fromStatus, toStatus)) {
    return NextResponse.json(
      { error: `任务当前状态为${getTaskStatusLabel(fromStatus)}，不能变更为${getTaskStatusLabel(toStatus)}。` },
      { status: 409 }
    );
  }

  const updatePayload: Record<string, string | null> = {
    status: toStatus,
    updated_at: new Date().toISOString()
  };

  if (toStatus === "open") {
    updatePayload.assigned_user_id = null;
    updatePayload.submitted_by_user_id = null;
    updatePayload.approved_by_user_id = null;
  }

  const { error } = await supabase.from("tasks").update(updatePayload).eq("id", task.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("task_logs").insert({
    task_id: task.id,
    from_status: fromStatus,
    to_status: toStatus,
    changed_by_user_id: user.id,
    note: parsed.data.note || `家主将任务状态改为${getTaskStatusLabel(toStatus)}`
  });

  await insertAdminAuditLog({
    householdId: task.household_id as string,
    actorUserId: user.id,
    targetType: "task",
    targetId: task.id as string,
    action: toStatus === "cancelled" ? "cancel" : "reopen",
    detail: `${String(task.title)} -> ${getTaskStatusLabel(toStatus)}`
  });

  return NextResponse.json({ ok: true });
}
