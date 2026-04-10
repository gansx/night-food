import { NextResponse } from "next/server";
import { getWebSessionUser, insertWebAuditLog } from "../../../../../lib/server/household";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await getWebSessionUser();

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

  const { data: membership } = await supabase
    .from("household_members")
    .select("status")
    .eq("household_id", task.household_id)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership || membership.status !== "active") {
    return NextResponse.json({ error: "当前账号没有这个家庭的有效访问权限。" }, { status: 403 });
  }

  if (task.assigned_user_id !== user.id) {
    return NextResponse.json({ error: "只有领取任务的成员才能提交完成。" }, { status: 403 });
  }

  if (!["claimed", "in_progress"].includes(String(task.status))) {
    return NextResponse.json({ error: "当前任务不能提交完成。" }, { status: 409 });
  }

  const { data: settings } = await supabase
    .from("household_settings")
    .select("task_approval_required")
    .eq("household_id", task.household_id)
    .limit(1)
    .maybeSingle();

  const approvalRequired = settings?.task_approval_required !== false;
  const nextStatus = approvalRequired ? "submitted" : "completed";

  const { error } = await supabase
    .from("tasks")
    .update({
      status: nextStatus,
      submitted_by_user_id: user.id,
      approved_by_user_id: approvalRequired ? null : user.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", task.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("task_logs").insert({
    task_id: task.id,
    from_status: task.status,
    to_status: nextStatus,
    changed_by_user_id: user.id,
    note: approvalRequired ? "成员提交任务，等待家主审批" : "成员提交任务，系统自动结算积分"
  });

  if (!approvalRequired) {
    const { data: account } = await supabase
      .from("points_accounts")
      .select("balance")
      .eq("household_id", task.household_id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const currentBalance = Number(account?.balance ?? 0);
    const nextBalance = currentBalance + Number(task.reward_points);

    await supabase.from("points_accounts").upsert(
      {
        household_id: task.household_id,
        user_id: user.id,
        balance: nextBalance,
        updated_at: new Date().toISOString()
      },
      { onConflict: "household_id,user_id" }
    );

    await supabase.from("points_transactions").insert({
      household_id: task.household_id,
      user_id: user.id,
      source_type: "task",
      source_id: task.id,
      direction: "credit",
      amount: Number(task.reward_points),
      balance_after: nextBalance,
      description: "完成家庭任务，自动获得积分"
    });
  }

  await insertWebAuditLog({
    householdId: task.household_id as string,
    actorUserId: user.id,
    targetType: "task",
    targetId: task.id as string,
    action: "submit",
    detail: `提交任务：${String(task.title)}`
  });

  return NextResponse.json({ ok: true });
}
