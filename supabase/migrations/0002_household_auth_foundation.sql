create table if not exists public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email text not null,
  invited_by_user_id uuid not null references public.profiles(user_id) on delete restrict,
  role text not null default 'member',
  token uuid not null default gen_random_uuid(),
  status text not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_invitations_role_check check (role in ('owner', 'member')),
  constraint household_invitations_status_check check (status in ('pending', 'accepted', 'expired', 'revoked'))
);

create unique index if not exists household_invitations_household_email_pending_idx
  on public.household_invitations (household_id, email, status);

create table if not exists public.household_bootstrap_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  owner_user_id uuid not null references public.profiles(user_id) on delete restrict,
  source text not null default 'owner_signup',
  created_at timestamptz not null default now()
);

