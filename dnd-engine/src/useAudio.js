import { useRef, useCallback, useEffect } from 'react';

// ─── Scene Ambient Definitions (Minecraft/Ghibli Vibe) ───────────
// Minimalist, melodic, and "lonely but cozy."

const SCENE_AMBIENTS = {
  bakery: {
    // Warm, golden, honey-like (C Major 9)
    calm: { notes: [261.6, 329.6, 392.0, 493.9, 523.3], type: 'sine', detune: 2, filterFreq: 800, gain: 0.12, sparkle: true },
    tense: { notes: [261.6, 311.1, 392.0, 466.2], type: 'sine', detune: 4, filterFreq: 600, gain: 0.10, sparkle: false },
    combat: { notes: [220.0, 261.6, 329.6, 392.0], type: 'triangle', detune: 8, filterFreq: 1000, gain: 0.08, sparkle: false },
  },
  woods: {
    // Shimmering, emerald Lydian (F Major #11)
    calm: { notes: [349.2, 440.0, 523.3, 659.3, 739.9], type: 'sine', detune: 6, filterFreq: 1200, gain: 0.10, sparkle: true },
    tense: { notes: [349.2, 415.3, 493.9, 587.3], type: 'sine', detune: 10, filterFreq: 800, gain: 0.10, sparkle: true },
    combat: { notes: [293.7, 349.2, 440.0, 523.3], type: 'triangle', detune: 15, filterFreq: 1100, gain: 0.08, sparkle: false },
  },
  peak: {
    // Airy, singing wind, soft bells (G Major / Lydian)
    // "The wind sounds like soft singing"
    calm: { notes: [392.0, 493.9, 587.3, 784.0, 987.8], type: 'sine', detune: 3, filterFreq: 1500, gain: 0.14, sparkle: true },
    tense: { notes: [392.0, 466.2, 587.3, 698.5], type: 'sine', detune: 5, filterFreq: 1000, gain: 0.12, sparkle: true },
    combat: { notes: [330.0, 392.0, 493.9, 587.3], type: 'triangle', detune: 12, filterFreq: 1300, gain: 0.10, sparkle: false },
  },
};

const DEFAULT_AMBIENT = SCENE_AMBIENTS.bakery;

function getAmbientConfig(sceneId, mood) {
  const scene = SCENE_AMBIENTS[sceneId] || DEFAULT_AMBIENT;
  return scene[mood] || scene.calm;
}

// ─── Ambient Pad Builder (Minimalist Engine) ─────────────────────

function buildAmbientPad(ctx, config, masterGain) {
  const nodes = [];
  const padGain = ctx.createGain();
  padGain.gain.value = 0;

  // Space/Reverb-style Delay
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.5;
  const delayGain = ctx.createGain();
  delayGain.gain.value = 0.4;
  
  padGain.connect(masterGain);
  padGain.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(delay); // Feedback
  delayGain.connect(masterGain);

  // Main Filter
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = config.filterFreq;
  filter.connect(padGain);

  // Slow Melodic "Bells" (Random notes from the chord)
  const interval = setInterval(() => {
    if (Math.random() > 0.7) {
      const freq = config.notes[Math.floor(Math.random() * config.notes.length)];
      const osc = ctx.createOscillator();
      const vca = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      vca.gain.setValueAtTime(0, ctx.currentTime);
      vca.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1);
      vca.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.0);
      
      osc.connect(vca);
      vca.connect(filter);
      
      osc.start();
      osc.stop(ctx.currentTime + 4.1);
    }
  }, 2000);

  // Base Pad (Very quiet, layered)
  config.notes.slice(0, 3).forEach(freq => {
    const osc = ctx.createOscillator();
    osc.type = config.type;
    osc.frequency.value = freq + (Math.random() * config.detune);
    const vca = ctx.createGain();
    vca.gain.value = 0.02; // Very subtle
    osc.connect(vca);
    vca.connect(filter);
    osc.start();
    nodes.push(osc);
  });

  return {
    fadeIn(duration = 4) {
      padGain.gain.linearRampToValueAtTime(config.gain, ctx.currentTime + duration);
    },
    fadeOut(duration = 2) {
      padGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    },
    stop() {
      clearInterval(interval);
      nodes.forEach(n => { try { n.stop(); } catch {} });
    },
  };
}

// ─── Sound Effects (Whimsical & Soft) ───────────────────────────

function playDiceRoll(ctx, masterGain) {
  const duration = 0.5;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const t = i / ctx.sampleRate;
    const env = Math.exp(-t * 10);
    data[i] = (Math.random() * 2 - 1) * env * 0.4;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2000;
  const gain = ctx.createGain();
  gain.gain.value = 0.2;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start();
}

function playRevealTone(ctx, masterGain) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 880; // High A
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(ctx.currentTime + 1.5);
}

function playCriticalHitFanfare(ctx, masterGain) {
  // Gentle triumphant arpeggio
  [523.3, 659.3, 784.0, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.1, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 2.0);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(start);
    osc.stop(start + 2.0);
  });
}

function playCriticalFailSound(ctx, masterGain) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(330, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 1.0);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(ctx.currentTime + 1.0);
}

function playQuestComplete(ctx, masterGain) {
  // Bright, magical shimmer
  [1047, 1319, 1568, 2093].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.08;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 1.5);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(start);
    osc.stop(start + 1.5);
  });
}

// ─── Hook ───────────────────────────────────────────────────────

export function useAudio() {
  const ctxRef = useRef(null);
  const masterGainRef = useRef(null);
  const padRef = useRef(null);
  const currentSceneRef = useRef(null);
  const currentMoodRef = useRef('calm');
  const volumeRef = useRef(0.7);

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      const master = ctx.createGain();
      master.gain.value = volumeRef.current;
      master.connect(ctx.destination);
      masterGainRef.current = master;
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const startAmbient = useCallback((sceneId, mood) => {
    const ctx = ensureContext();
    const config = getAmbientConfig(sceneId, mood || currentMoodRef.current);

    if (padRef.current) {
      const old = padRef.current;
      old.fadeOut(2);
      setTimeout(() => old.stop(), 2500);
    }

    const pad = buildAmbientPad(ctx, config, masterGainRef.current);
    pad.fadeIn(4);
    padRef.current = pad;
    currentSceneRef.current = sceneId;
    currentMoodRef.current = mood || 'calm';
  }, [ensureContext]);

  const stopAmbient = useCallback(() => {
    if (padRef.current) {
      padRef.current.fadeOut(1.5);
      const old = padRef.current;
      setTimeout(() => old.stop(), 2000);
      padRef.current = null;
    }
  }, []);

  const setVolume = useCallback((vol) => {
    volumeRef.current = vol;
    if (masterGainRef.current && ctxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(vol, ctxRef.current.currentTime, 0.1);
    }
  }, []);

  const sfx = useCallback((type) => {
    const ctx = ensureContext();
    const master = masterGainRef.current;
    switch (type) {
      case 'dice': playDiceRoll(ctx, master); break;
      case 'reveal': playRevealTone(ctx, master); break;
      case 'crit': playCriticalHitFanfare(ctx, master); break;
      case 'fail': playCriticalFailSound(ctx, master); break;
      case 'quest': playQuestComplete(ctx, master); break;
    }
  }, [ensureContext]);

  useEffect(() => {
    return () => {
      if (padRef.current) { try { padRef.current.stop(); } catch {} }
      if (ctxRef.current) { try { ctxRef.current.close(); } catch {} }
    };
  }, []);

  return { startAmbient, stopAmbient, setVolume, sfx };
}
