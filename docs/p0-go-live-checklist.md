# P0 Go-Live Checklist

This checklist is the shortest path to a working household demo with the current repository.

## 1. Create the Supabase project

- Create a new Supabase project in the region closest to your users.
- Enable email login in `Authentication -> Providers -> Email`.
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

## 7. Invite and join family members

1. In the admin app, open `/members`.
2. Generate an invite link.
3. Open the invite link in the web app while logged in as the invited member.
4. Accept the invitation.

## 8. Run the acceptance flow

Owner flow:

- verify household creation
- verify settings save
- verify menu create/edit/delete
- verify invite creation
- verify order confirm -> preparing -> completed
- verify task create -> approve

Member flow:

- verify invitation acceptance
- verify profile edit
- verify menu browsing and ordering
- verify negative points rule
- verify task claim -> submit
- verify points ledger updates

## 9. Production readiness checks

- run `pnpm --filter @night-food/web build`
- run `pnpm --filter @night-food/admin build`
- confirm OTP login emails are delivered
- confirm both site URLs match deployed domains
- confirm invite links point to the correct public web domain

## 10. Move into Phase 1

After P0 is stable, continue with:

- [phase1-live-setup.md](/C:/Users/gsx/Documents/New%20project%202/docs/phase1-live-setup.md)
- [phase1-acceptance-checklist.md](/C:/Users/gsx/Documents/New%20project%202/docs/phase1-acceptance-checklist.md)
