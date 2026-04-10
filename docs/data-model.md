# Data Model

## Core Entities

### `households`

Represents one family unit.

Key fields:

- `id`
- `name`
- `slug`
- `owner_user_id`
- `timezone`
- `status`

### `profiles`

Application profile for an authenticated user.

Key fields:

- `user_id`
- `display_name`
- `avatar_url`
- `phone`

### `household_members`

Membership join table between profiles and households.

Key fields:

- `id`
- `household_id`
- `user_id`
- `role`
- `status`
- `joined_at`

### `menu_categories`

Household-specific menu grouping.

Key fields:

- `id`
- `household_id`
- `name`
- `sort_order`
- `is_active`

### `menu_items`

Actual dishes family members can order.

Key fields:

- `id`
- `household_id`
- `category_id`
- `name`
- `description`
- `price_points`
- `image_url`
- `is_available`
- `sort_order`

### `orders`

Order header record.

Key fields:

- `id`
- `household_id`
- `member_user_id`
- `order_number`
- `status`
- `subtotal_points`
- `discount_points`
- `total_points`
- `remark`

### `order_items`

Order line items.

Key fields:

- `id`
- `order_id`
- `menu_item_id`
- `quantity`
- `unit_points`
- `subtotal_points`

### `tasks`

Family tasks.

Key fields:

- `id`
- `household_id`
- `title`
- `description`
- `reward_points`
- `status`
- `created_by_user_id`
- `assigned_user_id`
- `submitted_by_user_id`
- `approved_by_user_id`

### `points_accounts`

Current balance per user per household.

Key fields:

- `id`
- `household_id`
- `user_id`
- `balance`

### `points_transactions`

Immutable ledger for all point changes.

Key fields:

- `id`
- `household_id`
- `user_id`
- `source_type`
- `source_id`
- `direction`
- `amount`
- `balance_after`
- `description`

### `coupons`

Optional household reward units.

Key fields:

- `id`
- `household_id`
- `name`
- `coupon_type`
- `discount_points`
- `minimum_order_points`
- `starts_at`
- `ends_at`

### `user_coupons`

Coupon ownership and usage.

Key fields:

- `id`
- `coupon_id`
- `user_id`
- `is_used`
- `used_at`

### `household_settings`

Configurable rules for ordering and task operations.

Key fields:

- `household_id`
- `ordering_enabled`
- `task_approval_required`
- `allow_negative_points`
- `points_exchange_rate`
- `announcement_text`

