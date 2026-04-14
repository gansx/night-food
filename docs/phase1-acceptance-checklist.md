# Phase 1 Acceptance Checklist

Use this after the real Supabase project is connected.

## Owner setup

- owner can register and log into the admin app with username + password
- owner can create the first household at `/setup/owner`
- owner sees the dashboard instead of the setup page after bootstrap

## Member family-code join

- owner can copy the family code from `/members` or `/settings`
- owner can refresh the family code and invalidate the previous code
- member can register with username + password
- member can join the household by entering the family code at `/family`
- inactive or removed members cannot continue normal household actions

## Household rules

- owner can save announcement text
- owner can save ordering window
- owner can enable and disable ordering
- owner can switch task approval between manual and automatic

## Menu flow

- owner can create categories
- owner can create menu items
- owner can upload menu images
- owner can mark items as featured
- owner can search and filter items
- owner can batch enable and disable items

## Ordering flow

- member can browse the menu
- featured items appear on the home page
- member can submit an order inside the allowed time window
- blocked ordering window rejects new orders
- owner can move order status through confirm, preparing, complete
- cancelled orders refund points exactly once
- repeated cancellation attempts do not create duplicate refund ledger entries

## Task flow

- owner can create tasks with reward points and optional due date
- member can claim an open task
- expired tasks cannot be claimed
- member can submit a claimed task
- owner can approve submitted tasks
- owner can cancel and reopen eligible tasks
- task logs appear in both member and owner task detail pages

## Points flow

- task completion creates points ledger entries
- ordering creates debit ledger entries
- owner can manually adjust points
- member ledger paginates correctly on `/me`
- owner ledger paginates correctly on `/points`
- order cancellation refund appears as a single credit ledger entry

## Permission flow

- member cannot use owner-only APIs
- inactive members cannot continue normal household actions
- owner console redirects non-owner users away from admin-only areas

## Build and test

- `pnpm --filter @night-food/web typecheck`
- `pnpm --filter @night-food/admin typecheck`
- `pnpm --filter @night-food/web build`
- `pnpm --filter @night-food/admin build`
- `pnpm test:unit`
- `pnpm test:e2e:list`
