import { buildDisplayNameFallback, createAuthEmailFromUsername, isValidUsername, normalizeUsername } from "@night-food/lib";
import type { RegisterAccountPayload } from "@night-food/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceRoleClient } from "../../../../lib/supabase/service-role-client";

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "账号至少 3 个字符")
    .max(24, "账号不要超过 24 个字符")
    .refine(isValidUsername, "账号只能包含小写字母、数字和下划线"),
  password: z.string().min(6, "密码至少 6 位").max(72, "密码不要超过 72 位"),
  displayName: z.string().trim().max(24, "昵称不要超过 24 个字符").optional().or(z.literal(""))
});

export async function POST(request: Request) {
  const raw = (await request.json()) as RegisterAccountPayload;
  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const username = normalizeUsername(parsed.data.username);
  const displayName = parsed.data.displayName?.trim() || buildDisplayNameFallback(username);
  const internalEmail = createAuthEmailFromUsername(username);
  const serviceSupabase = createSupabaseServiceRoleClient();

  const { data: existingProfile, error: existingProfileError } = await serviceSupabase
    .from("profiles")
    .select("user_id")
    .eq("username", username)
    .limit(1)
    .maybeSingle();

  if (!existingProfileError && existingProfile) {
    return NextResponse.json({ error: "这个账号已经被注册了" }, { status: 409 });
  }

  const { data: createdUser, error: createUserError } = await serviceSupabase.auth.admin.createUser({
    email: internalEmail,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      username,
      display_name: displayName
    }
  });

  if (createUserError || !createdUser.user) {
    const message = createUserError?.message?.includes("already")
      ? "这个账号已经被注册了"
      : (createUserError?.message ?? "注册失败");
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const profileWithUsername = {
    user_id: createdUser.user.id,
    username,
    display_name: displayName
  };
  const { error: profileError } = await serviceSupabase.from("profiles").insert(profileWithUsername);

  if (profileError) {
    const canFallbackWithoutUsername = profileError.message.toLowerCase().includes("username");
    const { error: fallbackProfileError } = canFallbackWithoutUsername
      ? await serviceSupabase.from("profiles").insert({
          user_id: createdUser.user.id,
          display_name: displayName
        })
      : { error: profileError };

    if (fallbackProfileError) {
      await serviceSupabase.auth.admin.deleteUser(createdUser.user.id);
      return NextResponse.json({ error: fallbackProfileError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, username });
}
