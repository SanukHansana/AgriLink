import assert from 'node:assert/strict';
import { test } from 'node:test';
import { officerDistrict, requestScope, assertOfficerOwnsRequest, districtPattern, safeAttachmentUrl } from '../src/services/officer-access.js';
import { tradePipeline } from '../src/services/advisory-analytics.js';

const officer = { _id: 'officer', role: 'agricultureOfficer', isVerified: true, officerDistrict: 'Kandy (East)' };
test('verified officers require an administrator-assigned district and cannot take another officer case', () => {
  assert.throws(() => officerDistrict({ ...officer, isVerified: false }), /Verified officer/);
  assert.throws(() => officerDistrict({ ...officer, officerDistrict: undefined }), /assign your service district/);
  assert.equal(districtPattern(officer.officerDistrict).test('kandy (east)'), true);
  assert.equal(districtPattern(officer.officerDistrict).test('Kandy East'), false);
  assert.deepEqual(requestScope({ role: 'farmer', _id: 'farmer' }), { farmer: 'farmer' });
  const record = { status: 'pending', farmLocation: { district: 'Kandy (East)' } };
  assert.doesNotThrow(() => assertOfficerOwnsRequest(officer, record));
  assert.throws(() => assertOfficerOwnsRequest(officer, { ...record, assignedOfficer: 'other' }), /another officer/);
  assert.throws(() => assertOfficerOwnsRequest(officer, { ...record, farmLocation: { district: 'Colombo' } }), /outside/);
  assert.throws(() => assertOfficerOwnsRequest(officer, { ...record, status: 'resolved' }), /closed/);
});

test('document links exclude executable URLs and trade aggregation counts delivered orders by unit', () => {
  assert.equal(safeAttachmentUrl('https://example.com/document.pdf'), true);
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'file:///tmp/doc', 'https://user:pass@example.com']) assert.equal(safeAttachmentUrl(url), false);
  const pipeline = tradePipeline('Kandy');
  assert.deepEqual(pipeline[0], { $match: { status: 'delivered' } });
  const facet = pipeline.find((stage) => stage.$facet).$facet;
  assert.equal(facet.quantities[0].$group._id, '$unit');
  assert.equal(facet.crops[0].$group._id.unit, '$unit');
  assert.equal(facet.totals[0].$group.totalQuantity, undefined);
});
