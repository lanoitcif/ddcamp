/* ─── Party configuration: adapt the campaign to your real players ─────────
 * The stock campaign ships three fixed heroes. A DM can instead define a
 * party (1-6 kids, each with a name + class template) and optionally shrink
 * the campaign to a first-session arc. The config lives in the SYNCED game
 * state (gameState.partyConfig), so a player TV on another device adapts too.
 *
 * partyConfig shape:
 *   {
 *     configured: true,               // setup wizard has run at least once
 *     players: [{ name, classKey }],  // null/empty -> use the stock heroes
 *     shortSession: false,            // true -> first-adventure arc only
 *   }
 */

// Class templates mirror the stock heroes' kid-tuned stats; wizard is new.
// Portraits: pixel art where we have it, dicebear (same service as
// campaignSchema DEFAULT_IMAGES) for the wizard — swappable in-game via the
// portrait button.
export const CLASS_TEMPLATES = {
  rogue: {
    label: 'Rogue (sneaky)',
    class: 'Thief (Rogue)',
    hp: 9,
    bonus: 5,
    image: '/pixel_ranger.png',
    actions: [
      { name: 'Sneak Attack', bonus: 5, damage: '1d6+3' },
      { name: 'Shortbow', bonus: 5, damage: '1d6+3' },
    ],
  },
  fighter: {
    label: 'Fighter (brave)',
    class: 'Fighter',
    hp: 12,
    bonus: 5,
    image: '/pixel_fighter.png',
    actions: [
      { name: 'Longsword', bonus: 5, damage: '1d8+3' },
      { name: 'Handaxe', bonus: 5, damage: '1d6+3' },
    ],
  },
  paladin: {
    label: 'Paladin (kind)',
    class: 'Paladin',
    hp: 12,
    bonus: 4,
    image: '/pixel_paladin.png',
    actions: [
      { name: 'Warhammer', bonus: 4, damage: '1d8+2' },
      { name: 'Divine Smite', bonus: 4, damage: '2d8' },
    ],
  },
  wizard: {
    label: 'Wizard (clever)',
    class: 'Wizard',
    hp: 8,
    bonus: 5,
    image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Wizard',
    actions: [
      { name: 'Magic Missile', bonus: 5, damage: '1d4+3' },
      { name: 'Starlight Zap', bonus: 5, damage: '1d8+2' },
    ],
  },
};

export const MAX_PARTY_SIZE = 6;

// First-adventure arc: Oakhaven through the Fairy Glade (~60-90 min).
// Quests are hand-picked to those completable within these scenes —
// merchants-parcel (delivered in Goblin Hollow) and ingredient-hunt
// (multi-scene collection) are deliberately excluded.
export const SHORT_SESSION = {
  sceneIds: ['bakery', 'market', 'woods', 'glade'],
  questIds: [
    'bakery-clue',
    'lost-kitten',
    'hoot-riddle',
    'wolf-friend',
    'fairy-lights',
    'mushroom-map',
  ],
};

/**
 * Builds schema-valid hero objects from wizard entries.
 * IDs are index-stable (hero-1..hero-6) so renaming a kid's hero never
 * orphans their HP/XP entries in game state.
 */
export function buildPartyCharacters(players) {
  return players.map((p, i) => {
    const template = CLASS_TEMPLATES[p.classKey] || CLASS_TEMPLATES.fighter;
    const name = (p.name || '').trim() || `Hero ${i + 1}`;
    return {
      id: `hero-${i + 1}`,
      name,
      class: template.class,
      hp: template.hp,
      maxHp: template.hp,
      // Give the wizard a per-hero portrait seed so two wizards look distinct.
      image: p.classKey === 'wizard'
        ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`
        : template.image,
      bonus: template.bonus,
      actions: template.actions.map(a => ({ ...a })),
    };
  });
}

/**
 * Returns the campaign adjusted for the current party config.
 * No config (or stock party + full campaign) returns the input unchanged.
 */
export function applyPartyToCampaign(campaign, partyConfig) {
  if (!partyConfig?.configured) return campaign;

  const hasCustomParty = Array.isArray(partyConfig.players) && partyConfig.players.length > 0;
  const isShort = !!partyConfig.shortSession;
  if (!hasCustomParty && !isShort) return campaign;

  const characters = hasCustomParty
    ? buildPartyCharacters(partyConfig.players)
    : campaign.characters;

  if (!isShort) return { ...campaign, characters };

  const sceneSet = new Set(SHORT_SESSION.sceneIds);
  const questSet = new Set(SHORT_SESSION.questIds);
  return {
    ...campaign,
    characters,
    scenes: campaign.scenes.filter(s => sceneSet.has(s.id)),
    monsters: campaign.monsters.filter(m => sceneSet.has(m.sceneId)),
    quests: campaign.quests.filter(q => questSet.has(q.id)),
  };
}
