-- Ensure a cancelled order can create at most one refund ledger entry.
create unique index if not exists idx_points_transactions_order_refund_once
  on public.points_transactions (source_id)
  where source_type = 'order' and direction = 'credit';
