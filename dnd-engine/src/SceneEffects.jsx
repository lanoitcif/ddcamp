import React from 'react';
import { X, Sparkles } from 'lucide-react';

// ─── Scene Particle Configurations ──────────────────────────────

const SCENE_PARTICLES = {
  bakery: [
    { type: 'sparkle', count: 18, color: '#d4af37', size: [3, 7], speed: [15, 30], opacity: [0.3, 0.7] },
    { type: 'rise', count: 10, color: '#ffffff', size: [4, 10], speed: [10, 20], opacity: [0.1, 0.3] },
  ],
  woods: [
    { type: 'firefly', count: 22, color: '#aaff77', size: [3, 6], speed: [8, 18], opacity: [0.2, 0.8] },
    { type: 'fall', count: 14, color: '#22c55e', size: [5, 12], speed: [12, 25], opacity: [0.15, 0.4] },
  ],
  peak: [
    { type: 'snow', count: 30, color: '#ffffff', size: [2, 5], speed: [10, 25], opacity: [0.2, 0.5] },
    { type: 'ember', count: 12, color: '#f97316', size: [2, 5], speed: [15, 35], opacity: [0.3, 0.7] },
  ],
};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// ─── Particle Component ─────────────────────────────────────────

function Particle({ config }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const size = rand(config.size[0], config.size[1]);
    const opacity = rand(config.opacity[0], config.opacity[1]);
    const duration = rand(6, 14);
    const delay = rand(0, 8);
    const startX = rand(0, 100);

    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.opacity = '0';
    el.style.left = `${startX}%`;

    let keyframes;
    switch (config.type) {
      case 'sparkle':
        keyframes = [
          { transform: `translateY(0) scale(0)`, opacity: 0 },
          { transform: `translateY(-${rand(100, 300)}px) scale(1)`, opacity },
          { transform: `translateY(-${rand(200, 500)}px) scale(0.5)`, opacity: 0 },
        ];
        break;
      case 'rise':
        keyframes = [
          { transform: `translateY(0) translateX(0)`, opacity: 0 },
          { transform: `translateY(-${rand(150, 400)}px) translateX(${rand(-30, 30)}px)`, opacity },
          { transform: `translateY(-${rand(300, 600)}px) translateX(${rand(-50, 50)}px)`, opacity: 0 },
        ];
        break;
      case 'firefly': {
        const xDrift = rand(-80, 80);
        const yDrift = rand(-80, 80);
        keyframes = [
          { transform: `translate(0, 0) scale(0.5)`, opacity: 0 },
          { transform: `translate(${xDrift * 0.3}px, ${yDrift * 0.3}px) scale(1)`, opacity },
          { transform: `translate(${xDrift * 0.7}px, ${yDrift * 0.7}px) scale(1.2)`, opacity: opacity * 0.5 },
          { transform: `translate(${xDrift}px, ${yDrift}px) scale(0.5)`, opacity: 0 },
        ];
        break;
      }
      case 'fall':
        keyframes = [
          { transform: `translateY(-20px) translateX(0) rotate(0deg)`, opacity: 0 },
          { transform: `translateY(${rand(200, 500)}px) translateX(${rand(-60, 60)}px) rotate(${rand(90, 360)}deg)`, opacity },
          { transform: `translateY(${rand(500, 900)}px) translateX(${rand(-100, 100)}px) rotate(${rand(180, 720)}deg)`, opacity: 0 },
        ];
        break;
      case 'snow':
        keyframes = [
          { transform: `translateY(-10px) translateX(0)`, opacity: 0 },
          { transform: `translateY(${rand(300, 600)}px) translateX(${rand(-80, 80)}px)`, opacity },
          { transform: `translateY(${rand(600, 1000)}px) translateX(${rand(-120, 120)}px)`, opacity: 0 },
        ];
        break;
      case 'ember':
        keyframes = [
          { transform: `translateY(0) scale(1)`, opacity },
          { transform: `translateY(-${rand(200, 500)}px) translateX(${rand(-40, 40)}px) scale(0.3)`, opacity: 0 },
        ];
        break;
      default:
        keyframes = [
          { opacity: 0 },
          { opacity },
          { opacity: 0 },
        ];
    }

    const anim = el.animate(keyframes, {
      duration: duration * 1000,
      delay: delay * 1000,
      iterations: Infinity,
      easing: 'ease-in-out',
    });

    return () => anim.cancel();
  }, [config]);

  return (
    <div
      ref={ref}
      className="absolute rounded-full pointer-events-none"
      style={{
        backgroundColor: config.color,
        boxShadow: config.type === 'firefly' ? `0 0 8px ${config.color}` :
                    config.type === 'ember' ? `0 0 6px ${config.color}` :
                    config.type === 'sparkle' ? `0 0 4px ${config.color}` : 'none',
        top: config.type === 'fall' || config.type === 'snow' ? '0%' :
             config.type === 'rise' || config.type === 'sparkle' || config.type === 'ember' ? '80%' : '50%',
      }}
    />
  );
}

// ─── Scene Particles Container ──────────────────────────────────

