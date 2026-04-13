import { NextResponse } from "next/server";

const disabledPayload = {
  error: "邮箱邀请已停用，请在成员管理页复制家庭邀请码给家人。"
};

export async function GET() {
  return NextResponse.json(disabledPayload, { status: 410 });
}

export async function POST() {
  return NextResponse.json(disabledPayload, { status: 410 });
}
