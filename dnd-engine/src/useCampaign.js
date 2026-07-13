import { useState, useEffect, useCallback, useMemo } from 'react';
import campaignData from './campaign_data.json';
import { useSync } from './useSync';
import { awardXp as computeXpAward, defaultXpState } from './xpSystem';
import { secureRoll } from './cryptoUtils';
import { applyPartyToCampaign } from './partyConfig.js';
import { normalizeNarrationDuration } from './narrationUtils';

function defaultState() {
  return {
    currentSceneId: campaignData.scenes[0].id,
    characterHp: {
      ...campaignData.characters.reduce((acc, c) => ({ ...acc, [c.id]: c.hp }), {}),
      ...campaignData.monsters.reduce((acc, m) => ({ ...acc, [m.id]: m.hp }), {}),
    },
    characterPortraits: {}, // id -> imageUrl
    lastRoll: null,
    activeTurnId: campaignData.characters[0].id,
    completedQuests: [],
    toast: null,
    narration: null,
    rollLog: [],
    audioMood: 'calm',
    audioPlaying: false,
    audioVolume: 0.7,
    audioSettings: {
      llmEnabled: true,
      contextAware: true,
      style: 'alpha',
      quality: 'full',
      novelty: 0.72,
      refreshSeconds: 24,
    },
    audioDirector: null,
    ping: null,
    activeHandout: null,
    reaction: null, // { emoji, id }
    activePuzzle: null,
    hasAdvantage: null,
    lastCombatAction: null,
    characterXp: defaultXpState(campaignData.characters),
    levelUp: null,
    xpGain: null,
    optinioEnabled: true,
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem('dnd_game_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultState(),
        ...parsed,
        audioSettings: {
          ...defaultState().audioSettings,
          ...(parsed.audioSettings || {}),
        },
      };
    }
  } catch { /* ok */ }
  return defaultState();
}

export function rollDamage(damageStr) {
  if (!damageStr) return null;
  const match = damageStr.match(/^(\d+)d(\d+)(?:\+(\d+))?$/);
  if (!match) return null;
  const [, count, sides, mod] = match;
  const dice = [];
  for (let i = 0; i < Number(count); i++) {
    dice.push(secureRoll(Number(sides)));
  }
  const total = dice.reduce((a, b) => a + b, 0) + (Number(mod) || 0);
  return { dice, sides: Number(sides), mod: Number(mod) || 0, total, str: damageStr };
}

