import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  ".env.example",
  "README.md",
  "docs/p0-go-live-checklist.md",
  "supabase/migrations/0001_initial_household_schema.sql",
  "supabase/migrations/0002_household_auth_foundation.sql",
  "supabase/migrations/0003_household_ordering_window.sql",
  "supabase/migrations/0006_username_family_code.sql",
  "supabase/migrations/0007_order_refund_idempotency.sql",
  "supabase/seed/0001_demo_household_content.sql"
];

const envPath = path.join(root, ".env.local");
const envTemplatePath = path.join(root, ".env.example");

function parseEnv(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));

console.log("P0 readiness report");
console.log("===================");

if (missingFiles.length) {
  console.log("Missing files:");
  for (const file of missingFiles) {
    console.log(`- ${file}`);
  }
} else {
  console.log("Required repository assets: OK");
}

if (fs.existsSync(envTemplatePath)) {
  const template = parseEnv(fs.readFileSync(envTemplatePath, "utf8"));
  const current = fs.existsSync(envPath) ? parseEnv(fs.readFileSync(envPath, "utf8")) : {};
  const requiredEnvKeys = Object.keys(template).filter((key) =>
    [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "NEXT_PUBLIC_SITE_URL",
      "NEXT_PUBLIC_ADMIN_SITE_URL"
    ].includes(key)
  );

  const missingEnv = requiredEnvKeys.filter((key) => !current[key]);
  if (missingEnv.length) {
    console.log("Environment status: missing required keys in .env.local");
    for (const key of missingEnv) {
      console.log(`- ${key}`);
    }
  } else {
    console.log("Environment status: OK");
  }
} else {
  console.log("Environment template missing.");
}

console.log("Next step:");
console.log("- Follow docs/p0-go-live-checklist.md to connect a real Supabase project and run the closed loop.");
