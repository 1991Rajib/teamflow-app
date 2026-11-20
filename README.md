# TeamFlow — Multi-Tenant SaaS Workspace & Project Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Billing-6772E5?style=flat&logo=stripe)](https://stripe.com/)

**TeamFlow** is an enterprise-grade, multi-tenant Software-as-a-Service (SaaS) platform built with **Next.js 16 (App Router)**, **TypeScript**, **MongoDB (Mongoose)**, **NextAuth.js v5**, and **Stripe**. It provides secure tenant isolation, role-based access control (RBAC), team workspaces, task tracking, and tiered subscription monetization.

---

## ✨ Features

### 🏢 Multi-Tenant Workspaces
- **Workspace Isolation:** Every resource (Projects, Tasks, Comments, Team Members) is partitioned strictly by `tenantId` at the database level to ensure zero data leakage between organizations.
- **Multi-Tenant Memberships:** A single user account can create or belong to multiple workspaces and seamlessly switch contexts without re-authenticating.
- **Custom Branding & Settings:** Workspaces support custom naming, logos, descriptions, and soft-delete/restore capabilities.

### 👥 Role-Based Access Control (RBAC)
- **Granular Permissions:** Pre-configured with three strict roles: `OWNER`, `ADMIN`, and `MEMBER`.
- **Permission Enforcement:** Checked both at the Next.js API layer (route handlers) and server-rendered view layer.
- **Secure Invitations:** Workspace owners and admins can invite team members via secure tokenized email links.

