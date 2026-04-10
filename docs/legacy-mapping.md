# Legacy Mapping

This document maps the original open-source project to the new family-oriented web platform.

## Legacy Project Reference

Source location:

- `legacy/night-food-original/night-food-front`
- `legacy/night-food-original/NightFoodBackend`
- `legacy/night-food-original/NightFoodBackendPython`

## Page Mapping

| Legacy Page | Original Purpose | New Web Route | New Meaning |
| --- | --- | --- | --- |
| `pages/index/index` | home | `/` | household dashboard |
| `pages/order/order` | ordering | `/order` | family menu and cart |
| `pages/indent/indent` | order list | `/orders` | member order history |
| `pages/task/task` | task center | `/tasks` | household task center |
| `pages/task/addTask` | publish task | `/tasks/new` | owner creates household task |
| `pages/task/taskDetails` | task detail | `/tasks/[id]` | task lifecycle detail |
| `pages/main/main` | profile center | `/me` | member profile hub |
| `pages/main/coupon` | coupons | `/me/coupons` | reward and coupon list |
| `pages/main/userInfo` | profile | `/me/profile` | member profile details |
| `pages/login/login` | auth | `/login` | unified auth entry |

## Backend Mapping

| Legacy Entity | New Entity |
| --- | --- |
| `User` | `profiles` plus `household_members` |
| `FoodCategory` | `menu_categories` |
| `Food` | `menu_items` |
| `Order` | `orders` |
| `OrderDetail` | `order_items` |
| `TaskItem` | `tasks` |
| `Coupon` | `coupons` |
| `UserCoupon` | `user_coupons` |

## Design Upgrades

- the new schema introduces `households` as the top-level ownership boundary
- all major business tables are household-scoped
- role and membership are explicit rather than implied
- points are modeled as accounts and immutable transactions
- configuration moves into `household_settings`

