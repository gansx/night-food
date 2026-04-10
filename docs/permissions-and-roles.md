# Permissions and Roles

## Roles

## `owner`

Full household control.

### Allowed Actions

- update household settings
- manage members and invitations
- create, edit, publish, archive menu items
- create, edit, approve, cancel tasks
- create and manage coupons
- view all orders in the household
- manually adjust points
- post household announcements

## `member`

Daily participant of the household system.

### Allowed Actions

- browse menu items
- create own orders
- view own orders
- browse, claim, and submit tasks
- view own points balance and transaction history
- edit own profile

### Restricted Actions

- cannot change household settings
- cannot edit other members
- cannot modify menu definitions
- cannot approve task completion for others

## Permission Matrix

| Action | Owner | Member |
| --- | --- | --- |
| View household home | Yes | Yes |
| Place order | Yes | Yes |
| View all household orders | Yes | No |
| View own orders | Yes | Yes |
| Edit menu | Yes | No |
| Publish task | Yes | No |
| Claim task | Yes | Yes |
| Approve task completion | Yes | No |
| View all members | Yes | No |
| Manage member role | Yes | No |
| Adjust points manually | Yes | No |
| Edit own profile | Yes | Yes |

## Enforcement Strategy

- roles are stored in `household_members.role`
- owner-only mutations go through server-side checks
- every household-scoped query must filter by current household membership
- future row-level rules should mirror the same policy logic

