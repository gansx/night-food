import { NextResponse } from "next/server";

const disabledPayload = {
  error: "邮箱邀请已停用，请使用家庭邀请码。"
};

export async function PATCH() {
  return NextResponse.json(disabledPayload, { status: 410 });
}

export async function DELETE() {
  return NextResponse.json(disabledPayload, { status: 410 });
}
