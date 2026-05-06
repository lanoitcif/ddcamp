import assert from 'node:assert';
import { exportCampaignJSON, importCampaignJSON } from './src/campaignSchema.js';

const mockCampaign = {
  campaignName: 'Test Campaign',
  characters: [],
  scenes: [],
  monsters: [],
  quests: []
};

// Test exportCampaignJSON
console.log('Testing exportCampaignJSON...');
const json = exportCampaignJSON(mockCampaign);
assert.strictEqual(json, JSON.stringify(mockCampaign, null, 2));
assert.ok(json.includes('  "campaignName": "Test Campaign"'));
console.log('✓ exportCampaignJSON passed');

// Test importCampaignJSON - valid
console.log('Testing importCampaignJSON (valid)...');
const jsonString = JSON.stringify(mockCampaign, null, 2);
const result = importCampaignJSON(jsonString);
assert.deepStrictEqual(result.data, mockCampaign);
assert.strictEqual(result.errors.length, 0);
console.log('✓ importCampaignJSON (valid) passed');

// Test importCampaignJSON - invalid syntax
console.log('Testing importCampaignJSON (invalid syntax)...');
const invalidJson = '{ "campaignName": "Test" ';
const resultInvalid = importCampaignJSON(invalidJson);
assert.strictEqual(resultInvalid.data, null);
assert.ok(resultInvalid.errors[0].includes('Invalid JSON'));
console.log('✓ importCampaignJSON (invalid syntax) passed');

// Test importCampaignJSON - invalid data
console.log('Testing importCampaignJSON (invalid data)...');
const invalidData = { campaignName: '', characters: 'not-an-array' };
const jsonStringInvalidData = JSON.stringify(invalidData);
const resultInvalidData = importCampaignJSON(jsonStringInvalidData);
assert.strictEqual(resultInvalidData.data, null);
assert.ok(resultInvalidData.errors.length >= 2);
assert.ok(resultInvalidData.errors.includes('campaignName: must be a non-empty string'));
assert.ok(resultInvalidData.errors.includes('characters: must be an array'));
console.log('✓ importCampaignJSON (invalid data) passed');

// Test importCampaignJSON - non-string
console.log('Testing importCampaignJSON (non-string)...');
const resultNonString = importCampaignJSON(123);
assert.strictEqual(resultNonString.data, null);
assert.ok(resultNonString.errors.includes('Input must be a JSON string'));
console.log('✓ importCampaignJSON (non-string) passed');

console.log('All tests passed!');
