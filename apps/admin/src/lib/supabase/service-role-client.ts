import { createClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getPublicSupabaseEnv } from "../env";

export function createSupabaseServiceRoleClient() {
  const { url } = getPublicSupabaseEnv();
  const serviceRoleKey = getRuntimeSecret("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

function getRuntimeSecret(name: string): string {
  const processValue = process.env[name];
  if (processValue) {
    return processValue;
  }

  try {
    const cloudflareEnv = getCloudflareContext().env as Record<string, string | undefined>;
    const cloudflareValue = cloudflareEnv[name];
    if (cloudflareValue) {
      return cloudflareValue;
    }
  } catch {
    // Local Next builds do not have a Cloudflare request context.
  }

  throw new Error(`${name} is not set.`);
}
