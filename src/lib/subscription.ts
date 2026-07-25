import 'server-only';
import dbConnect from '@/lib/db/mongoose';
import Subscription, { ISubscription } from '@/models/Subscription';
import Plan, { IPlan } from '@/models/Plan';
import { PLAN_LIMITS, PLAN_CODES, PlanCode, LimitType, isUnlimited } from '@/config/plans';
import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SubscriptionWithPlan = {
  subscription: (ISubscription & { _id: mongoose.Types.ObjectId }) | null;
  plan: IPlan | null;
  planCode: PlanCode;
  limits: (typeof PLAN_LIMITS)[PlanCode];
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches the active subscription for a tenant and resolves it with plan limits.
 * If no subscription document exists, defaults to FREE plan limits.
 *
 * @param tenantId - The tenant ObjectId as a string.
 */
export async function getTenantSubscription(tenantId: string): Promise<SubscriptionWithPlan> {
  await dbConnect();

  const subscription = await Subscription.findOne({ tenantId }).populate('planId');

  if (!subscription) {
    // No subscription found — treat as FREE (graceful fallback)
    return {
      subscription: null,
      plan: null,
      planCode: 'FREE',
      limits: PLAN_LIMITS.FREE,
    };
  }

  const plan = subscription.planId as unknown as IPlan;
  const planCode: PlanCode =
    plan?.code && Object.values(PLAN_CODES).includes(plan.code as PlanCode)
      ? (plan.code as PlanCode)
      : 'FREE';

  return {
    subscription: subscription as ISubscription & { _id: mongoose.Types.ObjectId },
    plan,
    planCode,
    limits: PLAN_LIMITS[planCode],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature Gating
// ─────────────────────────────────────────────────────────────────────────────

export type LimitReachedError = {
  type: 'LIMIT_REACHED';
  limitType: LimitType;
  current: number;
  maxAllowed: number;
  message: string;
};

/**
 * Checks whether the tenant has exceeded the plan limit for a given resource type.
 *
 * Returns a LimitReachedError object if the limit is exceeded, or null if the operation is allowed.
 * Unlimited plans (-1) always pass.
 *
 * @param tenantId     - Active tenant ID string
 * @param limitType    - Which resource limit to check ('maxProjects', 'maxTasksPerProject', 'maxMembers')
 * @param currentCount - The current number of existing resources (queried before calling this)
 */
export async function checkPlanLimit(
  tenantId: string,
  limitType: LimitType,
  currentCount: number
): Promise<LimitReachedError | null> {
  const { limits, planCode } = await getTenantSubscription(tenantId);
  const maxAllowed = limits[limitType];

  // Unlimited plans are never blocked
  if (isUnlimited(maxAllowed)) {
    return null;
  }

  if (currentCount >= maxAllowed) {
    const resourceLabels: Record<LimitType, string> = {
      maxProjects: 'projects',
      maxTasksPerProject: 'tasks per project',
      maxMembers: 'workspace members',
    };
    const upgradeLabel = resourceLabels[limitType];

    return {
      type: 'LIMIT_REACHED',
      limitType,
      current: currentCount,
      maxAllowed,
      message:
        planCode === 'FREE'
          ? `${capitalizeFirst(upgradeLabel)} limit reached (${currentCount}/${maxAllowed}). Upgrade to Pro to unlock more ${upgradeLabel}.`
          : `${capitalizeFirst(upgradeLabel)} limit reached (${currentCount}/${maxAllowed}).`,
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves the FREE plan document from the database.
 * Used during Stripe subscription cancellation to revert a tenant back to FREE.
 */
export async function getFreePlanDoc(): Promise<IPlan | null> {
  await dbConnect();
  return Plan.findOne({ code: 'FREE', isActive: true });
}

/**
 * Retrieves the PRO plan document from the database.
 * Used during Stripe checkout completion to activate PRO.
 */
export async function getProPlanDoc(): Promise<IPlan | null> {
  await dbConnect();
  return Plan.findOne({ code: 'PRO', isActive: true });
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
