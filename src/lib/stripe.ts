import Stripe from 'stripe';

import { validateEnv } from '@/lib/env-validator';

let _stripe: Stripe | null = null;

/**
 * Returns the Stripe singleton client, initializing it on first call.
 * Lazy initialization prevents the module from throwing at build time
 * when STRIPE_SECRET_KEY is not present in the build environment.
 */
function getStripe(): Stripe {
  validateEnv();

  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY environment variable is not defined. ' +
        'Add it to your .env.local file before using Stripe.'
    );
  }

  _stripe = new Stripe(key, {
    apiVersion: '2026-06-24.dahlia',
    typescript: true,
  });

  return _stripe;
}

export default getStripe;
