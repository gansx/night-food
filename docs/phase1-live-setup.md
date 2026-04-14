# Phase 1 Live Setup

This runbook is the fastest path from the current repo to a real working household environment.

## 1. Create the Supabase project

Create one new Supabase project and keep the region close to your users.

You will need these values:

- `Project URL`
- `anon public key`
- `service_role key`

## 2. Configure Auth

In Supabase Authentication:

- enable email/password auth
- keep email confirmation disabled for the current username/password test flow
- add redirect URLs for both apps if you later enable callback-based auth

Local callback URLs:

- `http://localhost:3000/auth/callback`
- `http://localhost:3001/auth/callback`

If you already know your production domains, add them now too:

- `https://your-member-domain/auth/callback`
- `https://your-admin-domain/auth/callback`

## 3. Fill environment variables

Copy `.env.example` to `.env.local` at the workspace root and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_SITE_URL=http://localhost:3001
OWNER_INVITE_EXPIRY_HOURS=48
POINTS_EXCHANGE_RATE=1
```

Then run:

```bash
pnpm phase1:readiness
```

## 4. Apply migrations

Run the SQL files in `supabase/migrations` in this order:

1. `0001_initial_household_schema.sql`
2. `0002_household_auth_foundation.sql`
3. `0003_household_ordering_window.sql`
4. `0004_security_storage_audit.sql`
5. `0005_menu_featured_and_audit_indexes.sql`
6. `0006_username_family_code.sql`
7. `0007_order_refund_idempotency.sql`

This creates:

- household, member, menu, order, task, points tables
- username login and household family code fields
- RLS and audit log support
- storage bucket metadata for menu images
- featured menu item support

## 5. Start both apps locally

```bash
pnpm --filter @night-food/web dev
pnpm --filter @night-food/admin dev
```

Open:

- member app: `http://localhost:3000`
- admin app: `http://localhost:3001`

## 6. Bootstrap the first household

1. Open the admin app.
2. Register or log in with the future owner username and password.
3. Go to `/setup/owner`.
4. Create the household and owner profile.

After bootstrap, confirm:

- one row exists in `households`
- one row exists in `household_members` with role `owner`
- one row exists in `household_settings`
- one row exists in `points_accounts` for the owner

## 7. Seed starter data

Run `supabase/seed/0001_demo_household_content.sql` in the SQL editor.

Then call:

```sql
select public.seed_household_demo(
  'YOUR_HOUSEHOLD_ID',
  'YOUR_OWNER_USER_ID'
);
```

If members already exist:

```sql
select public.seed_household_demo(
  'YOUR_HOUSEHOLD_ID',
  'YOUR_OWNER_USER_ID',
  array['MEMBER_USER_ID_1', 'MEMBER_USER_ID_2']::uuid[]
);
```

## 8. Complete the first live walkthrough

1. Owner logs into admin.
2. Owner confirms household settings can be saved.
3. Owner creates menu categories and menu items.
4. Owner copies the family code from `/members` or `/settings`.
5. Member registers their own username and password in the web app.
6. Member enters the family code at `/family` and joins.
7. Member browses menu and places an order.
8. Owner confirms the order and completes it.
9. Owner creates a task.
10. Member claims and submits the task.
11. Owner approves the task, or the system auto-credits based on household settings.

## 9. Check storage upload

Open menu management and upload a menu image.

If upload fails, verify:

- `SUPABASE_SERVICE_ROLE_KEY` is present
- the `menu-images` bucket exists
- the image upload API returns a public URL

## 10. Prepare for deployment

When the local walkthrough is stable, continue with:

- `docs/cloudflare-deployment.md`

That is the handoff from Phase 1 live setup to actual deployment.
