/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { Search, Lightbulb, Footprints, Trophy, Droplets, Sparkles, Eye, Music, Scroll, Star } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// PUZZLE 1: Bakery Spotlight Search
// ═══════════════════════════════════════════════════════════════════

const CLUE_ZONES = [
  { id: 'blue-scale', x: 22, y: 65, r: 8, label: '✨ Blue Sparkly Scale!', hint: 'Look near the window frame...' },
  { id: 'golden-crumbs', x: 72, y: 40, r: 7, label: '🥖 Golden Crumb Trail!', hint: 'Follow the windowsill...' },
  { id: 'halfling-footprint', x: 50, y: 78, r: 9, label: '👣 Mrs. Crumb\'s Footprint!', hint: 'Something near the flour sacks...' },
];

function SpotlightDM({ puzzle, onUpdate }) {
  const containerRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);

  const handleMove = React.useCallback((clientX, clientY) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    onUpdate({ ...puzzle, spotX: Math.max(0, Math.min(100, x)), spotY: Math.max(0, Math.min(100, y)) });
  }, [puzzle, onUpdate]);

  const onPointerDown = (e) => { setDragging(true); handleMove(e.clientX, e.clientY); };
  const onPointerMove = (e) => { if (dragging) handleMove(e.clientX, e.clientY); };
  const onPointerUp = () => setDragging(false);

  const found = puzzle.foundClues || [];
  const nearClue = CLUE_ZONES.find(z => !found.includes(z.id) &&
    Math.hypot((puzzle.spotX ?? 50) - z.x, (puzzle.spotY ?? 50) - z.y) < z.r + 6
  );

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Drag the spotlight to search</p>
      <div
        ref={containerRef}
        className="relative w-full h-40 bg-gray-900 rounded-lg border border-gray-700 cursor-crosshair overflow-hidden select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {CLUE_ZONES.map(z => (
          <div key={z.id} className={`absolute rounded-full border-2 border-dashed ${
            found.includes(z.id) ? 'border-green-500 bg-green-900/30' : 'border-yellow-600/40'
          }`} style={{
            left: `${z.x - z.r}%`, top: `${z.y - z.r}%`,
            width: `${z.r * 2}%`, height: `${z.r * 2}%`,
          }}>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-500">
              {found.includes(z.id) ? '✓' : '?'}
            </span>
          </div>
        ))}
        <div className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/60 border-2 border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.5)]"
          style={{ left: `${puzzle.spotX ?? 50}%`, top: `${puzzle.spotY ?? 50}%` }}
        />
      </div>
      {nearClue && (
        <button
          onClick={() => onUpdate({ ...puzzle, foundClues: [...found, nearClue.id] })}
          className="w-full px-3 py-2 bg-yellow-800 hover:bg-yellow-700 border border-yellow-500 rounded text-sm font-bold text-yellow-200 animate-pulse"
        >
          ✨ Reveal: {nearClue.label}
        </button>
      )}
      <div className="flex gap-1 flex-wrap">
        {CLUE_ZONES.map(z => (
          <span key={z.id} className={`text-xs px-2 py-0.5 rounded-full ${found.includes(z.id) ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-500'}`}>
            {found.includes(z.id) ? z.label : z.hint}
          </span>
        ))}
      </div>
      <p className="text-xs text-dnd-gold font-bold">{found.length} / {CLUE_ZONES.length} clues found</p>
    </div>
  );
}

