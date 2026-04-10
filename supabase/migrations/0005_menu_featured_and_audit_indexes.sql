alter table public.menu_items
  add column if not exists is_featured boolean not null default false;

create index if not exists menu_items_household_featured_idx
  on public.menu_items (household_id, is_featured, is_available);

create index if not exists audit_logs_household_created_idx
  on public.audit_logs (household_id, created_at desc);
