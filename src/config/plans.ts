/**
 * Centralized plan configuration for TeamFlow.
 * This is the single source of truth for all plan limits.
 * Never hardcode limits in API routes or UI components — always import from here.
 */

export const PLAN_CODES = {
  FREE: 'FREE',
  PRO: 'PRO',
} as const;

export type PlanCode = keyof typeof PLAN_CODES;

export type PlanLimits = {
  maxMembers: number; // -1 = unlimited
  maxProjects: number; // -1 = unlimited
  maxTasksPerProject: number; // -1 = unlimited
};

export const PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  FREE: {
    maxMembers: 3,
    maxProjects: 2,
    maxTasksPerProject: 10,
  },
  PRO: {
    maxMembers: 10,
    maxProjects: -1,
    maxTasksPerProject: -1,
  },
};

export type LimitType = keyof PlanLimits;

export const PLAN_META: Record<
  PlanCode,
  {
    name: string;
    price: number;
    billingInterval: string;
    features: string[];
  }
> = {
  FREE: {
    name: 'Free Plan',
    price: 0,
    billingInterval: 'NONE',
    features: [
      'Up to 3 workspace members',
      'Up to 2 active projects',
      'Up to 10 tasks per project',
      'Basic workspace dashboard',
      'Project & task management',
    ],
  },
  PRO: {
    name: 'Pro Plan',
    price: 15,
    billingInterval: 'MONTHLY',
    features: [
      'Up to 10 workspace members',
      'Unlimited projects',
      'Unlimited tasks per project',
      'Full workspace dashboard',
      'Priority support',
    ],
  },
};

/**
 * Returns true if the given limit value represents "unlimited" (-1 sentinel).
 */
export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

/**
 * Returns a human-readable string for a limit value.
 * e.g. -1 → "Unlimited", 10 → "10"
 */
export function formatLimit(limit: number): string {
  return isUnlimited(limit) ? 'Unlimited' : String(limit);
}
