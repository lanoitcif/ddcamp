import { useState, useEffect, useCallback, useRef } from 'react';
import campaignData from './campaign_data.json';

const SYNC_CHANNEL = 'dnd_engine_sync';

function defaultState() {
  return {
    currentSceneId: campaignData.scenes[0].id,
    characterHp: {
      ...campaignData.characters.reduce((acc, c) => ({ ...acc, [c.id]: c.hp }), {}),
      ...campaignData.monsters.reduce((acc, m) => ({ ...acc, [m.id]: m.hp }), {}),
    },
    lastRoll: null,
    activeTurnId: campaignData.characters[0].id,
    completedQuests: [],
    toast: null,
    narration: null,
    rollLog: [],
    mood: null,
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem('dnd_game_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults so new fields are always present
      return { ...defaultState(), ...parsed };
    }
  } catch {
    // Corrupted localStorage — fall through to defaults
  }
  return defaultState();
}

// Parse a damage string like "2d8+3" or "1d6" and roll it
export function rollDamage(damageStr) {
  if (!damageStr) return null;
  const match = damageStr.match(/^(\d+)d(\d+)(?:\+(\d+))?$/);
  if (!match) return null;
  const [, count, sides, mod] = match;
  const dice = [];
  for (let i = 0; i < Number(count); i++) {
    dice.push(Math.floor(Math.random() * Number(sides)) + 1);
  }
  const total = dice.reduce((a, b) => a + b, 0) + (Number(mod) || 0);
  return { dice, sides: Number(sides), mod: Number(mod) || 0, total, str: damageStr };
}

export function useCampaign() {
  const [gameState, setGameState] = useState(loadState);
  const channelRef = useRef(null);

  const updateGameState = useCallback((updates) => {
    setGameState(prev => {
      const newState = { ...prev, ...updates };
      localStorage.setItem('dnd_game_state', JSON.stringify(newState));
      channelRef.current?.postMessage(newState);
      return newState;
    });
  }, []);

  useEffect(() => {
    const ch = new BroadcastChannel(SYNC_CHANNEL);
    channelRef.current = ch;
    const handleMessage = (event) => setGameState(event.data);
    ch.addEventListener('message', handleMessage);
    return () => {
      ch.removeEventListener('message', handleMessage);
      ch.close();
    };
  }, []);

  const getMaxHp = useCallback((id) => {
    const char = campaignData.characters.find(c => c.id === id);
    if (char) return char.maxHp;
    const mon = campaignData.monsters.find(m => m.id === id);
    return mon?.maxHp ?? mon?.hp ?? 99;
  }, []);

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

  const addLogEntry = useCallback((entry) => {
    setGameState(prev => {
      const log = [entry, ...(prev.rollLog || [])].slice(0, 50);
      const newState = { ...prev, rollLog: log };
      localStorage.setItem('dnd_game_state', JSON.stringify(newState));
      channelRef.current?.postMessage(newState);
      return newState;
    });
  }, []);

  const rollDice = useCallback((bonus, label, damageStr) => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + bonus;
    const damage = rollDamage(damageStr);
    const roll = { d20, bonus, total, label, damage, id: Date.now() };
    updateGameState({ lastRoll: roll });
    addLogEntry({ ...roll, time: new Date().toLocaleTimeString() });
  }, [updateGameState, addLogEntry]);

  const rollSkillCheck = useCallback((label) => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const roll = { d20, bonus: 0, total: d20, label: label || 'Skill Check', damage: null, id: Date.now() };
    updateGameState({ lastRoll: roll });
    addLogEntry({ ...roll, time: new Date().toLocaleTimeString() });
  }, [updateGameState, addLogEntry]);

  const rollSecret = useCallback((label) => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const roll = { d20, bonus: 0, total: d20, label: label || 'Secret Roll', time: new Date().toLocaleTimeString() };
    addLogEntry({ ...roll, secret: true });
    return roll;
  }, [addLogEntry]);

  const sceneMonsters = campaignData.monsters.filter(m =>
    gameState.currentSceneId === 'peak' || (m.id === 'hoot' && gameState.currentSceneId === 'woods')
  );

  const nextTurn = useCallback(() => {
    const allIds = [
      ...campaignData.characters.map(c => c.id),
      ...sceneMonsters.map(m => m.id),
    ];
    const currentIndex = allIds.indexOf(gameState.activeTurnId);
    const nextIndex = (currentIndex + 1) % allIds.length;
    updateGameState({ activeTurnId: allIds[nextIndex] });
  }, [gameState.activeTurnId, sceneMonsters, updateGameState]);

  const awardLoot = useCallback((questId) => {
    if (gameState.completedQuests.includes(questId)) return;
    const quest = campaignData.quests.find(q => q.id === questId);
    updateGameState({
      completedQuests: [...gameState.completedQuests, questId],
      toast: { title: "Quest Complete!", message: `You found: ${quest.reward}`, id: Date.now() }
    });
  }, [gameState.completedQuests, updateGameState]);

  const setNarration = useCallback((text) => {
    updateGameState({ narration: text ? { text, id: Date.now() } : null });
  }, [updateGameState]);

  const dismissOverlay = useCallback(() => {
    updateGameState({ lastRoll: null, toast: null });
  }, [updateGameState]);

  const resetGame = useCallback(() => {
    const fresh = defaultState();
    localStorage.removeItem('dnd_game_state');
    setGameState(fresh);
    channelRef.current?.postMessage(fresh);
  }, []);

  return {
    campaignData,
    gameState,
    sceneMonsters,
    updateGameState,
    handleHpChange,
    setHp,
    rollDice,
    rollSkillCheck,
    rollSecret,
    nextTurn,
    awardLoot,
    setNarration,
    dismissOverlay,
    resetGame,
  };
}
