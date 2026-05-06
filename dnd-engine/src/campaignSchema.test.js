import assert from 'node:assert';
import {
  validateDamageString,
  validateCharacter,
  validateScene,
  validateMonster,
  validateQuest,
  validateCampaign,
  createAction,
  createCharacter,
  createMonster,
  createScene,
  createQuest,
  createEmptyCampaign,
  exportCampaignJSON,
  importCampaignJSON
} from './campaignSchema.js';

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

console.log('Running campaignSchema unit tests...');

// --- validateDamageString Tests ---
test('validateDamageString - valid patterns', () => {
  assert.strictEqual(validateDamageString('1d4'), true);
  assert.strictEqual(validateDamageString('2d6+2'), true);
  assert.strictEqual(validateDamageString('10d10+5'), true);
  assert.strictEqual(validateDamageString('1d20+0'), true);
});

test('validateDamageString - whitespace handling', () => {
  assert.strictEqual(validateDamageString(' 1d4 '), true);
  assert.strictEqual(validateDamageString('\t2d6+2\n'), true);
});

test('validateDamageString - invalid patterns', () => {
  assert.strictEqual(validateDamageString('d4'), false);
  assert.strictEqual(validateDamageString('1d'), false);
  assert.strictEqual(validateDamageString('1d4+'), false);
  assert.strictEqual(validateDamageString('abc'), false);
  assert.strictEqual(validateDamageString('1d4 + 2'), false);
  assert.strictEqual(validateDamageString('1d4+2.5'), false);
});

test('validateDamageString - non-string inputs', () => {
  assert.strictEqual(validateDamageString(null), false);
  assert.strictEqual(validateDamageString(undefined), false);
  assert.strictEqual(validateDamageString(123), false);
  assert.strictEqual(validateDamageString({}), false);
});

// --- Entity Validators Tests ---

test('validateCharacter - valid character', () => {
  const char = {
    id: 'char-1',
    name: 'Lily',
    class: 'Ranger',
    hp: 10,
    maxHp: 10,
    bonus: 2,
    image: 'lily.png',
    actions: [{ name: 'Bow', bonus: 5, damage: '1d8' }]
  };
  const result = validateCharacter(char);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('validateCharacter - invalid character', () => {
  const char = { id: '', name: 'Lily' }; // Missing many fields
  const result = validateCharacter(char);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('maxHp')));

  const charHp = {
    id: 'char-1', name: 'Lily', class: 'Ranger', hp: 20, maxHp: 10, bonus: 2, image: 'lily.png',
    actions: [{ name: 'Bow', bonus: 5, damage: '1d8' }]
  };
  const resultHp = validateCharacter(charHp);
  assert.strictEqual(resultHp.valid, false);
  assert.ok(resultHp.errors.some(e => e.includes('hp: must not exceed maxHp')));
});

test('validateScene - valid scene', () => {
  const scene = {
    id: 'scene-1',
    title: 'Forest',
    description: 'A dark forest',
    image: 'forest.png',
    chapter: '1',
    introNarration: 'You enter the forest...',
    dmNotes: { npcs: 'none', tactics: 'none', questHints: 'none', tip: 'none' }
  };
  const result = validateScene(scene);
  assert.strictEqual(result.valid, true);
});

test('validateScene - invalid scene', () => {
  const scene = { id: 'scene-1', title: 'Forest' }; // Missing fields
  const result = validateScene(scene);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('validateMonster - valid monster', () => {
  const monster = {
    id: 'monster-1',
    sceneId: 'scene-1',
    name: 'Goblin',
    hp: 5,
    maxHp: 5,
    image: 'goblin.png',
    actions: [{ name: 'Claw', bonus: 2, damage: '1d4' }]
  };
  const result = validateMonster(monster);
  assert.strictEqual(result.valid, true);
});

test('validateMonster - invalid monster', () => {
  const monster = { id: 'monster-1', name: 'Goblin' }; // Missing sceneId, hp, etc.
  const result = validateMonster(monster);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('sceneId')));
});

test('validateQuest - valid quest', () => {
  const quest = {
    id: 'quest-1',
    title: 'Find the ring',
    reward: 'Gold',
    type: 'main'
  };
  const result = validateQuest(quest);
  assert.strictEqual(result.valid, true);
});

test('validateQuest - invalid quest', () => {
  const quest = { id: 'quest-1', title: 'Find the ring', reward: 'Gold', type: 'invalid-type' };
  const result = validateQuest(quest);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('type: must be one of')));
});

