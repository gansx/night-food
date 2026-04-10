import { NextResponse } from "next/server";
import {
  getAdminSessionUser,
  insertAdminAuditLog,
  requireAdminOwnerMembership
} from "../../../../../lib/server/household";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await getAdminSessionUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }

  const { data: task } = await supabase
    .from("tasks")
    .select("id, household_id, status, reward_points, assigned_user_id, title")
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

  const { data: settings } = await supabase
    .from("household_settings")
    .select("task_approval_required")
    .eq("household_id", task.household_id)
    .limit(1)
    .maybeSingle();

  if (settings?.task_approval_required === false) {
    return NextResponse.json({ error: "当前家庭开启了自动到账，不需要手动审批。" }, { status: 409 });
  }

  if (task.status !== "submitted" || !task.assigned_user_id) {
    return NextResponse.json({ error: "当前任务还不能审批。" }, { status: 409 });
  }

  const { data: account } = await supabase
    .from("points_accounts")
    .select("balance")
    .eq("household_id", task.household_id)
    .eq("user_id", task.assigned_user_id)
    .limit(1)
    .maybeSingle();

  const currentBalance = Number(account?.balance ?? 0);
  const nextBalance = currentBalance + Number(task.reward_points);

  const { error: taskError } = await supabase
    .from("tasks")
    .update({
      status: "completed",
      approved_by_user_id: user.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", task.id)
    .eq("status", "submitted");

  if (taskError) {
    return NextResponse.json({ error: taskError.message }, { status: 500 });
  }

  await supabase.from("task_logs").insert({
    task_id: task.id,
    from_status: "submitted",
    to_status: "completed",
    changed_by_user_id: user.id,
    note: "家主审批通过"
  });

  await supabase.from("points_accounts").upsert(
    {
      household_id: task.household_id,
      user_id: task.assigned_user_id,
      balance: nextBalance,
      updated_at: new Date().toISOString()
    },
    { onConflict: "household_id,user_id" }
  );

  await supabase.from("points_transactions").insert({
    household_id: task.household_id,
    user_id: task.assigned_user_id,
    source_type: "task",
    source_id: task.id,
    direction: "credit",
    amount: Number(task.reward_points),
    balance_after: nextBalance,
    description: "完成家庭任务，家主审批后发放积分"
  });

  await insertAdminAuditLog({
    householdId: task.household_id as string,
    actorUserId: user.id,
    targetType: "task",
    targetId: task.id as string,
    action: "approve",
    detail: `审批任务：${String(task.title)}`
  });

  return NextResponse.json({ ok: true });
}
