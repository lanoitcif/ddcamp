/**
 * XP & Leveling System for the D&D VTT Engine.
 *
 * Designed for kids ages 8–13: thresholds are low, rewards are frequent,
 * and every level-up feels exciting. All functions are pure.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** XP required to reach each level (index = level − 1). */
export const XP_THRESHOLDS = [0, 100, 250, 500, 800];

/** Highest level achievable in this campaign. */
export const MAX_LEVEL = 5;

/** Standard XP awards the DM can hand out. */
export const XP_REWARDS = {
  mainQuest: 75,
  sideQuest: 30,
  monsterDefeat: 20,
  puzzleSolve: 40,
  bossDefeat: 100,
  roleplay: 15,
};

/** Per-character bonuses earned at each level. */
export const LEVEL_BONUSES = {
  lily: {
    2: { level: 2, hpBonus: 3, bonusIncrease: 0, newAction: null, title: "Shadow Step" },
    3: { level: 3, hpBonus: 3, bonusIncrease: 1, newAction: { name: "Poison Blade", bonus: 6, damage: "1d8+4" }, title: "Blade Dancer" },
    4: { level: 4, hpBonus: 4, bonusIncrease: 0, newAction: null, title: "Ghost Walker" },
    5: { level: 5, hpBonus: 4, bonusIncrease: 1, newAction: { name: "Shadow Strike", bonus: 7, damage: "2d6+4" }, title: "Master Thief" },
  },
  thorne: {
    2: { level: 2, hpBonus: 4, bonusIncrease: 0, newAction: null, title: "Shield Bash" },
    3: { level: 3, hpBonus: 4, bonusIncrease: 1, newAction: { name: "Cleave", bonus: 6, damage: "1d10+3" }, title: "Battle Master" },
    4: { level: 4, hpBonus: 5, bonusIncrease: 0, newAction: null, title: "Iron Will" },
    5: { level: 5, hpBonus: 5, bonusIncrease: 1, newAction: { name: "Whirlwind", bonus: 7, damage: "2d8+3" }, title: "Champion" },
  },
  valerius: {
    2: { level: 2, hpBonus: 4, bonusIncrease: 0, newAction: null, title: "Holy Shield" },
    3: { level: 3, hpBonus: 4, bonusIncrease: 1, newAction: { name: "Holy Light", bonus: 5, damage: "2d6+2" }, title: "Crusader" },
    4: { level: 4, hpBonus: 5, bonusIncrease: 0, newAction: null, title: "Divine Ward" },
    5: { level: 5, hpBonus: 5, bonusIncrease: 1, newAction: { name: "Radiant Burst", bonus: 6, damage: "3d6" }, title: "Paladin Lord" },
  },
};

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Determine a character's level from their total XP.
 * @param {number} xp - Total accumulated XP.
 * @returns {number} Level between 1 and MAX_LEVEL.
 */
export function getLevel(xp) {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

/**
 * How much total XP is needed to reach the next level?
 * Returns 0 if the character is already at MAX_LEVEL.
 * @param {number} xp - Total accumulated XP.
 * @returns {number} XP threshold for the next level, or 0 at max.
 */
export function getXpForNextLevel(xp) {
  const level = getLevel(xp);
  if (level >= MAX_LEVEL) return 0;
  return XP_THRESHOLDS[level];
}

/**
 * Get progress toward the next level as current/needed/percent.
 * At max level the bar is full (percent = 100).
 * @param {number} xp - Total accumulated XP.
 * @returns {{ current: number, needed: number, percent: number }}
 */
export function getXpProgress(xp) {
  const level = getLevel(xp);
  if (level >= MAX_LEVEL) {
    return { current: 0, needed: 0, percent: 100 };
  }

  const currentThreshold = XP_THRESHOLDS[level - 1];
  const nextThreshold = XP_THRESHOLDS[level];
  const span = nextThreshold - currentThreshold;
  const current = xp - currentThreshold;

  return {
    current,
    needed: span,
    percent: Math.round((current / span) * 100),
  };
}

/**
 * Look up the flavour title earned at a given level for a character.
 * @param {string} characterId - Character key (e.g. "lily").
 * @param {number} level - The level to query (2–5). Level 1 has no title.
 * @returns {string|null} Title string or null if none exists.
 */
export function getLevelTitle(characterId, level) {
  const characterBonuses = LEVEL_BONUSES[characterId];
  if (!characterBonuses) return null;
  const entry = characterBonuses[level];
  return entry ? entry.title : null;
}

/**
 * Get the full bonus object for a character at a specific level.
 * @param {string} characterId - Character key.
 * @param {number} level - The level to query.
 * @returns {{ level: number, hpBonus: number, bonusIncrease: number, newAction: object|null, title: string }|null}
 */
export function getLevelBonuses(characterId, level) {
  const characterBonuses = LEVEL_BONUSES[characterId];
  if (!characterBonuses) return null;
  return characterBonuses[level] ?? null;
}

// ---------------------------------------------------------------------------
// State helpers (for useCampaign integration)
// ---------------------------------------------------------------------------

/**
 * Calculate the result of gaining XP, including any level-up.
 * @param {string} characterId - Character key.
 * @param {number} currentXp - XP before the award.
 * @param {number} xpGained - Amount of XP to add.
 * @returns {{
 *   newXp: number,
 *   newLevel: number,
 *   oldLevel: number,
 *   leveledUp: boolean,
 *   bonuses: { hpBonus: number, bonusIncrease: number, newAction: object|null, title: string }|null
 * }}
 */
export function calculateLevelUp(characterId, currentXp, xpGained) {
  const oldLevel = getLevel(currentXp);
  const newXp = currentXp + xpGained;
  const newLevel = getLevel(newXp);
  const leveledUp = newLevel > oldLevel;

  let bonuses = null;
  if (leveledUp) {
    // Return the bonuses for the highest newly-reached level
    bonuses = getLevelBonuses(characterId, newLevel);
  }

  return { newXp, newLevel, oldLevel, leveledUp, bonuses };
}

/**
 * Award XP to one character and return the updated XP map plus any level-up
 * information. Designed for direct integration with useCampaign state.
 * @param {Record<string, number>} characterXpState - Current XP for all characters.
 * @param {string} characterId - Character receiving XP.
 * @param {number} amount - XP to award.
 * @returns {{
 *   updatedXp: Record<string, number>,
 *   levelUp: { characterId: string, newLevel: number, title: string, hpBonus: number, newAction: object|null }|null
 * }}
 */
export function awardXp(characterXpState, characterId, amount) {
  const currentXp = characterXpState[characterId] ?? 0;
  const result = calculateLevelUp(characterId, currentXp, amount);

  const updatedXp = { ...characterXpState, [characterId]: result.newXp };

  let levelUp = null;
  if (result.leveledUp && result.bonuses) {
    levelUp = {
      characterId,
      newLevel: result.newLevel,
      title: result.bonuses.title,
      hpBonus: result.bonuses.hpBonus,
      newAction: result.bonuses.newAction,
    };
  }

  return { updatedXp, levelUp };
}

/**
 * Create a default (all-zero) XP state object from an array of characters.
 * Falls back to the three built-in heroes when called with no arguments.
 * @param {Array<{ id: string }>} [characters] - Character objects with an `id` field.
 * @returns {Record<string, number>} e.g. { lily: 0, thorne: 0, valerius: 0 }
 */
export function defaultXpState(characters) {
  if (!characters || characters.length === 0) {
    return { lily: 0, thorne: 0, valerius: 0 };
  }
  return Object.fromEntries(characters.map((c) => [c.id, 0]));
}
