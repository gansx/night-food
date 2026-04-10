create or replace function public.seed_household_demo(
  p_household_id uuid,
  p_owner_user_id uuid,
  p_member_user_ids uuid[] default '{}'
)
returns void
language plpgsql
as $$
declare
  breakfast_id uuid;
  snacks_id uuid;
  drinks_id uuid;
  current_member_id uuid;
begin
  insert into public.household_settings (
    household_id,
    ordering_enabled,
    task_approval_required,
    allow_negative_points,
    points_exchange_rate,
    announcement_text,
    ordering_window_start,
    ordering_window_end
  )
  values (
    p_household_id,
    true,
    true,
    false,
    1,
    '今晚 19:30 后统一出餐，完成任务可以赚积分换夜宵。',
    '16:00',
    '21:30'
  )
  on conflict (household_id) do update
  set
    ordering_enabled = excluded.ordering_enabled,
    task_approval_required = excluded.task_approval_required,
    allow_negative_points = excluded.allow_negative_points,
    points_exchange_rate = excluded.points_exchange_rate,
    announcement_text = excluded.announcement_text,
    ordering_window_start = excluded.ordering_window_start,
    ordering_window_end = excluded.ordering_window_end,
    updated_at = now();

  insert into public.menu_categories (household_id, name, sort_order, is_active)
  values
    (p_household_id, '晚饭主食', 10, true),
    (p_household_id, '夜宵小食', 20, true),
    (p_household_id, '饮品', 30, true)
  returning id into breakfast_id;

  select id into breakfast_id
  from public.menu_categories
  where household_id = p_household_id and name = '晚饭主食'
  order by created_at asc
  limit 1;

  select id into snacks_id
  from public.menu_categories
  where household_id = p_household_id and name = '夜宵小食'
  order by created_at asc
  limit 1;

  select id into drinks_id
  from public.menu_categories
  where household_id = p_household_id and name = '饮品'
  order by created_at asc
  limit 1;

  insert into public.menu_items (
    household_id,
    category_id,
    name,
    description,
    price_points,
    sort_order,
    is_available
  )
  values
    (p_household_id, breakfast_id, '照烧鸡腿饭', '适合晚饭和加班后补充能量。', 28, 10, true),
    (p_household_id, breakfast_id, '黑椒牛柳意面', '家庭高人气主食。', 32, 20, true),
    (p_household_id, snacks_id, '芝士土豆球', '看电影时的夜宵小食。', 16, 10, true),
    (p_household_id, snacks_id, '烤鸡翅', '适合共享。', 22, 20, true),
    (p_household_id, drinks_id, '热可可', '晚上喝更舒服。', 8, 10, true),
    (p_household_id, drinks_id, '鲜榨橙汁', '早餐和晚餐都适合。', 10, 20, true)
  on conflict do nothing;

  insert into public.tasks (
    household_id,
    title,
    description,
    reward_points,
    status,
    created_by_user_id
  )
  values
    (p_household_id, '饭后洗碗', '完成后拍照或口头确认。', 15, 'open', p_owner_user_id),
    (p_household_id, '整理餐桌', '把餐具归位并擦干净桌面。', 10, 'open', p_owner_user_id),
    (p_household_id, '本周零食补货清单', '统计家里剩余零食并补充到清单。', 20, 'open', p_owner_user_id)
  on conflict do nothing;

  insert into public.points_accounts (household_id, user_id, balance)
  values (p_household_id, p_owner_user_id, 120)
  on conflict (household_id, user_id) do update
  set balance = excluded.balance,
      updated_at = now();

  foreach current_member_id in array coalesce(p_member_user_ids, '{}')
  loop
    insert into public.points_accounts (household_id, user_id, balance)
    values (p_household_id, current_member_id, 60)
    on conflict (household_id, user_id) do update
    set balance = excluded.balance,
        updated_at = now();
  end loop;
end;
$$;
