import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOwnerMembership } from "../../../../lib/server/household";

const adjustSchema = z.object({
  householdId: z.string().uuid("家庭标识无效"),
  userId: z.string().uuid("成员标识无效"),
  direction: z.enum(["credit", "debit"]),
  amount: z.number().int().min(1, "积分调整至少为 1"),
  description: z.string().trim().min(1, "请填写调整原因").max(120)
});

export async function POST(request: Request) {
  const raw = (await request.json()) as {
    householdId?: string;
    userId?: string;
    direction?: "credit" | "debit";
    amount?: number;
    description?: string;
  };
  const parsed = adjustSchema.safeParse({
    ...raw,
    amount: Number(raw.amount)
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const guard = await requireAdminOwnerMembership(parsed.data.householdId);
  if (guard.response || !guard.user || !guard.membership) {
    return guard.response!;
  }

  const { data: account } = await guard.supabase
    .from("points_accounts")
    .select("balance")
    .eq("household_id", parsed.data.householdId)
    .eq("user_id", parsed.data.userId)
    .limit(1)
    .maybeSingle();

  const currentBalance = Number(account?.balance ?? 0);
  const delta = parsed.data.direction === "credit" ? parsed.data.amount : -parsed.data.amount;
  const nextBalance = currentBalance + delta;

  const { error: accountError } = await guard.supabase.from("points_accounts").upsert(
    {
      household_id: parsed.data.householdId,
      user_id: parsed.data.userId,
      balance: nextBalance,
      updated_at: new Date().toISOString()
    },
    { onConflict: "household_id,user_id" }
  );

  if (accountError) {
    return NextResponse.json({ error: accountError.message }, { status: 500 });
  }

  const { error: ledgerError } = await guard.supabase.from("points_transactions").insert({
    household_id: parsed.data.householdId,
    user_id: parsed.data.userId,
    source_type: "manual_adjustment",
    source_id: null,
    direction: parsed.data.direction,
    amount: parsed.data.amount,
    balance_after: nextBalance,
    description: parsed.data.description
  });

  if (ledgerError) {
    return NextResponse.json({ error: ledgerError.message }, { status: 500 });
  }

  await guard.supabase.from("audit_logs").insert({
    household_id: parsed.data.householdId,
    actor_user_id: guard.user.id,
    target_type: "points_account",
    target_id: parsed.data.userId,
    action: parsed.data.direction === "credit" ? "manual_credit" : "manual_debit",
    detail: `${parsed.data.amount} points: ${parsed.data.description}`
  });

  return NextResponse.json({ ok: true, nextBalance });
}
