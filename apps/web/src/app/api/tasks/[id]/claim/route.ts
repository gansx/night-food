import { NextResponse } from "next/server";
import {
  getWebSessionUser,
  insertWebAuditLog,
  requireWebMembership
} from "../../../../../lib/server/household";

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
    .select("id, household_id, status, assigned_user_id, title, due_at")
    .eq("id", id)
    .limit(1)
    .maybeSingle();

  if (!task) {
    return NextResponse.json({ error: "任务不存在。" }, { status: 404 });
  }

  const membershipGuard = await requireWebMembership(task.household_id as string);
  if (membershipGuard.response || !membershipGuard.membership) {
    return membershipGuard.response!;
  }

  if (membershipGuard.membership.role === "owner") {
    return NextResponse.json({ error: "家主不能领取任务，请使用成员账号领取。" }, { status: 403 });
  }

  if (task.status !== "open") {
    return NextResponse.json({ error: "这个任务当前不能领取。" }, { status: 409 });
  }

  if (task.due_at && new Date(task.due_at as string).getTime() < Date.now()) {
    return NextResponse.json({ error: "这个任务已经过期，无法领取。" }, { status: 409 });
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      status: "claimed",
      assigned_user_id: user.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", task.id)
    .eq("status", "open");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("task_logs").insert({
    task_id: task.id,
    from_status: "open",
    to_status: "claimed",
    changed_by_user_id: user.id,
    note: "成员领取任务"
  });

  await insertWebAuditLog({
    householdId: task.household_id as string,
    actorUserId: user.id,
    targetType: "task",
    targetId: task.id as string,
    action: "claim",
    detail: `领取任务：${String(task.title)}`
  });

  return NextResponse.json({ ok: true });
}
