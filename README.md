# TeamFlow — Multi-Tenant SaaS Workspace & Task Management

TeamFlow is a production-ready, multi-tenant Software-as-a-Service (SaaS) application designed for structured project management, task collaboration, and team administration. Built with high-security tenant isolation, role-based access controls, and Stripe subscription gating.

---

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** NextAuth.js (Auth.js v5)
- **Form Handling & Validation:** Formik & Yup
- **Payments & Billing:** Stripe (Hosted Checkout & Webhooks)
- **Styling:** Tailwind CSS / Vanilla CSS
- **Deployment:** Vercel

---

## 📂 SaaS Architecture

TeamFlow uses a multi-tenant isolation pattern where all business data is strictly partitioned at the database layer.

### Workspace & Identity Scope
```
USER ──(registers)
  │
  └── MEMBERSHIP ──(belongs to)── TENANT (Workspace)
         │
         └── ROLE (OWNER, ADMIN, MEMBER) ──(determines)── AUTHORIZATION
```

* **Users** can own or join multiple **Tenants** (Workspaces) via **Memberships**.
* The **Role** assigned to a membership dictates the server-side **Authorization** checks.
* **Tenant Isolation** is enforced at the database level: every collection document carries a `tenantId` field, and all queries are strictly filtered by the active tenant ID.

### Subscription & Resource Scope
```
TENANT (Workspace)
  │
  └── SUBSCRIPTION (Local DB Doc) ──(synced via Stripe Webhook)
         │
         └── PLAN (FREE, PRO)
                │
                └── FEATURE LIMITS (Projects, Members, Tasks)
```

* **Billing belongs to the Tenant**, not the individual User.
* The Tenant's active **Subscription** is linked to a Stripe Customer ID.
* The subscription maps to a **Plan** (FREE or PRO) that governs resource limits.

---

## 🔒 Role Permissions Matrix

| Feature | OWNER | ADMIN | MEMBER |
| :--- | :---: | :---: | :---: |
| View Team Members | ✓ | ✓ | ✓ |
| Invite/Add New Members | ✓ | ✓ | ✗ |
| Remove `MEMBER` seats | ✓ | ✓ | ✗ |
| Remove `ADMIN` seats | ✓ | ✗ | ✗ |
| Manage Roles (Promote/Demote) | ✓ | ✗ | ✗ |
| View Billing & Limits | ✓ | ✓ | ✓ |
| Upgrade Workspace to Pro | ✓ | ✗ | ✗ |
| Manage Stripe Subscriptions | ✓ | ✗ | ✗ |
| Create Projects & Tasks | ✓ | ✓ | ✗ |

---

## 💳 Billing & Stripe Integration

1. **Free Tier:** Limited to **2 Projects**, **3 Team Members**, and **10 Tasks per project**.
2. **Pro Tier ($15/month):** Unlocks unlimited projects, members, and tasks.
3. **Billing Lifecycle (Stripe Webhook):**
   * **Stripe Checkout:** Initiates secure sessions via `/api/billing/checkout` (restricted to OWNERs).
   * **State Synchronization:** The `/api/billing/webhook` route listens for Stripe events to synchronize state:
     * `checkout.session.completed` $\rightarrow$ Activates Pro plan, saves Stripe subscription IDs.
     * `invoice.payment_succeeded` $\rightarrow$ Records transaction logs in the local `Payment` collection.
     * `customer.subscription.deleted` $\rightarrow$ Gracefully downgrades the workspace back to the Free plan (without deleting historical data).
     * `customer.subscription.updated` / `invoice.payment_failed` $\rightarrow$ Syncs period end dates and tags overdue statuses (`PAST_DUE`).
   * **Webhook Security:** Strictly validates Stripe signatures using the raw request payload buffer before updating the database.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- Node.js (v20+ or v22+)
- MongoDB (Local instance or Atlas connection URI)
- Stripe account (for Test Mode Keys)
- Stripe CLI (for webhook forwarding)

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb+srv://...
AUTH_SECRET=your_next_auth_secret_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Installation & Run commands
```bash
# 1. Install dependencies
npm install

# 2. Seed the FREE and PRO plans into your database
node scripts/seed-plans.js

# 3. Start Stripe webhook forwarding (in a separate terminal)
stripe listen --forward-to localhost:3000/api/billing/webhook

# 4. Start Next.js development server
npm run dev

# 5. Build for production compilation checks
npm run build
```

