# GitHub Actions Cloudflare Deployment

This repository includes two GitHub Actions workflows that deploy from Linux runners instead of the local Windows machine.

## Workflows

- `.github/workflows/deploy-web.yml`
- `.github/workflows/deploy-admin.yml`

## Why use this route

This project uses OpenNext for Cloudflare Workers. The OpenNext Cloudflare build can fail on local Windows machines because of symlink restrictions, while GitHub Actions runs on Linux and avoids that issue.

## Required GitHub repository secrets

Add these in GitHub:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_ADMIN_SITE_URL`

## Expected Cloudflare worker names

The workflows deploy using the existing Wrangler configs:

- `apps/web/wrangler.jsonc` -> `night-food-web`
- `apps/admin/wrangler.jsonc` -> `night-food-admin`

## How to run

### Automatic

Push changes to:

- `main`
- `codex/family-web-cloudflare`

The matching workflow runs when files for that app change.

### Manual

In GitHub:

1. Open `Actions`
2. Choose `Deploy Web` or `Deploy Admin`
3. Click `Run workflow`

## Important runtime note

The workflows deploy with:

```bash
pnpm cf:deploy -- --keep-vars
```

That `--keep-vars` flag is important because Cloudflare dashboard runtime variables should remain in place between deployments.

## After the first successful deploy

Update Supabase Auth redirect URLs to the live domains:

- `<member-domain>/auth/callback`
- `<admin-domain>/auth/callback`

## References

- [OpenNext Cloudflare env vars](https://opennext.js.org/cloudflare/howtos/env-vars)
- [Cloudflare system environment variables](https://developers.cloudflare.com/workers/wrangler/system-environment-variables/)
