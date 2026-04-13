alter table public.profiles
  add column if not exists username text;

update public.profiles
set username = 'member_' || replace(left(user_id::text, 8), '-', '')
where username is null or trim(username) = '';

alter table public.profiles
  alter column username set not null;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username));

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_username_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_username_format_check
      check (username ~ '^[a-z0-9_]{3,24}$');
  end if;
end $$;

alter table public.households
  add column if not exists family_code text,
  add column if not exists family_code_status text not null default 'active',
  add column if not exists family_code_updated_at timestamptz not null default now();

update public.households
set family_code = upper(substr(md5(gen_random_uuid()::text), 1, 8)),
    family_code_updated_at = now()
where family_code is null or trim(family_code) = '';

alter table public.households
  alter column family_code set not null;

create unique index if not exists households_family_code_unique_idx
  on public.households (family_code);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'households_family_code_format_check'
  ) then
    alter table public.households
      add constraint households_family_code_format_check
      check (family_code ~ '^[A-Z0-9]{6,12}$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'households_family_code_status_check'
  ) then
    alter table public.households
      add constraint households_family_code_status_check
      check (family_code_status in ('active', 'disabled'));
  end if;
end $$;
