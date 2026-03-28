// ─── Campaign Schema & Utilities ────────────────────────────────────
// Data layer for the Campaign Builder feature.
// Provides validation, factory functions, and import/export utilities
// for campaign data consumed by useCampaign.js and the dual-view UI.

// ─── Constants ──────────────────────────────────────────────────────

export const DAMAGE_PATTERN = /^(\d+)d(\d+)(\+\d+)?$/;

export const QUEST_TYPES = ['main', 'side'];

export const DEFAULT_IMAGES = {
  scene: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?auto=format&fit=crop&w=1200&q=80',
  character: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Hero',
  monster: 'https://api.dicebear.com/7.x/bottts/svg?seed=Monster',
};

// ─── ID Generation ──────────────────────────────────────────────────

function generateId(prefix) {
  const timestamp = Date.now();
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${timestamp}-${suffix}`;
}

// ─── Validation Helpers ─────────────────────────────────────────────

function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

function isPositiveInt(val) {
  return Number.isInteger(val) && val > 0;
}

function isNonNegativeInt(val) {
  return Number.isInteger(val) && val >= 0;
}

function isNumber(val) {
  return typeof val === 'number' && Number.isFinite(val);
}

// ─── Damage String Validation ───────────────────────────────────────

export function validateDamageString(str) {
  if (typeof str !== 'string') return false;
  return DAMAGE_PATTERN.test(str.trim());
}

// ─── Action Validation ──────────────────────────────────────────────

function validateAction(action, path) {
  const errors = [];
  if (!action || typeof action !== 'object') {
    errors.push(`${path}: must be an object`);
    return errors;
  }
  if (!isNonEmptyString(action.name)) {
    errors.push(`${path}.name: must be a non-empty string`);
  }
  if (!isNumber(action.bonus)) {
    errors.push(`${path}.bonus: must be a number`);
  }
  if (!validateDamageString(action.damage)) {
    errors.push(`${path}.damage: must match pattern NdN or NdN+N (got "${action.damage}")`);
  }
  return errors;
}

// ─── Entity Validators ─────────────────────────────────────────────

export function validateCharacter(char) {
  const errors = [];
  if (!char || typeof char !== 'object') {
    return { valid: false, errors: ['Character must be an object'] };
  }

  if (!isNonEmptyString(char.id)) errors.push('id: must be a non-empty string');
  if (!isNonEmptyString(char.name)) errors.push('name: must be a non-empty string');
  if (!isNonEmptyString(char.class)) errors.push('class: must be a non-empty string');
  if (!isPositiveInt(char.maxHp)) errors.push('maxHp: must be a positive integer');
  if (!isNonNegativeInt(char.hp)) {
    errors.push('hp: must be a non-negative integer');
  } else if (char.hp > char.maxHp) {
    errors.push('hp: must not exceed maxHp');
  }
  if (!isNumber(char.bonus)) errors.push('bonus: must be a number');
  if (!isNonEmptyString(char.image)) errors.push('image: must be a non-empty string');

  if (!Array.isArray(char.actions) || char.actions.length === 0) {
    errors.push('actions: must be a non-empty array');
  } else {
    char.actions.forEach((a, i) => {
      errors.push(...validateAction(a, `actions[${i}]`));
    });
  }

  return { valid: errors.length === 0, errors };
}

export function validateScene(scene) {
  const errors = [];
  if (!scene || typeof scene !== 'object') {
    return { valid: false, errors: ['Scene must be an object'] };
  }

  if (!isNonEmptyString(scene.id)) errors.push('id: must be a non-empty string');
  if (!isNonEmptyString(scene.title)) errors.push('title: must be a non-empty string');
  if (!isNonEmptyString(scene.description)) errors.push('description: must be a non-empty string');
  if (!isNonEmptyString(scene.image)) errors.push('image: must be a non-empty string');
  if (!isNonEmptyString(scene.chapter)) errors.push('chapter: must be a non-empty string');
  if (!isNonEmptyString(scene.introNarration)) errors.push('introNarration: must be a non-empty string');

  if (!scene.dmNotes || typeof scene.dmNotes !== 'object') {
    errors.push('dmNotes: must be an object');
  } else {
    for (const key of ['npcs', 'tactics', 'questHints', 'tip']) {
      if (!isNonEmptyString(scene.dmNotes[key])) {
        errors.push(`dmNotes.${key}: must be a non-empty string`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateMonster(monster) {
  const errors = [];
  if (!monster || typeof monster !== 'object') {
    return { valid: false, errors: ['Monster must be an object'] };
  }

  if (!isNonEmptyString(monster.id)) errors.push('id: must be a non-empty string');
  if (!isNonEmptyString(monster.sceneId)) errors.push('sceneId: must be a non-empty string');
  if (!isNonEmptyString(monster.name)) errors.push('name: must be a non-empty string');
  if (!isPositiveInt(monster.maxHp)) errors.push('maxHp: must be a positive integer');
  if (!isNonNegativeInt(monster.hp)) {
    errors.push('hp: must be a non-negative integer');
  } else if (monster.hp > monster.maxHp) {
    errors.push('hp: must not exceed maxHp');
  }
  if (!isNonEmptyString(monster.image)) errors.push('image: must be a non-empty string');

  if (!Array.isArray(monster.actions) || monster.actions.length === 0) {
    errors.push('actions: must be a non-empty array');
  } else {
    monster.actions.forEach((a, i) => {
      errors.push(...validateAction(a, `actions[${i}]`));
    });
  }

  return { valid: errors.length === 0, errors };
}

export function validateQuest(quest) {
  const errors = [];
  if (!quest || typeof quest !== 'object') {
    return { valid: false, errors: ['Quest must be an object'] };
  }

  if (!isNonEmptyString(quest.id)) errors.push('id: must be a non-empty string');
  if (!isNonEmptyString(quest.title)) errors.push('title: must be a non-empty string');
  if (!isNonEmptyString(quest.reward)) errors.push('reward: must be a non-empty string');
  if (!QUEST_TYPES.includes(quest.type)) {
    errors.push(`type: must be one of ${QUEST_TYPES.join(', ')} (got "${quest.type}")`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateCampaign(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Campaign data must be an object'] };
  }

  if (!isNonEmptyString(data.campaignName)) {
    errors.push('campaignName: must be a non-empty string');
  }

  // Characters
  if (!Array.isArray(data.characters)) {
    errors.push('characters: must be an array');
  } else {
    const charIds = new Set();
    data.characters.forEach((c, i) => {
      const result = validateCharacter(c);
      result.errors.forEach((e) => errors.push(`characters[${i}].${e}`));
      if (c && c.id) {
        if (charIds.has(c.id)) errors.push(`characters[${i}].id: duplicate id "${c.id}"`);
        charIds.add(c.id);
      }
    });
  }

  // Scenes
  if (!Array.isArray(data.scenes)) {
    errors.push('scenes: must be an array');
  } else {
    const sceneIds = new Set();
    data.scenes.forEach((s, i) => {
      const result = validateScene(s);
      result.errors.forEach((e) => errors.push(`scenes[${i}].${e}`));
      if (s && s.id) {
        if (sceneIds.has(s.id)) errors.push(`scenes[${i}].id: duplicate id "${s.id}"`);
        sceneIds.add(s.id);
      }
    });
  }

  // Monsters
  if (!Array.isArray(data.monsters)) {
    errors.push('monsters: must be an array');
  } else {
    const sceneIds = new Set((data.scenes || []).map((s) => s?.id).filter(Boolean));
    const monsterIds = new Set();
    data.monsters.forEach((m, i) => {
      const result = validateMonster(m);
      result.errors.forEach((e) => errors.push(`monsters[${i}].${e}`));
      if (m && m.id) {
        if (monsterIds.has(m.id)) errors.push(`monsters[${i}].id: duplicate id "${m.id}"`);
        monsterIds.add(m.id);
      }
      if (m && m.sceneId && sceneIds.size > 0 && !sceneIds.has(m.sceneId)) {
        errors.push(`monsters[${i}].sceneId: references unknown scene "${m.sceneId}"`);
      }
    });
  }

  // Quests
  if (!Array.isArray(data.quests)) {
    errors.push('quests: must be an array');
  } else {
    const questIds = new Set();
    data.quests.forEach((q, i) => {
      const result = validateQuest(q);
      result.errors.forEach((e) => errors.push(`quests[${i}].${e}`));
      if (q && q.id) {
        if (questIds.has(q.id)) errors.push(`quests[${i}].id: duplicate id "${q.id}"`);
        questIds.add(q.id);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

// ─── Factory Functions ──────────────────────────────────────────────

export function createAction() {
  return {
    name: 'New Action',
    bonus: 0,
    damage: '1d4',
  };
}

export function createCharacter() {
  const id = generateId('char');
  return {
    id,
    name: 'New Hero',
    class: 'Fighter',
    hp: 10,
    maxHp: 10,
    bonus: 2,
    image: `https://api.dicebear.com/7.x/adventurer/svg?seed=${id}`,
    actions: [createAction()],
  };
}

