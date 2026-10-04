// Production demos must opt in explicitly; individual feature switches still take precedence.
export function simulatedBillingEnabled(featureFlag, env = process.env) {
  if (env[featureFlag] === 'false') return false;
  return env.NODE_ENV !== 'production' || env.SIMULATED_PAYMENTS_ENABLED === 'true';
}
