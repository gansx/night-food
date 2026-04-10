function getRequiredPublicEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set.`);
  }

  return value;
}

export function hasPublicSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getPublicSupabaseEnv() {
  return {
    url: getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  };
}

export function hasServiceRoleEnv() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!value) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  }

  return value;
}
