/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { Search, Lightbulb, Footprints, Trophy, Droplets } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// PUZZLE 1: Bakery Spotlight Search
// DM drags a spotlight circle; players see it on the TV.
// When spotlight lands on the hidden clue zone, it glows and reveals.
// ═══════════════════════════════════════════════════════════════════

const CLUE_ZONES = [
  { id: 'flour-trail', x: 22, y: 65, r: 8, label: '🐾 Flour Paw Prints!', hint: 'Look near the flour sacks...' },
  { id: 'crumb-note', x: 72, y: 40, r: 7, label: '📜 A Crumpled Note!', hint: 'Check the counter top...' },
  { id: 'frosting-smear', x: 50, y: 78, r: 9, label: '🐉 Blue Frosting Smear!', hint: 'Something sticky on the floor...' },
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
        {/* Clue zones (visible to DM only) */}
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
        {/* Spotlight indicator */}
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
      {/* Darkness overlay with spotlight cutout */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(circle 180px at ${spotX}% ${spotY}%, transparent 0%, rgba(0,0,0,0.92) 100%)`,
      }} />
      {/* Spotlight glow ring */}
      <div className="absolute w-[360px] h-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-yellow-400/30"
        style={{ left: `${spotX}%`, top: `${spotY}%` }}
      />
      {/* Found clue labels */}
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
      {/* Search prompt */}
      <div className="absolute top-8 left-0 right-0 flex justify-center">
        <div className="bg-black/80 border border-dnd-gold px-8 py-4 rounded-xl">
          <p className="text-3xl font-serif text-dnd-gold flex items-center gap-3">
            <Search size={32} /> Search the Bakery! ({found.length}/{CLUE_ZONES.length} clues)
          </p>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// PUZZLE 2: Hoot's Riddle
// Typewriter-style text reveal with DM-controlled hints.
// ═══════════════════════════════════════════════════════════════════

const RIDDLE = {
  text: "I have cities, but no houses live there.\nI have mountains, but no trees grow there.\nI have water, but no fish swim there.\nWhat am I?",
  answer: "A Map",
  hints: [
    "🦉 Hoot tilts his head... 'Think about what shows you the world without being the world...'",
    "🦉 Hoot ruffles his feathers... 'You carry it in your pack, adventurer!'",
    "🦉 Hoot hoots softly... 'It guides your journey but is made of paper...'",
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

  // Typewriter effect: animate up to revealedChars
  React.useEffect(() => {
    if (displayLen >= revealedChars) return;
    const timer = setTimeout(() => setDisplayLen(prev => Math.min(prev + 1, revealedChars)), 40);
    return () => clearTimeout(timer);
  }, [displayLen, revealedChars]);

  // Jump forward if DM reveals a big chunk
  React.useEffect(() => {
    if (revealedChars > displayLen + 20) {
      setDisplayLen(revealedChars - 8);
    }
  }, [revealedChars, displayLen]);

  const visibleText = RIDDLE.text.slice(0, displayLen);
  const lines = visibleText.split('\n');

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
      <div className="bg-black/90 backdrop-blur-lg p-16 rounded-[3rem] border-4 border-purple-500 shadow-[0_0_100px_rgba(168,85,247,0.3)] max-w-4xl">
        {/* Hoot avatar */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className="text-8xl">🦉</span>
          <h2 className="text-5xl font-serif text-purple-300 italic">Hoot speaks...</h2>
        </div>

        {/* Riddle text with typewriter */}
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

        {/* Hints */}
        {hintsGiven > 0 && (
          <div className="space-y-3 mt-8 border-t border-purple-500/30 pt-6">
            {RIDDLE.hints.slice(0, hintsGiven).map((hint, i) => (
              <p key={i} className="text-2xl text-purple-300 italic text-center">{hint}</p>
            ))}
          </div>
        )}

        {/* Solved state */}
        {solved && (
          <div className="mt-10 text-center animate-bounce">
            <div className="inline-block bg-green-900/80 border-4 border-green-400 px-12 py-6 rounded-2xl shadow-[0_0_60px_rgba(74,222,128,0.4)]">
              <p className="text-6xl font-bold text-green-300">🗺️ {RIDDLE.answer}!</p>
              <p className="text-2xl text-green-400 mt-2">The owl nods wisely!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// PUZZLE 3: Glimmer Stream Stepping Stones
// Timed challenge: pick the right stones to cross.
// Wrong stone = splash animation. Right path = safe crossing.
// ═══════════════════════════════════════════════════════════════════

const STONE_ROWS = [
  { stones: ['🌸', '🍄', '⭐'], safe: 2 },  // row 0 (near side): star is safe
  { stones: ['🌿', '💎', '🔥'], safe: 1 },  // row 1: gem is safe
  { stones: ['🌙', '🦋', '☀️'], safe: 0 },  // row 2: moon is safe
  { stones: ['🪨', '🐸', '🌊'], safe: 0 },  // row 3 (far side): rock is safe
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
        Players choose stones on the TV!
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
      // Correct!
      setCorrectAnim({ row: rowIdx, stone: stoneIdx });
      setTimeout(() => setCorrectAnim(null), 800);

      if (rowIdx >= STONE_ROWS.length - 1) {
        onUpdate({ ...puzzle, currentRow: rowIdx + 1, crossed: true, selectedStones: [...(puzzle.selectedStones || []), [rowIdx, stoneIdx]] });
      } else {
        onUpdate({ ...puzzle, currentRow: rowIdx + 1, selectedStones: [...(puzzle.selectedStones || []), [rowIdx, stoneIdx]] });
      }
    } else {
      // Splash!
      setSplashAnim({ row: rowIdx, stone: stoneIdx });
      setTimeout(() => setSplashAnim(null), 1200);
      onUpdate({ ...puzzle, splashes: [...splashes, [rowIdx, stoneIdx]] });
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center">
      {/* Title */}
      <div className="mb-8">
        <div className="bg-black/80 border-2 border-blue-400 px-10 py-5 rounded-2xl shadow-[0_0_60px_rgba(96,165,250,0.3)]">
          <h2 className="text-5xl font-serif text-blue-300 flex items-center gap-4">
            <Footprints size={40} /> Cross the Glimmer Stream!
          </h2>
          {!crossed && <p className="text-2xl text-blue-400 mt-2 text-center">Pick the safe stone in each row</p>}
        </div>
      </div>

      {/* Stone grid */}
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
                <button
                  key={si}
                  onClick={() => handlePick(ri, si)}
                  disabled={ri !== currentRow || crossed}
                  className={`w-36 h-36 rounded-2xl text-6xl flex items-center justify-center transition-all duration-300 border-4 ${
                    isChosen ? 'bg-green-900/80 border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.5)] scale-105' :
                    isSplashing ? 'bg-blue-600/80 border-blue-300 animate-bounce scale-125' :
                    wasSplash ? 'bg-blue-900/40 border-blue-800 opacity-50' :
                    ri === currentRow && !crossed ? 'bg-gray-800/90 border-gray-500 hover:border-white hover:scale-110 cursor-pointer hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]' :
                    'bg-gray-900/60 border-gray-700'
                  } ${isCorrectAnim ? 'ring-4 ring-green-400 scale-125' : ''}`}
                >
                  {isSplashing ? '💦' : stone}
                </button>
              );
            })}
          </div>
        )).reverse() /* Reverse so far side is at top, near side at bottom */}
      </div>

      {/* Splash effect overlay */}
      {splashAnim && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className="text-[10rem] animate-ping opacity-50">💦</div>
        </div>
      )}

      {/* Victory */}
      {crossed && (
        <div className="mt-8 animate-bounce">
          <div className="bg-green-900/90 border-4 border-green-400 px-12 py-6 rounded-2xl shadow-[0_0_80px_rgba(74,222,128,0.5)]">
            <p className="text-6xl font-bold text-green-300 flex items-center gap-4">
              <Trophy size={48} /> Safe Across!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// Puzzle Registry & Exports
// ═══════════════════════════════════════════════════════════════════

export const PUZZLES = {
  bakery: {
    id: 'spotlight',
    title: 'Search the Bakery',
    icon: Search,
    DMComponent: SpotlightDM,
    PlayerComponent: SpotlightPlayer,
    defaultState: { spotX: 50, spotY: 50, foundClues: [] },
  },
  woods: {
    id: 'riddle',
    title: "Hoot's Riddle",
    icon: Lightbulb,
    DMComponent: RiddleDM,
    PlayerComponent: RiddlePlayer,
    defaultState: { revealedChars: 0, hintsGiven: 0, solved: false },
  },
  peak: {
    id: 'stones',
    title: 'Glimmer Stream',
    icon: Droplets,
    DMComponent: StonesDM,
    PlayerComponent: StonesPlayer,
    defaultState: { currentRow: 0, splashes: [], crossed: false, selectedStones: [] },
    interactive: true, // Player can click
  },
};
