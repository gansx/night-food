# Night Food Family Platform

Night Food Family Platform is the redesigned web version of the original `night-food` project for household use.

## Product Focus

- family members browse menus and place meal orders
- household owners manage menus, tasks, points, and members
- family tasks reward points that can be used for meal redemption
- role-based permissions separate owners and family members

## Repository Layout

- `apps/web`: family member web app and PWA
- `apps/admin`: household management console
- `packages/types`: shared domain types
- `packages/lib`: shared domain helpers
- `docs`: architecture, module, permission, and rollout docs
- `supabase`: migrations and seed assets for the household schema
- `workers`: background jobs and scheduled tasks
- `legacy/night-food-original`: preserved original open-source project

## Current Status

The repository now includes:

- household-oriented web and admin apps
- Supabase schema and bootstrap flow
- username/password auth, household family code join, ordering, task, points, member, and menu management flows
- P0 go-live checklist and starter seed assets
- phase 1 live setup and acceptance runbooks

## Quick Start

1. Fill the environment values from `.env.example`.
2. Apply all SQL files in `supabase/migrations`.
3. Start the apps:

```bash
pnpm --filter @night-food/web dev
pnpm --filter @night-food/admin dev
```

4. Register a family owner account in the admin app, create a household, then share the family code with members.
5. Follow [docs/p0-go-live-checklist.md](/C:/Users/gsx/Documents/New%20project%202/docs/p0-go-live-checklist.md).

For the first real connected environment, also use:

- [docs/phase1-live-setup.md](/C:/Users/gsx/Documents/New%20project%202/docs/phase1-live-setup.md)
- [docs/phase1-acceptance-checklist.md](/C:/Users/gsx/Documents/New%20project%202/docs/phase1-acceptance-checklist.md)

Local self-check:

```bash
pnpm phase1:readiness
```

## Cloud Deployment

The project is designed to run fully in the cloud:

- `apps/web` deploys as the family-facing Cloudflare Worker
- `apps/admin` deploys as the owner console Cloudflare Worker
- Supabase remains the hosted database, auth, and storage backend

For the recommended Git-based Cloudflare flow, use:

- [docs/cloudflare-deployment.md](/C:/Users/gsx/Documents/New%20project%202/docs/cloudflare-deployment.md)
- [docs/cloudflare-workers-builds.md](/C:/Users/gsx/Documents/New%20project%202/docs/cloudflare-workers-builds.md)
- [docs/github-publish.md](/C:/Users/gsx/Documents/New%20project%202/docs/github-publish.md)
- [docs/github-actions-cloudflare.md](/C:/Users/gsx/Documents/New%20project%202/docs/github-actions-cloudflare.md)

## Source Reference

The legacy project is preserved under `legacy/night-food-original` and remains the feature reference for:

- ordering
- task center
- points-based rewards
- household-style access flows
