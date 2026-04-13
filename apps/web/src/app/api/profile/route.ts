import type { UpdateProfilePayload } from "@night-food/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "../../../lib/supabase/server-client";

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1, "请填写昵称").max(40, "昵称不要超过 40 个字符"),
  phone: z.string().trim().max(20, "手机号不要超过 20 个字符").optional().or(z.literal(""))
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }

  const raw = (await request.json()) as UpdateProfilePayload;
  const parsed = updateProfileSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const profileRecord = {
    user_id: user.id,
    username: (profile?.username as string | null) ?? `member_${user.id.replace(/-/g, "").slice(0, 8)}`,
    display_name: parsed.data.displayName,
    phone: parsed.data.phone || null,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from("profiles").upsert(profileRecord, { onConflict: "user_id" });

  if (error) {
    if (error.message.toLowerCase().includes("username")) {
      const { error: fallbackError } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          display_name: parsed.data.displayName,
          phone: parsed.data.phone || null,
          updated_at: profileRecord.updated_at
        },
        { onConflict: "user_id" }
      );

      if (!fallbackError) {
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