export default function SceneParticles({ sceneId }) {
  const layers = SCENE_PARTICLES[sceneId] || SCENE_PARTICLES.bakery;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {layers.map((layer, li) =>
        Array.from({ length: layer.count }, (_, i) => (
          <Particle key={`${sceneId}-${li}-${i}`} config={layer} index={i} total={layer.count} />
        ))
      )}
    </div>
  );
}

// ─── Ping Component (Owl Rodeo Style) ───────────────────────────

export function PingLayer({ ping }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!ping) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [ping]);

  if (!ping || !visible) return null;

  return (
    <div 
      className="absolute pointer-events-none z-50 flex items-center justify-center"
      style={{ left: `${ping.x}%`, top: `${ping.y}%` }}
    >
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute w-full h-full rounded-full border-4 border-dnd-gold animate-ping opacity-75" />
        <div className="absolute w-1/2 h-1/2 rounded-full bg-dnd-gold shadow-[0_0_15px_rgba(212,175,55,0.8)]" />
      </div>
    </div>
  );
}

// ─── Reaction Component ─────────────────────────────────────────

export function ReactionLayer({ reaction }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!reaction) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [reaction]);

  if (!reaction || !visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[110] flex items-center justify-center">
      <div className="text-[15rem] animate-bounce-slow drop-shadow-2xl opacity-90 transition-all duration-[3000ms] ease-out transform translate-y-[-100px] scale-110">
        {reaction.emoji}
      </div>
    </div>
  );
}

// ─── Handout Overlay ───────────────────────────────────────────

export function HandoutOverlay({ handout, onDismiss }) {
  if (!handout) return null;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-20 animate-in fade-in duration-500">
      <div className="relative max-w-4xl w-full bg-gray-900 border-4 border-dnd-gold rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.3)]">
        <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-black/40">
          <h3 className="text-4xl font-serif text-dnd-gold flex items-center gap-3">
             <Sparkles size={32} /> {handout.title}
          </h3>
          <button 
            onClick={onDismiss}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-full transition-colors"
          >
            <X size={32} />
          </button>
        </div>
        <div className="p-12 flex justify-center bg-gradient-to-b from-gray-900 to-black">
          <img 
            src={handout.image} 
            alt={handout.title}
            className="max-h-[60vh] rounded-lg shadow-2xl border border-white/10 object-contain"
          />
        </div>
        <div className="p-6 text-center bg-black/60">
           <p className="text-gray-400 italic text-xl uppercase tracking-widest">A New Discovery!</p>
        </div>
      </div>
    </div>
  );
}

// ─── Dice Roll Animation Component ─────────────────────────────

export function DiceRollAnimation({ roll, onComplete }) {
  const [displayNum, setDisplayNum] = React.useState(null);
  const [phase, setPhase] = React.useState('spinning'); // spinning | result
  const frameRef = React.useRef(null);

  React.useEffect(() => {
    if (!roll) return;

    setPhase('spinning');
    let startTime = null;
    const spinDuration = 1200; // ms

    const tick = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Decelerate: fast at start, slow at end
      const interval = 30 + progress * 200;
      const randomNum = Math.floor(Math.random() * 20) + 1;
      setDisplayNum(randomNum);

      if (progress < 1) {
        frameRef.current = setTimeout(() => {
          requestAnimationFrame(tick);
        }, interval);
      } else {
        // Land on actual result
        setDisplayNum(roll.total);
        setPhase('result');
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) clearTimeout(frameRef.current);
    };
  }, [roll, onComplete]);

  if (!roll) return null;

  return { displayNum, phase };
}

// ─── Action VFX Overlay ─────────────────────────────────────────

const ACTION_VFX = {
  slash: { emoji: '⚔️', animation: 'animate-ping', color: 'text-gray-300' },
  arrow: { emoji: '🏹', animation: 'animate-bounce', color: 'text-green-400' },
  smite: { emoji: '✨', animation: 'animate-pulse', color: 'text-yellow-400' },
  magic: { emoji: '🔮', animation: 'animate-spin', color: 'text-purple-400' },
  sneak: { emoji: '🗡️', animation: 'animate-ping', color: 'text-gray-400' },
};

function getActionVfx(label) {
  if (!label) return null;
  const lower = label.toLowerCase();
  if (lower.includes('smite') || lower.includes('divine')) return ACTION_VFX.smite;
  if (lower.includes('bow') || lower.includes('arrow') || lower.includes('shortbow')) return ACTION_VFX.arrow;
  if (lower.includes('sneak')) return ACTION_VFX.sneak;
  if (lower.includes('sword') || lower.includes('hammer') || lower.includes('axe') || lower.includes('longsword') || lower.includes('warhammer') || lower.includes('handaxe')) return ACTION_VFX.slash;
  return ACTION_VFX.magic;
}

export function ActionVfx({ label, visible }) {
  const vfx = getActionVfx(label);
  if (!vfx || !visible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
      <span className={`text-[8rem] ${vfx.animation} opacity-60 drop-shadow-2xl`}>
        {vfx.emoji}
      </span>
    </div>
  );
}