function SpotlightPlayer({ puzzle }) {
  const found = puzzle.foundClues || [];
  const spotX = puzzle.spotX ?? 50;
  const spotY = puzzle.spotY ?? 50;

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      <div className="absolute inset-0" style={{
        background: `radial-gradient(circle 180px at ${spotX}% ${spotY}%, transparent 0%, rgba(0,0,0,0.92) 100%)`,
      }} />
      <div className="absolute w-[360px] h-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-yellow-400/30"
        style={{ left: `${spotX}%`, top: `${spotY}%` }}
      />
      {found.map((id) => {
        const z = CLUE_ZONES.find(c => c.id === id);
        if (!z) return null;
        return (
          <div key={id} className="absolute -translate-x-1/2 -translate-y-1/2 animate-bounce"
            style={{ left: `${z.x}%`, top: `${z.y - 5}%` }}>
            <div className="bg-yellow-900/90 border-2 border-yellow-400 px-6 py-3 rounded-2xl shadow-[0_0_40px_rgba(250,204,21,0.4)]">
              <p className="text-3xl font-bold text-yellow-200 whitespace-nowrap">{z.label}</p>
            </div>
          </div>
        );
      })}
      <div className="absolute top-8 left-0 right-0 flex justify-center">
        <div className="bg-black/80 border border-dnd-gold px-8 py-4 rounded-xl">
          <p className="text-3xl font-serif text-dnd-gold flex items-center gap-3">
            <Search size={32} /> Search for the thief's trail! ({found.length}/{CLUE_ZONES.length} clues)
          </p>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// PUZZLE 2: Hoot's Riddle (Act 2)
// ═══════════════════════════════════════════════════════════════════

const RIDDLE = {
  text: "I have a heart that doesn't beat,\nI have a bed but never sleep,\nI can run but have no legs.\nWhat am I?",
  answer: "A River",
  hints: [
    "🦉 Hoot tilts his head... 'I am very wet!'",
    "🦉 Hoot ruffles his feathers... 'I flow through the valley below...'",
    "🦉 Hoot hoots softly... 'Water is my lifeblood...'",
  ],
};

function RiddleDM({ puzzle, onUpdate }) {
  const revealedChars = puzzle.revealedChars ?? 0;
  const hintsGiven = puzzle.hintsGiven ?? 0;
  const solved = puzzle.solved ?? false;

  const revealMore = () => {
    const next = Math.min(revealedChars + 8, RIDDLE.text.length);
    onUpdate({ ...puzzle, revealedChars: next });
  };

  const revealAll = () => {
    onUpdate({ ...puzzle, revealedChars: RIDDLE.text.length });
  };

  const giveHint = () => {
    if (hintsGiven < RIDDLE.hints.length) {
      onUpdate({ ...puzzle, hintsGiven: hintsGiven + 1 });
    }
  };

  const markSolved = () => {
    onUpdate({ ...puzzle, solved: true });
  };

  return (
    <div className="space-y-2">
      <div className="bg-gray-900 p-2 rounded text-xs font-mono text-green-400 min-h-[60px]">
        {RIDDLE.text.slice(0, revealedChars)}
        <span className="animate-pulse text-dnd-gold">▌</span>
      </div>
      <div className="flex gap-1">
        <button onClick={revealMore} disabled={revealedChars >= RIDDLE.text.length}
          className="flex-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs disabled:opacity-30">
          Reveal More
        </button>
        <button onClick={revealAll} disabled={revealedChars >= RIDDLE.text.length}
          className="px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs disabled:opacity-30">
          Show All
        </button>
      </div>
      <div className="flex gap-1">
        <button onClick={giveHint} disabled={hintsGiven >= RIDDLE.hints.length}
          className="flex-1 px-2 py-1 bg-purple-900 hover:bg-purple-800 border border-purple-600 rounded text-xs disabled:opacity-30 flex items-center justify-center gap-1">
          <Lightbulb size={12} /> Hint ({hintsGiven}/{RIDDLE.hints.length})
        </button>
        <button onClick={markSolved} disabled={solved}
          className="flex-1 px-2 py-1 bg-green-900 hover:bg-green-800 border border-green-600 rounded text-xs disabled:opacity-30 font-bold">
          {solved ? '✓ Solved!' : `Answer: ${RIDDLE.answer}`}
        </button>
      </div>
    </div>
  );
}

function RiddlePlayer({ puzzle }) {
  const revealedChars = puzzle.revealedChars ?? 0;
  const hintsGiven = puzzle.hintsGiven ?? 0;
  const solved = puzzle.solved ?? false;
  const [displayLen, setDisplayLen] = React.useState(0);

  React.useEffect(() => {
    if (displayLen >= revealedChars) return;
    const timer = setTimeout(() => setDisplayLen(prev => Math.min(prev + 1, revealedChars)), 40);
    return () => clearTimeout(timer);
  }, [displayLen, revealedChars]);

  const visibleText = RIDDLE.text.slice(0, displayLen);
  const lines = visibleText.split('\n');

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
      <div className="bg-black/90 backdrop-blur-lg p-16 rounded-[3rem] border-4 border-purple-500 shadow-[0_0_100px_rgba(168,85,247,0.3)] max-w-4xl">
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className="text-8xl">🦉</span>
          <h2 className="text-5xl font-serif text-purple-300 italic">Hoot's Ancient Riddle...</h2>
        </div>
        <div className="space-y-4 mb-8">
          {lines.map((line, i) => (
            <p key={i} className="text-4xl font-serif text-white leading-relaxed text-center">
              {line}
              {i === lines.length - 1 && displayLen < RIDDLE.text.length && (
                <span className="text-purple-400 animate-pulse ml-1">▌</span>
              )}
            </p>
          ))}
        </div>
        {hintsGiven > 0 && (
          <div className="space-y-3 mt-8 border-t border-purple-500/30 pt-6">
            {RIDDLE.hints.slice(0, hintsGiven).map((hint, i) => (
              <p key={i} className="text-2xl text-purple-300 italic text-center">{hint}</p>
            ))}
          </div>
        )}
        {solved && (
          <div className="mt-10 text-center animate-bounce">
            <div className="inline-block bg-green-900/80 border-4 border-green-400 px-12 py-6 rounded-2xl shadow-[0_0_60px_rgba(74,222,128,0.4)]">
              <p className="text-6xl font-bold text-green-300">🌊 {RIDDLE.answer}!</p>
              <p className="text-2xl text-green-400 mt-2">The owl hoots and lets you pass!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// PUZZLE 3: Glimmer Stream Stepping Stones (Act 2)
// ═══════════════════════════════════════════════════════════════════

const STONE_ROWS = [
  { stones: ['🌸', '🍄', '⭐'], safe: 2 },
  { stones: ['🌿', '💎', '🔥'], safe: 1 },
  { stones: ['🌙', '🦋', '☀️'], safe: 0 },
  { stones: ['🪨', '🐸', '🌊'], safe: 0 },
];

function StonesDM({ puzzle, onUpdate }) {
  const currentRow = puzzle.currentRow ?? 0;
  const splashes = puzzle.splashes ?? [];
  const crossed = puzzle.crossed ?? false;

  const resetStones = () => {
    onUpdate({ ...puzzle, currentRow: 0, splashes: [], crossed: false, selectedStones: [] });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 uppercase tracking-widest">
        Athletics Check (10+) to jump safely!
      </p>
      <div className="space-y-1">
        {STONE_ROWS.map((row, ri) => (
          <div key={ri} className={`flex gap-1 ${ri === currentRow && !crossed ? 'ring-1 ring-dnd-gold rounded' : ''}`}>
            {row.stones.map((stone, si) => {
              const wasSplash = splashes.some(s => s[0] === ri && s[1] === si);
              return (
                <div key={si} className={`flex-1 text-center py-1 rounded text-sm ${
                  ri < currentRow ? (si === row.safe ? 'bg-green-900/40 text-green-400' : 'bg-gray-900 text-gray-600') :
                  wasSplash ? 'bg-blue-900/40 text-blue-400' :
                  'bg-gray-800 text-white'
                }`}>
                  {stone} {si === row.safe ? '✓' : ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex gap-1 text-xs">
        <span className={`px-2 py-0.5 rounded ${crossed ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'}`}>
          {crossed ? '✓ Crossed!' : `Row ${currentRow + 1}/${STONE_ROWS.length}`}
        </span>
        <button onClick={resetStones} className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded">
          Reset
        </button>
      </div>
    </div>
  );
}

function StonesPlayer({ puzzle, onUpdate }) {
  const currentRow = puzzle.currentRow ?? 0;
  const splashes = puzzle.splashes ?? [];
  const crossed = puzzle.crossed ?? false;
  const [splashAnim, setSplashAnim] = React.useState(null);
  const [correctAnim, setCorrectAnim] = React.useState(null);

  const handlePick = (rowIdx, stoneIdx) => {
    if (crossed || rowIdx !== currentRow) return;
    const row = STONE_ROWS[rowIdx];
    if (stoneIdx === row.safe) {
      setCorrectAnim({ row: rowIdx, stone: stoneIdx });
      setTimeout(() => setCorrectAnim(null), 800);
      onUpdate({ ...puzzle, currentRow: rowIdx + 1, crossed: rowIdx >= STONE_ROWS.length - 1, selectedStones: [...(puzzle.selectedStones || []), [rowIdx, stoneIdx]] });
    } else {
      setSplashAnim({ row: rowIdx, stone: stoneIdx });
      setTimeout(() => setSplashAnim(null), 1200);
      onUpdate({ ...puzzle, splashes: [...splashes, [rowIdx, stoneIdx]] });
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center">
      <div className="mb-8">
        <div className="bg-black/80 border-2 border-blue-400 px-10 py-5 rounded-2xl shadow-[0_0_60px_rgba(96,165,250,0.3)]">
          <h2 className="text-5xl font-serif text-blue-300 flex items-center gap-4">
            <Footprints size={40} /> Cross the Glimmer Stream!
          </h2>
          {!crossed && <p className="text-2xl text-blue-400 mt-2 text-center">Jump across the liquid silver stones</p>}
        </div>
      </div>
      <div className="space-y-6 w-[700px]">
        {STONE_ROWS.map((row, ri) => (
          <div key={ri} className={`flex gap-6 justify-center transition-all duration-500 ${
            ri === currentRow && !crossed ? 'scale-110' : ri < currentRow ? 'opacity-60 scale-95' : 'opacity-40 scale-90'
          }`}>
            {row.stones.map((stone, si) => {
              const isChosen = (puzzle.selectedStones || []).some(s => s[0] === ri && s[1] === si);
              const wasSplash = splashes.some(s => s[0] === ri && s[1] === si);
              const isSplashing = splashAnim?.row === ri && splashAnim?.stone === si;
              const isCorrectAnim = correctAnim?.row === ri && correctAnim?.stone === si;
              return (
                <button key={si} onClick={() => handlePick(ri, si)} disabled={ri !== currentRow || crossed}
                  className={`w-36 h-36 rounded-2xl text-6xl flex items-center justify-center transition-all duration-300 border-4 ${
                    isChosen ? 'bg-green-900/80 border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.5)] scale-105' :
                    isSplashing ? 'bg-blue-600/80 border-blue-300 animate-bounce scale-125' :
                    wasSplash ? 'bg-blue-900/40 border-blue-800 opacity-50' :
                    ri === currentRow && !crossed ? 'bg-gray-800/90 border-gray-500 hover:border-white hover:scale-110 cursor-pointer hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]' :
                    'bg-gray-900/60 border-gray-700'
                  } ${isCorrectAnim ? 'ring-4 ring-green-400 scale-125' : ''}`}>
                  {isSplashing ? '💦' : stone}
                </button>
              );
            })}
          </div>
        )).reverse()}
      </div>
      {splashAnim && <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50"><div className="text-[10rem] animate-ping opacity-50">💦</div></div>}
      {crossed && <div className="mt-8 animate-bounce"><div className="bg-green-900/90 border-4 border-green-400 px-12 py-6 rounded-2xl shadow-[0_0_80px_rgba(74,222,128,0.5)]"><p className="text-6xl font-bold text-green-300 flex items-center gap-4"><Trophy size={48} /> Safe Across!</p></div></div>}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// PUZZLE 4: Market Ingredient Hunt
// ═══════════════════════════════════════════════════════════════════

const INGREDIENTS = [
  { id: 'moonberry', label: '🫐 Moonberry', bowl: 'moon-bread' },
  { id: 'dragon-pepper', label: '🌶️ Dragon Pepper', bowl: 'sun-cake' },
  { id: 'starflour', label: '⭐ Starflour', bowl: 'moon-bread' },
  { id: 'honey-dew', label: '🍯 Honey Dew', bowl: 'sun-cake' },
];

const RECIPE_BOWLS = [
  { id: 'sun-cake', label: '☀️ Sun-Cake' },
  { id: 'moon-bread', label: '🌙 Moon-Bread' },
];

function IngredientsDM({ puzzle, onUpdate }) {
  const placed = puzzle.placed || {};

  const countCorrect = (p) => Object.entries(p).filter(([iId, bId]) =>
    INGREDIENTS.find(i => i.id === iId)?.bowl === bId
  ).length;

  const placeIngredient = (ingredientId, bowlId) => {
    const newPlaced = { ...placed, [ingredientId]: bowlId };
    onUpdate({ ...puzzle, placed: newPlaced, correct: countCorrect(newPlaced) });
  };

  const removeIngredient = (ingredientId) => {
    const newPlaced = { ...placed };
    delete newPlaced[ingredientId];
    onUpdate({ ...puzzle, placed: newPlaced, correct: countCorrect(newPlaced) });
  };

  const correct = countCorrect(placed);

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 uppercase tracking-widest">Place ingredients in bowls</p>
      <div className="flex gap-2">
        {RECIPE_BOWLS.map(bowl => (
          <div key={bowl.id} className="flex-1 bg-gray-900 rounded-lg border border-gray-700 p-2">
            <p className="text-xs text-dnd-gold font-bold mb-1">{bowl.label}</p>
            {INGREDIENTS.filter(i => placed[i.id] === bowl.id).map(i => {
              const isCorrect = i.bowl === bowl.id;
              return (
                <div key={i.id} className={`text-xs px-1 py-0.5 rounded mb-0.5 flex justify-between items-center ${isCorrect ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                  <span>{i.label}</span>
                  <button onClick={() => removeIngredient(i.id)} className="text-gray-500 hover:text-white">✕</button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex gap-1 flex-wrap">
        {INGREDIENTS.filter(i => !placed[i.id]).map(i => (
          <div key={i.id} className="text-xs bg-gray-800 rounded p-1 flex items-center gap-1">
            <span>{i.label}</span>
            {RECIPE_BOWLS.map(b => (
              <button key={b.id} onClick={() => placeIngredient(i.id, b.id)}
                className="px-1 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-[10px]">
                →{b.id === 'sun-cake' ? '☀️' : '🌙'}
              </button>
            ))}
          </div>
        ))}
      </div>
      <p className="text-xs text-dnd-gold font-bold">{correct}/{INGREDIENTS.length} correct</p>
    </div>
  );
}

function IngredientsPlayer({ puzzle }) {
  const placed = puzzle.placed || {};
  const correct = puzzle.correct || 0;

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none">
      <div className="bg-black/80 border-2 border-dnd-gold px-10 py-5 rounded-2xl mb-8">
        <h2 className="text-5xl font-serif text-dnd-gold flex items-center gap-4">
          <Sparkles size={40} /> Ingredient Hunt!
        </h2>
      </div>
      <div className="flex gap-16">
        {RECIPE_BOWLS.map(bowl => (
          <div key={bowl.id} className="w-72 min-h-[300px] bg-gray-900/80 rounded-3xl border-4 border-dnd-gold/60 p-6 flex flex-col items-center">
            <p className="text-4xl mb-4">{bowl.label}</p>
            <div className="space-y-3 flex-1">
              {INGREDIENTS.filter(i => placed[i.id] === bowl.id).map(i => {
                const isCorrect = i.bowl === bowl.id;
                return (
                  <div key={i.id} className={`text-3xl px-6 py-3 rounded-xl border-2 ${isCorrect ? 'bg-green-900/80 border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.4)]' : 'bg-red-900/80 border-red-400'}`}>
                    {i.label} {isCorrect && '✨'}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {correct === INGREDIENTS.length && (
        <div className="mt-8 animate-bounce">
          <div className="bg-green-900/90 border-4 border-green-400 px-12 py-6 rounded-2xl shadow-[0_0_80px_rgba(74,222,128,0.5)]">
            <p className="text-6xl font-bold text-green-300">🎉 Perfect Recipe!</p>
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// PUZZLE 5: Glade Firefly Catch
// ═══════════════════════════════════════════════════════════════════

const FIREFLY_POSITIONS = [
  { id: 0, x: 20, y: 25 },
  { id: 1, x: 50, y: 15 },
  { id: 2, x: 75, y: 30 },
  { id: 3, x: 30, y: 60 },
  { id: 4, x: 60, y: 55 },
  { id: 5, x: 80, y: 70 },
];

function FirefliesDM({ puzzle, onUpdate }) {
  const released = puzzle.released ?? 0;
  const caught = puzzle.caught || [];
  const active = puzzle.active;

  const releaseNext = () => {
    if (released >= FIREFLY_POSITIONS.length) return;
    onUpdate({ ...puzzle, released: released + 1, active: released });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 uppercase tracking-widest">Firefly Catch</p>
      <div className="grid grid-cols-3 gap-1">
        {FIREFLY_POSITIONS.map(f => (
          <div key={f.id} className={`text-center py-1 rounded text-xs ${
            caught.includes(f.id) ? 'bg-green-900/50 text-green-300' :
            active === f.id ? 'bg-yellow-900/50 text-yellow-300 animate-pulse' :
            f.id < released ? 'bg-red-900/50 text-red-300' :
            'bg-gray-800 text-gray-500'
          }`}>
            {caught.includes(f.id) ? '✓' : active === f.id ? '✦' : f.id < released ? '✗' : '·'}
          </div>
        ))}
      </div>
      <button onClick={releaseNext} disabled={active !== null && active !== undefined || released >= FIREFLY_POSITIONS.length}
        className="w-full px-2 py-1.5 bg-yellow-900 hover:bg-yellow-800 border border-yellow-600 rounded text-xs font-bold text-yellow-200 disabled:opacity-30">
        ✦ Release Next Firefly ({released}/{FIREFLY_POSITIONS.length})
      </button>
      <p className="text-xs text-dnd-gold font-bold">Caught: {caught.length}/{FIREFLY_POSITIONS.length}</p>
    </div>
  );
}

function FirefliesPlayer({ puzzle, onUpdate }) {
  const caught = puzzle.caught || [];
  const active = puzzle.active;

  React.useEffect(() => {
    if (active === null || active === undefined) return;
    const timer = setTimeout(() => {
      onUpdate({ ...puzzle, active: null });
    }, 3000);
    return () => clearTimeout(timer);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  const catchFirefly = (id) => {
    if (id !== active) return;
    onUpdate({ ...puzzle, caught: [...caught, id], active: null });
  };

  return (
    <div className="absolute inset-0 z-40 bg-gray-950/80">
      <div className="absolute top-8 left-0 right-0 flex justify-center">
        <div className="bg-black/80 border-2 border-yellow-400 px-10 py-5 rounded-2xl">
          <h2 className="text-5xl font-serif text-yellow-300 flex items-center gap-4">
            <Sparkles size={40} /> Catch the Fireflies!
          </h2>
          <p className="text-2xl text-yellow-400 mt-2 text-center">Caught: {caught.length}/{FIREFLY_POSITIONS.length}</p>
        </div>
      </div>
      {FIREFLY_POSITIONS.map(f => {
        const isCaught = caught.includes(f.id);
        const isActive = active === f.id;
        return (
          <button key={f.id}
            onClick={() => catchFirefly(f.id)}
            disabled={!isActive}
            className={`absolute w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500 ${
              isCaught ? 'bg-green-400/60 border-4 border-green-300 shadow-[0_0_40px_rgba(74,222,128,0.6)]' :
              isActive ? 'bg-yellow-300/80 border-4 border-yellow-200 shadow-[0_0_60px_rgba(250,204,21,0.8)] animate-pulse cursor-pointer scale-110' :
              'bg-gray-800/30 border-2 border-gray-700'
            }`}
            style={{ left: `${f.x}%`, top: `${f.y}%` }}
          >
            <span className="text-4xl">{isCaught ? '🟢' : isActive ? '✦' : ''}</span>
          </button>
        );
      })}
      {caught.length === FIREFLY_POSITIONS.length && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center animate-bounce">
          <div className="bg-green-900/90 border-4 border-green-400 px-12 py-6 rounded-2xl shadow-[0_0_80px_rgba(74,222,128,0.5)]">
            <p className="text-6xl font-bold text-green-300">🌟 All Fireflies Caught!</p>
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// PUZZLE 6: Goblin Camp Sneak Path
// ═══════════════════════════════════════════════════════════════════

const SAFE_ROUTE = [1, 0, 2, 1];
const ROUTE_EMOJIS = ['🌿', '🍂', '🌲'];
const ROUTE_LABELS = ['Left', 'Middle', 'Right'];

function SneakDM({ puzzle, onUpdate }) {
  const currentCheckpoint = puzzle.currentCheckpoint ?? 0;
  const alerts = puzzle.alerts ?? 0;
  const success = puzzle.success ?? false;

  const resetSneak = () => {
    onUpdate({ ...puzzle, currentCheckpoint: 0, alerts: 0, success: false });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 uppercase tracking-widest">Sneak Path — Answer Key</p>
      <div className="space-y-1">
        {SAFE_ROUTE.map((safe, ri) => (
          <div key={ri} className={`flex gap-1 ${ri === currentCheckpoint && !success ? 'ring-1 ring-dnd-gold rounded' : ''}`}>
            {[0, 1, 2].map(si => (
              <div key={si} className={`flex-1 text-center py-1 rounded text-xs ${
                si === safe ? 'bg-green-900/60 text-green-300 font-bold' :
                'bg-gray-900 text-gray-600'
              }`}>
                {ROUTE_EMOJIS[si]} {si === safe ? '✓' : ''}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-2 text-xs">
        <span className={`px-2 py-0.5 rounded ${success ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'}`}>
          {success ? '✓ Sneaked through!' : `Checkpoint ${currentCheckpoint + 1}/4`}
        </span>
        <span className="px-2 py-0.5 rounded bg-red-900/50 text-red-300">⚠ {alerts} alerts</span>
        <button onClick={resetSneak} className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded">
          Reset
        </button>
      </div>
    </div>
  );
}

function SneakPlayer({ puzzle, onUpdate }) {
  const currentCheckpoint = puzzle.currentCheckpoint ?? 0;
  const alerts = puzzle.alerts ?? 0;
  const success = puzzle.success ?? false;
  const [snap, setSnap] = React.useState(false);

  const pickRoute = (checkpoint, route) => {
    if (success || checkpoint !== currentCheckpoint) return;
    if (route === SAFE_ROUTE[checkpoint]) {
      const nextCheckpoint = checkpoint + 1;
      onUpdate({
        ...puzzle,
        currentCheckpoint: nextCheckpoint,
        success: nextCheckpoint >= SAFE_ROUTE.length,
      });
    } else {
      setSnap(true);
      setTimeout(() => setSnap(false), 1000);
      onUpdate({ ...puzzle, alerts: alerts + 1 });
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center">
      <div className="bg-black/80 border-2 border-green-700 px-10 py-5 rounded-2xl mb-8">
        <h2 className="text-5xl font-serif text-green-300 flex items-center gap-4">
          <Eye size={40} /> Sneak Past the Goblins!
        </h2>
        <p className="text-2xl text-green-400 mt-2 text-center">Choose the safe path at each checkpoint</p>
      </div>
      <div className="space-y-6 w-[700px]">
        {SAFE_ROUTE.map((_, ri) => (
          <div key={ri} className={`flex gap-6 justify-center transition-all duration-500 ${
            ri === currentCheckpoint && !success ? 'scale-110' : ri < currentCheckpoint ? 'opacity-60 scale-95' : 'opacity-40 scale-90'
          }`}>
            {[0, 1, 2].map(si => {
              const isPast = ri < currentCheckpoint;
              const isCorrectPast = isPast && si === SAFE_ROUTE[ri];
              return (
                <button key={si} onClick={() => pickRoute(ri, si)}
                  disabled={ri !== currentCheckpoint || success}
                  className={`w-40 h-28 rounded-2xl text-5xl flex flex-col items-center justify-center border-4 transition-all ${
                    isCorrectPast ? 'bg-green-900/80 border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.4)]' :
                    isPast ? 'bg-gray-900/60 border-gray-700 opacity-40' :
                    ri === currentCheckpoint && !success ? 'bg-gray-800/90 border-gray-500 hover:border-green-400 hover:scale-110 cursor-pointer' :
                    'bg-gray-900/60 border-gray-700'
                  }`}>
                  <span>{ROUTE_EMOJIS[si]}</span>
                  <span className="text-lg text-gray-400">{ROUTE_LABELS[si]}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {snap && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-red-900/90 border-4 border-red-400 px-12 py-6 rounded-2xl animate-bounce">
            <p className="text-6xl font-bold text-red-300">💥 Snap! Twig breaks!</p>
          </div>
        </div>
      )}
      {success && (
        <div className="mt-8 animate-bounce">
          <div className="bg-green-900/90 border-4 border-green-400 px-12 py-6 rounded-2xl shadow-[0_0_80px_rgba(74,222,128,0.5)]">
            <p className="text-6xl font-bold text-green-300">🤫 Silent as a shadow!</p>
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// PUZZLE 7: Caves Crystal Melody (Simon Says)
// ═══════════════════════════════════════════════════════════════════

const CRYSTAL_COLORS = [
  { name: 'Red', bg: 'bg-red-600', glow: 'shadow-[0_0_60px_rgba(239,68,68,0.8)]', border: 'border-red-400', lit: 'bg-red-400' },
  { name: 'Blue', bg: 'bg-blue-600', glow: 'shadow-[0_0_60px_rgba(96,165,250,0.8)]', border: 'border-blue-400', lit: 'bg-blue-400' },
  { name: 'Green', bg: 'bg-green-600', glow: 'shadow-[0_0_60px_rgba(74,222,128,0.8)]', border: 'border-green-400', lit: 'bg-green-400' },
  { name: 'Purple', bg: 'bg-purple-600', glow: 'shadow-[0_0_60px_rgba(168,85,247,0.8)]', border: 'border-purple-400', lit: 'bg-purple-400' },
];

function MelodyDM({ puzzle, onUpdate }) {
  const sequence = puzzle.sequence || [];
  const phase = puzzle.phase || 'play';

  const addNote = () => {
    const next = Math.floor(Math.random() * 4);
    onUpdate({ ...puzzle, sequence: [...sequence, next], playerInput: [], phase: 'watch', showIndex: 0 });
  };

  const showSequence = () => {
    onUpdate({ ...puzzle, playerInput: [], phase: 'watch', showIndex: 0 });
  };

  const resetMelody = () => {
    onUpdate({ sequence: [], playerInput: [], phase: 'play', showIndex: -1 });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 uppercase tracking-widest">Crystal Melody</p>
      <div className="flex gap-1 flex-wrap">
        {sequence.map((ci, i) => (
          <span key={i} className={`w-5 h-5 rounded-full ${CRYSTAL_COLORS[ci].bg}`} title={CRYSTAL_COLORS[ci].name} />
        ))}
        {sequence.length === 0 && <span className="text-xs text-gray-500">No notes yet</span>}
      </div>
      <div className="flex gap-1">
        <button onClick={addNote}
          className="flex-1 px-2 py-1 bg-purple-900 hover:bg-purple-800 border border-purple-600 rounded text-xs font-bold">
          + Add Note
        </button>
        <button onClick={showSequence} disabled={sequence.length === 0}
          className="flex-1 px-2 py-1 bg-blue-900 hover:bg-blue-800 border border-blue-600 rounded text-xs disabled:opacity-30">
          Show Sequence
        </button>
        <button onClick={resetMelody}
          className="px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs">
          Reset
        </button>
      </div>
      <p className="text-xs text-gray-400">Phase: <span className="text-dnd-gold">{phase}</span> | Notes: {sequence.length}</p>
    </div>
  );
}

function MelodyPlayer({ puzzle, onUpdate }) {
  const sequence = puzzle.sequence || [];
  const playerInput = puzzle.playerInput || [];
  const phase = puzzle.phase || 'play';
  const showIndex = puzzle.showIndex ?? -1;

  React.useEffect(() => {
    if (phase !== 'watch' || showIndex < 0) return;
    if (showIndex >= sequence.length) {
      const timer = setTimeout(() => {
        onUpdate({ ...puzzle, phase: 'play', showIndex: -1, playerInput: [] });
      }, 600);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      onUpdate({ ...puzzle, showIndex: showIndex + 1 });
    }, 800);
    return () => clearTimeout(timer);
  }, [phase, showIndex, sequence.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlay = (colorIdx) => {
    if (phase !== 'play' || sequence.length === 0) return;
    const nextInput = [...playerInput, colorIdx];
    const step = nextInput.length - 1;
    if (nextInput[step] !== sequence[step]) {
      onUpdate({ ...puzzle, playerInput: nextInput, phase: 'fail' });
      return;
    }
    if (nextInput.length === sequence.length) {
      onUpdate({ ...puzzle, playerInput: nextInput, phase: 'success' });
    } else {
      onUpdate({ ...puzzle, playerInput: nextInput });
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center">
      <div className="bg-black/80 border-2 border-purple-500 px-10 py-5 rounded-2xl mb-8">
        <h2 className="text-5xl font-serif text-purple-300 flex items-center gap-4">
          <Music size={40} /> Crystal Melody!
        </h2>
        <p className="text-2xl text-purple-400 mt-2 text-center">
          {phase === 'watch' ? 'Watch the sequence...' :
           phase === 'play' ? (sequence.length > 0 ? 'Your turn! Repeat the melody' : 'Waiting for the DM...') :
           phase === 'success' ? '✓ Perfect!' : '✗ Wrong note!'}
        </p>
      </div>
      <div className="flex gap-8">
        {CRYSTAL_COLORS.map((c, i) => {
          const isLit = phase === 'watch' && showIndex >= 0 && showIndex < sequence.length && sequence[showIndex] === i;
          return (
            <button key={i} onClick={() => handlePlay(i)}
              disabled={phase !== 'play'}
              className={`w-32 h-32 rounded-full border-4 ${c.border} transition-all duration-300 ${
                isLit ? `${c.lit} ${c.glow} scale-125` : `${c.bg} opacity-70`
              } ${phase === 'play' && sequence.length > 0 ? 'hover:scale-110 cursor-pointer hover:opacity-100' : ''}`}
            >
              <span className="text-3xl font-bold text-white/80">{c.name}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex gap-2">
        {sequence.map((_, i) => (
          <div key={i} className={`w-6 h-6 rounded-full border-2 ${
            i < playerInput.length
              ? (playerInput[i] === sequence[i] ? 'bg-green-500 border-green-300' : 'bg-red-500 border-red-300')
              : 'bg-gray-700 border-gray-500'
          }`} />
        ))}
      </div>
      {phase === 'success' && (
        <div className="mt-8 animate-bounce">
          <div className="bg-green-900/90 border-4 border-green-400 px-12 py-6 rounded-2xl">
            <p className="text-5xl font-bold text-green-300">✨ Melody Complete!</p>
          </div>
        </div>
      )}
      {phase === 'fail' && (
        <div className="mt-8 animate-bounce">
          <div className="bg-red-900/90 border-4 border-red-400 px-12 py-6 rounded-2xl">
            <p className="text-5xl font-bold text-red-300">💥 Wrong Note! Try Again</p>
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// PUZZLE 8: Ruins Rune Match (Memory Game)
// ═══════════════════════════════════════════════════════════════════

const RUNE_SYMBOLS = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ'];

function createRuneTiles() {
  const tiles = RUNE_SYMBOLS.flatMap((rune, i) => [
    { id: i * 2, rune, flipped: false, matched: false },
    { id: i * 2 + 1, rune, flipped: false, matched: false },
  ]);
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

function RunesDM({ puzzle, onUpdate }) {
  const tiles = puzzle.tiles || [];
  const matches = puzzle.matches ?? 0;

  const resetRunes = () => {
    onUpdate({ tiles: createRuneTiles(), flippedPair: [], matches: 0 });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 uppercase tracking-widest">Rune Match — Answer Key</p>
      <div className="grid grid-cols-4 gap-1">
        {tiles.map((t, i) => (
          <div key={i} className={`text-center py-1 rounded text-sm ${
            t.matched ? 'bg-green-900/50 text-green-300' : 'bg-purple-900/50 text-purple-300'
          }`}>
            {t.rune}
          </div>
        ))}
      </div>
      <div className="flex gap-1 text-xs">
        <span className="px-2 py-0.5 rounded bg-gray-800 text-dnd-gold">{matches}/{RUNE_SYMBOLS.length} pairs</span>
        <button onClick={resetRunes} className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded">
          Reset
        </button>
      </div>
    </div>
  );
}

function RunesPlayer({ puzzle, onUpdate }) {
  const tiles = puzzle.tiles || [];
  const flippedPair = puzzle.flippedPair || [];
  const matches = puzzle.matches ?? 0;

  React.useEffect(() => {
    if (flippedPair.length < 2) return;
    const [a, b] = flippedPair;
    if (tiles[a]?.rune === tiles[b]?.rune) {
      const newTiles = tiles.map((t, i) =>
        i === a || i === b ? { ...t, matched: true, flipped: true } : t
      );
      onUpdate({ ...puzzle, tiles: newTiles, flippedPair: [], matches: matches + 1 });
    } else {
      const timer = setTimeout(() => {
        const newTiles = tiles.map((t, i) =>
          i === a || i === b ? { ...t, flipped: false } : t
        );
        onUpdate({ ...puzzle, tiles: newTiles, flippedPair: [] });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [flippedPair.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const flipTile = (idx) => {
    if (flippedPair.length >= 2 || tiles[idx]?.flipped || tiles[idx]?.matched) return;
    const newTiles = tiles.map((t, i) => i === idx ? { ...t, flipped: true } : t);
    onUpdate({ ...puzzle, tiles: newTiles, flippedPair: [...flippedPair, idx] });
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center">
      <div className="bg-black/80 border-2 border-purple-500 px-10 py-5 rounded-2xl mb-8">
        <h2 className="text-5xl font-serif text-purple-300 flex items-center gap-4">
          <Scroll size={40} /> Rune Match!
        </h2>
        <p className="text-2xl text-purple-400 mt-2 text-center">Find the matching pairs ({matches}/{RUNE_SYMBOLS.length})</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {tiles.map((t, i) => (
          <button key={i} onClick={() => flipTile(i)}
            disabled={t.flipped || t.matched || flippedPair.length >= 2}
            className={`w-28 h-28 rounded-2xl border-4 text-6xl flex items-center justify-center transition-all duration-300 ${
              t.matched ? 'bg-green-900/80 border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.5)]' :
              t.flipped ? 'bg-purple-900/80 border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.5)]' :
              'bg-gray-800/90 border-gray-600 hover:border-purple-400 hover:scale-105 cursor-pointer'
            }`}>
            {t.flipped || t.matched ? t.rune : '?'}
          </button>
        ))}
      </div>
      {matches === RUNE_SYMBOLS.length && (
        <div className="mt-8 animate-bounce">
          <div className="bg-green-900/90 border-4 border-green-400 px-12 py-6 rounded-2xl">
            <p className="text-6xl font-bold text-green-300">✨ All Runes Matched!</p>
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// PUZZLE 9: Camp Star Connect (Constellation)
// ═══════════════════════════════════════════════════════════════════

const STAR_POSITIONS = [
  { x: 20, y: 30 },
  { x: 35, y: 15 },
  { x: 50, y: 25 },
  { x: 65, y: 10 },
  { x: 70, y: 35 },
  { x: 55, y: 50 },
  { x: 35, y: 55 },
];

function StarsDM({ puzzle, onUpdate }) {
  const connected = puzzle.connected || [];
  const complete = puzzle.complete ?? false;

  const resetStars = () => {
    onUpdate({ connected: [], complete: false });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 uppercase tracking-widest">Star Connect — Full Outline</p>
      <div className="relative w-full h-32 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full">
          {STAR_POSITIONS.map((s, i) => {
            if (i === 0) return null;
            const prev = STAR_POSITIONS[i - 1];
            return <line key={i} x1={`${prev.x}%`} y1={`${prev.y}%`} x2={`${s.x}%`} y2={`${s.y}%`} stroke="#d4af37" strokeWidth="2" opacity="0.5" />;
          })}
        </svg>
        {STAR_POSITIONS.map((s, i) => (
          <div key={i} className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-dnd-gold"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}>
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-dnd-gold">{i + 1}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-1 text-xs">
        <span className="px-2 py-0.5 rounded bg-gray-800 text-dnd-gold">
          {complete ? '✓ Complete!' : `${connected.length}/${STAR_POSITIONS.length} stars`}
        </span>
        <button onClick={resetStars} className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded">
          Reset
        </button>
      </div>
    </div>
  );
}

function StarsPlayer({ puzzle, onUpdate }) {
  const connected = puzzle.connected || [];
  const complete = puzzle.complete ?? false;
  const [wrongStar, setWrongStar] = React.useState(null);

  const clickStar = (idx) => {
    if (complete) return;
    const nextExpected = connected.length;
    if (idx === nextExpected) {
      const newConnected = [...connected, idx];
      onUpdate({ ...puzzle, connected: newConnected, complete: newConnected.length === STAR_POSITIONS.length });
    } else {
      setWrongStar(idx);
      setTimeout(() => setWrongStar(null), 600);
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-gray-950">
      <div className="absolute top-8 left-0 right-0 flex justify-center z-10">
        <div className="bg-black/80 border-2 border-dnd-gold px-10 py-5 rounded-2xl">
          <h2 className="text-5xl font-serif text-dnd-gold flex items-center gap-4">
            <Star size={40} /> Connect the Stars!
          </h2>
          <p className="text-2xl text-yellow-400 mt-2 text-center">Click stars in order (1→{STAR_POSITIONS.length})</p>
        </div>
      </div>
      <svg className="absolute inset-0 w-full h-full">
        {connected.map((_, i) => {
          if (i === 0) return null;
          const a = STAR_POSITIONS[connected[i - 1]];
          const b = STAR_POSITIONS[connected[i]];
          return <line key={i} x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`}
            stroke="#d4af37" strokeWidth="4" strokeLinecap="round" />;
        })}
      </svg>
      {STAR_POSITIONS.map((s, i) => {
        const isConnected = connected.includes(i);
        const isWrong = wrongStar === i;
        return (
          <button key={i} onClick={() => clickStar(i)}
            className={`absolute w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 transition-all duration-300 flex items-center justify-center text-3xl font-bold ${
              isConnected ? 'bg-yellow-500 border-yellow-300 shadow-[0_0_40px_rgba(234,179,8,0.6)] text-black' :
              isWrong ? 'bg-red-600 border-red-400 animate-pulse scale-125' :
              'bg-gray-700 border-gray-500 hover:border-yellow-400 hover:scale-110 cursor-pointer text-gray-300'
            }`}
            style={{ left: `${s.x}%`, top: `${s.y}%` }}>
            {i + 1}
          </button>
        );
      })}
      {complete && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center animate-bounce z-10">
          <div className="bg-green-900/90 border-4 border-green-400 px-12 py-6 rounded-2xl shadow-[0_0_80px_rgba(74,222,128,0.5)]">
            <p className="text-6xl font-bold text-green-300">🐉 Dragon Constellation Complete!</p>
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// PUZZLE 10: Peak Dragon's Hoard (Treasure Sort)
// ═══════════════════════════════════════════════════════════════════

const TREASURES = [
  { id: 'crown', label: '👑 Crown', pile: 'village' },
  { id: 'gem', label: '💎 Gem', pile: 'dragon' },
  { id: 'coin', label: '🪙 Coin', pile: 'keep' },
  { id: 'ring', label: '💍 Ring', pile: 'dragon' },
  { id: 'goblet', label: '🏆 Goblet', pile: 'village' },
  { id: 'necklace', label: '📿 Necklace', pile: 'keep' },
];

const TREASURE_PILES = [
  { id: 'village', label: '🏘️ Return to Village' },
  { id: 'dragon', label: '🐉 Give to Dragon' },
  { id: 'keep', label: '🎒 Keep as Reward' },
];

function HoardDM({ puzzle, onUpdate }) {
  const sorted = puzzle.sorted || {};
  const correct = puzzle.correct || 0;

  const resetHoard = () => {
    onUpdate({ ...puzzle, sorted: {}, correct: 0, selected: null });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 uppercase tracking-widest">{"Dragon's Hoard — Answer Key"}</p>
      <div className="space-y-1">
        {TREASURE_PILES.map(pile => (
          <div key={pile.id} className="bg-gray-900 rounded p-1">
            <p className="text-xs text-dnd-gold font-bold">{pile.label}</p>
            <div className="flex gap-1 flex-wrap">
              {TREASURES.filter(t => t.pile === pile.id).map(t => (
                <span key={t.id} className={`text-xs px-1 py-0.5 rounded ${
                  sorted[t.id] === pile.id ? 'bg-green-900/50 text-green-300' : 'bg-gray-800 text-gray-400'
                }`}>
                  {t.label} {sorted[t.id] === pile.id ? '✓' : ''}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 text-xs items-center">
        <p className="text-xs text-dnd-gold font-bold">{correct}/{TREASURES.length} correct</p>
        <button onClick={resetHoard} className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded ml-auto">
          Reset
        </button>
      </div>
    </div>
  );
}

function HoardPlayer({ puzzle, onUpdate }) {
  const sorted = puzzle.sorted || {};
  const correct = puzzle.correct || 0;
  const [selected, setSelected] = React.useState(null);

  const countCorrect = (s) => Object.entries(s).filter(([tId, pId]) =>
    TREASURES.find(t => t.id === tId)?.pile === pId
  ).length;

  const selectTreasure = (treasureId) => {
    if (sorted[treasureId]) return;
    setSelected(treasureId);
  };

  const placeTreasure = (pileId) => {
    if (!selected) return;
    const newSorted = { ...sorted, [selected]: pileId };
    onUpdate({ ...puzzle, sorted: newSorted, correct: countCorrect(newSorted) });
    setSelected(null);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center">
      <div className="bg-black/80 border-2 border-dnd-gold px-10 py-5 rounded-2xl mb-6">
        <h2 className="text-5xl font-serif text-dnd-gold flex items-center gap-4">
          <Trophy size={40} /> {"Dragon's Hoard!"}
        </h2>
        <p className="text-2xl text-yellow-400 mt-2 text-center">Sort the treasures into the right piles</p>
      </div>
      <div className="flex gap-4 flex-wrap justify-center mb-8">
        {TREASURES.filter(t => !sorted[t.id]).map(t => (
          <button key={t.id} onClick={() => selectTreasure(t.id)}
            className={`px-6 py-4 rounded-2xl text-3xl border-4 transition-all ${
              selected === t.id ? 'bg-dnd-gold/20 border-dnd-gold scale-110 shadow-[0_0_30px_rgba(212,175,55,0.5)]' :
              'bg-gray-800/90 border-gray-600 hover:border-dnd-gold hover:scale-105 cursor-pointer'
            }`}>
            {t.label}
          </button>
        ))}
        {TREASURES.every(t => sorted[t.id]) && (
          <p className="text-2xl text-gray-500 italic">All treasures placed!</p>
        )}
      </div>
      <div className="flex gap-8">
        {TREASURE_PILES.map(pile => (
          <button key={pile.id} onClick={() => placeTreasure(pile.id)}
            disabled={!selected}
            className={`w-56 min-h-[220px] rounded-3xl border-4 p-4 flex flex-col items-center transition-all ${
              selected ? 'border-dnd-gold/80 hover:bg-dnd-gold/10 hover:scale-105 cursor-pointer' : 'border-gray-700'
            } bg-gray-900/80`}>
            <p className="text-3xl font-bold mb-3">{pile.label}</p>
            <div className="space-y-2 flex-1">
              {TREASURES.filter(t => sorted[t.id] === pile.id).map(t => {
                const isCorrect = t.pile === pile.id;
                return (
                  <div key={t.id} className={`text-2xl px-4 py-2 rounded-xl border-2 ${
                    isCorrect ? 'bg-green-900/80 border-green-400' : 'bg-red-900/80 border-red-400'
                  }`}>
                    {t.label}
                  </div>
                );
              })}
            </div>
          </button>
        ))}
      </div>
      {correct === TREASURES.length && (
        <div className="mt-8 animate-bounce">
          <div className="bg-green-900/90 border-4 border-green-400 px-12 py-6 rounded-2xl shadow-[0_0_80px_rgba(74,222,128,0.5)]">
            <p className="text-6xl font-bold text-green-300">👑 Treasures Sorted!</p>
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// Puzzle Registry
// ═══════════════════════════════════════════════════════════════════

export const PUZZLES = {
  bakery: {
    id: 'spotlight',
    title: 'Search for Clues',
    icon: Search,
    DMComponent: SpotlightDM,
    PlayerComponent: SpotlightPlayer,
    defaultState: { spotX: 50, spotY: 50, foundClues: [] },
  },
  market: {
    id: 'ingredients',
    title: 'Ingredient Hunt',
    icon: Sparkles,
    DMComponent: IngredientsDM,
    PlayerComponent: IngredientsPlayer,
    defaultState: { placed: {}, correct: 0 },
  },
  woods: {
    id: 'riddle',
    title: "Hoot's Riddle",
    icon: Lightbulb,
    DMComponent: RiddleDM,
    PlayerComponent: RiddlePlayer,
    defaultState: { revealedChars: 0, hintsGiven: 0, solved: false },
  },
  glade: {
    id: 'fireflies',
    title: 'Firefly Catch',
    icon: Sparkles,
    DMComponent: FirefliesDM,
    PlayerComponent: FirefliesPlayer,
    defaultState: { released: 0, caught: [], active: null },
    interactive: true,
  },
  stream: {
    id: 'stones',
    title: 'Glimmer Stream',
    icon: Droplets,
    DMComponent: StonesDM,
    PlayerComponent: StonesPlayer,
    defaultState: { currentRow: 0, splashes: [], crossed: false, selectedStones: [] },
    interactive: true,
  },
  goblin_camp: {
    id: 'sneak',
    title: 'Sneak Path',
    icon: Eye,
    DMComponent: SneakDM,
    PlayerComponent: SneakPlayer,
    defaultState: { currentCheckpoint: 0, alerts: 0, success: false },
    interactive: true,
  },
  caves: {
    id: 'melody',
    title: 'Crystal Melody',
    icon: Music,
    DMComponent: MelodyDM,
    PlayerComponent: MelodyPlayer,
    defaultState: { sequence: [], playerInput: [], phase: 'play', showIndex: -1 },
    interactive: true,
  },
  ruins: {
    id: 'runes',
    title: 'Rune Match',
    icon: Scroll,
    DMComponent: RunesDM,
    PlayerComponent: RunesPlayer,
    defaultState: { tiles: createRuneTiles(), flippedPair: [], matches: 0 },
    interactive: true,
  },
  camp: {
    id: 'stars',
    title: 'Star Connect',
    icon: Star,
    DMComponent: StarsDM,
    PlayerComponent: StarsPlayer,
    defaultState: { connected: [], complete: false },
    interactive: true,
  },
  peak: {
    id: 'hoard',
    title: "Dragon's Hoard",
    icon: Trophy,
    DMComponent: HoardDM,
    PlayerComponent: HoardPlayer,
    defaultState: { sorted: {}, correct: 0 },
    interactive: true,
  },
};
