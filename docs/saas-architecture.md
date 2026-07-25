# TeamFlow SaaS Architecture & Technical Specification

This document serves as the single source of truth for the architecture, data models, workflows, and implementation requirements of the **TeamFlow** multi-tenant SaaS application.

---

## 1. Product Overview
**TeamFlow** is a lightweight, multi-tenant project and task management SaaS application designed for organizations and workspaces. 
Users can register, create or join organizations (tenants), manage projects and tasks collaboratively, invite members, and access advanced features or higher resource limits by subscribing to the Pro plan via Stripe Test Mode.

---

## 2. Tech Stack
- **Framework:** Next.js (App Router, React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS & shadcn/ui
- **Forms & Validation:** Formik & Yup
- **Database:** MongoDB Atlas (Cluster: `teamflow-cluster`, Database: `teamflow`)
- **Database Library (ODM):** Mongoose
- **Authentication:** Auth.js (NextAuth.js v5)
- **Billing Integration:** Stripe (Test Mode)

---

## 3. User Types

### Guest
- **Definition:** An unauthenticated visitor to the website.
- **Permitted Routes:** `/`, `/pricing`, `/features`, `/login`, `/register`.
- **Capabilities:** Browse public marketing pages, view subscription pricing/features, register a new account, or sign in.
- **Restrictions:** Cannot access any internal app dashboards, tenant-specific data, billing pages, or project settings.

### Tenant Owner
- **Definition:** The user who created the tenant (organization). 
- **Capabilities:** Full access to dashboard, project/task CRUD, team invitations, and billing/subscription management.
- **Restrictions:** Owners cannot be removed or downgraded from their own tenant unless they transfer ownership.

### Tenant Admin
- **Definition:** A user assigned administrative privileges inside a tenant.
- **Capabilities:** Access dashboards, manage projects/tasks, invite new members, change roles of standard members, and remove standard members.
- **Restrictions:** Cannot access Stripe billing dashboards, modify subscription plans, or delete the tenant.

### Tenant Member
- **Definition:** A standard team member in a tenant workspace.
- **Capabilities:** View projects, create and update tasks, change task status, and assign tasks to other members.
- **Restrictions:** Cannot manage members, modify roles, view billing, or change tenant settings.

### Platform Admin
- **Definition:** An administrator with system-wide authority across all tenants.
- **Capabilities:** View platform-level dashboard metrics, list all users/tenants, view subscription details, and suspend/reactivate tenants.
- **Restrictions:** Does not automatically get reading or writing access to tenant project/task data unless explicitly assigned to that tenant.

---

## 4. Role Architecture
We separate global **Platform Roles** (identity and system management) from local **Tenant Roles** (permissions within a specific organization workspace).

```
Platform Role (Stored on User)
 ├── USER
 └── PLATFORM_ADMIN

Tenant Role (Stored on Membership)
 ├── OWNER
 ├── ADMIN
 └── MEMBER
```

A user's tenant-specific role is **never** stored on the `User` document. Instead, it is stored on a join entity called `Membership`. This allows a single user to belong to multiple tenants with different roles (e.g., Owner of Tenant A and Member of Tenant B).

---

## 5. Multi-Tenant Architecture
TeamFlow utilizes a **shared-database with logical tenant isolation** (single-database, multi-tenant model).

- The `Tenant` collection represents the tenant boundary.
- All tenant-owned resources (Membership, Project, Task, Subscription, Payment) store a `tenantId` field referencing the owning Tenant.
- Database queries and modifications must always include the active `tenantId` parameter to prevent cross-tenant data leakage.

```
+-------------------------------------------------------+
|                      MongoDB Atlas                    |
|                        (teamflow)                     |
+-------------------------------------------------------+
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
+─────────────+      +─────────────+      +─────────────+
|  Tenant A   |      |  Tenant B   |      |  Tenant C   |
| (tenantId1) |      | (tenantId2) |      | (tenantId3) |
+─────────────+      +─────────────+      +─────────────+
       │                    │                    │
       ├── Memberships      ├── Memberships      ├── Memberships
       ├── Projects         ├── Projects         ├── Projects
       └── Tasks            └── Tasks            └── Tasks
```

---

## 6. Tenant Isolation Rules
To guarantee robust tenant isolation:

1. **Explicit Identification:** No tenant-owned resource (Projects, Tasks, Members, Billing) can be queried without an authenticated user session and a verified active `tenantId`.
2. **Server-Side Verification:** The server must independently verify that:
   - The user is authenticated.
   - The user has an active, valid `Membership` in the target tenant.
   - The user's role in that membership allows the requested action.
   - The resource being accessed actually belongs to the active tenant (`resource.tenantId === activeTenantId`).
3. **No ID Spoofing:** A user must never be able to access or modify a project/task simply by changing an ID parameter in the URL or the request body. If the resource is not owned by the user's active tenant, the server must return a `403 Forbidden` or `404 Not Found` response.

---

## 7. Tenant Selection
- Users belonging to multiple organizations can switch between workspaces using a UI Workspace/Tenant Switcher.
- The active tenant ID is stored in a secure cookie or session parameter.
- Every client request targeting tenant-specific data must send the active tenant ID (typically in headers or route parameters).
- The server **must validate** this tenant ID against the user's active memberships. The client's assertion is never trusted blindly.

---

## 8. Database Entity Plan
All schemas will be defined using Mongoose.

```mongoose
// User Schema
{
  email: String (unique, required),
  name: String,
  image: String,
  platformRole: String [USER, PLATFORM_ADMIN] (default: USER)
}

// Tenant Schema
{
  name: String (required),
  createdAt: Date
}

// Membership Schema
{
  userId: ObjectId (ref: User, required),
  tenantId: ObjectId (ref: Tenant, required),
  role: String [OWNER, ADMIN, MEMBER] (required),
  joinedAt: Date
}

// Project Schema
{
  tenantId: ObjectId (ref: Tenant, required),
  name: String (required),
  description: String,
  status: String [ACTIVE, ARCHIVED] (default: ACTIVE),
  createdBy: ObjectId (ref: User),
  createdAt: Date
}

// Task Schema
{
  tenantId: ObjectId (ref: Tenant, required),
  projectId: ObjectId (ref: Project, required),
  title: String (required),
  description: String,
  status: String [TODO, IN_PROGRESS, DONE] (default: TODO),
  priority: String [LOW, MEDIUM, HIGH] (default: MEDIUM),
  assignedTo: ObjectId (ref: User),
  createdBy: ObjectId (ref: User),
  createdAt: Date
}

// Subscription Schema
{
  tenantId: ObjectId (ref: Tenant, required),
  stripeSubscriptionId: String (unique, optional),
  stripeCustomerId: String (optional),
  plan: String [FREE, PRO] (default: FREE),
  status: String [ACTIVE, TRIALING, PAST_DUE, CANCELED, INCOMPLETE] (default: ACTIVE),
  currentPeriodEnd: Date
}

// Payment Schema
{
  tenantId: ObjectId (ref: Tenant, required),
  stripeInvoiceId: String (unique),
  amount: Number,
  currency: String,
  status: String,
  createdAt: Date
}
```

---

## 9. Entity Relationships
- **User ── (1:N) ── Membership ── (N:1) ── Tenant**  
  A User can have many Memberships, and each Membership connects them to a single Tenant.
- **Tenant ── (1:N) ── Project ── (1:N) ── Task**  
  A Tenant owns multiple Projects. A Project owns multiple Tasks.
- **Tenant ── (1:1) ── Subscription**  
  Each Tenant has exactly one Subscription record governing resource limits.
- **Tenant ── (1:N) ── Payment**  
  Each Tenant has zero or more Payment invoice records for billing reconciliation.
- **Task ── (N:1) ── User (assignedTo)**  
  A Task can be assigned to a single User who belongs to the tenant.

---

## 10. Authentication Architecture
Authentication will be handled using **Auth.js** (NextAuth.js v5) with a passwordless or credentials-based adapter (to be determined in the authentication phase).
- **Session Handling:** JSON Web Tokens (JWT) stored in secure, HTTP-only cookies.
- **Protected Routes:** Next.js middleware will intercept unauthorized requests to app routes and redirect them to `/login`.
- **Identity Context:** Auth.js session details (User ID, email, name, platformRole) will be exposed to server components and API route handlers.

---

## 11. Authorization Architecture
Authorization is evaluated sequentially on the server for every request targeting tenant-level data.

```
[Incoming Request]
        │
        ▼
Is User Authenticated? ──(No)──► [401 Unauthorized]
        │ (Yes)
        ▼
Verify Active Tenant Membership & Retrieve Role ──(None)──► [403 Forbidden]
        │ (Role: Owner/Admin/Member)
        ▼
Does Requested Resource belong to Active Tenant? ──(No)──► [404 Not Found / 403 Forbidden]
        │ (Yes)
        ▼
Does Tenant Role allow this specific Action? ──(No)──► [403 Forbidden]
        │ (Yes)
        ▼
Does Subscription Plan allow this operation (Limit)? ──(No)──► [403 Limit Exceeded (Upgrade CTA)]
        │ (Yes)
        ▼
[Execute Operation]
```

---

## 12. Free Plan & Limits
The Free plan serves to demonstrate SaaS limits and encourage conversions to the Pro tier.

- **Resource Limits:**
  - Maximum Tenant Members: `3`
  - Maximum Projects: `2`
  - Maximum Tasks per Project: `10`
- **Limit Gating Flow:**
  - When a user attempts to add a member, create a project, or add a task, the server calculates the current database count for that tenant.
  - If `currentCount >= limit`, the server blocks the write operation and returns a structured error:
    ```json
    {
      "status": "limit_reached",
      "limitType": "projects",
      "current": 2,
      "maxAllowed": 2,
      "message": "Project limit reached. Please upgrade to Pro to create unlimited projects."
    }
    ```
  - The client UI uses this structured response to display a modal or page with upgrade options and a call-to-action (CTA).

---

## 13. Pro Plan & Limits
The Pro plan unlocks higher limits and enhanced metrics.

- **Resource Limits:**
  - Maximum Tenant Members: `10`
  - Maximum Projects: `Unlimited` (represented as `Infinity` or `-1` in config)
  - Maximum Tasks per Project: `Unlimited`
- **Features Included:**
  - Standard Project/Task CRUD.
  - Project/Task assignment.
  - Full metrics and workspace activity feed.

---

## 14. Feature Gating Strategy
- **Centralized Config:** Limits must be defined in a single configuration file (`src/config/plans.ts`) rather than hardcoded into React components or API routes.
- **Server Enforcement:** Front-end flags may hide buttons or inputs for a smoother user experience, but authorization checks **must** be re-evaluated server-side prior to performing database writes.
- **Gating Helpers:** Reusable utility functions (e.g. `checkFeatureLimit(tenantId, limitType)`) will make limit checks concise in controllers.

---

## 15. Subscription Lifecycle
A workspace’s billing state is captured by its `Subscription` document:

1. **Provisioning (FREE):** Created automatically upon Tenant creation.
2. **Upgrading:** Initiated by clicking "Upgrade" which redirects the user to Stripe Checkout.
3. **Activation (PRO):** A Stripe Webhook processes the `checkout.session.completed` event and updates the subscription plan to `PRO` and status to `ACTIVE`.
4. **Maintenance:** Subscription states (`ACTIVE`, `TRIALING`, `PAST_DUE`, `CANCELED`) correspond to Stripe subscription billing cycles.
5. **Cancellation/Expiration:** If canceled, the subscription reverts to `FREE` once the period ends, causing features to degrade and enforcing limits (existing assets remain but new writes are locked).

---

## 16. Payment Architecture
Payments are handled securely using **Stripe Test Mode** integration.

- **Stripe Checkout:** Redirects the user to a secure hosted payment checkout page.
- **No Card Storage:** Card details are never handled, processed, or saved by the TeamFlow server.
- **Webhooks:** A server endpoint `/api/billing/webhook` handles events from Stripe (`invoice.payment_succeeded`, `customer.subscription.deleted`, `customer.subscription.updated`).
- **Reconciliation:** Webhooks authenticate Stripe signatures, extract the `tenantId` from metadata, and update the matching `Subscription` and `Payment` collections.

---

## 17. Application Route Plan

### Public Routes (No Auth)
- `/` — Landing page.
- `/features` — Marketing details.
- `/pricing` — Plan comparisons.

### Authentication Routes
- `/login` — Sign in page.
- `/register` — Account registration page.

### Authenticated App Routes (Requires Session & Active Tenant)
- `/dashboard` — Tenant dashboard showing metrics, charts, and recent activity.
- `/projects` — Project list.
- `/projects/[projectId]` — Project details page containing task boards.
- `/tasks` — Task list across all projects in the active workspace.
- `/team` — Member management page (Owner/Admin can invite/remove).
- `/billing` — Subscription dashboard showing current plan, limits, and billing history.
- `/settings` — Workspace configurations (Tenant name, settings).

### Platform Admin Routes (Requires PLATFORM_ADMIN platformRole)
- `/admin` — System metrics and summary.
- `/admin/users` — Global users list.
- `/admin/tenants` — Global organizations list.
- `/admin/subscriptions` — System subscriptions overview.

---

## 18. API Plan

### Authentication APIs
- `POST /api/auth/register` — Create user account.

### Tenant APIs
- `GET /api/tenants` — List tenants the user belongs to.
- `POST /api/tenants` — Create a new tenant (automatic owner membership).
- `POST /api/tenants/switch` — Switch the current active tenant (updates cookie).

### Membership APIs
- `GET /api/team` — List members in active tenant.
- `POST /api/team/invite` — Invite user to active tenant.
- `PATCH /api/team/role` — Update member role (Owner/Admin only).
- `DELETE /api/team/remove` — Remove member (Owner/Admin only).

### Project APIs
- `GET /api/projects` — List projects in active tenant.
- `POST /api/projects` — Create project (gated by subscription limit).
- `GET /api/projects/[projectId]` — Get project details.
- `PATCH /api/projects/[projectId]` — Update project details.
- `DELETE /api/projects/[projectId]` — Archive project.

### Task APIs
- `GET /api/tasks` — List tasks in project/tenant.
- `POST /api/tasks` — Create task in project (gated by project task limit).
- `PATCH /api/tasks/[taskId]` — Update task details or status.
- `DELETE /api/tasks/[taskId]` — Delete task.

### Billing APIs
- `GET /api/billing` — Get subscription details.
- `POST /api/billing/checkout` — Create a Stripe Checkout session.
- `POST /api/billing/webhook` — Stripe webhook handler (processes payment events).

### Platform Admin APIs
- `GET /api/admin/metrics` — View system-wide stats.
- `GET /api/admin/users` — List users globally.
- `GET /api/admin/tenants` — List tenants globally.

---

## 19. User Flows

### New User Onboarding
```
Guest ──► Registers Account ──► Creates Tenant ──► Owner Membership Created ──► Free Subscription Provisioned ──► Tenant Dashboard
```

### Tenant Switching
```
User (Tenant A Dashboard) ──► Clicks Tenant Switcher ──► Selects Tenant B ──► Server Validates Membership ──► Session Cookie Updated ──► Reloads with Tenant B Context
```

### Project Creation (Gated)
```
User Clicks "New Project" ──► Client Checks UI Limit ──► Sends POST Request ──► Server Counts Current Projects ──► Limit Exceeded?
                                                                                                               ├── (Yes) ──► Return 403 (Limit Reached) ──► Show Upgrade Modal
                                                                                                               └── (No)  ──► Create Project in DB ──► Show Success Toast
```

### Pro Upgrade Flow
```
User (Free Plan) ──► Clicks "Upgrade to Pro" ──► POST Checkout Session ──► Redirects to Stripe Checkout ──► Completes Test Payment ──► Stripe Sends Webhook ──► Server Activates Subscription ──► User Workspace Reloads as Pro
```

---

## 20. Phase Dependency Plan
The application must be built in this strict linear order to avoid breaking changes and regression issues:

1. **Phase 0:** Project Foundation & MongoDB Setup *(Completed)*
2. **Phase 1:** Architecture & Technical Specification *(Current Planning Phase)*
3. **Phase 2:** Mongoose Schemas & Models (User, Tenant, Membership, Project, Task, Subscription, Payment)
4. **Phase 3:** Authentication (Auth.js Setup, Register/Login/Logout Flow)
5. **Phase 4:** Multi-Tenant Context & Router Guarding (Tenant Selection, Middleware Guard, Server Verification Helpers)
6. **Phase 5:** Application Layout Shell & Dashboard UI (Navigation, Tenant Switcher, Dashboard Widgets)
7. **Phase 6:** Project CRUD API & UI (Creation, Archives, Filtering)
8. **Phase 7:** Task CRUD API & UI (Board Views, Task Creation, Assignment, Drag-and-Drop)
9. **Phase 8:** Team & Workspace Membership Management (Invites, Roles, Deletions)
10. **Phase 9:** Feature Gating & Limit Enforcement (Centralized plans, UI blocks, Server-side blockers)
11. **Phase 10:** Stripe Billing Integration & Webhook Handler (Checkout, Subscriptions, Payments)
12. **Phase 11:** Platform Admin Interface (Global monitoring, User/Tenant management)
13. **Phase 12:** Testing, Security Reviews, and UX Heuristic Auditing

---

## 21. Out of Scope Features (MVP Exclusions)
- **Real Financial Operations:** No actual money charging; only Stripe Test Mode cards allowed.
- **Invoicing & Taxes:** No formal PDF invoicing, tax calculations, or receipt templates.
- **Multiple Currencies:** System defaults exclusively to USD ($).
- **Asset/File Storage:** No project attachments, task uploads, or file management.
- **Real-Time WebSockets:** No live chat, push notifications, or cursor sharing.
- **Third-Party Integrations:** No Slack, Jira, or GitHub hooks.
- **Advanced Identity:** No SAML, Enterprise SSO, or multi-factor auth.
- **Custom RBAC:** No custom permission sets or customizable role creation.