// --- validateCampaign Tests ---

test('validateCampaign - valid campaign', () => {
  const campaign = {
    campaignName: 'Test Campaign',
    characters: [{
      id: 'char-1', name: 'Lily', class: 'Ranger', hp: 10, maxHp: 10, bonus: 2, image: 'lily.png',
      actions: [{ name: 'Bow', bonus: 5, damage: '1d8' }]
    }],
    scenes: [{
      id: 'scene-1', title: 'Forest', description: 'Dark', image: 'f.png', chapter: '1', introNarration: 'In',
      dmNotes: { npcs: 'n', tactics: 't', questHints: 'q', tip: 't' }
    }],
    monsters: [{
      id: 'monster-1', sceneId: 'scene-1', name: 'G', hp: 5, maxHp: 5, image: 'g.png',
      actions: [{ name: 'C', bonus: 2, damage: '1d4' }]
    }],
    quests: [{ id: 'q-1', title: 'T', reward: 'R', type: 'main' }]
  };
  const result = validateCampaign(campaign);
  assert.strictEqual(result.valid, true);
});

test('validateCampaign - duplicate IDs', () => {
  const campaign = {
    campaignName: 'Test Campaign',
    characters: [
      { id: 'dup-1', name: 'C1', class: 'F', hp: 10, maxHp: 10, bonus: 1, image: 'i.png', actions: [createAction()] },
      { id: 'dup-1', name: 'C2', class: 'F', hp: 10, maxHp: 10, bonus: 1, image: 'i.png', actions: [createAction()] }
    ],
    scenes: [], monsters: [], quests: []
  };
  const result = validateCharacter(campaign.characters[0]);
  assert.strictEqual(result.valid, true); // Individual char is valid

  const campaignResult = validateCampaign(campaign);
  assert.strictEqual(campaignResult.valid, false);
  assert.ok(campaignResult.errors.some(e => e.includes('duplicate id "dup-1"')));
});

test('validateCampaign - unknown sceneId in monster', () => {
  const campaign = {
    campaignName: 'Test Campaign',
    characters: [],
    scenes: [{
      id: 'scene-1', title: 'Forest', description: 'Dark', image: 'f.png', chapter: '1', introNarration: 'In',
      dmNotes: { npcs: 'n', tactics: 't', questHints: 'q', tip: 't' }
    }],
    monsters: [{
      id: 'monster-1', sceneId: 'WRONG-SCENE', name: 'G', hp: 5, maxHp: 5, image: 'g.png',
      actions: [{ name: 'C', bonus: 2, damage: '1d4' }]
    }],
    quests: []
  };
  const campaignResult = validateCampaign(campaign);
  assert.strictEqual(campaignResult.valid, false);
  assert.ok(campaignResult.errors.some(e => e.includes('references unknown scene "WRONG-SCENE"')));
});

// --- Factory Functions Tests ---

test('factory functions produce valid objects', () => {
  const char = createCharacter();
  assert.strictEqual(validateCharacter(char).valid, true);

  const monster = createMonster('scene-1');
  assert.strictEqual(validateMonster(monster).valid, true);
  assert.strictEqual(monster.sceneId, 'scene-1');

  const scene = createScene();
  assert.strictEqual(validateScene(scene).valid, true);

  const quest = createQuest();
  assert.strictEqual(validateQuest(quest).valid, true);

  const campaign = createEmptyCampaign();
  assert.strictEqual(validateCampaign(campaign).valid, true);
});

// --- Import/Export Utilities Tests ---

test('exportCampaignJSON and importCampaignJSON', () => {
  const campaign = createEmptyCampaign();
  campaign.campaignName = 'Export Test';

  const json = exportCampaignJSON(campaign);
  assert.strictEqual(typeof json, 'string');
  assert.ok(json.includes('Export Test'));

  const importResult = importCampaignJSON(json);
  assert.strictEqual(importResult.errors.length, 0);
  assert.strictEqual(importResult.data.campaignName, 'Export Test');
});

test('importCampaignJSON - error handling', () => {
  // Invalid JSON
  const result1 = importCampaignJSON('invalid-json');
  assert.strictEqual(result1.data, null);
  assert.ok(result1.errors[0].includes('Invalid JSON'));

  // Invalid data (missing required fields)
  const result2 = importCampaignJSON('{"campaignName": ""}');
  assert.strictEqual(result2.data, null);
  assert.ok(result2.errors.length > 0);
});