export function useCampaign() {
  const [gameState, setGameState] = useState(loadState);

  const sync = useSync((incoming) => {
    if (incoming && typeof incoming === 'object') {
      setGameState(incoming);
    }
  });

  // The campaign adapted to the configured party (custom heroes and/or the
  // short first-adventure arc). partyConfig lives in synced game state, so
  // remote player TVs adapt too.
  const activeCampaign = useMemo(
    () => applyPartyToCampaign(campaignData, gameState.partyConfig),
    [gameState.partyConfig]
  );

  const updateGameState = useCallback((updates) => {
    setGameState(prev => {
      const newState = { ...prev, ...updates };
      localStorage.setItem('dnd_game_state', JSON.stringify(newState));
      sync.send(newState);
      return newState;
    });
  }, [sync]);

  const getMaxHp = useCallback((id) => {
    const char = activeCampaign.characters.find(c => c.id === id);
    if (char) return char.maxHp;
    const mon = activeCampaign.monsters.find(m => m.id === id);
    if (!mon) console.warn(`getMaxHp: unknown entity "${id}"`);
    return mon?.maxHp ?? mon?.hp ?? 1;
  }, [activeCampaign]);

  const handleHpChange = useCallback((id, delta) => {
    const maxHp = getMaxHp(id);
    const current = gameState.characterHp[id] ?? 0;
    const clamped = Math.max(0, Math.min(maxHp, current + delta));
    updateGameState({ characterHp: { ...gameState.characterHp, [id]: clamped } });
  }, [gameState.characterHp, getMaxHp, updateGameState]);

  const setHp = useCallback((id, value) => {
    const maxHp = getMaxHp(id);
    const clamped = Math.max(0, Math.min(maxHp, value));
    updateGameState({ characterHp: { ...gameState.characterHp, [id]: clamped } });
  }, [gameState.characterHp, getMaxHp, updateGameState]);

  const setPortrait = useCallback((id, imageUrl) => {
    updateGameState({ 
      characterPortraits: { ...gameState.characterPortraits, [id]: imageUrl } 
    });
  }, [gameState.characterPortraits, updateGameState]);

  const sendReaction = useCallback((emoji) => {
    updateGameState({ reaction: { emoji, id: Date.now() } });
  }, [updateGameState]);

  const addLogEntry = useCallback((entry) => {
    setGameState(prev => {
      const log = [entry, ...(prev.rollLog || [])].slice(0, 50);
      const newState = { ...prev, rollLog: log };
      localStorage.setItem('dnd_game_state', JSON.stringify(newState));
      sync.send(newState);
      return newState;
    });
  }, [sync]);

  const rollDice = useCallback((bonus, label, damageStr, targetId) => {
    let d20, advantageRolls = null, usedAdvantage = false;

    // Check if the rolling entity has advantage
    const rollingEntityId = [...activeCampaign.characters, ...activeCampaign.monsters]
      .find(e => label.startsWith(e.name + ':'))?.id;

    if (gameState.hasAdvantage && rollingEntityId === gameState.hasAdvantage) {
      const roll1 = secureRoll(20);
      const roll2 = secureRoll(20);
      d20 = Math.max(roll1, roll2);
      advantageRolls = [roll1, roll2];
      usedAdvantage = true;
    } else {
      d20 = secureRoll(20);
    }

    const total = d20 + bonus;
    const damage = rollDamage(damageStr);
    const roll = { d20, bonus, total, label, damage, id: Date.now(), advantageRolls, usedAdvantage };

    const updates = { lastRoll: roll };
    if (usedAdvantage) {
      updates.hasAdvantage = null;
    }

    if (targetId && damage) {
      const targetEntity = activeCampaign.characters.find(c => c.id === targetId) ||
                           activeCampaign.monsters.find(m => m.id === targetId);
      const targetName = targetEntity?.name || targetId;
      handleHpChange(targetId, -damage.total);
      roll.targetId = targetId;
      roll.targetName = targetName;
      roll.autoApplied = true;
      roll.label = `${label} → ${targetName}`;

      // Auto-combat mood
      updates.lastCombatAction = Date.now();
      if (gameState.audioPlaying && gameState.audioMood !== 'combat') {
        updates.audioMood = 'combat';
      }
    }

    updateGameState(updates);
    addLogEntry({ ...roll, time: new Date().toLocaleTimeString() });
  }, [updateGameState, addLogEntry, handleHpChange, gameState.hasAdvantage, gameState.audioPlaying, gameState.audioMood, activeCampaign]);

  const rollSkillCheck = useCallback((label) => {
    const d20 = secureRoll(20);
    const roll = { d20, bonus: 0, total: d20, label: label || 'Skill Check', damage: null, id: Date.now() };
    updateGameState({ lastRoll: roll });
    addLogEntry({ ...roll, time: new Date().toLocaleTimeString() });
  }, [updateGameState, addLogEntry]);

  const rollSecret = useCallback((label) => {
    const d20 = secureRoll(20);
    const roll = { d20, bonus: 0, total: d20, label: label || 'Secret Roll', time: new Date().toLocaleTimeString() };
    addLogEntry({ ...roll, secret: true });
    return roll;
  }, [addLogEntry]);

  const sceneMonsters = activeCampaign.monsters.filter(m =>
    m.sceneId === gameState.currentSceneId
  );

  const nextTurn = useCallback(() => {
    const allIds = [
      ...activeCampaign.characters.map(c => c.id),
      ...sceneMonsters.map(m => m.id),
    ];
    // Filter out dead monsters (HP <= 0), keep all characters
    const aliveIds = allIds.filter(id => {
      const isMonster = activeCampaign.monsters.some(m => m.id === id);
      if (!isMonster) return true;
      return (gameState.characterHp[id] ?? 0) > 0;
    });
    if (aliveIds.length === 0) return;
    const currentIndex = aliveIds.indexOf(gameState.activeTurnId);
    const nextIndex = (currentIndex + 1) % aliveIds.length;
    updateGameState({ activeTurnId: aliveIds[nextIndex] });
  }, [gameState.activeTurnId, gameState.characterHp, sceneMonsters, updateGameState, activeCampaign]);

  const awardLoot = useCallback((questId) => {
    if (gameState.completedQuests.includes(questId)) return;
    const quest = activeCampaign.quests.find(q => q.id === questId);
    updateGameState({
      completedQuests: [...gameState.completedQuests, questId],
      toast: { title: "Quest Complete!", message: `You found: ${quest.reward}`, id: Date.now() }
    });
  }, [gameState.completedQuests, updateGameState, activeCampaign]);

  const setNarration = useCallback((text, duration, voiceId) => {
    updateGameState({
      narration: text
        ? { text, id: Date.now(), duration: normalizeNarrationDuration(duration), voiceId }
        : null,
    });
  }, [updateGameState]);

  const helpAction = useCallback((helperName, targetName) => {
    const targetChar = activeCampaign.characters.find(c => c.name === targetName);
    addLogEntry({
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      label: `✨ ${helperName} helps ${targetName}! (Advantage)`,
      d20: 'HELP',
      total: 'ADV',
      bonus: 0
    });
    updateGameState({
      toast: { title: "Help!", message: `${helperName} gives Advantage to ${targetName}!`, id: Date.now() },
      hasAdvantage: targetChar?.id || null,
    });
  }, [addLogEntry, updateGameState, activeCampaign]);

  const snackAction = useCallback((id, name) => {
    const current = gameState.characterHp[id] ?? 0;
    const maxHp = getMaxHp(id);
    const healed = Math.min(maxHp, current + 2);
    updateGameState({ 
      characterHp: { ...gameState.characterHp, [id]: healed },
      toast: { title: "Yum!", message: `${name} ate a Sun-Cake snack and feels better! (+2 HP)`, id: Date.now() }
    });
    addLogEntry({
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      label: `🍎 ${name} takes a snack break!`,
      d20: 'HEAL',
      total: '+2 HP',
      bonus: 0
    });
  }, [gameState.characterHp, getMaxHp, updateGameState, addLogEntry]);

  const setPing = useCallback((x, y) => {
    updateGameState({ ping: { x, y, id: Date.now() } });
  }, [updateGameState]);

  const setHandout = useCallback((handout) => {
    updateGameState({ activeHandout: handout ? { ...handout, id: Date.now() } : null });
  }, [updateGameState]);

  const dismissOverlay = useCallback(() => {
    updateGameState({ lastRoll: null, toast: null, activeHandout: null });
  }, [updateGameState]);

  const startPuzzle = useCallback((puzzleId, sceneId, defaultPuzzleState) => {
    updateGameState({ activePuzzle: { puzzleId, sceneId, ...defaultPuzzleState } });
  }, [updateGameState]);

  const updatePuzzle = useCallback((puzzleState) => {
    updateGameState({ activePuzzle: puzzleState });
  }, [updateGameState]);

  const endPuzzle = useCallback(() => {
    updateGameState({ activePuzzle: null });
  }, [updateGameState]);

  // Applies the Party Setup wizard's config without destroying progress:
  // HP/XP survive for hero ids still in the roster (ids are index-stable, so
  // renaming a kid's hero keeps their stats). Turn/scene/quests are fixed up
  // if the new config filtered them out.
  const applyPartySetup = useCallback((config) => {
    const nextConfig = {
      configured: true,
      players: Array.isArray(config?.players) && config.players.length > 0 ? config.players : null,
      shortSession: !!config?.shortSession,
    };
    const campaign = applyPartyToCampaign(campaignData, nextConfig);
    const heroes = campaign.characters;

    const characterHp = { ...gameState.characterHp };
    heroes.forEach(h => {
      const existing = characterHp[h.id];
      characterHp[h.id] = existing == null ? h.hp : Math.min(existing, h.maxHp);
    });

    const prevXp = gameState.characterXp || {};
    const characterXp = { ...defaultXpState(heroes) };
    heroes.forEach(h => {
      if (prevXp[h.id] != null) characterXp[h.id] = prevXp[h.id];
    });

    const updates = { partyConfig: nextConfig, characterHp, characterXp };
    const turnStillValid =
      heroes.some(h => h.id === gameState.activeTurnId) ||
      campaign.monsters.some(m => m.id === gameState.activeTurnId);
    if (!turnStillValid) updates.activeTurnId = heroes[0].id;
    if (!campaign.scenes.some(s => s.id === gameState.currentSceneId)) {
      updates.currentSceneId = campaign.scenes[0].id;
    }
    updates.completedQuests = (gameState.completedQuests || [])
      .filter(qid => campaign.quests.some(q => q.id === qid));
    updateGameState(updates);
  }, [gameState.characterHp, gameState.characterXp, gameState.activeTurnId, gameState.currentSceneId, gameState.completedQuests, updateGameState]);

  const resetGame = useCallback(() => {
    // A reset starts the adventure over for the SAME party — the kids'
    // heroes survive, their progress doesn't.
    const partyConfig = gameState.partyConfig;
    const fresh = { ...defaultState(), partyConfig };
    if (partyConfig?.configured) {
      const campaign = applyPartyToCampaign(campaignData, partyConfig);
      fresh.currentSceneId = campaign.scenes[0].id;
      fresh.activeTurnId = campaign.characters[0].id;
      fresh.characterHp = {
        ...campaign.characters.reduce((acc, c) => ({ ...acc, [c.id]: c.hp }), {}),
        ...campaign.monsters.reduce((acc, m) => ({ ...acc, [m.id]: m.hp }), {}),
      };
      fresh.characterXp = defaultXpState(campaign.characters);
    }
    localStorage.setItem('dnd_game_state', JSON.stringify(fresh));
    setGameState(fresh);
    sync.send(fresh);
  }, [sync, gameState.partyConfig]);

  const awardXpAction = useCallback((characterId, amount, reason) => {
    const result = computeXpAward(gameState.characterXp || {}, characterId, amount);
    const character = activeCampaign.characters.find(c => c.id === characterId);
    const charName = character?.name || characterId;
    const updates = {
      characterXp: result.updatedXp,
      xpGain: { amount, reason, characterId, characterName: charName, id: Date.now() },
    };
    if (result.levelUp) {
      updates.levelUp = { ...result.levelUp, characterName: charName, id: Date.now() };
      // Apply HP bonus from level-up
      if (result.levelUp.hpBonus) {
        const maxHp = (character?.maxHp || 0) + result.levelUp.hpBonus;
        updates.characterHp = { ...gameState.characterHp, [characterId]: Math.min(maxHp, (gameState.characterHp[characterId] ?? 0) + result.levelUp.hpBonus) };
      }
    }
    updateGameState(updates);
    addLogEntry({
      id: Date.now(), time: new Date().toLocaleTimeString(),
      label: `⭐ ${charName} gains ${amount} XP${reason ? ` (${reason})` : ''}${result.levelUp ? ` — LEVEL UP to ${result.levelUp.newLevel}!` : ''}`,
      d20: 'XP', total: `+${amount}`, bonus: 0,
    });
  }, [gameState.characterXp, gameState.characterHp, updateGameState, addLogEntry, activeCampaign]);

  // Auto-combat mood: fade back after 30s idle
  useEffect(() => {
    if (!gameState.lastCombatAction || !gameState.audioPlaying || gameState.audioMood !== 'combat') return;
    const timer = setTimeout(() => {
      const elapsed = Date.now() - gameState.lastCombatAction;
      if (elapsed >= 30000) {
        updateGameState({ audioMood: 'tense' });
        setTimeout(() => {
          updateGameState({ audioMood: 'calm' });
        }, 15000);
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [gameState.lastCombatAction, gameState.audioPlaying, gameState.audioMood, updateGameState]);

  return {
    campaignData: activeCampaign,
    gameState,
    sceneMonsters,
    sync,
    updateGameState,
    handleHpChange,
    setHp,
    setPortrait,
    sendReaction,
    rollDice,
    rollSkillCheck,
    rollSecret,
    nextTurn,
    awardLoot,
    setNarration,
    helpAction,
    snackAction,
    setPing,
    setHandout,
    dismissOverlay,
    startPuzzle,
    updatePuzzle,
    endPuzzle,
    resetGame,
    awardXpAction,
    applyPartySetup,
  };
}
