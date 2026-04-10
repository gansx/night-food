# Feature Modules

## 1. Household Home

The home screen preserves the original project structure but reframes it for family use.

### Goals

- show the current household identity
- surface active menu items
- show point balance and pending tasks
- provide direct access to ordering, tasks, orders, and profile

### Key Widgets

- hero banner and household notice
- quick actions: order, tasks, orders, publish task
- current point balance
- latest orders
- upcoming or open family tasks

## 2. Menu and Ordering

This module is derived from the original left-category plus right-list ordering page.

### Capabilities

- browse categories and menu items
- add items to cart
- adjust quantities
- submit order with notes
- redeem points
- apply coupon if eligible

### Owner Capabilities

- create category
- create menu item
- set price and availability
- attach image
- define sort order
- schedule menu visibility

## 3. Orders

Orders exist inside a household and are visible according to role.

### Member View

- list own orders
- inspect order details
- see point redemption and status
- re-order previous items

### Owner View

- see all household orders
- filter by status and date
- update order state
- cancel or complete orders

### Order States

- `draft`
- `submitted`
- `confirmed`
- `preparing`
- `completed`
- `cancelled`

## 4. Tasks

Tasks are the household collaboration engine.

### Member Capabilities

- browse open tasks
- claim or start task
- submit completion
- view earned points

### Owner Capabilities

- create task
- assign reward points
- optionally target specific members
- approve completion
- cancel or reopen task

### Task States

- `open`
- `claimed`
- `in_progress`
- `submitted`
- `completed`
- `cancelled`

## 5. Points and Rewards

Points are the first-phase payment and reward currency.

### Features

- task completion rewards points
- owners can manually adjust points
- orders can redeem points
- all changes produce immutable ledger entries

### Optional Later Expansion

- coupon campaigns
- owner gift points
- streak rewards
- seasonal household challenges

## 6. Household Management

This module is the owner control center.

### Features

- create household
- invite members
- remove or deactivate members
- set member role
- configure ordering and reward rules

### Household Roles

- `owner`
- `member`
- optional future `manager`

## 7. Profile and Identity

### Features

- account login
- profile editing
- avatar upload
- household membership listing
- current household selection

## 8. Announcements and Configuration

### Features

- household notices
- ordering windows
- points redemption rules
- task approval requirement
- contact information