### 📋 Project & Task Management
- **Projects:** Organize work into isolated projects with status, descriptions, and progress indicators.
- **Task Collaboration:** Rich task creation with assignees, due dates, priority tiers (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and status workflows (`TODO`, `IN_PROGRESS`, `DONE`).
- **Discussion & Comments:** Comment threads per task for direct team collaboration.
- **Filtering & Search:** Real-time client-side and server-side filtering by assignee, status, priority, and keywords.

### 💳 Stripe Subscription Billing & Gating
- **Tiered Model:**
  - **Free Tier:** Default for all new workspaces (capped at 2 Projects, 3 Members, 10 Tasks per project).
  - **Pro Tier ($15/month):** Unlocks unlimited projects, unlimited team members, and unlimited tasks.
- **Hosted Stripe Checkout:** Clean checkout redirection powered by Stripe Customer Sessions.
- **Webhook Reconciliation:** Synchronizes subscription status (`checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`, `customer.subscription.updated`).
- **Graceful Downgrade:** Preserves historical data if an account downgrades to Free.

### 🛡️ Platform Admin Dashboard
- **System Overview:** Platform-level analytics, active tenants, total users, and revenue trends.
- **Tenant Management:** View all workspaces, inspect membership health, and suspend or manage tenants.
- **Activity Logs:** Audit trail tracking high-level platform events and billing actions.

### 🎨 Modern UI & UX
- **Theming:** Full Dark Mode and Light Mode support with smooth transition animations.
- **Responsive Design:** Optimized for mobile, tablet, and desktop viewports with a collapsible sidebar.
- **Feedback & Usability:** Instant visual feedback, skeleton loading states, empty states, and error boundary handling.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Frontend:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/), [GSAP](https://greensock.com/gsap/)
- **Backend:** Next.js Route Handlers & Server Actions
- **Database & ODM:** [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Authentication:** [NextAuth.js (v5 / Auth.js)](https://authjs.dev/) with `bcryptjs`
- **Forms & Validation:** [Formik](https://formik.org/) & [Yup](https://github.com/jquense/yup)
- **Payments:** [Stripe API & Webhooks](https://stripe.com/docs/api)
- **Email Delivery:** [Nodemailer](https://nodemailer.com/) (Resend SMTP)

---

## 📐 Architecture & Data Model

```
       +--------------------------------------------------+
       |                   USER ACCOUNT                   |
       |             (Global Auth & Identity)             |
       +-------------------------+------------------------+
                                 |
                                 | 1..* Memberships
                                 v
       +--------------------------------------------------+
       |               TENANT (Workspace)                 |
       |  - tenantId (enforces query isolation boundary)  |
       |  - Subscription (Free / Pro)                     |
       +-------+-------------------+------------------+---+
               |                   |                  |
      1..*     |          1..*     |         1..*     |
               v                   v                  v
     +-------------------+ +---------------+ +-----------------+
     |      PROJECTS     | |  INVITATIONS  | |  NOTIFICATIONS  |
     +---------+---------+ +---------------+ +-----------------+
               |
      1..*     |
               v
     +-------------------+
     |       TASKS       |
     +---------+---------+
               |
      1..*     |
               v
     +-------------------+
     |     COMMENTS      |
     +-------------------+
```

### Role Permissions Matrix

| Capability | OWNER | ADMIN | MEMBER |
|:---|:---:|:---:|:---:|
| View Projects & Tasks | ✅ | ✅ | ✅ |
| Create & Edit Tasks | ✅ | ✅ | ✅ |
| Create Projects | ✅ | ✅ | ❌ |
| Invite Members | ✅ | ✅ | ❌ |
| Remove Members | ✅ | ✅ | ❌ |
| Promote / Demote Roles | ✅ | ❌ | ❌ |
| Upgrade to Pro / Stripe Portal | ✅ | ❌ | ❌ |
| Delete / Rename Workspace | ✅ | ❌ | ❌ |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v20+ or v22+ recommended)
- **npm** or **pnpm**
- **MongoDB** instance (Local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Stripe Account** (for API keys in test mode)
- *(Optional)* [Stripe CLI](https://stripe.com/docs/stripe-cli) for testing webhooks locally

### 2. Clone Repository & Install Dependencies
```bash
git clone https://github.com/1991Rajib/teamflow-app.git
cd teamflow-app
npm install
```

### 3. Configure Environment Variables
Copy the example environment configuration:
```bash
cp .env.example .env.local
```

Fill in your configuration values in `.env.local`:
```env
# MongoDB Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/teamflow?retryWrites=true&w=majority

# NextAuth Secret (Generate via `openssl rand -hex 32`)
AUTH_SECRET=your_auth_secret_key

# Public App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe Credentials
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...

# SMTP / Email Configuration (e.g. Resend)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASSWORD=your_resend_api_key
EMAIL_FROM="TeamFlow <onboarding@resend.dev>"
```

### 4. Seed Plans in MongoDB
Initialize the default **Free** and **Pro** subscription tiers:
```bash
node scripts/seed-plans.js
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💳 Stripe Webhook Testing (Local Development)

To test Stripe billing and automated subscription synchronization locally:

1. Log in to the Stripe CLI:
   ```bash
   stripe login
   ```
2. Forward events to your local API route:
   ```bash
   stripe listen --forward-to localhost:3000/api/billing/webhook
   ```
3. Copy the webhook signing secret printed by the CLI (`whsec_...`) into `STRIPE_WEBHOOK_SECRET` in `.env.local`.
4. Trigger checkout in the app and test upgrades using the standard Stripe test card `4242 4242 4242 4242`.

---

## 📦 Project Structure

```
teamflow-app/
├── public/                 # Static assets & dashboard previews
├── scripts/                # Database seeds & setup utilities
├── src/
│   ├── app/                # Next.js 16 App Router
│   │   ├── (admin)/        # Platform admin console routes
│   │   ├── (app)/          # Protected workspace routes (dashboard, projects, tasks, billing, team)
│   │   ├── (auth)/         # Auth pages (login, register)
│   │   ├── api/            # Route Handlers (auth, billing, tasks, projects, team, tenants)
│   │   └── onboarding/     # Initial workspace creation flow
│   ├── components/         # Reusable UI components & dialogs
│   ├── config/             # Plan configurations & resource limits
│   ├── lib/                # Database connection, auth helpers, Stripe client, email service
│   ├── models/             # Mongoose schemas (Tenant, User, Project, Task, Subscription, etc.)
│   ├── types/              # TypeScript declarations
│   ├── middleware.ts       # Route protection & session interception
│   └── auth.ts             # NextAuth configuration
├── .env.example            # Environment template
├── next.config.ts          # Next.js config
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies and scripts
```

---

## 📜 Available Scripts

| Command | Description |
|:---|:---|
| `npm run dev` | Starts the Next.js development server with Turbopack |
| `npm run build` | Builds the production-optimized application |
| `npm run start` | Runs the compiled production server |
| `npm run lint` | Runs ESLint checks across the codebase |

---

## ☁️ Deployment

TeamFlow is optimized for zero-configuration deployment on **Vercel**:
1. Push your repository to GitHub.
2. Import the project on [Vercel](https://vercel.com).
3. Add all environment variables from `.env.example`.
4. Deploy and set up your production Stripe webhook pointing to `https://your-domain.com/api/billing/webhook`.

---

## 📄 License

This project is licensed under the MIT License.
