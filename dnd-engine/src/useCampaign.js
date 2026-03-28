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
    characterPortraits: {}, // id -> imageUrl
    lastRoll: null,
    activeTurnId: campaignData.characters[0].id,
    completedQuests: [],
    toast: null,
    narration: null,
    rollLog: [],
    audioMood: 'calm',
    audioPlaying: false,
    ping: null,
    activeHandout: null,
    reaction: null, // { emoji, id }
    activePuzzle: null,
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem('dnd_game_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultState(), ...parsed };
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
    const handleMessage = (event) => {
      if (event.data && typeof event.data === 'object') {
        setGameState(event.data);
      }
    };
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
    if (!mon) console.warn(`getMaxHp: unknown entity "${id}"`);
    return mon?.maxHp ?? mon?.hp ?? 1;
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

  const helpAction = useCallback((helperName, targetName) => {
    addLogEntry({
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      label: `✨ ${helperName} helps ${targetName}! (Advantage)`,
      d20: 'HELP',
      total: 'ADV',
      bonus: 0
    });
    updateGameState({ toast: { title: "Help!", message: `${helperName} gives Advantage to ${targetName}!`, id: Date.now() } });
  }, [addLogEntry, updateGameState]);

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
  };
}
