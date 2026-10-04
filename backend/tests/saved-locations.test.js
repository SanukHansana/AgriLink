import assert from 'node:assert/strict';
import { test } from 'node:test';
import Product from '../src/models/Product.js';
import FarmerProfile from '../src/models/FarmerProfile.js';
import BuyerProfile from '../src/models/BuyerProfile.js';
import PurchaseRequest from '../src/models/PurchaseRequest.js';
import { assertMapPin } from '../src/utils/validation.js';

const location = { addressLine: 'Farm Road', city: 'Kandy', district: 'Kandy', latitude: 7.2906, longitude: 80.6337 };
test('products, Wanted requests and profiles retain saved map coordinates in their schemas', async () => {
  for (const [Model, field] of [[Product, 'farmLocation'], [FarmerProfile, 'farmLocation'], [PurchaseRequest, 'deliveryLocation']]) {
    const doc = new Model({ [field]: location });
    assert.equal(doc[field].latitude, location.latitude);
    assert.equal(doc[field].longitude, location.longitude);
    await assert.rejects(new Model({ [field]: { ...location, latitude: 100 } }).validate(), (error) => Boolean(error.errors[`${field}.latitude`]));
  }
  const buyer = new BuyerProfile({ deliveryLocations: [location] });
  assert.equal(buyer.deliveryLocations[0].latitude, location.latitude);
  assert.equal(buyer.deliveryLocations[0].longitude, location.longitude);
});

test('saved location validation rejects half-pins and invalid ranges, but supports older address-only records', () => {
  assert.doesNotThrow(() => assertMapPin({ district: 'Kandy' }));
  assert.doesNotThrow(() => assertMapPin(location));
  for (const pin of [{ latitude: 7 }, { longitude: 80 }, { latitude: '7', longitude: 80 }, { latitude: 100, longitude: 80 }, { latitude: 7, longitude: Infinity }]) {
    assert.throws(() => assertMapPin(pin), /both valid latitude and longitude/);
  }
});
