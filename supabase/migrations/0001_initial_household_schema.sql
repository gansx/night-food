create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_user_id uuid not null,
  timezone text not null default 'Asia/Shanghai',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint households_status_check check (status in ('active', 'archived'))
);

create table if not exists public.profiles (
  user_id uuid primary key,
  display_name text not null,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  role text not null,
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, user_id),
  constraint household_members_role_check check (role in ('owner', 'member')),
  constraint household_members_status_check check (status in ('active', 'inactive', 'removed'))
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  description text,
  price_points integer not null default 0,
  image_url text,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_items_price_points_check check (price_points >= 0)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  member_user_id uuid not null references public.profiles(user_id) on delete restrict,
  order_number text not null unique,
  status text not null default 'submitted',
  subtotal_points integer not null default 0,
  discount_points integer not null default 0,
  total_points integer not null default 0,
  remark text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_status_check check (status in ('draft', 'submitted', 'confirmed', 'preparing', 'completed', 'cancelled')),
  constraint orders_subtotal_points_check check (subtotal_points >= 0),
  constraint orders_discount_points_check check (discount_points >= 0),
  constraint orders_total_points_check check (total_points >= 0)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete restrict,
  quantity integer not null,
  unit_points integer not null,
  subtotal_points integer not null,
  created_at timestamptz not null default now(),
  constraint order_items_quantity_check check (quantity > 0),
  constraint order_items_unit_points_check check (unit_points >= 0),
  constraint order_items_subtotal_points_check check (subtotal_points >= 0)
);

create table if not exists public.order_status_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by_user_id uuid references public.profiles(user_id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  description text,
  reward_points integer not null default 0,
  status text not null default 'open',
  created_by_user_id uuid not null references public.profiles(user_id) on delete restrict,
  assigned_user_id uuid references public.profiles(user_id) on delete set null,
  submitted_by_user_id uuid references public.profiles(user_id) on delete set null,
  approved_by_user_id uuid references public.profiles(user_id) on delete set null,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_status_check check (status in ('open', 'claimed', 'in_progress', 'submitted', 'completed', 'cancelled')),
  constraint tasks_reward_points_check check (reward_points >= 0)
);

create table if not exists public.task_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by_user_id uuid references public.profiles(user_id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.points_accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  balance integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table if not exists public.points_transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  source_type text not null,
  source_id uuid,
  direction text not null,
  amount integer not null,
  balance_after integer not null,
  description text,
  created_at timestamptz not null default now(),
  constraint points_transactions_direction_check check (direction in ('credit', 'debit')),
  constraint points_transactions_amount_check check (amount > 0)
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  coupon_type text not null,
  discount_points integer,
  minimum_order_points integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_type_check check (coupon_type in ('full_reduction', 'discount'))
);

create table if not exists public.user_coupons (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  is_used boolean not null default false,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.household_settings (
  household_id uuid primary key references public.households(id) on delete cascade,
  ordering_enabled boolean not null default true,
  task_approval_required boolean not null default true,
  allow_negative_points boolean not null default false,
  points_exchange_rate integer not null default 1,
  announcement_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

