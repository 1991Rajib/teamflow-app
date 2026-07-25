import 'server-only';

const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'AUTH_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRO_PRICE_ID',
  'NEXT_PUBLIC_APP_URL',
];

/**
 * Validates that all required server-side environment variables are present.
 * Throws a clean, safe, generic error if any configurations are missing
 * to prevent leaking the names or details of variables to client errors.
 */
export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    // Log the details to the server console for debugging
    console.error(
      `[Env Validation Error] Missing required server configuration keys: ${missing.join(', ')}`
    );
    // Throw a generic error for safety
    throw new Error('Missing required server configuration.');
  }
}
