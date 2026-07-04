import React from 'react';
import { Users, Plus, Trash2, X, Sparkles } from 'lucide-react';
import { CLASS_TEMPLATES, MAX_PARTY_SIZE, SHORT_SESSION } from './partyConfig';

/* ─── Party Setup wizard ──────────────────────────────────────────
 * Lets the DM adapt the campaign to the real table: how many kids are
 * playing, their heroes' names, and a class each. Optionally trims the
 * campaign to the first-adventure arc (Oakhaven → Fairy Glade) for a
 * ~60-90 minute session. Saving applies via applyPartySetup, which keeps
 * HP/XP for existing heroes — safe to reopen mid-game to fix a name.
 */

const DEFAULT_ROW = { name: '', classKey: 'fighter' };

export default function PartySetup({ partyConfig, onSave, onClose }) {
  const [players, setPlayers] = React.useState(() =>
    partyConfig?.players?.length
      ? partyConfig.players.map(p => ({ ...p }))
      : [{ ...DEFAULT_ROW }]
  );
  const [shortSession, setShortSession] = React.useState(!!partyConfig?.shortSession);

  const setPlayer = (i, updates) =>
    setPlayers(prev => prev.map((p, idx) => (idx === i ? { ...p, ...updates } : p)));
  const addPlayer = () =>
    setPlayers(prev => (prev.length >= MAX_PARTY_SIZE ? prev : [...prev, { ...DEFAULT_ROW }]));
  const removePlayer = (i) =>
    setPlayers(prev => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));

  const save = (useStandardHeroes) => {
    onSave({
      players: useStandardHeroes ? null : players,
      shortSession,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-6">
      <div className="bg-gray-900 border-2 border-dnd-gold rounded-none max-w-2xl w-full p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white" title="Close"><X /></button>
        <h2 className="text-2xl font-serif text-dnd-gold mb-1 flex items-center gap-3">
          <Users size={22} /> Party Setup
        </h2>
        <p className="text-xs text-gray-400 mb-6">
          Who&apos;s playing today? Name each hero and pick a class — the whole game (cards, turns, TV view, XP) adapts.
        </p>

        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
          {players.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 w-4 text-right">{i + 1}</span>
              <input
                type="text"
                value={p.name}
                maxLength={24}
                onChange={e => setPlayer(i, { name: e.target.value })}
                placeholder={`Hero ${i + 1}'s name`}
                className="flex-1 bg-gray-800 border border-gray-600 focus:border-dnd-gold text-white px-3 py-2 text-sm rounded-none outline-none"
              />
              <select
                value={p.classKey}
                onChange={e => setPlayer(i, { classKey: e.target.value })}
                className="bg-gray-800 border border-gray-600 text-gray-200 px-2 py-2 text-xs rounded-none"
              >
                {Object.entries(CLASS_TEMPLATES).map(([key, t]) => (
                  <option key={key} value={key}>{t.label}</option>
                ))}
              </select>
              <button
                onClick={() => removePlayer(i)}
                disabled={players.length <= 1}
                className="p-2 text-gray-500 hover:text-red-400 disabled:opacity-30"
                title="Remove hero"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addPlayer}
          disabled={players.length >= MAX_PARTY_SIZE}
          className="mt-3 w-full bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-none flex items-center justify-center gap-2 border border-gray-600 text-xs disabled:opacity-40"
        >
          <Plus size={14} /> Add Hero ({players.length}/{MAX_PARTY_SIZE})
        </button>

        <label className="mt-5 flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={shortSession}
            onChange={e => setShortSession(e.target.checked)}
            className="mt-0.5 accent-dnd-gold"
          />
          <span className="text-xs text-gray-300">
            <span className="text-dnd-gold font-bold flex items-center gap-1"><Sparkles size={12} /> Short adventure (~60–90 min)</span>
            First session only: Bakery → Market → Sparkle Woods → Fairy Glade
            ({SHORT_SESSION.sceneIds.length} scenes, {SHORT_SESSION.questIds.length} quests). Great for a test game — uncheck later to unlock the full journey to Whispering Peak.
          </span>
        </label>

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => save(false)}
            className="flex-1 bg-dnd-gold/20 hover:bg-dnd-gold/30 text-dnd-gold p-3 rounded-none font-bold border border-dnd-gold text-sm"
          >
            Save Party
          </button>
          <button
            onClick={() => save(true)}
            className="px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 p-3 rounded-none border border-gray-600 text-xs"
            title="Play with Lily, Thorne, and Valerius"
          >
            Use Standard Heroes
          </button>
        </div>
      </div>
    </div>
  );
}
