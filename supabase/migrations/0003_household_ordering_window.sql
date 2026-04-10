alter table public.household_settings
  add column if not exists ordering_window_start time,
  add column if not exists ordering_window_end time;

alter table public.household_settings
  drop constraint if exists household_settings_points_exchange_rate_check;

alter table public.household_settings
  add constraint household_settings_points_exchange_rate_check
  check (points_exchange_rate >= 1);
