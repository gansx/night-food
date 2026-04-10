# System Architecture

## Product Definition

Night Food is a household collaboration platform rather than a restaurant storefront.

The core loop is:

1. Household owner creates and maintains menus
2. Family members place meal orders
3. Owner publishes family tasks
4. Family members complete tasks to earn points
5. Points are redeemed against meal orders

## High-Level Architecture

```text
Family Member Web/PWA
        |
        v
     Next.js Web App  -----> Shared UI / Domain Packages
        |
        v
   Route Handlers / BFF
        |
        +----> Supabase Auth
        +----> Supabase Postgres
        +----> Supabase Storage
        |
        +----> Cloudflare Worker Jobs
```

## Deployment Topology

- `apps/web` deploys as the household-facing app
- `apps/admin` deploys as the owner management console
- Supabase hosts authentication, relational data, and file storage
- Cloudflare handles edge delivery, static hosting, and background jobs

## Architectural Principles

- Household-first data ownership
- Role-based permissions at every write boundary
- Clear separation between family app and owner console
- Postgres as the source of truth for all business entities
- Background jobs for state transitions such as expiration and reconciliation

## Bounded Contexts

### Household Context

- households
- household members
- invitations
- household settings

### Menu Context

- menu categories
- menu items
- menu scheduling
- menu availability

### Ordering Context

- carts
- orders
- order items
- order status logs

### Task Context

- family tasks
- task lifecycle
- task confirmation
- task rewards

### Rewards Context

- points accounts
- points transactions
- coupons
- redemption rules

### Identity Context

- users
- profiles
- household roles
- owner/member invitation flows

## Initial App Split

### `apps/web`

Used by family members and owners for daily usage:

- home dashboard
- browse menu and order
- tasks and task details
- my orders
- my points and coupons
- profile and household switcher

### `apps/admin`

Used by owners for management:

- menu editor
- member administration
- task publishing and approval
- order oversight
- household rule configuration

## Security Model

- Supabase Auth identifies the user
- `household_members` links users to households and assigns roles
- every business table is household-scoped
- owner-only actions are enforced by route handlers and row-level rules

## Technical Stack

- Frontend: Next.js, React, TypeScript
- State and data fetching: TanStack Query, Zustand
- Forms and validation: React Hook Form, Zod
- Styling: Tailwind CSS plus shared design tokens
- Backend layer: Next.js route handlers and Supabase server clients
- Database: Supabase Postgres
- File storage: Supabase Storage
- Jobs: Cloudflare Workers
- Testing: Vitest and Playwright

