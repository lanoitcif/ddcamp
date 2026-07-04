import assert from 'node:assert';
import process from 'node:process';
import { readFileSync } from 'node:fs';
import {
  CLASS_TEMPLATES,
  MAX_PARTY_SIZE,
  SHORT_SESSION,
  buildPartyCharacters,
  applyPartyToCampaign,
} from './partyConfig.js';
import { validateCharacter, validateCampaign } from './campaignSchema.js';

const campaignData = JSON.parse(
  readFileSync(new URL('./campaign_data.json', import.meta.url), 'utf8')
);

// --- Test Helper ---
function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (err) {
    console.error(`❌ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log('Running partyConfig unit tests...');

// --- buildPartyCharacters ---
test('buildPartyCharacters - produces schema-valid characters', () => {
  const players = Object.keys(CLASS_TEMPLATES).map((classKey, i) => ({
    name: `Kid ${i + 1}`,
    classKey,
  }));
  const chars = buildPartyCharacters(players);
  assert.strictEqual(chars.length, players.length);
  for (const c of chars) {
    const result = validateCharacter(c);
    assert.strictEqual(result.valid, true, JSON.stringify(result.errors));
  }
});

test('buildPartyCharacters - ids are index-stable across renames', () => {
  const before = buildPartyCharacters([{ name: 'Ava', classKey: 'rogue' }, { name: 'Ben', classKey: 'wizard' }]);
  const after = buildPartyCharacters([{ name: 'Ava the Swift', classKey: 'rogue' }, { name: 'Benjamin', classKey: 'wizard' }]);
  assert.deepStrictEqual(before.map(c => c.id), after.map(c => c.id));
  assert.strictEqual(before[0].id, 'hero-1');
  assert.strictEqual(before[1].id, 'hero-2');
});

test('buildPartyCharacters - blank names get friendly defaults', () => {
  const chars = buildPartyCharacters([{ name: '  ', classKey: 'fighter' }, { name: '', classKey: 'paladin' }]);
  assert.strictEqual(chars[0].name, 'Hero 1');
  assert.strictEqual(chars[1].name, 'Hero 2');
});

test('buildPartyCharacters - unknown class falls back to fighter', () => {
  const [c] = buildPartyCharacters([{ name: 'Zed', classKey: 'bard' }]);
  assert.strictEqual(c.class, CLASS_TEMPLATES.fighter.class);
});

test('buildPartyCharacters - supports a full table of MAX_PARTY_SIZE', () => {
  const players = Array.from({ length: MAX_PARTY_SIZE }, (_, i) => ({ name: `P${i}`, classKey: 'fighter' }));
  const chars = buildPartyCharacters(players);
  assert.strictEqual(chars.length, MAX_PARTY_SIZE);
  assert.strictEqual(new Set(chars.map(c => c.id)).size, MAX_PARTY_SIZE);
});

// --- applyPartyToCampaign ---
test('applyPartyToCampaign - unconfigured returns campaign unchanged', () => {
  assert.strictEqual(applyPartyToCampaign(campaignData, undefined), campaignData);
  assert.strictEqual(applyPartyToCampaign(campaignData, null), campaignData);
});

test('applyPartyToCampaign - stock party + full campaign is passthrough', () => {
  const result = applyPartyToCampaign(campaignData, { configured: true, players: null, shortSession: false });
  assert.strictEqual(result, campaignData);
});

test('applyPartyToCampaign - custom party replaces characters only', () => {
  const config = { configured: true, players: [{ name: 'Mia', classKey: 'wizard' }], shortSession: false };
  const result = applyPartyToCampaign(campaignData, config);
  assert.strictEqual(result.characters.length, 1);
  assert.strictEqual(result.characters[0].name, 'Mia');
  assert.strictEqual(result.scenes, campaignData.scenes);
  assert.strictEqual(result.monsters, campaignData.monsters);
  assert.strictEqual(result.quests, campaignData.quests);
});

test('applyPartyToCampaign - short session filters scenes/monsters/quests consistently', () => {
  const config = { configured: true, players: null, shortSession: true };
  const result = applyPartyToCampaign(campaignData, config);
  const sceneIds = new Set(result.scenes.map(s => s.id));
  assert.deepStrictEqual([...sceneIds], SHORT_SESSION.sceneIds);
  for (const m of result.monsters) {
    assert.ok(sceneIds.has(m.sceneId), `monster ${m.id} references filtered scene ${m.sceneId}`);
  }
  assert.deepStrictEqual(result.quests.map(q => q.id).sort(), [...SHORT_SESSION.questIds].sort());
});

test('applyPartyToCampaign - SHORT_SESSION ids all exist in the shipped campaign', () => {
  const sceneIds = new Set(campaignData.scenes.map(s => s.id));
  const questIds = new Set(campaignData.quests.map(q => q.id));
  for (const id of SHORT_SESSION.sceneIds) assert.ok(sceneIds.has(id), `unknown scene ${id}`);
  for (const id of SHORT_SESSION.questIds) assert.ok(questIds.has(id), `unknown quest ${id}`);
});

test('applyPartyToCampaign - custom party + short session validates as a campaign', () => {
  const config = {
    configured: true,
    players: [
      { name: 'Ava', classKey: 'rogue' },
      { name: 'Ben', classKey: 'fighter' },
      { name: 'Cleo', classKey: 'wizard' },
      { name: 'Dax', classKey: 'paladin' },
    ],
    shortSession: true,
  };
  const result = applyPartyToCampaign(campaignData, config);
  const validation = validateCampaign(result);
  assert.strictEqual(validation.valid, true, JSON.stringify(validation.errors));
});

console.log('All partyConfig tests passed!');
