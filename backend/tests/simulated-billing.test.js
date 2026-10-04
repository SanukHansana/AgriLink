import assert from 'node:assert/strict';
import { test } from 'node:test';
import { simulatedBillingEnabled } from '../src/services/simulated-billing.js';
test('production simulation requires explicit opt-in for orders and subscriptions', () => {
  for (const flag of ['MOCK_PAYMENTS_ENABLED', 'MOCK_SUBSCRIPTIONS_ENABLED']) {
    assert.equal(simulatedBillingEnabled(flag, { NODE_ENV: 'production' }), false);
    assert.equal(simulatedBillingEnabled(flag, { NODE_ENV: 'production', SIMULATED_PAYMENTS_ENABLED: 'true' }), true);
    assert.equal(simulatedBillingEnabled(flag, { NODE_ENV: 'production', SIMULATED_PAYMENTS_ENABLED: 'true', [flag]: 'false' }), false);
    assert.equal(simulatedBillingEnabled(flag, { NODE_ENV: 'production', SIMULATED_PAYMENTS_ENABLED: 'false' }), false);
    assert.equal(simulatedBillingEnabled(flag, { NODE_ENV: 'development' }), true);
  }
});
