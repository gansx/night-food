create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade,
  actor_user_id uuid references public.profiles(user_id) on delete set null,
  target_type text not null,
  target_id uuid,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.household_members enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_logs enable row level security;
alter table public.tasks enable row level security;
alter table public.task_logs enable row level security;
alter table public.points_accounts enable row level security;
alter table public.points_transactions enable row level security;
alter table public.household_settings enable row level security;
alter table public.household_invitations enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
  );
$$;

create or replace function public.is_household_owner(target_household_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.role = 'owner'
      and hm.status = 'active'
  );
$$;

drop policy if exists "profiles_self_access" on public.profiles;
create policy "profiles_self_access" on public.profiles
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "households_member_read" on public.households;
create policy "households_member_read" on public.households
for select
using (public.is_household_member(id));

drop policy if exists "household_members_member_read" on public.household_members;
create policy "household_members_member_read" on public.household_members
for select
using (public.is_household_member(household_id));

drop policy if exists "household_members_owner_manage" on public.household_members;
create policy "household_members_owner_manage" on public.household_members
for all
using (public.is_household_owner(household_id))
with check (public.is_household_owner(household_id));

drop policy if exists "menu_categories_member_read" on public.menu_categories;
create policy "menu_categories_member_read" on public.menu_categories
for select
using (public.is_household_member(household_id));

drop policy if exists "menu_categories_owner_manage" on public.menu_categories;
create policy "menu_categories_owner_manage" on public.menu_categories
for all
using (public.is_household_owner(household_id))
with check (public.is_household_owner(household_id));

drop policy if exists "menu_items_member_read" on public.menu_items;
create policy "menu_items_member_read" on public.menu_items
for select
using (public.is_household_member(household_id));

drop policy if exists "menu_items_owner_manage" on public.menu_items;
create policy "menu_items_owner_manage" on public.menu_items
for all
using (public.is_household_owner(household_id))
with check (public.is_household_owner(household_id));

drop policy if exists "orders_member_read" on public.orders;
create policy "orders_member_read" on public.orders
for select
using (
  public.is_household_member(household_id)
  and (
    member_user_id = auth.uid()
    or public.is_household_owner(household_id)
  )
);

drop policy if exists "orders_member_insert" on public.orders;
create policy "orders_member_insert" on public.orders
for insert
with check (
  public.is_household_member(household_id)
  and member_user_id = auth.uid()
);

drop policy if exists "orders_owner_update" on public.orders;
create policy "orders_owner_update" on public.orders
for update
using (public.is_household_owner(household_id))
with check (public.is_household_owner(household_id));

drop policy if exists "order_items_member_read" on public.order_items;
create policy "order_items_member_read" on public.order_items
for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and public.is_household_member(o.household_id)
      and (o.member_user_id = auth.uid() or public.is_household_owner(o.household_id))
  )
);

drop policy if exists "order_items_member_insert" on public.order_items;
create policy "order_items_member_insert" on public.order_items
for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.member_user_id = auth.uid()
      and public.is_household_member(o.household_id)
  )
);

drop policy if exists "order_status_logs_member_read" on public.order_status_logs;
create policy "order_status_logs_member_read" on public.order_status_logs
for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and public.is_household_member(o.household_id)
      and (o.member_user_id = auth.uid() or public.is_household_owner(o.household_id))
  )
);

drop policy if exists "order_status_logs_owner_insert" on public.order_status_logs;
create policy "order_status_logs_owner_insert" on public.order_status_logs
for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and public.is_household_member(o.household_id)
  )
);

drop policy if exists "tasks_member_read" on public.tasks;
create policy "tasks_member_read" on public.tasks
for select
using (public.is_household_member(household_id));

drop policy if exists "tasks_owner_manage" on public.tasks;
create policy "tasks_owner_manage" on public.tasks
for all
using (public.is_household_owner(household_id))
with check (public.is_household_owner(household_id));

drop policy if exists "tasks_member_update_own" on public.tasks;
create policy "tasks_member_update_own" on public.tasks
for update
using (public.is_household_member(household_id) and assigned_user_id = auth.uid())
with check (public.is_household_member(household_id) and assigned_user_id = auth.uid());

drop policy if exists "task_logs_member_read" on public.task_logs;
create policy "task_logs_member_read" on public.task_logs
for select
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_id
      and public.is_household_member(t.household_id)
  )
);

drop policy if exists "task_logs_member_insert" on public.task_logs;
create policy "task_logs_member_insert" on public.task_logs
for insert
with check (
  exists (
    select 1 from public.tasks t
    where t.id = task_id
      and public.is_household_member(t.household_id)
  )
);

drop policy if exists "points_accounts_member_read" on public.points_accounts;
create policy "points_accounts_member_read" on public.points_accounts
for select
using (
  user_id = auth.uid()
  or public.is_household_owner(household_id)
);

drop policy if exists "points_accounts_owner_manage" on public.points_accounts;
create policy "points_accounts_owner_manage" on public.points_accounts
for all
using (public.is_household_owner(household_id))
with check (public.is_household_owner(household_id));

drop policy if exists "points_transactions_member_read" on public.points_transactions;
create policy "points_transactions_member_read" on public.points_transactions
for select
using (
  user_id = auth.uid()
  or public.is_household_owner(household_id)
);

drop policy if exists "points_transactions_owner_insert" on public.points_transactions;
create policy "points_transactions_owner_insert" on public.points_transactions
for insert
with check (public.is_household_member(household_id));

drop policy if exists "household_settings_member_read" on public.household_settings;
create policy "household_settings_member_read" on public.household_settings
for select
using (public.is_household_member(household_id));

drop policy if exists "household_settings_owner_manage" on public.household_settings;
create policy "household_settings_owner_manage" on public.household_settings
for all
using (public.is_household_owner(household_id))
with check (public.is_household_owner(household_id));

drop policy if exists "household_invitations_owner_read" on public.household_invitations;
create policy "household_invitations_owner_read" on public.household_invitations
for select
using (public.is_household_owner(household_id));

drop policy if exists "household_invitations_owner_manage" on public.household_invitations;
create policy "household_invitations_owner_manage" on public.household_invitations
for all
using (public.is_household_owner(household_id))
with check (public.is_household_owner(household_id));

drop policy if exists "audit_logs_owner_read" on public.audit_logs;
create policy "audit_logs_owner_read" on public.audit_logs
for select
using (public.is_household_owner(household_id));

drop policy if exists "audit_logs_member_insert" on public.audit_logs;
create policy "audit_logs_member_insert" on public.audit_logs
for insert
with check (household_id is null or public.is_household_member(household_id));

insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;
