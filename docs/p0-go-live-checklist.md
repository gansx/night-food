# P0 Go-Live Checklist

This checklist is the shortest path to a working household demo with the current repository.

## 1. Create the Supabase project

- Create a new Supabase project in the region closest to your users.
- Keep Supabase Auth enabled for email/password internally. The app exposes username + password registration, and turns usernames into internal auth emails automatically.
- Copy:
  - `Project URL`
  - `anon public key`
  - `service_role key`

## 2. Configure local environment

Create `.env.local` in both apps or at the workspace root based on `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_SITE_URL=http://localhost:3001
OWNER_INVITE_EXPIRY_HOURS=48
POINTS_EXCHANGE_RATE=1
```

## 3. Apply database schema

Run the SQL files in order:

1. [0001_initial_household_schema.sql](/C:/Users/gsx/Documents/New%20project%202/supabase/migrations/0001_initial_household_schema.sql)
2. [0002_household_auth_foundation.sql](/C:/Users/gsx/Documents/New%20project%202/supabase/migrations/0002_household_auth_foundation.sql)
3. [0003_household_ordering_window.sql](/C:/Users/gsx/Documents/New%20project%202/supabase/migrations/0003_household_ordering_window.sql)
4. [0004_security_storage_audit.sql](/C:/Users/gsx/Documents/New%20project%202/supabase/migrations/0004_security_storage_audit.sql)
5. [0005_menu_featured_and_audit_indexes.sql](/C:/Users/gsx/Documents/New%20project%202/supabase/migrations/0005_menu_featured_and_audit_indexes.sql)
6. [0006_username_family_code.sql](/C:/Users/gsx/Documents/New%20project%202/supabase/migrations/0006_username_family_code.sql)
7. [0007_order_refund_idempotency.sql](/C:/Users/gsx/Documents/New%20project%202/supabase/migrations/0007_order_refund_idempotency.sql)

## 4. Start local apps

```bash
pnpm --filter @night-food/web dev
pnpm --filter @night-food/admin dev
```

## 5. Bootstrap the owner household

1. Open the admin app.
2. Log in with the owner email.
3. Go to `/setup/owner`.
4. Create the household and owner profile.

## 6. Seed starter household data

1. Run [0001_demo_household_content.sql](/C:/Users/gsx/Documents/New%20project%202/supabase/seed/0001_demo_household_content.sql).
2. Call `public.seed_household_demo(...)` with the real owner and household IDs.

## 7. Join family members with the family code

1. In the admin app, open `/members` or `/settings`.
2. Copy the household family code.
3. Ask the family member to register their own username + password in the web app.
4. The member opens `/family`, enters the family code, and joins the household.

## 8. Run the acceptance flow

Owner flow:

- verify household creation
- verify settings save
- verify menu create/edit/delete
- verify family code join
- verify order confirm -> preparing -> completed
- verify task create -> approve

Member flow:

- verify family code acceptance
- verify profile edit
- verify menu browsing and ordering
- verify negative points rule
- verify task claim -> submit
- verify points ledger updates

## 9. Production readiness checks

- run `pnpm --filter @night-food/web build`
- run `pnpm --filter @night-food/admin build`
- confirm both site URLs match deployed domains
- confirm family code join works on the public web domain

## 10. Move into Phase 1

After P0 is stable, continue with:

- [phase1-live-setup.md](/C:/Users/gsx/Documents/New%20project%202/docs/phase1-live-setup.md)
- [phase1-acceptance-checklist.md](/C:/Users/gsx/Documents/New%20project%202/docs/phase1-acceptance-checklist.md)
