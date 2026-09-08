import assert from 'node:assert/strict';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { requireRole } from '../src/middleware/roleMiddleware.js';

test('officer verification is required for officer-only and shared resources', () => {
  for (const roles of [['agricultureOfficer'], ['farmer', 'agricultureOfficer']]) {
    for (const isVerified of [undefined, false, true]) {
      let allowed = false;
      let status;
      const response = { status(code) { status = code; return this; }, json() { return this; } };
      requireRole(...roles)({ user: { role: 'agricultureOfficer', isVerified } }, response, () => { allowed = true; });
      assert.equal(allowed, isVerified === true);
      if (!allowed) assert.equal(status, 403);
    }
  }
});

test('admin API enforces authentication, roles and mutation validation', async () => {
  const originalFindById = User.findById;
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-only-admin-secret';
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const token = jwt.sign({ sub: '507f1f77bcf86cd799439011' }, process.env.JWT_SECRET);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  try {
    assert.equal((await fetch(`${base}/admin/overview`)).status, 401);
    for (const role of ['farmer', 'buyer', 'driver', 'agricultureOfficer']) {
      User.findById = async () => ({ role, isActive: true });
      assert.equal((await fetch(`${base}/admin/users`, { headers })).status, 403);
    }
    User.findById = async () => ({ role: 'admin', isActive: false });
    assert.equal((await fetch(`${base}/admin/users`, { headers })).status, 401);
    User.findById = async () => ({ role: 'admin', isActive: true });
    assert.equal((await fetch(`${base}/admin/users/507f1f77bcf86cd799439011/verification`, { method: 'PATCH', headers, body: JSON.stringify({ isVerified: 'true' }) })).status, 400);
    User.findById = async () => ({ role: 'agricultureOfficer', isActive: true, isVerified: false });
    for (const path of ['officer-profile', 'requests', 'notices', 'quality-guidelines', 'surplus-advisories', 'reported-listings', 'reports/overview']) {
      assert.equal((await fetch(`${base}/advisory/${path}`, { headers })).status, 403);
    }
    assert.equal((await fetch(`${base}/admin/users/507f1f77bcf86cd799439011/verification`, { method: 'PATCH', headers, body: JSON.stringify({ isVerified: true }) })).status, 403);
    User.findById = async () => ({ role: 'admin', isActive: true });
    assert.equal((await fetch(`${base}/admin/users/invalid`, { method: 'PATCH', headers, body: JSON.stringify({ isActive: false }) })).status, 400);
    assert.equal((await fetch(`${base}/admin/users/507f1f77bcf86cd799439011`, { method: 'PATCH', headers, body: JSON.stringify({ isActive: 'false' }) })).status, 400);
    assert.equal((await fetch(`${base}/admin/products/507f1f77bcf86cd799439011`, { method: 'PATCH', headers, body: JSON.stringify({ status: 'sold' }) })).status, 400);
    assert.equal((await fetch(`${base}/auth/register`, { method: 'POST', headers, body: JSON.stringify({ name: 'Admin', email: 'admin@example.com', password: 'test-password', role: 'admin' }) })).status, 400);
  } finally {
    User.findById = originalFindById;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
    await new Promise((resolve) => server.close(resolve));
  }
});
