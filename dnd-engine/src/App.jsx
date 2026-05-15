import React from 'react';
import { useCampaign } from './useCampaign';
import { useAudio } from './useAudio';
import { useOllama } from './useOllama';
import { useMusicDirector } from './useMusicDirector';
import { secureRoll } from './cryptoUtils';
import SceneParticles, { ActionVfx, PingLayer, HandoutOverlay, ReactionLayer } from './SceneEffects';
import { PUZZLES } from './Puzzles';
import CampaignBuilder from './CampaignBuilder';
import { XpBar, LevelUpOverlay, XpToast, DmXpPanel } from './LevelUpOverlay';
import { Sword, Heart, Scroll, Tv, Trophy, FastForward, CheckCircle, Star, RotateCcw, Skull, Zap, BookOpen, Eye, EyeOff, Send, X, Shield, Volume2, VolumeX, Play, Pause, Music, Puzzle, Image as ImageIcon, Wifi, WifiOff, Brain, Crosshair, Sparkles } from 'lucide-react';

/* ─── Error Boundary ─────────────────────────────────────────── */

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error('D&D Engine error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-dnd-dark text-white">
          <div className="text-center p-12">
            <p className="text-6xl mb-6">🐉</p>
            <h1 className="text-3xl font-serif text-dnd-gold mb-4">The Dragon Sneezed!</h1>
            <p className="text-gray-400 mb-8">Something went wrong, but we can fix it.</p>
            <button
              onClick={() => window.location.reload()}
              className="dnd-button px-8 py-3 text-lg"
            >
              Restart Adventure
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Image fallback for offline/broken URLs ─────────────────── */

const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23333' width='100' height='100' rx='50'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='%23d4af37' font-size='36'%3E⚔%3C/text%3E%3C/svg%3E";

function handleImgError(e) {
  e.target.onerror = null;
  e.target.src = FALLBACK_IMG;
}

function buildMusicScreenContext({ scene, gameState, activeTurnEntity, sceneMonsters }) {
  const liveMonsters = sceneMonsters.filter(monster => (gameState.characterHp[monster.id] ?? 0) > 0).length;
  const puzzleLabel = gameState.activePuzzle?.puzzleId || 'none';
  const questToast = gameState.toast?.title || 'none';
  const narration = gameState.narration?.text ? gameState.narration.text.slice(0, 140) : 'none';
  const handout = gameState.activeHandout?.title || gameState.activeHandout?.name || 'none';
  return [
    `Scene ${scene?.title || 'Unknown'} is active`,
    `${liveMonsters} hostile creatures remain in view`,
    `Current mood is ${gameState.audioMood}`,
    `Active turn belongs to ${activeTurnEntity?.name || 'nobody'}`,
    `Puzzle overlay: ${puzzleLabel}`,
    `Handout: ${handout}`,
    `Quest toast: ${questToast}`,
    `Narration excerpt: ${narration}`,
  ].join('. ');
}

const PORTRAITS = [
  // Lily the Silent — Rogue / Thief options
  { label: "Shadow Dancer", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=ShadowDancer&backgroundColor=1a1a2e", group: "Rogue" },
  { label: "Nightblade", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Nightblade&backgroundColor=1a1a2e", group: "Rogue" },
  { label: "Whisper", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=WhisperThief&backgroundColor=2d1b69", group: "Rogue" },
  { label: "Raven", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=RavenRogue&backgroundColor=1a1a2e", group: "Rogue" },
  { label: "Phantom", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=PhantomStep&backgroundColor=2d1b69", group: "Rogue" },
  { label: "Moonthief", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=MoonThief&backgroundColor=1a1a2e", group: "Rogue" },
  { label: "Silent Blade", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=SilentBlade&backgroundColor=2d1b69", group: "Rogue" },
  // Brave Thorne — Fighter / Warrior options
  { label: "Ironheart", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=IronheartFighter&backgroundColor=4a1a1a", group: "Fighter" },
  { label: "Warblade", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Warblade&backgroundColor=4a1a1a", group: "Fighter" },
  { label: "Stoneguard", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=StoneguardAxe&backgroundColor=3d2b1f", group: "Fighter" },
  { label: "Berserker", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=BerserkerRage&backgroundColor=4a1a1a", group: "Fighter" },
  { label: "Axeborn", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=AxebornHero&backgroundColor=3d2b1f", group: "Fighter" },
  { label: "Shield Breaker", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=ShieldBreaker&backgroundColor=4a1a1a", group: "Fighter" },
  { label: "Champion", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=ChampionBrave&backgroundColor=3d2b1f", group: "Fighter" },
  // Valerius the Just — Paladin / Holy Knight options
  { label: "Sunblade", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=SunbladeKnight&backgroundColor=1a3a1a", group: "Paladin" },
  { label: "Radiant", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=RadiantPaladin&backgroundColor=1a2a4a", group: "Paladin" },
  { label: "Crusader", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=HolyCrusader&backgroundColor=1a3a1a", group: "Paladin" },
  { label: "Dawn Knight", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=DawnKnight&backgroundColor=1a2a4a", group: "Paladin" },
  { label: "Templar", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=TemplarJust&backgroundColor=1a3a1a", group: "Paladin" },
  { label: "Devotion", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=DevotionHoly&backgroundColor=1a2a4a", group: "Paladin" },
];

function PortraitGallery({ onSelect, onClose }) {
  const groups = ['Rogue', 'Fighter', 'Paladin'];
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-10">
      <div className="bg-gray-900 border-2 border-dnd-gold rounded-none max-w-4xl w-full p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
        <h2 className="text-2xl font-serif text-dnd-gold mb-6">Choose a Hero Portrait</h2>
        <div className="overflow-y-auto max-h-[60vh] p-2 space-y-6">
          {groups.map(group => (
            <div key={group}>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                <Shield size={14} className="text-dnd-gold" /> {group}
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
                {PORTRAITS.filter(p => p.group === group).map(p => (
                  <button 
                    key={p.url} 
                    onClick={() => onSelect(p.url)}
                    className="group relative rounded-none overflow-hidden border-2 border-transparent hover:border-dnd-gold transition-all"
                  >
                    <img src={p.url} className="w-full aspect-square object-cover rounded-none" alt={p.label} onError={handleImgError} />
                    <p className="text-[9px] text-center text-gray-500 group-hover:text-dnd-gold mt-1 truncate">{p.label}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── DM Console ─────────────────────────────────────────────── */

function DMControl() {
  const {
    campaignData, gameState, sceneMonsters, sync,
    updateGameState, handleHpChange, setHp, setPortrait,
    rollDice, rollSkillCheck, rollSecret,
    nextTurn, awardLoot, setNarration,
    helpAction, snackAction, setPing, setHandout, sendReaction,
    dismissOverlay, startPuzzle, updatePuzzle, endPuzzle, resetGame,
    awardXpAction,
  } = useCampaign();

  const [hpInput, setHpInput] = React.useState({});
  const [narrationText, setNarrationText] = React.useState('');
  const [skillLabel, setSkillLabel] = React.useState('');
  const [lastSecret, setLastSecret] = React.useState(null);
  const [showReset, setShowReset] = React.useState(false);
  const [showPortraits, setShowPortraits] = React.useState(null); // id or null
  const [sideQuestsOpen, setSideQuestsOpen] = React.useState(false);
  const [showPrep, setShowPrep] = React.useState(true);
  const [prepSceneId, setPrepSceneId] = React.useState(null);
  const [showGuide, setShowGuide] = React.useState(false);
  const [aiPromptInput, setAiPromptInput] = React.useState({});
  
  const audio = useAudio();
  const { generateResponse, isGenerating } = useOllama();
  const { generateMusicDirection, isGeneratingMusic, musicError } = useMusicDirector();
  const directorTimerRef = React.useRef(null);
  const directorRequestRef = React.useRef(0);
  const directorInFlightRef = React.useRef(false);
  const directorLastStartRef = React.useRef(0);

  const activeScene = React.useMemo(() =>
    campaignData.scenes.find(s => s.id === gameState.currentSceneId),
    [campaignData.scenes, gameState.currentSceneId]
  );
  const activeTurnEntity = React.useMemo(() =>
    campaignData.characters.find(c => c.id === gameState.activeTurnId) ||
    campaignData.monsters.find(m => m.id === gameState.activeTurnId),
    [campaignData.characters, campaignData.monsters, gameState.activeTurnId]
  );
  const audioSettings = gameState.audioSettings || {};
  const musicScreenContext = React.useMemo(() =>
    buildMusicScreenContext({ scene: activeScene, gameState, activeTurnEntity, sceneMonsters }),
    [activeScene, gameState, activeTurnEntity, sceneMonsters]
  );
  const directorContextKey = React.useMemo(() => JSON.stringify({
    sceneId: gameState.currentSceneId,
    mood: gameState.audioMood,
    activeTurn: activeTurnEntity?.name || 'none',
    puzzle: gameState.activePuzzle?.puzzleId || 'none',
    narration: gameState.narration?.text || 'none',
    recentEvent: gameState.lastRoll?.label || gameState.toast?.message || 'ambient exploration',
    style: audioSettings.style || 'alpha',
    quality: audioSettings.quality || 'full',
    novelty: audioSettings.novelty ?? 0.72,
    contextAware: audioSettings.contextAware ?? true,
    screenContext: audioSettings.contextAware ? musicScreenContext : `Scene ${activeScene?.title || 'Unknown'}`,
  }), [
    activeScene?.title,
    activeTurnEntity?.name,
    audioSettings.contextAware,
    audioSettings.novelty,
    audioSettings.quality,
    audioSettings.style,
    gameState.activePuzzle?.puzzleId,
    gameState.audioMood,
    gameState.currentSceneId,
    gameState.lastRoll?.label,
    gameState.narration?.text,
    gameState.toast?.message,
    musicScreenContext,
  ]);
  const directorContext = React.useMemo(() => {
    if (!activeScene) return null;
    return {
      style: audioSettings.style || 'alpha',
      quality: audioSettings.quality || 'full',
      novelty: audioSettings.novelty ?? 0.72,
      sceneTitle: activeScene.title,
      sceneDescription: activeScene.description,
      mood: gameState.audioMood,
      activeTurn: activeTurnEntity?.name || 'none',
      recentEvent: gameState.lastRoll?.label || gameState.toast?.message || 'ambient exploration',
      narration: gameState.narration?.text || 'none',
      puzzleState: gameState.activePuzzle?.puzzleId || 'none',
      screenContext: audioSettings.contextAware ? musicScreenContext : `Scene ${activeScene.title}`,
    };
  }, [
    activeScene,
    activeTurnEntity?.name,
    audioSettings.contextAware,
    audioSettings.novelty,
    audioSettings.quality,
    audioSettings.style,
    gameState.activePuzzle?.puzzleId,
    gameState.audioMood,
    gameState.lastRoll?.label,
    gameState.narration?.text,
    gameState.toast?.message,
    musicScreenContext,
  ]);

  const handleAiGenerate = React.useCallback(async (entity) => {
    const actionStr = aiPromptInput[entity.id];
    if (!actionStr) return;
    setNarrationText("Generating AI response... (Wait)");
    const response = await generateResponse(entity, activeScene, actionStr);
    setNarrationText(response || "Failed to generate response. Check AI server.");
    setAiPromptInput(prev => ({ ...prev, [entity.id]: '' }));
  }, [aiPromptInput, activeScene, generateResponse]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch(e.key.toLowerCase()) {
        case 'n': nextTurn(); break;
        case 'd': case 'escape': dismissOverlay(); break;
        default: {
          const num = parseInt(e.key);
          if (!isNaN(num) && num >= 1 && num <= campaignData.characters.length) {
            updateGameState({ activeTurnId: campaignData.characters[num - 1]?.id });
          }
          break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextTurn, dismissOverlay, updateGameState, campaignData.characters]);

  // Scene Prep: auto-show on scene change, auto-collapse after 10s
  React.useEffect(() => {
    if (gameState.currentSceneId !== prepSceneId) {
      setShowPrep(true);
      setPrepSceneId(gameState.currentSceneId);
      const timer = setTimeout(() => setShowPrep(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentSceneId, prepSceneId]);

  React.useEffect(() => {
    audio.setVolume(gameState.audioVolume ?? 0.7);
  }, [audio, gameState.audioVolume]);

  React.useEffect(() => {
    if (gameState.audioPlaying) {
      audio.startAmbient(gameState.currentSceneId, gameState.audioMood, gameState.audioSettings, gameState.audioDirector);
    } else {
      audio.stopAmbient();
    }
  }, [audio, gameState.audioDirector, gameState.audioMood, gameState.audioPlaying, gameState.audioSettings, gameState.currentSceneId]);

  React.useEffect(() => {
    if (directorTimerRef.current) {
      clearTimeout(directorTimerRef.current);
      directorTimerRef.current = null;
    }
    if (!gameState.audioPlaying || !audioSettings.llmEnabled || !directorContext) return undefined;

    let cancelled = false;
    const refreshMs = Math.max(8, Number(audioSettings.refreshSeconds) || 24) * 1000;
    const lastGeneratedAt = gameState.audioDirector?.generatedAt || 0;
    const sameContextAsLast =
      gameState.audioDirector?.sceneId === gameState.currentSceneId &&
      gameState.audioDirector?.mood === gameState.audioMood;
    const scheduleNext = () => {
      if (cancelled) return;
      directorTimerRef.current = setTimeout(() => {
        runDirector('refresh');
      }, refreshMs);
    };

    const runDirector = async (reason) => {
      const now = Date.now();
      if (
        directorInFlightRef.current ||
        now - directorLastStartRef.current < 4000 ||
        (sameContextAsLast && now - lastGeneratedAt < refreshMs * 0.9)
      ) return;
      directorInFlightRef.current = true;
      directorLastStartRef.current = now;
      const requestId = ++directorRequestRef.current;
      try {
        const direction = await generateMusicDirection({
          ...directorContext,
        });

        if (cancelled || !direction || requestId !== directorRequestRef.current) return;
        updateGameState({
          audioDirector: {
            ...direction,
            reason,
            sceneId: gameState.currentSceneId,
            mood: gameState.audioMood,
            generatedAt: Date.now(),
            contextSummary: musicScreenContext,
          },
        });
      } finally {
        directorInFlightRef.current = false;
        scheduleNext();
      }
    };

    if (sameContextAsLast && Date.now() - lastGeneratedAt < refreshMs * 0.9) {
      scheduleNext();
      return () => {
        cancelled = true;
        if (directorTimerRef.current) clearTimeout(directorTimerRef.current);
        directorInFlightRef.current = false;
      };
    }

    runDirector('start');

    return () => {
      cancelled = true;
      if (directorTimerRef.current) clearTimeout(directorTimerRef.current);
      directorInFlightRef.current = false;
    };
  }, [
    activeScene,
    audioSettings.llmEnabled,
    audioSettings.refreshSeconds,
    directorContext,
    gameState.audioPlaying,
    gameState.audioDirector?.generatedAt,
    gameState.audioDirector?.mood,
    gameState.audioDirector?.sceneId,
    gameState.audioMood,
    gameState.currentSceneId,
    directorContextKey,
    generateMusicDirection,
    musicScreenContext,
    updateGameState,
  ]);

  const applyHpDelta = (id, maxHp) => {
    const raw = hpInput[id];
    if (raw === undefined || raw === '') return;
    const val = parseInt(raw, 10);
    if (isNaN(val)) return;
    setHp(id, Math.max(0, Math.min(maxHp, (gameState.characterHp[id] ?? 0) + val)));
    setHpInput(prev => ({ ...prev, [id]: '' }));
  };

  /* ─── Card renderer shared by characters & monsters ─── */
  const EntityCard = ({ entity, isMonster }) => {
    const hp = gameState.characterHp[entity.id] ?? 0;
    const maxHp = entity.maxHp ?? entity.hp;
    const isActive = gameState.activeTurnId === entity.id;
    const portrait = gameState.characterPortraits[entity.id] || entity.image;
    const isDead = isMonster && hp <= 0;

    return (
      <div data-testid={`card-${entity.id}`} className={`dnd-card flex-1 min-w-[300px] max-w-[450px] transition-all ${isDead ? 'opacity-40 grayscale scale-95' : ''} ${isActive ? 'ring-2 ring-white scale-105 z-10' : 'opacity-80 hover:opacity-100'}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative group/portrait">
            <img src={portrait} alt={entity.name} className={`w-16 h-16 rounded-none border-2 shadow-[4px_4px_0px_rgba(0,0,0,1)] object-cover ${isMonster ? 'border-red-500' : 'border-dnd-gold'}`} onError={handleImgError} />
            {!isMonster && (
              <button 
                onClick={() => setShowPortraits(entity.id)}
                className="absolute inset-0 bg-black/60 rounded-none opacity-0 group-hover/portrait:opacity-100 flex items-center justify-center text-[10px] font-bold text-white transition-opacity"
              >CHANGE</button>
            )}
          </div>
          <div>
            <h3 className="font-bold text-xl text-dnd-gold">{entity.name}</h3>
            {entity.class && <p className="text-xs text-gray-400 italic tracking-widest">{entity.class.toUpperCase()}</p>}
            {isMonster && <p className="text-xs text-red-400 italic tracking-widest flex items-center gap-1"><Skull size={10} /> MONSTER</p>}
          </div>
        </div>

        {/* HP display */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Heart className={`${isMonster ? 'text-red-400 fill-red-400' : 'text-red-500 fill-red-500'}`} size={18} />
            <span data-testid={`hp-${entity.id}`} className="font-bold text-3xl">{hp}</span>
            <span className="text-gray-500 text-sm">/ {maxHp}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleHpChange(entity.id, -1)} className="w-10 h-10 rounded-none bg-red-900/50 hover:bg-red-800 border border-red-500 flex items-center justify-center font-bold">-</button>
            <button onClick={() => handleHpChange(entity.id, 1)} className="w-10 h-10 rounded-none bg-green-900/50 hover:bg-green-800 border border-green-500 flex items-center justify-center font-bold">+</button>
          </div>
        </div>

        {/* Quick HP delta */}
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            placeholder="±HP"
            value={hpInput[entity.id] || ''}
            onChange={e => setHpInput(prev => ({ ...prev, [entity.id]: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && applyHpDelta(entity.id, maxHp)}
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-center"
          />
          <button
            onClick={() => applyHpDelta(entity.id, maxHp)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs border border-gray-500"
          >Apply</button>
        </div>

        {isDead && (
          <button
            onClick={() => setHp(entity.id, entity.maxHp ?? entity.hp)}
            className="w-full mb-4 px-3 py-2 bg-green-900/40 hover:bg-green-800 border border-green-600 rounded text-xs font-bold text-green-300 flex items-center justify-center gap-2"
          >
            <RotateCcw size={12} /> Revive ({entity.maxHp ?? entity.hp} HP)
          </button>
        )}

        {/* Actions */}
        {entity.actions && (
          <div className="space-y-2 mb-4">
            {entity.actions.map(action => (
              <button
                key={action.name}
                onClick={() => {
                  let targetId = null;
                  if (isMonster) {
                    const activeChar = campaignData.characters.find(c => c.id === gameState.activeTurnId);
                    targetId = activeChar?.id || campaignData.characters[0]?.id;
                  } else {
                    targetId = sceneMonsters.find(m => (gameState.characterHp[m.id] ?? m.hp) > 0)?.id;
                  }
                  rollDice(action.bonus, `${entity.name}: ${action.name}`, action.damage, targetId);
                }}
                className="w-full text-left p-2 bg-gray-800 hover:bg-black rounded text-xs border border-gray-700 hover:border-dnd-gold transition-all flex justify-between group"
              >
                <span>
                  {action.name.match(/bow|shoot|arrow/i) ? <Crosshair size={12} className="inline mr-2 text-gray-500 group-hover:text-dnd-gold" /> :
                   action.name.match(/smite|magic|spell/i) ? <Sparkles size={12} className="inline mr-2 text-gray-500 group-hover:text-dnd-gold" /> :
                   <Sword size={12} className="inline mr-2 text-gray-500 group-hover:text-dnd-gold" />}
                  {action.name}
                </span>
                <span className="text-dnd-gold">+{action.bonus} <span className="text-gray-500 ml-1">({action.damage})</span></span>
              </button>
            ))}
          </div>
        )}

        {/* Heroic Actions */}
        {!isMonster && (
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => helpAction(entity.name, activeTurnEntity?.name)}
              className="flex-1 px-3 py-1.5 bg-blue-900/40 hover:bg-blue-800 border border-blue-600 rounded-none text-[10px] font-bold text-blue-300 flex items-center justify-center gap-1"
            >
              <Sparkles size={10} /> Lucky Roll!
            </button>
            <button
              onClick={() => snackAction(entity.id, entity.name)}
              className="flex-1 px-3 py-1.5 bg-green-900/40 hover:bg-green-800 border border-green-600 rounded-none text-[10px] font-bold text-green-300 flex items-center justify-center gap-1"
            >
              <Heart size={10} /> Snack
            </button>
          </div>
        )}

        {/* Universal Voice / AI Controls */}
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-700">
          <div className="flex gap-1">
            <input
              type="text"
              placeholder={isMonster ? "Ask AI or Type to Speak..." : "Type to Speak..."}
              value={aiPromptInput[entity.id] || ''}
              onChange={e => setAiPromptInput(prev => ({ ...prev, [entity.id]: e.target.value }))}
              onKeyDown={e => { 
                if (e.key === 'Enter') {
                  const text = aiPromptInput[entity.id];
                  if (text) {
                    setNarration(text, text.length * 100, isMonster ? 'monster' : 'character');
                    setAiPromptInput(prev => ({ ...prev, [entity.id]: '' }));
                  }
                }
              }}
              className="flex-1 bg-gray-900 border border-gray-600 focus:border-white rounded-none px-2 py-1.5 text-[10px] text-white placeholder-gray-500 font-mono"
              disabled={isGenerating}
            />
            <button
              onClick={() => {
                const text = aiPromptInput[entity.id];
                if (text) {
                  setNarration(text, text.length * 100, isMonster ? 'monster' : 'character');
                  setAiPromptInput(prev => ({ ...prev, [entity.id]: '' }));
                }
              }}
              className="px-2 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-500 rounded-none text-[10px] font-bold text-white flex items-center justify-center"
              title="Speak text directly"
            >
              <Volume2 size={12} />
            </button>
            {isMonster && (
              <button
                onClick={() => handleAiGenerate(entity)}
                disabled={isGenerating}
                className="px-2 py-1.5 bg-purple-900/40 hover:bg-purple-800 border border-purple-600 rounded-none text-[10px] font-bold text-purple-300 flex items-center justify-center disabled:opacity-50"
                title="Generate AI Response"
              >
                <Brain size={12} className={isGenerating ? "animate-pulse" : ""} />
              </button>
            )}
          </div>
        </div>

        {/* XP Bar (characters only) */}
        {!isMonster && gameState.characterXp && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <XpBar xp={gameState.characterXp[entity.id] ?? 0} characterId={entity.id} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-dnd-dark overflow-hidden">
      {/* ─── Sidebar ─── */}
      <div className="w-72 bg-black p-4 border-r border-dnd-gold overflow-y-auto flex flex-col">
        <h2 className="text-dnd-gold font-bold flex items-center gap-2 mb-4">
          <Scroll size={20} /> Scenes
        </h2>
        <div className="space-y-1 mb-8">
          {campaignData.scenes.map((scene, i) => {
            const prevChapter = i > 0 ? campaignData.scenes[i - 1].chapter : null;
            const showChapter = scene.chapter && scene.chapter !== prevChapter;
            return (
              <React.Fragment key={scene.id}>
                {showChapter && (
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest pt-3 pb-1 border-t border-gray-800 first:border-0 first:pt-0">
                    {scene.chapter}
                  </p>
                )}
                <button
                  onClick={() => {
                    updateGameState({ currentSceneId: scene.id });
                    if (gameState.audioPlaying) {
                      audio.startAmbient(scene.id, gameState.audioMood, gameState.audioSettings, gameState.audioDirector);
                    }
                  }}
                  className={`w-full text-left px-3 py-2 rounded transition-all text-sm ${
                    gameState.currentSceneId === scene.id ? 'bg-dnd-red text-white border-l-4 border-white' : 'hover:bg-gray-800 text-gray-400'
                  }`}
                >
                  {scene.title}
                </button>
              </React.Fragment>
            );
          })}
        </div>


        <h2 className="text-dnd-gold font-bold flex items-center gap-2 mb-4">
          <FastForward size={20} /> Initiative
        </h2>
        <div className="bg-gray-900 p-3 rounded-none border border-gray-700 mb-8">
          <div className="space-y-1 mb-3">
            {[...campaignData.characters, ...sceneMonsters].map(ent => {
              const isActive = gameState.activeTurnId === ent.id;
              const isMon = campaignData.monsters.some(m => m.id === ent.id);
              const isDead = isMon && (gameState.characterHp[ent.id] ?? 0) <= 0;
              const portrait = gameState.characterPortraits[ent.id] || ent.image;
              return (
                <div key={ent.id} className={`flex items-center gap-2 px-2 py-1 rounded transition-all ${isActive ? 'bg-dnd-gold/20 border border-dnd-gold' : 'opacity-50'}`}>
                  <img src={portrait} alt={ent.name} className="w-6 h-6 rounded-none object-cover" onError={handleImgError} />
                  <span className={`text-xs font-medium truncate ${isDead ? 'line-through opacity-30' : ''} ${isMon ? 'text-red-400' : 'text-white'}`}>{ent.name}</span>
                  {isActive && <span className="ml-auto text-[10px] text-dnd-gold uppercase">Active</span>}
                </div>
              );
            })}
          </div>
          <button
            onClick={nextTurn}
            className="w-full dnd-button flex items-center justify-center gap-2 text-sm py-2"
          >
            Next Turn <FastForward size={16} />
          </button>
          {gameState.hasAdvantage && (
            <div className="mb-6 p-3 bg-blue-900/40 border-2 border-blue-500 rounded text-center text-blue-300 font-bold uppercase tracking-widest animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              ✨ {campaignData.characters.find(c => c.id === gameState.hasAdvantage)?.name} has a Lucky Roll!
            </div>
          )}
        </div>

        <h2 className="text-dnd-gold font-bold flex items-center gap-2 mb-4">
          <Trophy size={20} /> Quest Log
        </h2>
        <div className="space-y-1 mb-2">
          {campaignData.quests.filter(q => q.type === 'main').map(quest => (
            <button
              key={quest.id}
              disabled={gameState.completedQuests.includes(quest.id)}
              onClick={() => awardLoot(quest.id)}
              className={`w-full text-left px-3 py-2 rounded text-xs flex justify-between items-center transition-all ${
                gameState.completedQuests.includes(quest.id)
                  ? 'bg-green-900/30 border border-green-500 text-green-400'
                  : 'bg-gray-800 border border-dnd-gold/40 hover:border-dnd-gold'
              }`}
            >
              <span>⭐ {quest.title}</span>
              {gameState.completedQuests.includes(quest.id) ? <CheckCircle size={14} /> : <Star size={14} className="text-dnd-gold" />}
            </button>
          ))}
        </div>
        {/* Side Quests — collapsible */}
        {(() => {
          const sideQuests = campaignData.quests.filter(q => q.type === 'side');
          const completedSide = sideQuests.filter(q => gameState.completedQuests.includes(q.id)).length;
          return (
            <div className="mb-8">
              <button
                onClick={() => setSideQuestsOpen(prev => !prev)}
                className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-gray-200 flex justify-between items-center"
              >
                <span>Side Quests ({completedSide}/{sideQuests.length})</span>
                <span className="text-[10px]">{sideQuestsOpen ? '▲' : '▼'}</span>
              </button>
              {sideQuestsOpen && (
                <div className="space-y-1 mt-1">
                  {sideQuests.map(quest => (
                    <button
                      key={quest.id}
                      disabled={gameState.completedQuests.includes(quest.id)}
                      onClick={() => awardLoot(quest.id)}
                      className={`w-full text-left px-3 py-2 rounded text-xs flex justify-between items-center transition-all ${
                        gameState.completedQuests.includes(quest.id)
                          ? 'bg-green-900/30 border border-green-500 text-green-400'
                          : 'bg-gray-800 border border-gray-700 hover:border-dnd-gold'
                      }`}
                    >
                      <span>{quest.title}</span>
                      {gameState.completedQuests.includes(quest.id) ? <CheckCircle size={14} /> : <Star size={14} className="text-gray-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ─── DM Tools ─── */}
        <h2 className="text-dnd-gold font-bold flex items-center gap-2 mb-4">
          <Zap size={20} /> DM Tools
        </h2>

        {/* Skill Check */}
        <div className="bg-gray-900 p-3 rounded-none border border-gray-700 mb-3">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Skill Check</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Investigation..."
              value={skillLabel}
              onChange={e => setSkillLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (rollSkillCheck(skillLabel), setSkillLabel(''))}
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
            />
            <button
              onClick={() => { rollSkillCheck(skillLabel); setSkillLabel(''); }}
              className="px-3 py-1 bg-dnd-red hover:bg-red-700 rounded text-xs border border-dnd-gold font-bold"
            >d20</button>
          </div>
        </div>

        {/* Secret Roll */}
        <div className="bg-gray-900 p-3 rounded-none border border-gray-700 mb-3">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Secret Roll</p>
          <button
            onClick={() => setLastSecret(rollSecret('DM Secret'))}
            className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs border border-gray-600 flex items-center justify-center gap-2"
          >
            <EyeOff size={14} /> Roll (DM only)
          </button>
          {lastSecret && (
            <p className="text-center mt-2 text-lg font-bold text-dnd-gold">{lastSecret.d20}</p>
          )}
        </div>

        {/* Narration */}
        <div className="bg-gray-900 p-3 rounded-none border border-gray-700 mb-3">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest flex justify-between items-center">
            <span>Narration (TV)</span>
            {activeScene?.introNarration && (
              <button 
                onClick={() => { setNarration(activeScene.introNarration, 20000); }}
                className="text-[10px] bg-dnd-gold/20 text-dnd-gold px-2 py-0.5 rounded border border-dnd-gold/30 hover:bg-dnd-gold/40"
              >📜 Scene Intro</button>
            )}
          </p>
          <textarea
            rows={2}
            placeholder="The door creaks open..."
            value={narrationText}
            onChange={e => setNarrationText(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm mb-2 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setNarration(narrationText, 15000); }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs border border-gray-500 font-bold flex items-center justify-center gap-1"
            >
              <Send size={12} /> Text Only
            </button>
            <button
              onClick={() => { setNarration(narrationText, 15000, activeScene?.aiNarratorVoiceId || 'onyx'); }}
              className="flex-1 px-3 py-1 bg-dnd-red hover:bg-red-700 rounded text-xs border border-dnd-gold font-bold flex items-center justify-center gap-2"
            >
              <Brain size={12} /> Send & Speak (TTS)
            </button>
            <button
              onClick={() => { setNarration(null); setNarrationText(''); }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs border border-gray-500"
            >Clear</button>
          </div>
          <div className="flex gap-1 mt-2">
            {[{label: '10s', ms: 10000}, {label: '30s', ms: 30000}, {label: '∞', ms: 0}].map(opt => (
              <button
                key={opt.label}
                onClick={() => { setNarration(narrationText, opt.ms); }}
                className="flex-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-[10px] border border-gray-600 text-gray-400 hover:text-white"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reactions */}
        <div className="bg-gray-900 p-3 rounded-none border border-gray-700 mb-3">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-1">
            <Zap size={12} /> Quick Reactions
          </p>
          <div className="flex justify-between">
            {['🎉', '❤️', '🌟', '❓', '💀', '🔥', '👏', '😂'].map(emoji => (
              <button 
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="text-xl hover:scale-125 transition-transform"
              >{emoji}</button>
            ))}
          </div>
        </div>

        {/* ─── Puzzle Controls ─── */}
        {(() => {
          const scenePuzzle = PUZZLES[gameState.currentSceneId];
          const activePuzzle = gameState.activePuzzle;
          const isPuzzleActive = activePuzzle && activePuzzle.puzzleId === scenePuzzle?.id;

          if (!scenePuzzle) return (
            <p className="text-xs text-gray-600 italic mb-3 px-1">🔓 No puzzle in this scene.</p>
          );

          const PuzzleIcon = scenePuzzle.icon;
          const DMComp = scenePuzzle.DMComponent;

          return (
            <div className="bg-gray-900 p-3 rounded-none border border-purple-700 mb-3" data-testid="puzzle-controls">
              <p className="text-xs text-purple-400 mb-2 uppercase tracking-widest flex items-center gap-1">
                <Puzzle size={12} /> {scenePuzzle.title}
              </p>
              {!isPuzzleActive ? (
                <button
                  onClick={() => startPuzzle(scenePuzzle.id, gameState.currentSceneId, scenePuzzle.defaultState)}
                  className="w-full px-3 py-2 bg-purple-900 hover:bg-purple-800 border border-purple-500 rounded text-sm font-bold text-purple-200 flex items-center justify-center gap-2"
                  data-testid="start-puzzle"
                >
                  <PuzzleIcon size={16} /> Launch Puzzle
                </button>
              ) : (
                <>
                  <DMComp puzzle={activePuzzle} onUpdate={updatePuzzle} />
                  <button
                    onClick={endPuzzle}
                    className="w-full mt-2 px-3 py-1 bg-red-900 hover:bg-red-800 border border-red-600 rounded text-xs text-red-300"
                    data-testid="end-puzzle"
                  >
                    End Puzzle
                  </button>
                </>
              )}
            </div>
          );
        })()}

        {/* Dismiss Overlay */}
        <button
          onClick={dismissOverlay}
          className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs border border-gray-600 flex items-center justify-center gap-2 mb-3"
        >
          <X size={14} /> Dismiss Overlay
        </button>

        {/* ─── Audio Controls ─── */}
        <div className="bg-gray-900 p-3 rounded-none border border-gray-700 mb-3" data-testid="audio-controls">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-1">
            <Music size={12} /> Ambience
          </p>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => {
                if (gameState.audioPlaying) {
                  audio.stopAmbient();
                  updateGameState({ audioPlaying: false });
                } else {
                  audio.startAmbient(gameState.currentSceneId, gameState.audioMood, gameState.audioSettings, gameState.audioDirector);
                  audio.setVolume(gameState.audioVolume ?? 0.7);
                  updateGameState({ audioPlaying: true });
                }
              }}
              className={`flex-1 px-3 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                gameState.audioPlaying
                  ? 'bg-green-800 border-green-500 text-green-300'
                  : 'bg-gray-800 border-gray-600 hover:border-dnd-gold'
              }`}
              data-testid="audio-toggle"
            >
              {gameState.audioPlaying ? <><Pause size={12} /> Playing</> : <><Play size={12} /> Start</>}
            </button>
            <button
              onClick={() => {
                const nextVolume = (gameState.audioVolume ?? 0.7) > 0 ? 0 : 0.7;
                audio.setVolume(nextVolume);
                updateGameState({ audioVolume: nextVolume });
              }}
              className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs hover:border-dnd-gold"
            >
              {(gameState.audioVolume ?? 0.7) > 0 ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          </div>
          <input
            type="range"
            min="0" max="1" step="0.05"
            value={gameState.audioVolume ?? 0.7}
            onChange={e => {
              const v = parseFloat(e.target.value);
              audio.setVolume(v);
              updateGameState({ audioVolume: v });
            }}
            className="w-full mb-2 accent-dnd-gold"
          />
          <div className="flex gap-1">
            {['calm', 'tense', 'combat'].map(mood => (
              <button
                key={mood}
                onClick={() => {
                  updateGameState({ audioMood: mood });
                  if (gameState.audioPlaying) {
                    audio.startAmbient(gameState.currentSceneId, mood, gameState.audioSettings, gameState.audioDirector);
                  }
                }}
                className={`flex-1 px-2 py-1 rounded text-xs capitalize border transition-all ${
                  gameState.audioMood === mood
                    ? 'bg-dnd-red border-dnd-gold text-dnd-gold font-bold'
                    : 'bg-gray-800 border-gray-600 hover:border-gray-500'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <button
              onClick={() => updateGameState({
                audioSettings: {
                  ...(gameState.audioSettings || {}),
                  llmEnabled: !(gameState.audioSettings?.llmEnabled ?? true),
                },
              })}
              className={`px-2 py-1 border ${
                gameState.audioSettings?.llmEnabled ? 'bg-green-900/40 border-green-600 text-green-300' : 'bg-gray-800 border-gray-600'
              }`}
            >
              Director {gameState.audioSettings?.llmEnabled ? 'On' : 'Off'}
            </button>
            <button
              onClick={() => updateGameState({
                audioSettings: {
                  ...(gameState.audioSettings || {}),
                  contextAware: !(gameState.audioSettings?.contextAware ?? true),
                },
              })}
              className={`px-2 py-1 border ${
                gameState.audioSettings?.contextAware ? 'bg-blue-900/40 border-blue-600 text-blue-300' : 'bg-gray-800 border-gray-600'
              }`}
            >
              Context {gameState.audioSettings?.contextAware ? 'On' : 'Off'}
            </button>
            <label className="flex flex-col gap-1">
              <span className="text-gray-500 uppercase tracking-wide">Style</span>
              <select
                value={gameState.audioSettings?.style || 'alpha'}
                onChange={e => updateGameState({
                  audioSettings: { ...(gameState.audioSettings || {}), style: e.target.value },
                })}
                className="bg-gray-800 border border-gray-600 px-2 py-1"
              >
                <option value="alpha">Alpha</option>
                <option value="chiptune">8-Bit</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-gray-500 uppercase tracking-wide">Quality</span>
              <select
                value={gameState.audioSettings?.quality || 'full'}
                onChange={e => updateGameState({
                  audioSettings: { ...(gameState.audioSettings || {}), quality: e.target.value },
                })}
                className="bg-gray-800 border border-gray-600 px-2 py-1"
              >
                <option value="full">Full</option>
                <option value="sketch">Sketch</option>
              </select>
            </label>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-500 mb-1">
              <span>Novelty</span>
              <span>{Math.round((gameState.audioSettings?.novelty ?? 0.72) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2" max="1" step="0.05"
              value={gameState.audioSettings?.novelty ?? 0.72}
              onChange={e => updateGameState({
                audioSettings: {
                  ...(gameState.audioSettings || {}),
                  novelty: parseFloat(e.target.value),
                },
              })}
              className="w-full accent-dnd-gold"
            />
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-500 mb-1">
              <span>Refresh</span>
              <span>{gameState.audioSettings?.refreshSeconds || 24}s</span>
            </div>
            <input
              type="range"
              min="8" max="45" step="1"
              value={gameState.audioSettings?.refreshSeconds || 24}
              onChange={e => updateGameState({
                audioSettings: {
                  ...(gameState.audioSettings || {}),
                  refreshSeconds: parseInt(e.target.value, 10),
                },
              })}
              className="w-full accent-dnd-gold"
            />
          </div>
          <div className="mt-3 text-[10px] text-gray-300 leading-relaxed">
            <p className="text-dnd-gold">Director: {isGeneratingMusic ? 'thinking...' : (gameState.audioDirector?.instrumentBlend || 'idle')}</p>
            <p className="text-gray-300">{musicError ? `Model issue: ${musicError}` : (gameState.audioDirector?.contextSummary || 'Uses synced game context to steer new phrases.')}</p>
          </div>
        </div>

        {/* ─── XP Awards ─── */}
        <div className="bg-gray-900 p-3 rounded-none border border-gray-700 mb-3">
          <DmXpPanel characterXp={gameState.characterXp || {}} onAwardXp={awardXpAction} />
        </div>

        {/* TV View + Reset */}
        <div className="mt-auto space-y-2 pt-4">
          {/* Connection Status */}
          {sync.mode === 'remote' && (
            <div className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded text-xs border ${
              sync.isConnected 
                ? 'bg-green-900/30 border-green-700 text-green-400' 
                : 'bg-red-900/30 border-red-700 text-red-400'
            }`}>
              {sync.isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {sync.isConnected ? `Connected (${sync.clientCount ?? '?'} clients)` : 'Disconnected — reconnecting...'}
            </div>
          )}
          <button
            onClick={() => window.open('/?mode=player', '_blank')}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white p-3 rounded flex items-center justify-center gap-2 border border-gray-600 transition-all"
          >
            <Tv size={18} /> Open TV View
          </button>
          {!showReset ? (
            <button
              onClick={() => setShowReset(true)}
              className="w-full bg-gray-900 hover:bg-red-900/40 text-gray-500 hover:text-red-400 p-2 rounded flex items-center justify-center gap-2 border border-gray-700 transition-all text-xs"
            >
              <RotateCcw size={14} /> Reset Campaign
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => { resetGame(); setShowReset(false); }}
                className="flex-1 bg-red-800 hover:bg-red-700 text-white p-2 rounded text-xs font-bold border border-red-500"
              >Confirm Reset</button>
              <button
                onClick={() => setShowReset(false)}
                className="px-3 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs border border-gray-500"
              >Cancel</button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Main Panel ─── */}
      <div className="flex-1 p-8 overflow-y-auto">
        {showPortraits && (
          <PortraitGallery 
            onClose={() => setShowPortraits(null)} 
            onSelect={(url) => { setPortrait(showPortraits, url); setShowPortraits(null); }} 
          />
        )}
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-4xl font-serif text-dnd-gold italic tracking-tight">{campaignData.campaignName}</h1>
          <div className="bg-gray-800 px-4 py-2 rounded-none flex items-center gap-2 border border-gray-700">
             <div className="w-2 h-2 bg-green-500 rounded-none animate-pulse" />
             <span className="text-sm font-bold tracking-widest text-gray-300">DM CONSOLE v2.0</span>
             <p className="text-[10px] text-gray-500 mt-1 tracking-wider">
               <kbd className="px-1 bg-gray-700 rounded text-gray-400 border border-gray-600">N</kbd> Next Turn
               <span className="mx-1">·</span>
               <kbd className="px-1 bg-gray-700 rounded text-gray-400 border border-gray-600">D</kbd> Dismiss
               <span className="mx-1">·</span>
               <kbd className="px-1 bg-gray-700 rounded text-gray-400 border border-gray-600">1-9</kbd> Select Hero
             </p>
             <button
               onClick={() => setShowGuide(!showGuide)}
               className="ml-4 p-2 bg-blue-900/40 hover:bg-blue-800 text-blue-300 border border-blue-600 rounded-none transition-colors"
               title="Toggle DM Guide"
             >
               <BookOpen size={16} />
             </button>
          </div>
        </header>

        {/* Scene Prep Panel */}
        {activeScene?.dmNotes && (
          <div className={`mb-6 bg-gray-900 border border-amber-700/50 rounded-none overflow-hidden transition-all ${showPrep ? '' : 'cursor-pointer'}`}>
            <button
              onClick={() => setShowPrep(p => !p)}
              className="w-full px-4 py-2 flex justify-between items-center text-sm text-amber-400 hover:bg-gray-800"
            >
              <span className="flex items-center gap-2"><BookOpen size={14} /> Scene Prep: {activeScene.title}</span>
              <span className="text-[10px]">{showPrep ? '▲ Collapse' : '▼ Expand'}</span>
            </button>
            {showPrep && (
              <div className="px-4 pb-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-800 p-2 rounded">
                  <p className="text-gray-500 uppercase tracking-widest mb-1">NPCs</p>
                  <p className="text-gray-300">{activeScene.dmNotes.npcs}</p>
                </div>
                <div className="bg-gray-800 p-2 rounded">
                  <p className="text-gray-500 uppercase tracking-widest mb-1">Tactics</p>
                  <p className="text-gray-300">{activeScene.dmNotes.tactics}</p>
                </div>
                <div className="bg-gray-800 p-2 rounded">
                  <p className="text-gray-500 uppercase tracking-widest mb-1">Quests Available</p>
                  <p className="text-gray-300">{activeScene.dmNotes.questHints}</p>
                </div>
                <div className="bg-amber-900/30 p-2 rounded border border-amber-700/30">
                  <p className="text-amber-400 uppercase tracking-widest mb-1">💡 DM Tip</p>
                  <p className="text-amber-200">{activeScene.dmNotes.tip}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Character Cards */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          {campaignData.characters.map(char => (
            <EntityCard key={char.id} entity={char} isMonster={false} />
          ))}
        </div>

        {/* Monster Cards (scene-relevant) */}
        {sceneMonsters.length > 0 ? (
          <>
            <h2 className="text-xl font-bold text-red-400 flex items-center gap-2 mb-4">
              <Skull size={20} /> Monsters in Scene
            </h2>
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              {sceneMonsters.map(mon => (
                <EntityCard key={mon.id} entity={mon} isMonster={true} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600 italic mb-8">🛡️ No monsters in this scene — safe for roleplay and exploration.</p>
        )}

        {/* Scene Context */}
        <div className="parchment p-8 rounded-none shadow-[4px_4px_0px_rgba(0,0,0,1)] relative overflow-hidden group mb-8 cursor-crosshair active:brightness-95 transition-all"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setPing(x, y);
          }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Scroll size={80} />
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-70 transition-opacity flex items-center gap-1 text-[10px] text-blue-100 font-bold uppercase">
             <Zap size={10} /> Click to Ping TV
          </div>
          <h2 className="text-3xl font-serif font-bold mb-4 border-b-2 border-blue-100 pb-2 text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,0.75)]">{activeScene?.title}</h2>
          <p className="text-xl leading-relaxed text-blue-50 font-medium italic drop-shadow-[1px_1px_0px_rgba(0,0,0,0.8)]">"{activeScene?.description}"</p>
        </div>

        {/* Handouts */}
        <h2 className="text-dnd-gold font-bold flex items-center gap-2 mb-4">
          <Eye size={20} /> Handouts
        </h2>
        <div className="grid grid-cols-2 gap-2 mb-8">
          {[
            { title: "Sun-Cakes", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80" },
            { title: "Dragon Scale", image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80" },
            { title: "The Medal", image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=800&q=80" },
            { title: "Mrs. Crumb", image: "https://api.dicebear.com/7.x/adventurer/svg?seed=Crumb" }
          ].map(h => (
            <button
              key={h.title}
              onClick={() => setHandout(h)}
              className="p-2 bg-gray-900 border border-gray-700 rounded text-[10px] hover:border-dnd-gold transition-all flex flex-col items-center gap-1 text-gray-400 hover:text-dnd-gold"
            >
               <img src={h.image} className="w-12 h-12 rounded object-cover border border-gray-800" alt={h.title} onError={handleImgError} />
               {h.title}
            </button>
          ))}
        </div>

        {/* Combat Log */}
        <div className="bg-gray-900 border border-gray-700 rounded-none p-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <BookOpen size={16} /> Combat Log
          </h2>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {(gameState.rollLog || []).length === 0 && (
              <p className="text-gray-400 text-xs italic">No rolls yet...</p>
            )}
            {(gameState.rollLog || []).map((entry, i) => (
              <div key={entry.id || i} className={`text-xs flex gap-3 py-1 border-b border-gray-800 ${entry.secret ? 'text-purple-400' : 'text-gray-300'}`}>
                <span className="text-gray-600 w-16 shrink-0">{entry.time}</span>
                <span className="flex-1">{entry.label}</span>
                <span className="font-bold">
                  {entry.secret && <EyeOff size={10} className="inline mr-1" />}
                  d20:{entry.d20}
                  {entry.bonus > 0 && `+${entry.bonus}`}
                  ={entry.total}
                  {entry.damage && <span className="text-red-400 ml-2">⚔ {entry.damage.total} dmg</span>}
                  {entry.autoApplied && <span className="text-green-400 ml-1">→ applied</span>}
                  {entry.usedAdvantage && <span className="text-blue-300 ml-1">★ LUCKY</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── DM Guide Sidebar ─── */}
      {showGuide && (
        <div className="w-80 bg-black border-l-4 border-white flex flex-col p-6 overflow-y-auto shadow-[-8px_0px_0px_rgba(0,0,0,1)] z-40 font-sans">
          <div className="flex justify-between items-center mb-6 pb-2 border-b-4 border-white">
            <h2 className="text-xl text-dnd-gold font-sans font-bold">DM Guide</h2>
            <button onClick={() => setShowGuide(false)} className="text-white hover:text-dnd-red"><X /></button>
          </div>
          
          <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
            <section>
              <h3 className="text-white mb-2 text-sm flex items-center gap-2"><BookOpen size={14}/> Setup & Players</h3>
              <p className="mb-2">Click <b className="text-dnd-gold">Campaign Builder</b> (top right menu on launch) to edit characters. Add or delete players as needed!</p>
              <p className="text-[8px] text-gray-500">Note: New custom characters won't have predefined level-up actions unless added to the code.</p>
            </section>
            
            <section>
              <h3 className="text-white mb-2 text-sm flex items-center gap-2"><Sword size={14}/> Combat & Turns</h3>
              <p className="mb-2">Use keys <b className="text-dnd-gold">1-9</b> to quickly select active players.</p>
              <p>Press <b className="text-dnd-gold">N</b> to cycle the next turn.</p>
            </section>

            <section>
              <h3 className="text-white mb-2 text-sm flex items-center gap-2"><Volume2 size={14}/> Voice & AI</h3>
              <p className="mb-2">Type text into the bottom of any Hero or Monster card and click the <b className="text-dnd-gold">Speaker</b> icon.</p>
              <p>The Player TV will instantly read it out loud!</p>
            </section>

            <section>
              <h3 className="text-white mb-2 text-sm flex items-center gap-2"><Trophy size={14}/> XP & Rewards</h3>
              <p>Give XP using the left sidebar. Players level up at <b className="text-dnd-gold">100, 250, 500, and 800 XP</b> automatically!</p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Narration Auto-Dismiss Helper ──────────────────────────── */

function NarrationAutoDismiss({ gameState, updateGameState }) {
  React.useEffect(() => {
    if (!gameState.narration) return;
    const duration = gameState.narration.duration || 15000;
    if (!duration) return; // duration of 0 means infinite
    const timer = setTimeout(() => {
      if (gameState.narration?.id) {
        updateGameState({ narration: null });
      }
    }, duration);
    return () => clearTimeout(timer);
  }, [gameState.narration, gameState.narration?.duration, updateGameState]);
  return null;
}

/* ─── Player View (TV) ───────────────────────────────────────── */

function PlayerView() {
  const { campaignData, gameState, sceneMonsters, updatePuzzle, dismissOverlay, updateGameState } = useCampaign();
  const activeScene = React.useMemo(() =>
    campaignData.scenes.find(s => s.id === gameState.currentSceneId),
    [campaignData.scenes, gameState.currentSceneId]
  );

  const [showRoll, setShowRoll] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [prevSceneId, setPrevSceneId] = React.useState(gameState.currentSceneId);
  const [sceneTransition, setSceneTransition] = React.useState(false);
  const [dicePhase, setDicePhase] = React.useState(null); // 'spin' | 'reveal' | null
  const [diceDisplay, setDiceDisplay] = React.useState(null);
  const [showVfx, setShowVfx] = React.useState(false);
  const audio = useAudio();
  const diceFrameRef = React.useRef(null);

  const activeTurnEntity = React.useMemo(() =>
    campaignData.characters.find(c => c.id === gameState.activeTurnId) ||
    campaignData.monsters.find(m => m.id === gameState.activeTurnId),
    [campaignData.characters, campaignData.monsters, gameState.activeTurnId]
  );

  // Sync ambient with global state
  React.useEffect(() => {
    if (gameState.audioPlaying) {
      audio.startAmbient(gameState.currentSceneId, gameState.audioMood, gameState.audioSettings, gameState.audioDirector);
    } else {
      audio.stopAmbient();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.audioDirector, gameState.audioPlaying, gameState.audioMood, gameState.audioSettings, gameState.currentSceneId]);

  React.useEffect(() => {
    audio.setVolume(gameState.audioVolume ?? 0.7);
  }, [audio, gameState.audioVolume]);

  // Scene transition fade
  React.useEffect(() => {
    if (gameState.currentSceneId !== prevSceneId) {
      setSceneTransition(true);
      const timer = setTimeout(() => {
        setPrevSceneId(gameState.currentSceneId);
        setSceneTransition(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentSceneId, prevSceneId]);

  // Dice roll: animated spin then reveal (keyed by roll ID to prevent duplicate triggers)
  const lastRollId = gameState.lastRoll?.id;
  const lastRoll = gameState.lastRoll;
  React.useEffect(() => {
    if (!lastRoll) return;

    // Start dice animation
    setDicePhase('spin');
    setShowVfx(true);
    audio.sfx('dice');

    let cancelled = false;
    let startTime = null;
    const spinDuration = 1200;
    const roll = gameState.lastRoll;

    const tick = (timestamp) => {
      if (cancelled) return;
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      const interval = 30 + progress * 200;

      setDiceDisplay(secureRoll(20));

      if (progress < 1) {
        diceFrameRef.current = setTimeout(() => requestAnimationFrame(tick), interval);
      } else {
        // Reveal actual result
        setDiceDisplay(roll.d20 || roll.total);
        setDicePhase('reveal');
        setShowRoll(true);

        // Play appropriate SFX on reveal
        if (roll.d20 === 20) audio.sfx('crit');
        else if (roll.d20 === 1) audio.sfx('fail');
        else audio.sfx('reveal');

        // Hide VFX after a beat
        setTimeout(() => { if (!cancelled) setShowVfx(false); }, 2000);
        // Auto-hide roll overlay
        diceFrameRef.current = setTimeout(() => {
          if (!cancelled) {
            setShowRoll(false);
            setDicePhase(null);
          }
        }, 5000);
      }
    };

    requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (diceFrameRef.current) clearTimeout(diceFrameRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastRollId]);

  // Toast (quest complete)
  React.useEffect(() => {
    if (gameState.toast) {
      setShowToast(true);
      audio.sfx('quest');
      const timer = setTimeout(() => setShowToast(false), 6000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.toast]);

  // TTS Voice Playback
  React.useEffect(() => {
    if (!gameState.narration?.text || !gameState.narration?.voiceId) return;

    let cancelled = false;

    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(gameState.narration.text);
      
      // 8-bit retro vibes: Monsters are slow/deep, characters are fast/high
      if (gameState.narration.voiceId === 'monster') {
        utterance.pitch = 0.3;
        utterance.rate = 0.7;
      } else {
        utterance.pitch = 1.4;
        utterance.rate = 1.1;
      }

      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(v => v.lang.startsWith('en'));
      if (engVoice) utterance.voice = engVoice;

      if (!cancelled) window.speechSynthesis.speak(utterance);
    } else {
      console.warn("TTS not supported in this browser.");
    }

    return () => {
      cancelled = true;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [gameState.narration?.id, gameState.narration?.text, gameState.narration?.voiceId]);

  const isNat20 = gameState.lastRoll?.d20 === 20;
  const isNat1 = gameState.lastRoll?.d20 === 1;

  const allEntities = React.useMemo(() => [
    ...campaignData.characters.map(c => ({ ...c, isMonster: false })),
    ...sceneMonsters.map(m => ({ ...m, isMonster: true })),
  ], [campaignData.characters, sceneMonsters]);

   return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Background with crossfade transition */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ${sceneTransition ? 'opacity-0' : 'opacity-100'}`}
        style={{ backgroundImage: `url(${activeScene?.image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-70" />

      {/* Pings, Handouts & Reactions */}
      <PingLayer ping={gameState.ping} />
      <HandoutOverlay handout={gameState.activeHandout} onDismiss={dismissOverlay} />
      <ReactionLayer reaction={gameState.reaction} />

      {/* Scene Particles */}
      <SceneParticles sceneId={gameState.currentSceneId} />

      {/* Narrative Header */}
      <div className="absolute top-12 left-0 right-0 flex justify-center px-12">
        <div className="bg-black/70 backdrop-blur-md border-b-4 border-dnd-gold px-12 py-6 rounded-none shadow-[4px_4px_0px_rgba(0,0,0,1)] text-center">
          <h2 className="text-6xl font-serif text-dnd-gold tracking-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">{activeScene?.title}</h2>
        </div>
      </div>

      {/* YOUR TURN Banner */}
      {activeTurnEntity && (
        <div data-testid="turn-banner" className="absolute top-44 left-0 right-0 flex justify-center pointer-events-none z-20">
          <div className={`px-8 py-3 rounded-none border-2 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all duration-500 ${
            campaignData.characters.some(c => c.id === gameState.activeTurnId)
              ? 'bg-dnd-gold/20 border-dnd-gold'
              : 'bg-red-900/40 border-red-500'
          }`}>
            <p className="text-3xl font-bold tracking-widest text-white drop-shadow-md flex items-center gap-3">
              <Shield size={24} />
              {activeTurnEntity.name.toUpperCase()}'S TURN
            </p>
          </div>
        </div>
      )}

      {/* DM Narration Subtitle */}
      {gameState.narration && (
        <div className="absolute bottom-60 left-0 right-0 flex justify-center px-20 z-30 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-sm px-10 py-5 rounded-none border border-white/20 max-w-4xl">
            <p className="text-4xl text-white font-serif italic text-center leading-relaxed">"{gameState.narration.text}"</p>
          </div>
        </div>
      )}

      {/* Narration auto-dismiss */}
      <NarrationAutoDismiss gameState={gameState} updateGameState={updateGameState} />

      {/* Active Puzzle Overlay (only for current scene) */}
      {gameState.activePuzzle && gameState.activePuzzle.sceneId === gameState.currentSceneId && (() => {
        const puzzleDef = PUZZLES[gameState.activePuzzle.sceneId];
        if (!puzzleDef) return null;
        const PlayerComp = puzzleDef.PlayerComponent;
        return <PlayerComp puzzle={gameState.activePuzzle} onUpdate={updatePuzzle} />;
      })()}

      {/* Quest Completion Toast */}
      {showToast && gameState.toast && (
        <div className="absolute inset-0 flex items-center justify-center z-[60] pointer-events-none px-20 text-center">
           <div className="bg-gradient-to-b from-yellow-400 to-yellow-700 border-8 border-white p-16 rounded-[4rem] shadow-[0_0_100px_rgba(255,255,255,0.4)]">
              <Trophy size={120} className="mx-auto text-white mb-6 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] animate-bounce" />
              <h3 className="text-7xl font-serif text-white mb-4 uppercase tracking-tighter drop-shadow-md">{gameState.toast.title}</h3>
              <p className="text-4xl text-white font-bold bg-black/30 px-8 py-4 rounded-none inline-block">{gameState.toast.message}</p>
           </div>
        </div>
      )}

      {/* Dice Roll Overlay — animated spin then result */}
      {(dicePhase || showRoll) && gameState.lastRoll && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          {/* Action VFX emoji behind dice card */}
          <ActionVfx label={gameState.lastRoll.label} visible={showVfx} />

          <div className={`backdrop-blur-xl p-16 rounded-[3rem] text-center shadow-[0_0_80px_rgba(212,175,55,0.6)] transition-all duration-300 ${
            dicePhase === 'spin' ? 'scale-110' : 'scale-100'
          } ${
            isNat20 ? 'bg-yellow-900/95 border-[6px] border-yellow-400' :
            isNat1 ? 'bg-red-950/95 border-[6px] border-red-500' :
            'bg-black/95 border-[6px] border-dnd-gold'
          }`}>
            <p className="text-3xl text-gray-400 mb-4 uppercase tracking-[0.3em]">{gameState.lastRoll.label}</p>
            <div data-testid="dice-display" className={`text-[12rem] leading-none font-bold mb-8 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transition-all duration-200 ${
              dicePhase === 'spin' ? 'text-gray-400 animate-pulse' :
              isNat20 ? 'text-yellow-300' : isNat1 ? 'text-red-400' : 'text-white'
            }`}>
              {dicePhase === 'spin' ? (diceDisplay ?? '?') : gameState.lastRoll.total}
            </div>
            {dicePhase !== 'spin' && (
              <>
                <div className="text-6xl font-bold text-dnd-gold flex items-center justify-center gap-6 bg-black/40 py-4 px-8 rounded-none border-2 border-dnd-gold/30">
                  <span className="text-5xl" title="Base Roll">🎲</span> {gameState.lastRoll.d20} 
                  <span className="text-5xl opacity-50">+</span> 
                  <span className="text-5xl" title="Bonus">✨</span> {gameState.lastRoll.bonus}
                </div>
                {isNat20 && (
                  <div className="mt-10 text-6xl font-bold text-yellow-400 animate-pulse uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]">✨ Critical Hit! ✨</div>
                )}
                {isNat1 && (
                  <div className="mt-10 text-6xl font-bold text-red-400 animate-pulse uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">💀 Critical Fail! 💀</div>
                )}
                {gameState.lastRoll.damage && (
                  <div className="mt-8 text-4xl font-bold text-red-400">
                    ⚔ {gameState.lastRoll.damage.total} damage
                    <span className="text-xl text-gray-400 ml-3">({gameState.lastRoll.damage.str})</span>
                  </div>
                )}
                {gameState.lastRoll.usedAdvantage && (
                  <div className="mt-4 text-2xl text-blue-300 font-bold uppercase tracking-wider">
                    ✨ LUCKY ROLL! ({gameState.lastRoll.advantageRolls[0]} / {gameState.lastRoll.advantageRolls[1]})
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* XP Overlays */}
      {gameState.levelUp && (
        <LevelUpOverlay
          levelUp={gameState.levelUp}
          onDismiss={() => updateGameState({ levelUp: null })}
        />
      )}
      {gameState.xpGain && (
        <XpToast xpGain={gameState.xpGain} />
      )}

      {/* Hero & Monster Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-12 flex justify-center gap-16 bg-gradient-to-t from-black via-black/80 to-transparent">
        {allEntities.map(entity => {
          const hp = gameState.characterHp[entity.id] ?? 0;
          const maxHp = entity.maxHp ?? entity.hp;
          const hpRatio = maxHp > 0 ? hp / maxHp : 0;
          const isActive = gameState.activeTurnId === entity.id;
          const isBonked = hp <= 0;
          const portrait = gameState.characterPortraits[entity.id] || entity.image;

          return (
            <div key={entity.id} data-testid={`hero-${entity.id}`} className="text-center group">
              <div className={`relative mb-4 transition-all duration-500 ${isActive ? 'scale-125 z-10' : 'opacity-60 scale-100'} ${isBonked ? 'grayscale' : (hpRatio <= 0.5 ? 'sepia-[.50]' : '')}`}>
                {isActive && (
                  <div className={`absolute -inset-4 rounded-none blur-2xl animate-pulse ${entity.isMonster ? 'bg-red-500/30' : 'bg-white/30'}`} />
                )}
                <img
                  src={portrait}
                  alt={`${entity.name} portrait`}
                  onError={handleImgError}
                  className={`w-32 h-32 rounded-none border-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all object-cover ${
                    isActive ? (entity.isMonster ? 'border-red-400 ring-8 ring-red-400/20' : 'border-white ring-8 ring-white/20')
                    : (entity.isMonster ? 'border-red-700' : 'border-dnd-gold')
                  } ${!isBonked && hpRatio <= 0.5 ? 'animate-[pulse_2s_ease-in-out_infinite] ring-4 ring-red-500/50 border-red-500' : ''}`}
                />
                {isBonked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-none border-4 border-red-600">
                    <span className="text-white font-black text-2xl uppercase tracking-tighter rotate-[-15deg]">BONKED</span>
                  </div>
                )}
              </div>

              <p className={`text-2xl font-bold transition-colors ${isActive ? 'text-white scale-110' : 'text-gray-400'}`}>{entity.name}</p>

              {/* HP Bar + Numbers */}
              <div className="w-32 mx-auto mt-2">
                <div className="h-4 bg-gray-900 rounded-none border-2 border-white/20 overflow-hidden shadow-inner">
                  <div
                    className={`h-full transition-all duration-700 ${
                      hpRatio < 0.3 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-green-600 to-green-400'
                    }`}
                    style={{ width: `${Math.max(0, hpRatio * 100)}%` }}
                  />
                </div>
                <p data-testid={`player-hp-${entity.id}`} className="text-sm font-bold mt-1 text-gray-300">{hp} / {maxHp}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── App Router ──────────────────────────────────────────────── */

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');

  return (
    <ErrorBoundary>
      <div className="App">
        {mode === 'player' ? <PlayerView /> : mode === 'builder' ? <CampaignBuilder /> : <DMControl />}
      </div>
    </ErrorBoundary>
  );
}

export default App;
