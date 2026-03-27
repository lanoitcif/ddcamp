import { useState, useEffect, useCallback } from 'react';
import campaignData from './campaign_data.json';

const SYNC_CHANNEL = 'dnd_engine_sync';

export function useCampaign() {
  const [gameState, setGameState] = useState(() => {
    const saved = localStorage.getItem('dnd_game_state');
    return saved ? JSON.parse(saved) : {
      currentSceneId: campaignData.scenes[0].id,
      characterHp: campaignData.characters.reduce((acc, char) => ({ ...acc, [char.id]: char.hp }), {}),
      lastRoll: null,
    };
  });

  const [channel] = useState(() => new BroadcastChannel(SYNC_CHANNEL));

  const updateGameState = useCallback((updates) => {
    setGameState(prev => {
      const newState = { ...prev, ...updates };
      localStorage.setItem('dnd_game_state', JSON.stringify(newState));
      channel.postMessage(newState);
      return newState;
    });
  }, [channel]);

  useEffect(() => {
    const handleMessage = (event) => {
      setGameState(event.data);
    };
    channel.addEventListener('message', handleMessage);
    return () => {
      channel.removeEventListener('message', handleMessage);
      // We don't close the channel here to avoid issues with React 18 strict mode
    };
  }, [channel]);

  const rollDice = (bonus, label) => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + bonus;
    updateGameState({
      lastRoll: { d20, bonus, total, label, id: Date.now() }
    });
  };

  return {
    campaignData,
    gameState,
    updateGameState,
    rollDice
  };
}
