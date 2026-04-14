import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envTemplatePath = path.join(root, ".env.example");
const envPath = path.join(root, ".env.local");

const requiredFiles = [
  ".env.example",
  "docs/phase1-live-setup.md",
  "docs/phase1-acceptance-checklist.md",
  "docs/cloudflare-deployment.md",
  "supabase/migrations/0001_initial_household_schema.sql",
  "supabase/migrations/0002_household_auth_foundation.sql",
  "supabase/migrations/0003_household_ordering_window.sql",
  "supabase/migrations/0004_security_storage_audit.sql",
  "supabase/migrations/0005_menu_featured_and_audit_indexes.sql",
  "supabase/migrations/0006_username_family_code.sql",
  "supabase/migrations/0007_order_refund_idempotency.sql",
  "supabase/seed/0001_demo_household_content.sql"
];

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

console.log("Phase 1 readiness report");
console.log("========================");

if (missingFiles.length) {
  console.log("Missing repository assets:");
  for (const file of missingFiles) {
    console.log(`- ${file}`);
  }
} else {
  console.log("Repository assets: OK");
}

if (!fs.existsSync(envTemplatePath)) {
  console.log("Environment template missing.");
  process.exit(1);
}

const template = parseEnv(fs.readFileSync(envTemplatePath, "utf8"));
const current = fs.existsSync(envPath) ? parseEnv(fs.readFileSync(envPath, "utf8")) : {};
const requiredEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_ADMIN_SITE_URL"
];

const missingEnv = requiredEnvKeys.filter((key) => !current[key]);
if (missingEnv.length) {
  console.log("Environment status: missing required keys in .env.local");
  for (const key of missingEnv) {
    console.log(`- ${key}`);
  }
} else {
  console.log("Environment status: OK");
}

const siteUrl = current.NEXT_PUBLIC_SITE_URL || template.NEXT_PUBLIC_SITE_URL;
const adminSiteUrl = current.NEXT_PUBLIC_ADMIN_SITE_URL || template.NEXT_PUBLIC_ADMIN_SITE_URL;

console.log("Supabase auth redirect URLs:");
console.log(`- Member app callback: ${siteUrl}/auth/callback`);
console.log(`- Admin app callback: ${adminSiteUrl}/auth/callback`);

console.log("Next step:");
console.log("- Follow docs/phase1-live-setup.md to create the Supabase project, run the migrations, and complete the first live household walkthrough.");
