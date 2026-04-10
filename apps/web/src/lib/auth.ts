import { getRoleDisplayName } from "@night-food/lib";
import { createSupabaseServerClient } from "./supabase/server-client";

export type WebViewerSummary = {
  userId: string;
  email: string;
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

    const { data: membership } = await supabase
      .from("household_members")
      .select("role, household_id, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const role = (membership?.role ?? "member") as "owner" | "member";

    return {
      userId: user.id,
      email: user.email ?? "",
      role,
      roleLabel: getRoleDisplayName(role),
      householdId: membership?.status === "active" ? ((membership.household_id as string) ?? null) : null,
      householdStatus: (membership?.status as "active" | "inactive" | "removed" | null) ?? null
    };
  } catch {
    return null;
  }
}
