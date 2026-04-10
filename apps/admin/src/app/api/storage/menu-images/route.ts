import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { hasServiceRoleEnv } from "../../../../lib/env";
import { createSupabaseServerClient } from "../../../../lib/supabase/server-client";
import { createSupabaseServiceRoleClient } from "../../../../lib/supabase/service-role-client";

export async function POST(request: Request) {
  if (!hasServiceRoleEnv()) {
    return NextResponse.json({ error: "未配置服务端上传密钥。" }, { status: 500 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请上传图片文件。" }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "只有家主可以上传菜单图片。" }, { status: 403 });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filePath = `${membership.household_id}/${randomUUID()}.${extension}`;
  const serviceClient = createSupabaseServiceRoleClient();
  const bytes = await file.arrayBuffer();

  const { error } = await serviceClient.storage
    .from("menu-images")
    .upload(filePath, bytes, {
      contentType: file.type || "image/jpeg",
      upsert: false
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = serviceClient.storage.from("menu-images").getPublicUrl(filePath);

  return NextResponse.json({
    path: filePath,
    publicUrl: data.publicUrl
  });
}
