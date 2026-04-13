import { getRoleDisplayName, getUsernameFromAuthEmail } from "@night-food/lib";
import { createSupabaseServerClient } from "./supabase/server-client";

export type WebViewerSummary = {
  userId: string;
  username: string;
  displayName: string;
  role: "owner" | "member";
  roleLabel: string;
  householdId: string | null;
  householdStatus: "active" | "inactive" | "removed" | null;
};

export async function getWebViewerSummary(): Promise<WebViewerSummary | null> {
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

    const role = (membership?.role ?? "member") as "owner" | "member";

    return {
      userId: user.id,
      username: (profile?.username as string | null) ?? getUsernameFromAuthEmail(user.email),
      displayName: (profile?.display_name as string | null) ?? "",
      role,
      roleLabel: getRoleDisplayName(role),
      householdId: membership?.status === "active" ? ((membership.household_id as string) ?? null) : null,
      householdStatus: (membership?.status as "active" | "inactive" | "removed" | null) ?? null
    };
  } catch {
    return null;
  }
}
