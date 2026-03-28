import React, { useState, useEffect } from 'react';
import { Star, Sparkles, Sword, Heart, Shield, X, Plus } from 'lucide-react';
import {
  getLevel,
  getXpProgress,
  XP_REWARDS,
  MAX_LEVEL,
} from './xpSystem';

// ---------------------------------------------------------------------------
// XpBar — compact XP progress bar for character cards
// ---------------------------------------------------------------------------
export function XpBar({ xp }) {
  const level = getLevel(xp);
  const progress = getXpProgress(xp);
  const isMax = level >= MAX_LEVEL;

  return (
    <div className="flex items-center gap-1.5 w-full">
      <span className="bg-dnd-gold text-black rounded-full text-[10px] font-bold px-2 leading-4 shrink-0">
        Lv.{level}
      </span>

      {isMax ? (
        <span className="text-[10px] text-dnd-gold font-bold tracking-wide">MAX</span>
      ) : (
        <>
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-dnd-gold transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
            {progress.current}/{progress.needed} XP
          </span>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LevelUpOverlay — full-screen celebration overlay for Player View
// ---------------------------------------------------------------------------
export function LevelUpOverlay({ levelUp, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!levelUp || !visible) return null;

  const {
    characterName,
    newLevel,
    title,
    hpBonus,
    bonusIncrease,
    newAction,
  } = levelUp;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[80] flex items-center justify-center cursor-pointer"
      onClick={() => { setVisible(false); onDismiss?.(); }}
    >
      <div className="bg-gradient-to-b from-yellow-900 to-gray-900 border-4 border-dnd-gold rounded-3xl p-16 max-w-2xl w-full text-center space-y-8 relative">
        {/* dismiss button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); setVisible(false); onDismiss?.(); }}
        >
          <X size={24} />
        </button>

        {/* heading */}
        <div className="space-y-1">
          <Sparkles className="mx-auto text-yellow-400 mb-2" size={36} />
          <h1
            className="text-8xl font-serif text-yellow-400 animate-pulse leading-none"
            style={{ textShadow: '0 0 40px rgba(212,175,55,0.6), 0 0 80px rgba(212,175,55,0.3)' }}
          >
            LEVEL UP!
          </h1>
        </div>

        {/* character info */}
        <div className="space-y-1">
          <p className="text-4xl text-white font-bold uppercase tracking-wider">
            {characterName}
          </p>
          {title && (
            <p className="text-2xl text-dnd-gold italic">~ {title} ~</p>
          )}
        </div>

        {/* stat bonuses */}
        <div className="flex justify-center gap-8">
          {hpBonus != null && (
            <div className="bg-gray-800 rounded-xl p-4 min-w-[120px]">
              <Heart className="mx-auto text-red-400 mb-1" size={24} />
              <p className="text-3xl font-bold text-white">+{hpBonus}</p>
              <p className="text-sm text-gray-400">HP</p>
            </div>
          )}
          {bonusIncrease != null && (
            <div className="bg-gray-800 rounded-xl p-4 min-w-[120px]">
              <Shield className="mx-auto text-blue-400 mb-1" size={24} />
              <p className="text-3xl font-bold text-white">+{bonusIncrease}</p>
              <p className="text-sm text-gray-400">Attack</p>
            </div>
          )}
        </div>

        {/* new action card */}
        {newAction && (
          <div className="bg-purple-900/50 border border-purple-500 rounded-xl p-4 mx-auto max-w-md">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sword className="text-purple-300" size={20} />
              <span className="text-lg text-purple-200 font-semibold">
                New Ability: {newAction.name}
              </span>
            </div>
            <p className="text-sm text-gray-300">
              +{newAction.bonus} to hit · {newAction.damage} damage
            </p>
          </div>
        )}

        {/* level badge */}
        <p className="text-lg text-gray-500">Level {newLevel}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// XpToast — small floating XP gain notification
// ---------------------------------------------------------------------------
export function XpToast({ xpGain }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!xpGain || !visible) return null;

  return (
    <div className="fixed top-4 right-4 z-[70] animate-bounce-in">
      <div className="bg-gray-900/95 border border-dnd-gold/60 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg shadow-yellow-900/30">
        <Star className="text-dnd-gold" size={16} />
        <span className="text-dnd-gold font-bold text-sm">+{xpGain.amount} XP</span>
        {xpGain.reason && (
          <span className="text-gray-400 text-sm">· {xpGain.reason}</span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DmXpPanel — DM sidebar panel for awarding XP
// ---------------------------------------------------------------------------
export function DmXpPanel({ characterXp, onAwardXp }) {
  const [customAmounts, setCustomAmounts] = useState({});
  const [showCustom, setShowCustom] = useState({});

  const characters = Object.entries(characterXp || {});

  const handleQuickAward = (charId, amount, reason) => {
    onAwardXp?.(charId, amount, reason);
  };

  const handleCustomAward = (charId) => {
    const amount = parseInt(customAmounts[charId], 10);
    if (!amount || amount <= 0) return;
    onAwardXp?.(charId, amount, 'Custom');
    setCustomAmounts((prev) => ({ ...prev, [charId]: '' }));
    setShowCustom((prev) => ({ ...prev, [charId]: false }));
  };

  return (
    <div className="space-y-3">
      {/* header */}
      <h3 className="flex items-center gap-2 text-dnd-gold font-bold text-sm uppercase tracking-wider">
        <Star size={16} /> Experience
      </h3>

      {characters.map(([charId, xp]) => {
        const level = getLevel(xp);
        const progress = getXpProgress(xp);
        const isMax = level >= MAX_LEVEL;

        return (
          <div key={charId} className="bg-gray-800/60 rounded-lg p-2 space-y-1.5">
            {/* name + level */}
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium capitalize">{charId}</span>
              <span className="bg-dnd-gold text-black rounded-full text-[10px] font-bold px-2 leading-4">
                Lv.{level}
              </span>
            </div>

            {/* mini xp bar */}
            {isMax ? (
              <p className="text-[10px] text-dnd-gold font-bold">MAX LEVEL</p>
            ) : (
              <div className="flex items-center gap-1">
                <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-dnd-gold transition-all duration-500"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-500">
                  {progress.current}/{progress.needed}
                </span>
              </div>
            )}

            {/* quick award buttons */}
            {!isMax && (
              <div className="flex flex-wrap gap-1">
                {Object.entries(XP_REWARDS).map(([key, amount]) => {
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                  return (
                    <button
                      key={key}
                      onClick={() => handleQuickAward(charId, amount, label)}
                      className="text-[10px] bg-gray-700 hover:bg-dnd-gold/20 text-gray-300 hover:text-dnd-gold rounded px-1.5 py-0.5 transition-colors"
                    >
                      {label} (+{amount})
                    </button>
                  );
                })}

                {/* toggle custom input */}
                <button
                  onClick={() =>
                    setShowCustom((prev) => ({ ...prev, [charId]: !prev[charId] }))
                  }
                  className="text-[10px] bg-gray-700 hover:bg-dnd-gold/20 text-gray-300 hover:text-dnd-gold rounded px-1.5 py-0.5 transition-colors"
                >
                  <Plus size={10} className="inline -mt-px" /> Custom
                </button>
              </div>
            )}

            {/* custom amount input */}
            {showCustom[charId] && !isMax && (
              <div className="flex gap-1 mt-1">
                <input
                  type="number"
                  min="1"
                  placeholder="XP"
                  value={customAmounts[charId] || ''}
                  onChange={(e) =>
                    setCustomAmounts((prev) => ({ ...prev, [charId]: e.target.value }))
                  }
                  className="w-16 bg-gray-700 text-white text-xs rounded px-1.5 py-0.5 border border-gray-600 focus:border-dnd-gold outline-none"
                />
                <button
                  onClick={() => handleCustomAward(charId)}
                  className="text-[10px] bg-dnd-gold/20 hover:bg-dnd-gold/40 text-dnd-gold rounded px-2 py-0.5 font-bold transition-colors"
                >
                  Award
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
