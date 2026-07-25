# Database Architecture & Mongoose Models

This document outlines the MongoDB/Mongoose data model definitions, relationships, indexing strategies, and multi-tenant isolation rules for **TeamFlow**.

---

## 1. Mongoose Models Overview

### User (`User`)
Represents an authenticated user on the platform. It holds account details and the platform role.
- **Collection:** `users`
- **Key Fields:** `name`, `email` (normalized unique index), `passwordHash`, `platformRole` (`USER` | `PLATFORM_ADMIN`).

### Tenant (`Tenant`)
Represents an organization or workspace workspace. A tenant serves as the primary boundary for data isolation.
- **Collection:** `tenants`
- **Key Fields:** `name`, `slug` (unique path prefix slug), `ownerId` (ref to User).

### Membership (`Membership`)
Represents a User's association with a Tenant. It manages their local workspace permission role.
- **Collection:** `memberships`
- **Key Fields:** `userId`, `tenantId`, `role` (`OWNER` | `ADMIN` | `MEMBER`), `status` (`ACTIVE` | `INVITED` | `SUSPENDED`).
- **Indexes:** Compound unique index `{ userId: 1, tenantId: 1 }` to prevent duplicate membership records.

### Project (`Project`)
Represents a collection of tasks inside a tenant.
- **Collection:** `projects`
- **Key Fields:** `name`, `tenantId`, `status` (`ACTIVE` | `ARCHIVED`), `createdBy`.
- **Indexes:** Compound index `{ tenantId: 1, status: 1 }` for tenant-scoped filters.

### Task (`Task`)
Represents a tracking item within a project.
- **Collection:** `tasks`
- **Key Fields:** `title`, `projectId`, `tenantId`, `status` (`TODO` | `IN_PROGRESS` | `DONE`), `priority` (`LOW` | `MEDIUM` | `HIGH`), `assignedTo` (ref to User), `createdBy`.
- **Indexes:** Compound indexes for tenant-scoped lists by status, project, or assignee.

### Plan (`Plan`)
Defines the subscription pricing tiers and their corresponding resource limits.
- **Collection:** `plans`
- **Key Fields:** `name`, `code` (`FREE` | `PRO`), `price`, `limits` (`maxMembers`, `maxProjects`, `maxTasksPerProject`).

### Subscription (`Subscription`)
Maintains the active billing plan and subscription status for a tenant.
- **Collection:** `subscriptions`
- **Key Fields:** `tenantId` (unique), `planId`, `status` (`ACTIVE`, `PAST_DUE`, etc.), Stripe customer and subscription IDs.

### Payment (`Payment`)
Transaction logs for invoice payments to enable financial record keeping and reporting.
- **Collection:** `payments`
- **Key Fields:** `tenantId`, `subscriptionId`, `amount`, `status`, `providerPaymentId` (unique sparse).

---

## 2. Model Relationships

```
      [User] ◄────────────────┐ (createdBy / assignedTo)
        │                     │
        ▼ (1:N)               │
   [Membership] ────(N:1)────►│
                              │
   [Tenant] ──────────────────┼─────────────────────────┐
      │                       │                         │
      ├───(1:N)───► [Project] ◄──(1:N)───► [Task]       │
      │                                                 │
      ├───(1:1)───► [Subscription] ───(1:N)───► [Payment]
      │                     │
      └─────────────────────┴───► [Plan]
```

---

## 3. Tenant Isolation Strategy
TeamFlow utilizes **logical tenant isolation** inside a shared MongoDB database.

1. **Logical Partitioning:** Every workspace-owned resource (Membership, Project, Task, Subscription, Payment) contains a `tenantId` property.
2. **Mandatory Scoping:** Application queries must explicitly request data using the active `tenantId`.
   * *Example:* `Project.find({ tenantId: currentTenantId })`
3. **Prevention of Unscoped Queries:** Unscoped CRUD queries or generic repository scripts without explicit tenant constraints are prohibited.

---

## 4. Plan Limits Design
Plan limits are configured centrally in the `Plan` collection:

- **Free Tier (`FREE`):**
  * `maxMembers: 3`
  * `maxProjects: 2`
  * `maxTasksPerProject: 10`
- **Pro Tier (`PRO`):**
  * `maxMembers: 10`
  * `maxProjects: -1` (represents Unlimited)
  * `maxTasksPerProject: -1` (represents Unlimited)

### Unlimited Representation
Unlimited values are represented as `-1` in the database. Gating rules will be checked using:
```typescript
if (limit !== -1 && currentCount >= limit) {
  // Block operation and return limit error
}
```

---

## 5. Important Indices

| Collection | Fields Indexed | Index Type | Query Target |
| :--- | :--- | :--- | :--- |
| **User** | `email` | Unique | Login / Registration Lookup |
| **Tenant** | `slug` | Unique | Workspace routing |
| **Membership** | `userId`, `tenantId` | Compound Unique | Verify membership & authorization |
| **Project** | `tenantId`, `status` | Compound | Tenant project views |
| **Task** | `tenantId`, `status` | Compound | Tenant Kanban board views |
| | `tenantId`, `projectId` | Compound | Project task lists |
| | `tenantId`, `assignedTo` | Compound | My tasks views |
| **Subscription**| `tenantId` | Unique | Subscription state check |
| **Payment** | `providerPaymentId` | Unique Sparse | Stripe invoice webhook reconciliation |

---

## 6. Service / API Layer Enforcement
The database models establish boundaries and constraints, but the following rules must be enforced in the application code in subsequent phases:

- **Task-Project Parent Verification:** When creating a task, the server must verify that the requested `projectId` belongs to the active `tenantId` to prevent cross-tenant injection.
- **Role Verification:** Changing workspace roles (e.g. promoting a Member to Admin) must be authorized by verifying the requestor's Membership role is `OWNER` or `ADMIN`.
- **Write Gating:** Feature limit counts (e.g. project count vs `plan.limits.maxProjects`) must be evaluated prior to saving a new document.
