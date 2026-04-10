# Cloudflare Deployment

This repo is prepared to deploy the member app and the owner console as two separate Cloudflare Workers produced by OpenNext.

For this project, the recommended production path is **Cloudflare Workers Builds connected to GitHub/GitLab**, not local Windows deployment.

## Apps

- `apps/web`: member-facing PWA
- `apps/admin`: owner console

## Required environment variables

Shared variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Member app:

- `NEXT_PUBLIC_SITE_URL`

Admin app:

- `NEXT_PUBLIC_ADMIN_SITE_URL`

## Suggested deployment flow

1. Run the SQL migrations in `supabase/migrations`.
2. Push this repository to GitHub or GitLab.
3. Create the `night-food-web` Worker Build with:
   - Root directory: `apps/web`
   - Build command: `npx @opennextjs/cloudflare build`
   - Deploy command: `npx @opennextjs/cloudflare deploy -- --keep-vars`
4. Create the `night-food-admin` Worker Build with:
   - Root directory: `apps/admin`
   - Build command: `npx @opennextjs/cloudflare build`
   - Deploy command: `npx @opennextjs/cloudflare deploy -- --keep-vars`
5. Add the required environment variables in Cloudflare for each Worker.
6. Update Supabase Auth redirect URLs to the final Worker domains.

Detailed cloud-build instructions are in:

- [cloudflare-workers-builds.md](/C:/Users/gsx/Documents/New%20project%202/docs/cloudflare-workers-builds.md)

## Local CLI notes

The repo still includes local CLI scripts:

- `pnpm cf:build:web`
- `pnpm cf:build:admin`
- `pnpm cf:deploy:web`
- `pnpm cf:deploy:admin`

However, OpenNext can fail on Windows during standalone output generation because of symlink restrictions. If local deploys are needed, use:

- WSL
- Linux/macOS
- or Cloudflare Workers Builds

## Wrangler configs

- `apps/web/wrangler.jsonc`
- `apps/admin/wrangler.jsonc`

Update the Worker names, public URLs, and secrets before production deployment.

## Notes

- The member app includes a lightweight service worker and web manifest for installability.
- Menu image uploads expect the Supabase bucket created by `supabase/migrations/0004_security_storage_audit.sql`.
- If you use Cloudflare custom domains, set the final public URLs in both Wrangler vars and Supabase auth redirect settings.
- Official references:
  - `https://developers.cloudflare.com/workers/frameworks/framework-guides/nextjs/`
  - `https://opennext.js.org/cloudflare`
