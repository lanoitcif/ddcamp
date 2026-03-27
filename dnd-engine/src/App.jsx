import React from 'react';
import { useCampaign } from './useCampaign';
import { useAudio } from './useAudio';
import SceneParticles, { ActionVfx } from './SceneEffects';
import { Sword, Heart, Scroll, Tv, Trophy, FastForward, CheckCircle, Star, RotateCcw, Skull, Zap, BookOpen, Eye, EyeOff, Hash, Send, X, Shield, Volume2, VolumeX, Play, Pause, Music } from 'lucide-react';

/* ─── DM Console ─────────────────────────────────────────────── */

function DMControl() {
  const {
    campaignData, gameState, sceneMonsters,
    updateGameState, handleHpChange, setHp,
    rollDice, rollSkillCheck, rollSecret,
    nextTurn, awardLoot, setNarration,
    dismissOverlay, resetGame,
  } = useCampaign();

  const [hpInput, setHpInput] = React.useState({});
  const [narrationText, setNarrationText] = React.useState('');
  const [skillLabel, setSkillLabel] = React.useState('');
  const [lastSecret, setLastSecret] = React.useState(null);
  const [showReset, setShowReset] = React.useState(false);
  const [audioPlaying, setAudioPlaying] = React.useState(false);
  const [audioVolume, setAudioVolume] = React.useState(0.7);
  const [audioMood, setAudioMood] = React.useState('calm');
  const audio = useAudio();

  const activeScene = campaignData.scenes.find(s => s.id === gameState.currentSceneId);
  const activeTurnEntity = campaignData.characters.find(c => c.id === gameState.activeTurnId) ||
                           campaignData.monsters.find(m => m.id === gameState.activeTurnId);

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

    return (
      <div data-testid={`card-${entity.id}`} className={`dnd-card transition-all ${isActive ? 'ring-2 ring-white scale-105 z-10' : 'opacity-80 hover:opacity-100'}`}>
        <div className="flex items-center gap-4 mb-4">
          <img src={entity.image} alt={entity.name} className={`w-16 h-16 rounded-full border-2 shadow-lg ${isMonster ? 'border-red-500' : 'border-dnd-gold'}`} />
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
            <button onClick={() => handleHpChange(entity.id, -1)} className="w-10 h-10 rounded-lg bg-red-900/50 hover:bg-red-800 border border-red-500 flex items-center justify-center font-bold">-</button>
            <button onClick={() => handleHpChange(entity.id, 1)} className="w-10 h-10 rounded-lg bg-green-900/50 hover:bg-green-800 border border-green-500 flex items-center justify-center font-bold">+</button>
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

        {/* Actions */}
        {entity.actions && (
          <div className="space-y-2">
            {entity.actions.map(action => (
              <button
                key={action.name}
                onClick={() => rollDice(action.bonus, `${entity.name}: ${action.name}`, action.damage)}
                className="w-full text-left p-2 bg-gray-800 hover:bg-black rounded text-xs border border-gray-700 hover:border-dnd-gold transition-all flex justify-between group"
              >
                <span><Sword size={12} className="inline mr-2 text-gray-500 group-hover:text-dnd-gold" /> {action.name}</span>
                <span className="text-dnd-gold">+{action.bonus} <span className="text-gray-500 ml-1">({action.damage})</span></span>
              </button>
            ))}
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
        <div className="space-y-2 mb-8">
          {campaignData.scenes.map(scene => (
            <button
              key={scene.id}
              onClick={() => {
                updateGameState({ currentSceneId: scene.id });
                if (audioPlaying) audio.startAmbient(scene.id, audioMood);
              }}
              className={`w-full text-left p-3 rounded transition-all text-sm ${
                gameState.currentSceneId === scene.id ? 'bg-dnd-red text-white border-l-4 border-white' : 'hover:bg-gray-800 text-gray-400'
              }`}
            >
              {scene.title}
            </button>
          ))}
        </div>

        <h2 className="text-dnd-gold font-bold flex items-center gap-2 mb-4">
          <FastForward size={20} /> Initiative
        </h2>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 mb-8">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Active Turn</p>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full border-2 border-dnd-gold bg-black flex items-center justify-center overflow-hidden">
               <img src={activeTurnEntity?.image} alt="" className="w-8 h-8 rounded-full" />
            </div>
            <span className="font-bold text-white truncate">{activeTurnEntity?.name}</span>
          </div>
          <button
            onClick={nextTurn}
            className="w-full dnd-button flex items-center justify-center gap-2 text-sm py-2"
          >
            Next Turn <FastForward size={16} />
          </button>
        </div>

        <h2 className="text-dnd-gold font-bold flex items-center gap-2 mb-4">
          <Trophy size={20} /> Quest Log
        </h2>
        <div className="space-y-2 mb-8">
          {campaignData.quests.map(quest => (
            <button
              key={quest.id}
              disabled={gameState.completedQuests.includes(quest.id)}
              onClick={() => awardLoot(quest.id)}
              className={`w-full text-left p-3 rounded text-xs flex justify-between items-center transition-all ${
                gameState.completedQuests.includes(quest.id)
                  ? 'bg-green-900/30 border border-green-500 text-green-400'
                  : 'bg-gray-800 border border-gray-700 hover:border-dnd-gold'
              }`}
            >
              <span>{quest.title}</span>
              {gameState.completedQuests.includes(quest.id) ? <CheckCircle size={14} /> : <Star size={14} className="text-dnd-gold" />}
            </button>
          ))}
        </div>

        {/* ─── DM Tools ─── */}
        <h2 className="text-dnd-gold font-bold flex items-center gap-2 mb-4">
          <Zap size={20} /> DM Tools
        </h2>

        {/* Skill Check */}
        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 mb-3">
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
        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 mb-3">
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
        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 mb-3">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Narration (TV)</p>
          <textarea
            rows={2}
            placeholder="The door creaks open..."
            value={narrationText}
            onChange={e => setNarrationText(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm mb-2 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setNarration(narrationText); }}
              className="flex-1 px-3 py-1 bg-dnd-red hover:bg-red-700 rounded text-xs border border-dnd-gold font-bold flex items-center justify-center gap-1"
            >
              <Send size={12} /> Send
            </button>
            <button
              onClick={() => { setNarration(null); setNarrationText(''); }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs border border-gray-500"
            >Clear</button>
          </div>
        </div>

        {/* Dismiss Overlay */}
        <button
          onClick={dismissOverlay}
          className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs border border-gray-600 flex items-center justify-center gap-2 mb-3"
        >
          <X size={14} /> Dismiss Overlay
        </button>

        {/* ─── Audio Controls ─── */}
        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 mb-3" data-testid="audio-controls">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-1">
            <Music size={12} /> Ambience
          </p>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => {
                if (audioPlaying) {
                  audio.stopAmbient();
                  setAudioPlaying(false);
                } else {
                  audio.startAmbient(gameState.currentSceneId, audioMood);
                  audio.setVolume(audioVolume);
                  setAudioPlaying(true);
                }
              }}
              className={`flex-1 px-3 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                audioPlaying
                  ? 'bg-green-800 border-green-500 text-green-300'
                  : 'bg-gray-800 border-gray-600 hover:border-dnd-gold'
              }`}
              data-testid="audio-toggle"
            >
              {audioPlaying ? <><Pause size={12} /> Playing</> : <><Play size={12} /> Start</>}
            </button>
            <button
              onClick={() => {
                audio.setVolume(audioVolume > 0 ? 0 : 0.7);
                setAudioVolume(audioVolume > 0 ? 0 : 0.7);
              }}
              className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs hover:border-dnd-gold"
            >
              {audioVolume > 0 ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          </div>
          <input
            type="range"
            min="0" max="1" step="0.05"
            value={audioVolume}
            onChange={e => { const v = parseFloat(e.target.value); setAudioVolume(v); audio.setVolume(v); }}
            className="w-full mb-2 accent-dnd-gold"
          />
          <div className="flex gap-1">
            {['calm', 'tense', 'combat'].map(mood => (
              <button
                key={mood}
                onClick={() => {
                  setAudioMood(mood);
                  updateGameState({ mood });
                  if (audioPlaying) audio.startAmbient(gameState.currentSceneId, mood);
                }}
                className={`flex-1 px-2 py-1 rounded text-xs capitalize border transition-all ${
                  audioMood === mood
                    ? 'bg-dnd-red border-dnd-gold text-dnd-gold font-bold'
                    : 'bg-gray-800 border-gray-600 hover:border-gray-500'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        {/* TV View + Reset */}
        <div className="mt-auto space-y-2 pt-4">
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
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-4xl font-serif text-dnd-gold italic tracking-tight">{campaignData.campaignName}</h1>
          <div className="bg-gray-800 px-4 py-2 rounded-full flex items-center gap-2 border border-gray-700">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             <span className="text-sm font-bold tracking-widest text-gray-300">DM CONSOLE v2.0</span>
          </div>
        </header>

        {/* Character Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {campaignData.characters.map(char => (
            <EntityCard key={char.id} entity={char} isMonster={false} />
          ))}
        </div>

        {/* Monster Cards (scene-relevant) */}
        {sceneMonsters.length > 0 && (
          <>
            <h2 className="text-xl font-bold text-red-400 flex items-center gap-2 mb-4">
              <Skull size={20} /> Monsters in Scene
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {sceneMonsters.map(mon => (
                <EntityCard key={mon.id} entity={mon} isMonster={true} />
              ))}
            </div>
          </>
        )}

        {/* Scene Context */}
        <div className="parchment p-8 rounded-lg shadow-2xl relative overflow-hidden group mb-8">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Scroll size={80} />
          </div>
          <h2 className="text-3xl font-serif font-bold mb-4 border-b-2 border-gray-300 pb-2 text-gray-800">{activeScene?.title}</h2>
          <p className="text-xl leading-relaxed text-gray-700 font-medium italic">"{activeScene?.description}"</p>
        </div>

        {/* Combat Log */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <BookOpen size={16} /> Combat Log
          </h2>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {(gameState.rollLog || []).length === 0 && (
              <p className="text-gray-600 text-xs italic">No rolls yet...</p>
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
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Player View (TV) ───────────────────────────────────────── */

function PlayerView() {
  const { campaignData, gameState, sceneMonsters } = useCampaign();
  const activeScene = campaignData.scenes.find(s => s.id === gameState.currentSceneId);
  const [showRoll, setShowRoll] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [prevSceneId, setPrevSceneId] = React.useState(gameState.currentSceneId);
  const [sceneTransition, setSceneTransition] = React.useState(false);
  const [dicePhase, setDicePhase] = React.useState(null); // 'spin' | 'reveal' | null
  const [diceDisplay, setDiceDisplay] = React.useState(null);
  const [showVfx, setShowVfx] = React.useState(false);
  const audio = useAudio();
  const diceFrameRef = React.useRef(null);

  const activeTurnEntity = campaignData.characters.find(c => c.id === gameState.activeTurnId) ||
                           campaignData.monsters.find(m => m.id === gameState.activeTurnId);

  // Auto-start ambient on player view when mood is sent from DM
  React.useEffect(() => {
    if (gameState.mood) {
      audio.startAmbient(gameState.currentSceneId, gameState.mood);
    }
  }, [gameState.mood, gameState.currentSceneId]);

  // Scene transition fade + ambient scene change
  React.useEffect(() => {
    if (gameState.currentSceneId !== prevSceneId) {
      setSceneTransition(true);
      if (gameState.mood) {
        audio.startAmbient(gameState.currentSceneId, gameState.mood);
      }
      const timer = setTimeout(() => {
        setPrevSceneId(gameState.currentSceneId);
        setSceneTransition(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentSceneId, prevSceneId]);

  // Dice roll: animated spin then reveal
  React.useEffect(() => {
    if (gameState.lastRoll) {
      // Start dice animation
      setDicePhase('spin');
      setShowVfx(true);
      audio.sfx('dice');

      let startTime = null;
      const spinDuration = 1200;

      const tick = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        const interval = 30 + progress * 200;

        setDiceDisplay(Math.floor(Math.random() * 20) + 1);

        if (progress < 1) {
          diceFrameRef.current = setTimeout(() => requestAnimationFrame(tick), interval);
        } else {
          // Reveal actual result
          setDiceDisplay(gameState.lastRoll.d20 || gameState.lastRoll.total);
          setDicePhase('reveal');
          setShowRoll(true);

          // Play appropriate SFX on reveal
          if (gameState.lastRoll.d20 === 20) audio.sfx('crit');
          else if (gameState.lastRoll.d20 === 1) audio.sfx('fail');
          else audio.sfx('reveal');

          // Hide VFX after a beat
          setTimeout(() => setShowVfx(false), 2000);
          // Auto-hide roll overlay
          diceFrameRef.current = setTimeout(() => {
            setShowRoll(false);
            setDicePhase(null);
          }, 5000);
        }
      };

      requestAnimationFrame(tick);

      return () => { if (diceFrameRef.current) clearTimeout(diceFrameRef.current); };
    }
  }, [gameState.lastRoll]);

  // Toast (quest complete)
  React.useEffect(() => {
    if (gameState.toast) {
      setShowToast(true);
      audio.sfx('quest');
      const timer = setTimeout(() => setShowToast(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [gameState.toast]);

  const isNat20 = gameState.lastRoll?.d20 === 20;
  const isNat1 = gameState.lastRoll?.d20 === 1;

  const allEntities = [
    ...campaignData.characters.map(c => ({ ...c, isMonster: false })),
    ...sceneMonsters.map(m => ({ ...m, isMonster: true })),
  ];

   return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Background with crossfade transition */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ${sceneTransition ? 'opacity-0' : 'opacity-100'}`}
        style={{ backgroundImage: `url(${activeScene?.image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-70" />

      {/* Scene Particles */}
      <SceneParticles sceneId={gameState.currentSceneId} />

      {/* Narrative Header */}
      <div className="absolute top-12 left-0 right-0 flex justify-center px-12">
        <div className="bg-black/70 backdrop-blur-md border-b-4 border-dnd-gold px-12 py-6 rounded-xl shadow-2xl text-center">
          <h2 className="text-6xl font-serif text-dnd-gold tracking-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">{activeScene?.title}</h2>
        </div>
      </div>

      {/* YOUR TURN Banner */}
      {activeTurnEntity && (
        <div data-testid="turn-banner" className="absolute top-44 left-0 right-0 flex justify-center pointer-events-none z-20">
          <div className={`px-8 py-3 rounded-full border-2 shadow-lg transition-all duration-500 ${
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
          <div className="bg-black/80 backdrop-blur-sm px-10 py-5 rounded-2xl border border-white/20 max-w-4xl">
            <p className="text-3xl text-white font-serif italic text-center leading-relaxed">"{gameState.narration.text}"</p>
          </div>
        </div>
      )}

      {/* Quest Completion Toast */}
      {showToast && gameState.toast && (
        <div className="absolute inset-0 flex items-center justify-center z-[60] pointer-events-none px-20 text-center">
           <div className="bg-gradient-to-b from-yellow-400 to-yellow-700 border-8 border-white p-16 rounded-[4rem] shadow-[0_0_100px_rgba(255,255,255,0.4)]">
              <Trophy size={120} className="mx-auto text-white mb-6 drop-shadow-lg animate-bounce" />
              <h3 className="text-7xl font-serif text-white mb-4 uppercase tracking-tighter drop-shadow-md">{gameState.toast.title}</h3>
              <p className="text-4xl text-white font-bold bg-black/30 px-8 py-4 rounded-full inline-block">{gameState.toast.message}</p>
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
                <div className="text-5xl font-serif text-dnd-gold flex items-center justify-center gap-4">
                  <span className="opacity-50 text-3xl">d20</span> {gameState.lastRoll.d20} <span className="text-3xl opacity-50">+</span> {gameState.lastRoll.bonus}
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
              </>
            )}
          </div>
        </div>
      )}

      {/* Hero & Monster Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-12 flex justify-center gap-16 bg-gradient-to-t from-black via-black/80 to-transparent">
        {allEntities.map(entity => {
          const hp = gameState.characterHp[entity.id] ?? 0;
          const maxHp = entity.maxHp ?? entity.hp;
          const hpRatio = maxHp > 0 ? hp / maxHp : 0;
          const isActive = gameState.activeTurnId === entity.id;
          const isBonked = hp <= 0;

          return (
            <div key={entity.id} data-testid={`hero-${entity.id}`} className="text-center group">
              <div className={`relative mb-4 transition-all duration-500 ${isActive ? 'scale-125 z-10' : 'opacity-60 scale-100'} ${isBonked ? 'grayscale' : ''}`}>
                {isActive && (
                  <div className={`absolute -inset-4 rounded-full blur-2xl animate-pulse ${entity.isMonster ? 'bg-red-500/30' : 'bg-white/30'}`} />
                )}
                <img
                  src={entity.image}
                  alt={entity.name}
                  className={`w-32 h-32 rounded-full border-4 shadow-2xl transition-all ${
                    isActive ? (entity.isMonster ? 'border-red-400 ring-8 ring-red-400/20' : 'border-white ring-8 ring-white/20')
                    : (entity.isMonster ? 'border-red-700' : 'border-dnd-gold')
                  }`}
                />
                {isBonked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full border-4 border-red-600">
                    <span className="text-white font-black text-2xl uppercase tracking-tighter rotate-[-15deg]">BONKED</span>
                  </div>
                )}
              </div>

              <p className={`text-2xl font-bold transition-colors ${isActive ? 'text-white scale-110' : 'text-gray-400'}`}>{entity.name}</p>

              {/* HP Bar + Numbers */}
              <div className="w-32 mx-auto mt-2">
                <div className="h-4 bg-gray-900 rounded-full border-2 border-white/20 overflow-hidden shadow-inner">
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
    <div className="App">
      {mode === 'player' ? <PlayerView /> : <DMControl />}
    </div>
  );
}

export default App;
