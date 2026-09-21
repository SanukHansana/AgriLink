const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

test('offline updates retain operation IDs, sync in order, and stop on conflicts without leaking accounts', async () => {
  const storage = new Map();
  const asyncStorage = { getItem: async (key) => storage.get(key) ?? null, setItem: async (key, value) => storage.set(key, value), getAllKeys: async () => [...storage.keys()] };
  const source = fs.readFileSync('src/services/offline-driver.ts', 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const moduleObject = { exports: {} };
  new Function('require', 'module', 'exports', js)((name) => name === '@react-native-async-storage/async-storage' ? asyncStorage : require(name), moduleObject, moduleObject.exports);
  const offline = moduleObject.exports;
  let reachable = false, conflict = false;
  const sent = [];
  const client = {
    interceptors: { request: { use() {} }, response: { use() {} } },
    patch: async (path, data) => {
      if (!reachable) throw { isAxiosError: true, code: 'ERR_NETWORK' };
      if (conflict) throw { isAxiosError: true, response: { status: 409, data: { message: 'Trip already reassigned' } } };
      sent.push({ path, data }); return { data: { job: {} } };
    },
  };
  offline.installOfflineDriver(client); offline.setOfflineOwner('driver-one');
  assert.equal((await offline.sendDriverUpdate('patch', '/drivers/jobs/trip/stops', { kind: 'pickup', index: 0 })).queued, true);
  await offline.sendDriverUpdate('patch', '/drivers/jobs/trip/status', { status: 'inTransit' });
  const pending = await offline.pendingUpdates();
  assert.equal(pending.length, 2);
  offline.setOfflineOwner('driver-two');
  await offline.syncDriverUpdates(); assert.equal(sent.length, 0);
  assert.equal((await offline.pendingUpdates()).length, 0);
  offline.setOfflineOwner('driver-one'); reachable = true;
  await offline.syncDriverUpdates();
  assert.deepEqual(sent.map((entry) => entry.path), ['/drivers/jobs/trip/stops', '/drivers/jobs/trip/status']);
  assert.equal(sent[0].data.operationId, pending[0].id);
  assert.equal((await offline.pendingUpdates()).length, 0);
  reachable = false;
  await offline.sendDriverUpdate('patch', '/drivers/jobs/trip/status', { status: 'delivered' });
  reachable = true; conflict = true;
  await offline.syncDriverUpdates();
  const rejected = await offline.pendingUpdates();
  assert.equal(rejected[0].conflict, 'Trip already reassigned');
  await offline.reviewPending(rejected[0].id, true);
  assert.equal((await offline.pendingUpdates()).length, 0);
});
