# Cloudflare Workers Builds Setup

This project should be deployed as two separate Cloudflare Workers backed by the same Supabase project.

## Recommended deployment model

- Worker 1: `night-food-web`
- Worker 2: `night-food-admin`
- Build platform: Cloudflare Workers Builds
- Source control: GitHub or GitLab

This is the recommended path because `@opennextjs/cloudflare` builds more reliably in a Linux-based CI environment than on local Windows machines.

## Prerequisites

Before creating the Workers in Cloudflare:

1. Push this repository to GitHub or GitLab.
2. Keep `apps/web/wrangler.jsonc` and `apps/admin/wrangler.jsonc` in the repo.
3. Make sure Supabase migrations are already applied.

## Worker 1: Member app

Create a Worker from your Git repository with these settings:

- Worker name: `night-food-web`
- Root directory: `apps/web`
- Build command: `npx @opennextjs/cloudflare build`
- Deploy command: `npx @opennextjs/cloudflare deploy -- --keep-vars`

### Build variables and secrets

Add these in the Worker build settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Set `NEXT_PUBLIC_SITE_URL` to the final public member URL, for example:

```text
https://night-food-web.<your-subdomain>.workers.dev
```

### Runtime variables and secrets

Add the same values again in the Worker runtime settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

## Worker 2: Admin app

Create a second Worker from the same Git repository with these settings:

- Worker name: `night-food-admin`
- Root directory: `apps/admin`
- Build command: `npx @opennextjs/cloudflare build`
- Deploy command: `npx @opennextjs/cloudflare deploy -- --keep-vars`

### Build variables and secrets

Add these in the Worker build settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_ADMIN_SITE_URL`

Set `NEXT_PUBLIC_ADMIN_SITE_URL` to the final admin URL, for example:

```text
https://night-food-admin.<your-subdomain>.workers.dev
```

### Runtime variables and secrets

Add the same values again in the Worker runtime settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_ADMIN_SITE_URL`

## Supabase auth callback URLs

After both Workers are created, update Supabase Auth redirect URLs:

- `https://night-food-web.<your-subdomain>.workers.dev/auth/callback`
- `https://night-food-admin.<your-subdomain>.workers.dev/auth/callback`

If you later bind custom domains, add the custom-domain callback URLs too.

## Why both build and runtime variables are needed

OpenNext and Next.js need environment variables in two places:

- during build, so `NEXT_PUBLIC_*` values can be embedded into the client bundle
- during runtime, so server actions, route handlers, and Supabase service-role access work correctly

## Suggested cloud verification flow

1. Open the admin Worker URL.
2. Log in with the owner email.
3. Create the household.
4. Open the member Worker URL.
5. Log in as a family member.
6. Accept the invitation link.
7. Create menu items in admin.
8. Place an order in the member app.
9. Publish a task and verify points settlement.

## References

- [OpenNext Cloudflare: Develop and deploy](https://opennext.js.org/cloudflare/howtos/dev-deploy)
- [OpenNext Cloudflare: Environment variables](https://opennext.js.org/cloudflare/howtos/env-vars)
- [Cloudflare Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Cloudflare Workers Builds overview](https://developers.cloudflare.com/workers/ci-cd/builds/)
