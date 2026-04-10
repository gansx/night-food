import { getRoleDisplayName } from "@night-food/lib";
import { createSupabaseServerClient } from "./supabase/server-client";

export type AdminViewerSummary = {
  userId: string;
  email: string;
  role: "owner" | "member" | null;
  roleLabel: string;
  householdId: string | null;
  householdStatus: "active" | "inactive" | "removed" | null;
};

export async function getAdminViewerSummary(): Promise<AdminViewerSummary | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: membership } = await supabase
      .from("household_members")
      .select("role, household_id, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return {
        userId: user.id,
        email: user.email ?? "",
        role: null,
        roleLabel: "未加入家庭",
        householdId: null,
        householdStatus: null
      };
    }

    const role = membership.role as "owner" | "member";
    return {
      userId: user.id,
      email: user.email ?? "",
      role,
      roleLabel: getRoleDisplayName(role),
      householdId: membership.status === "active" ? ((membership.household_id as string) ?? null) : null,
      householdStatus: membership.status as "active" | "inactive" | "removed"
    };
  } catch {
    return null;
  }
}
