import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getActiveTenantContext } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import { getTenantSubscription } from '@/lib/subscription';
import { PLAN_META, PLAN_LIMITS, formatLimit, isUnlimited } from '@/config/plans';
import Membership from '@/models/Membership';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Payment from '@/models/Payment';
import BillingStatus from './BillingStatus';
import {
  CreditCard,
  CheckCircle,
  Zap,
  Users,
  FolderKanban,
  ListTodo,
  Crown,
  Lock,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Receipt,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────

export const metadata = {
  title: 'Billing & Subscription — TeamFlow',
  description: 'Manage your workspace subscription plan, usage, and billing history.',
};

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default async function BillingPage() {
  const context = await getActiveTenantContext();
  if (!context) redirect('/onboarding');

  const { tenant, role } = context;
  const isOwner = role === 'OWNER';

  await dbConnect();

  // Retrieve active project IDs to filter out tasks belonging to archived projects from usage metrics
  const activeProjects = await Project.find({ tenantId: tenant.id, status: 'ACTIVE' }, '_id');
  const activeProjectIds = activeProjects.map((p) => p._id);

  // Fetch subscription data + usage in parallel
  const [{ subscription, planCode, limits }, memberCount, projectCount, taskCount, payments] =
    await Promise.all([
      getTenantSubscription(tenant.id),
      Membership.countDocuments({ tenantId: tenant.id, status: 'ACTIVE' }),
      Project.countDocuments({ tenantId: tenant.id, status: 'ACTIVE' }),
      Task.countDocuments({ tenantId: tenant.id, projectId: { $in: activeProjectIds } }),
      Payment.find({ tenantId: tenant.id }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

  const planName = planCode === 'PRO' ? 'Pro Plan' : 'Free Plan';
  const isPro = planCode === 'PRO';


  const currentPeriodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : null;

  return (
    <div className="flex flex-col gap-8 font-sans text-slate-900 dark:text-slate-200 max-w-7xl mx-auto">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-200">Billing &amp; Subscription</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage your plan, view usage, and review payment history.
            </p>
          </div>
        </div>
      </div>

      {/* ── Client Component: Notifications + Upgrade Button ─────────────── */}
      <Suspense fallback={null}>
        <BillingStatus planCode={planCode} isOwner={isOwner} />
      </Suspense>

      {/* ── Non-owner billing note ────────────────────────────────────────── */}
      {!isOwner && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 text-sm">
          <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-500" aria-hidden="true" />
          <p>
            Billing and subscription changes can only be made by the workspace{' '}
            <span className="text-slate-700 dark:text-slate-300 font-medium">Owner</span>. Contact your workspace
            owner to upgrade or manage the plan.
          </p>
        </div>
      )}

      {/* ── Current Plan Banner ───────────────────────────────────────────── */}
      <section
        aria-label="Current subscription plan"
        className={`rounded-2xl p-6 border flex flex-col sm:flex-row sm:items-center gap-5 shadow-lg ${isPro
            ? 'bg-gradient-to-br from-violet-900/30 to-indigo-900/20 border-violet-500/30'
            : 'bg-white dark:bg-[#1e293b]/40 border-slate-200 dark:border-slate-800/80'
          }`}
      >
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isPro
              ? 'bg-violet-500/20 border border-violet-500/30 text-violet-300'
              : 'bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400'
            }`}
        >
          {isPro ? (
            <Crown className="w-6 h-6" aria-hidden="true" />
          ) : (
            <Zap className="w-6 h-6" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-200">{planName}</h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${isPro
                  ? 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/30'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600/60'
                }`}
            >
              {isPro ? 'Active' : 'Free'}
            </span>
            {subscription?.cancelAtPeriodEnd && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                Cancels at period end
              </span>
            )}
            {subscription?.status === 'PAST_DUE' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                Payment overdue
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isPro
              ? `$${PLAN_META.PRO.price}/month · billed monthly`
              : 'No charge · Free forever for small teams'}
          </p>
          {isPro && currentPeriodEnd && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" aria-hidden="true" />
              {subscription?.cancelAtPeriodEnd
                ? `Access expires ${currentPeriodEnd}`
                : `Renews on ${currentPeriodEnd}`}
            </p>
          )}
        </div>

        {isPro && (
          <div className="sm:text-right">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-200">${PLAN_META.PRO.price}</p>
            <p className="text-xs text-slate-400">per month</p>
          </div>
        )}
      </section>

      {/* ── Cancel At Period End Warning ───────────────────────────────────── */}
      {subscription?.cancelAtPeriodEnd && currentPeriodEnd && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm">
            Your Pro subscription is scheduled to cancel on{' '}
            <span className="font-semibold">{currentPeriodEnd}</span>. After this date, the
            workspace will revert to the Free plan limits.
          </p>
        </div>
      )}

      {/* ── Usage Metrics ─────────────────────────────────────────────────── */}
      <section aria-label="Current plan usage">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">Usage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UsageCard
            label="Team Members"
            icon={<Users className="w-4 h-4" />}
            current={memberCount}
            max={limits.maxMembers}
            color="emerald"
          />
          <UsageCard
            label="Active Projects"
            icon={<FolderKanban className="w-4 h-4" />}
            current={projectCount}
            max={limits.maxProjects}
            color="indigo"
          />
          <UsageCard
            label="Total Tasks"
            icon={<ListTodo className="w-4 h-4" />}
            current={taskCount}
            max={limits.maxTasksPerProject}
            color="indigo"
            footnote="Per project limit"
          />
        </div>
      </section>

      {/* ── Plan Comparison ───────────────────────────────────────────────── */}
      <section aria-label="Available plans">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 font-sans">
          {/* FREE Plan Card */}
          <PlanCard
            code="FREE"
            name="Free"
            price={0}
            features={PLAN_META.FREE.features}
            limits={PLAN_LIMITS.FREE}
            isCurrent={!isPro}
            isHighlighted={false}
          />

          {/* PRO Plan Card */}
          <PlanCard
            code="PRO"
            name="Pro"
            price={PLAN_META.PRO.price}
            features={PLAN_META.PRO.features}
            limits={PLAN_LIMITS.PRO}
            isCurrent={isPro}
            isHighlighted={true}
          />
        </div>
      </section>

      {/* ── Payment History ───────────────────────────────────────────────── */}
      <section aria-label="Billing and payment history">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-slate-400" aria-hidden="true" />
          Payment History
        </h2>

        {payments.length === 0 ? (
          <div className="bg-white dark:bg-[#1e293b]/25 border border-slate-200 dark:border-slate-800/80 rounded-xl p-8 flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center text-slate-500">
              <Receipt className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No payments yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Invoices will appear here once you upgrade to Pro.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1e293b]/25 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/60">
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, i) => (
                  <tr
                    key={payment._id.toString()}
                    className={`${i !== payments.length - 1 ? 'border-b border-slate-200 dark:border-slate-800/40' : ''} hover:bg-slate-50 dark:hover:bg-slate-800/20 transition`}
                  >
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {new Date(payment.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-200">
                      ${payment.amount.toFixed(2)}{' '}
                      <span className="text-xs text-slate-500 font-normal uppercase">
                        {payment.currency}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Help / Documentation note ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/25 border border-slate-200 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 text-xs">
        <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" aria-hidden="true" />
        <p>
          Billing is powered by{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">Stripe (Test Mode)</span>. No real charges
          are made. For billing inquiries, contact your workspace owner.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

type Color = 'emerald' | 'indigo' | 'amber';

const colorMap: Record<Color, { icon: string; bar: string; barFill: string; label: string }> = {
  emerald: {
    icon: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400',
    bar: 'bg-slate-100 dark:bg-slate-800/60',
    barFill: 'bg-emerald-500',
    label: 'text-emerald-600 dark:text-emerald-400',
  },

  indigo: {
    icon: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 dark:text-indigo-400',
    bar: 'bg-slate-100 dark:bg-slate-800/60',
    barFill: 'bg-indigo-500',
    label: 'text-indigo-600 dark:text-indigo-400',
  },
  amber: {
    icon: 'bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-400',
    bar: 'bg-slate-100 dark:bg-slate-800/60',
    barFill: 'bg-amber-500',
    label: 'text-amber-600 dark:text-amber-400',
  },
};

function UsageCard({
  label,
  icon,
  current,
  max,
  color,
  footnote,
}: {
  label: string;
  icon: React.ReactNode;
  current: number;
  max: number;
  color: Color;
  footnote?: string;
}) {
  const unlimited = isUnlimited(max);
  const percentage = unlimited ? 0 : Math.min(Math.round((current / max) * 100), 100);
  const c = colorMap[color];

  // Color the bar based on usage level
  let barFillColor = c.barFill;
  if (!unlimited && percentage >= 100) barFillColor = 'bg-red-500';
  else if (!unlimited && percentage >= 80) barFillColor = 'bg-amber-500';

  return (
    <div className="bg-white dark:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 flex flex-col gap-3 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center border ${c.icon}`}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-200">{current}</span>
        <span className="text-sm text-slate-400 pb-1">
          / {unlimited ? '∞' : max}
        </span>
      </div>
      {!unlimited && (
        <div className="w-full">
          <div
            className={`w-full h-1.5 rounded-full ${c.bar}`}
            role="progressbar"
            aria-valuenow={current}
            aria-valuemax={max}
            aria-label={`${label} usage`}
          >
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${barFillColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-slate-500">{percentage}% used</span>
            {!unlimited && current >= max && (
              <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold">Limit reached</span>
            )}
          </div>
        </div>
      )}
      {unlimited && (
        <span className="text-xs text-slate-500">Unlimited</span>
      )}
      {footnote && <p className="text-[11px] text-slate-600 -mt-1">{footnote}</p>}
    </div>
  );
}

function PlanCard({
  code,
  name,
  price,
  features,
  limits,
  isCurrent,
  isHighlighted,
}: {
  code: 'FREE' | 'PRO';
  name: string;
  price: number;
  features: string[];
  limits: typeof PLAN_LIMITS['FREE'];
  isCurrent: boolean;
  isHighlighted: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl p-6 border flex flex-col gap-5 shadow-lg transition ${isHighlighted
          ? 'bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/30 dark:to-indigo-900/10 border-indigo-200 dark:border-indigo-500/30 shadow-indigo-500/10 dark:shadow-indigo-900/20'
          : 'bg-white dark:bg-[#1e293b]/40 border-slate-200 dark:border-slate-800/80'
        }`}
    >
      {isHighlighted && (
        <div className="absolute top-4 right-4">
          <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
            Most Popular
          </span>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200">{name}</h3>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-200">${price}</span>
          {price > 0 && <span className="text-sm text-slate-500 dark:text-slate-400">/month</span>}
          {price === 0 && <span className="text-sm text-slate-500 dark:text-slate-400">forever</span>}
        </div>
      </div>

      {/* Resource Limits Summary */}
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Users className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" aria-hidden="true" />
          <span>
            <strong className="text-slate-900 dark:text-slate-200">{formatLimit(limits.maxMembers)}</strong> workspace
            members
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <FolderKanban className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" aria-hidden="true" />
          <span>
            <strong className="text-slate-900 dark:text-slate-200">{formatLimit(limits.maxProjects)}</strong> projects
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <ListTodo className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" aria-hidden="true" />
          <span>
            <strong className="text-slate-900 dark:text-slate-200">{formatLimit(limits.maxTasksPerProject)}</strong>{' '}
            tasks per project
          </span>
        </div>
      </div>

      {/* Feature List */}
      <ul className="flex flex-col gap-2" aria-label={`${name} plan features`}>
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            <CheckCircle
              className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            {feature}
          </li>
        ))}
      </ul>

      {/* Plan CTA / Status */}
      <div className="mt-auto pt-2">
        {isCurrent ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400">
            <CheckCircle className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            Current Plan
          </span>
        ) : code === 'PRO' ? (
          <p className="text-xs text-slate-400">
            Use the <strong className="text-slate-700 dark:text-slate-300">Upgrade to Pro</strong> button above to
            switch to this plan.
          </p>
        ) : null}
      </div>
    </div>
  );
}

type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<PaymentStatus, { label: string; className: string }> = {
    SUCCEEDED: {
      label: 'Paid',
      className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    },
    PENDING: {
      label: 'Pending',
      className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20',
    },
    FAILED: {
      label: 'Failed',
      className: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20',
    },
    REFUNDED: {
      label: 'Refunded',
      className: 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600/40',
    },
  };

  const config = map[status as PaymentStatus] ?? {
    label: status,
    className: 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600/40',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${config.className}`}>
      {config.label}
    </span>
  );
}
