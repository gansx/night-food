import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv, getServiceRoleKey } from "../env";

export function createSupabaseServiceRoleClient() {
  const { url } = getPublicSupabaseEnv();
  const serviceRoleKey = getServiceRoleKey();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
