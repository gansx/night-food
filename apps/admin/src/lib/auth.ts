import { getRoleDisplayName, getUsernameFromAuthEmail } from "@night-food/lib";
import { createSupabaseServerClient } from "./supabase/server-client";

export type AdminViewerSummary = {
  userId: string;
  username: string;
  displayName: string;
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

    const [{ data: membership }, profileResult] = await Promise.all([
      supabase
        .from("household_members")
        .select("role, household_id, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("username, display_name")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle()
    ]);
    let profile: Record<string, unknown> | null = profileResult.data;
    if (profileResult.error?.message.toLowerCase().includes("username")) {
      const { data: fallbackProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      profile = fallbackProfile;
    }

    const username = (profile?.username as string | null) ?? getUsernameFromAuthEmail(user.email);
    const displayName = (profile?.display_name as string | null) ?? "";

    if (!membership) {
      return {
        userId: user.id,
        username,
        displayName,
        role: null,
        roleLabel: "未加入家庭",
        householdId: null,
        householdStatus: null
      };
    }

    const role = membership.role as "owner" | "member";
    return {
      userId: user.id,
      username,
      displayName,
      role,
      roleLabel: getRoleDisplayName(role),
      householdId: membership.status === "active" ? ((membership.household_id as string) ?? null) : null,
      householdStatus: membership.status as "active" | "inactive" | "removed"
    };
  } catch {
    return null;
  }
}
