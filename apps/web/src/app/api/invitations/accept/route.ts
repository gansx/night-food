import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "邮箱邀请链接已停用，请注册登录后使用家庭邀请码加入。",
      redirectTo: "/family"
    },
    { status: 410 }
  );
}