---

## ☁️ Vercel Deployment Guide

1. Push your linked Git repository to GitHub/GitLab.
2. Import the repository into your **Vercel Dashboard**.
3. Configure the 6 Environment Variables listed in the configuration section (keep server keys non-public).
4. Click **Deploy**.
5. Once deployed, copy your live domain (e.g. `https://teamflow-app.vercel.app`) and update the `NEXT_PUBLIC_APP_URL` variable in Vercel to match this live production domain.
6. Go to **Stripe Dashboard $\rightarrow$ Developers $\rightarrow$ Webhooks**, create a new webhook endpoint pointing to `https://your-domain.vercel.app/api/billing/webhook`, copy the webhook signing secret, and update Vercel's `STRIPE_WEBHOOK_SECRET` environment key.

---

## 🧪 Stripe Test Mode Instructions

1. Log in to your TeamFlow workspace as the **OWNER**.
2. Navigate to the **Billing** panel.
3. Verify that your current plan is displayed as **Free Plan**.
4. Click **Upgrade to Pro — $15/month**.
5. You will be redirected to the secure, Stripe-hosted hosted checkout portal.
6. Fill in the payment form using the Stripe test card:
   - **Card Number:** `4242 4242 4242 4242`
   - **Expiry:** Any future date (e.g., `12/28`)
   - **CVC:** Any 3 digits (e.g., `123`)
7. Click **Subscribe**.
8. After checkout completes, Stripe will redirect you back to `/billing?session=success`. The background Stripe Webhook will synchronize status in the database, instantly upgrading your dashboard view to **Pro Plan** with unlocked limits.

---

## 🎬 5-10 Minute Demonstration Flow

* **Step 1: Unauthenticated Landing** — Visit `/`. Verify that the middleware intercepts the guest access and redirects immediately to `/login`.
* **Step 2: User Sign Up & Tenant Creation** — Click register, sign up a new account, and name your workspace (e.g. "Acme Corp").
* **Step 3: Dashboard Limits Check** — Verify that the new workspace has the **Free Plan** active, showing progress meters capped at 2 projects, 10 tasks, and 3 team members.
* **Step 4: Create Projects (Free limit)** — Create two active projects ("Project Alpha", "Project Beta"). Try to create a third; verify that the app redirects to a "Project Limit Reached" alert screen.
* **Step 5: Create Tasks (Free limit)** — Open Project Alpha and add 10 tasks. Try to add an 11th; verify that the server-side block intercepts and blocks task creation.
* **Step 6: Team seats (Free limit)** — Navigate to Team page. Add two users. Try to add a third; verify that team seats are capped.
* **Step 7: Role verification (MEMBER)** — Log in as one of the newly added members. Open projects/tasks and notice they can view them, but all "Create" buttons are hidden and direct API calls are blocked.
* **Step 8: Pro Upgrade Flow** — Log back in as the OWNER. Go to Billing and click **Upgrade to Pro**.
* **Step 9: Complete Checkout** — Pay with the `4242` Stripe test card.
* **Step 10: Verified Upgrade** — Return to the dashboard. The plan status is now **Pro** and all project/task limits are fully unlocked.
* **Step 11: Tenant Isolation check** — Create a second tenant workspace ("Beta Labs"). Verify that Acme Corp projects and tasks do not bleed into the new workspace.

---

## 🎤 Core SaaS Architect Concepts (Interview Pitch)

* **Authentication:** NextAuth (Auth.js v5) handles token validation, caching credentials, and securing API endpoints.
* **Multi-Tenancy:** We partition organizational workspaces via `Tenant` models. Users belong to Tenants through `Memberships`, allowing a single user account to join multiple workspaces without duplicate authentication profiles.
* **RBAC:** Fine-grained authorization checks differentiate between `OWNER`, `ADMIN`, and `MEMBER` roles at the endpoint and view layer.
* **Stripe Billing:** Billing is workspace-scoped, not user-scoped. Webhooks serve as the single source of truth for payment reconciliation and subscription lifecycles.
* **Tenant Isolation:** Every read, create, update, or delete request strictly queries with `{ tenantId }` resolved server-side from session contexts to guarantee zero data bleed.