export function createMonster(sceneId = '') {
  const id = generateId('monster');
  return {
    id,
    sceneId,
    name: 'New Monster',
    hp: 10,
    maxHp: 10,
    image: `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`,
    actions: [createAction()],
  };
}

export function createScene() {
  const id = generateId('scene');
  return {
    id,
    title: 'New Scene',
    description: 'Describe what the players see…',
    image: DEFAULT_IMAGES.scene,
    chapter: 'Chapter 1',
    introNarration: 'The adventure continues…',
    dmNotes: {
      npcs: 'None',
      tactics: 'None',
      questHints: 'None',
      tip: 'None',
    },
  };
}

export function createQuest() {
  return {
    id: generateId('quest'),
    title: 'New Quest',
    reward: 'A shiny reward',
    type: 'side',
  };
}

export function createEmptyCampaign() {
  return {
    campaignName: 'Untitled Campaign',
    characters: [],
    scenes: [],
    monsters: [],
    quests: [],
  };
}

// ─── Import / Export ────────────────────────────────────────────────

export function exportCampaignJSON(data) {
  return JSON.stringify(data, null, 2);
}

export function importCampaignJSON(jsonString) {
  if (typeof jsonString !== 'string') {
    return { data: null, errors: ['Input must be a JSON string'] };
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return { data: null, errors: [`Invalid JSON: ${err.message}`] };
  }

  const { valid, errors } = validateCampaign(parsed);
  if (!valid) {
    return { data: null, errors };
  }

  return { data: parsed, errors: [] };
}

export function downloadCampaignFile(data, filename = 'campaign.json') {
  const json = exportCampaignJSON(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
