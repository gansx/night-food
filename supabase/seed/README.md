# Seed Data Guide

This folder now contains a callable SQL helper for initializing a real household after the owner has finished bootstrap.

## File

- `0001_demo_household_content.sql`

## What it does

- upserts household settings
- creates starter menu categories
- creates starter menu items
- creates starter household tasks
- initializes points balances for the owner and invited members

## How to use

1. Run all migration files in `supabase/migrations`.
2. Open the Supabase SQL editor.
3. Run the contents of `0001_demo_household_content.sql`.
4. Call the function with your real IDs:

```sql
select public.seed_household_demo(
  'YOUR_HOUSEHOLD_ID',
  'YOUR_OWNER_USER_ID',
  array['MEMBER_USER_ID_1', 'MEMBER_USER_ID_2']::uuid[]
);
```

If you only have the owner account for now:

```sql
select public.seed_household_demo(
  'YOUR_HOUSEHOLD_ID',
  'YOUR_OWNER_USER_ID'
);
```

## Where to get the IDs

- `household_id`: from the `households` table after owner bootstrap
- `owner_user_id`: from `auth.users.id` for the owner account
- `member_user_id`: from `auth.users.id` for invited family accounts after they join
