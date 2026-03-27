import { useRef, useCallback, useEffect } from 'react';

// ─── Scene Ambient Definitions ──────────────────────────────────
// Each scene has a function that creates oscillators/nodes for its mood.

const SCENE_AMBIENTS = {
  bakery: {
    calm: { notes: [261.6, 329.6, 392.0], type: 'sine', lfoRate: 0.3, filterFreq: 800, gain: 0.12 },
    tense: { notes: [261.6, 311.1, 370.0], type: 'triangle', lfoRate: 0.8, filterFreq: 600, gain: 0.10 },
    combat: { notes: [246.9, 293.7, 370.0], type: 'sawtooth', lfoRate: 1.5, filterFreq: 1000, gain: 0.08 },
  },
  woods: {
    calm: { notes: [392.0, 523.3, 659.3], type: 'sine', lfoRate: 0.2, filterFreq: 1200, gain: 0.10 },
    tense: { notes: [370.0, 440.0, 554.4], type: 'triangle', lfoRate: 0.6, filterFreq: 900, gain: 0.10 },
    combat: { notes: [330.0, 415.3, 493.9], type: 'sawtooth', lfoRate: 1.2, filterFreq: 1100, gain: 0.08 },
  },
  peak: {
    calm: { notes: [130.8, 164.8, 196.0], type: 'sine', lfoRate: 0.15, filterFreq: 500, gain: 0.14 },
    tense: { notes: [123.5, 155.6, 185.0], type: 'triangle', lfoRate: 0.5, filterFreq: 400, gain: 0.12 },
    combat: { notes: [110.0, 138.6, 164.8], type: 'sawtooth', lfoRate: 1.0, filterFreq: 700, gain: 0.10 },
  },
};

// Fallback for unknown scenes
const DEFAULT_AMBIENT = {
  calm: { notes: [261.6, 329.6, 392.0], type: 'sine', lfoRate: 0.3, filterFreq: 800, gain: 0.10 },
  tense: { notes: [246.9, 311.1, 370.0], type: 'triangle', lfoRate: 0.7, filterFreq: 600, gain: 0.10 },
  combat: { notes: [220.0, 277.2, 330.0], type: 'sawtooth', lfoRate: 1.2, filterFreq: 900, gain: 0.08 },
};

function getAmbientConfig(sceneId, mood) {
  const scene = SCENE_AMBIENTS[sceneId] || DEFAULT_AMBIENT;
  return scene[mood] || scene.calm;
}

// ─── Ambient Pad Builder ────────────────────────────────────────

function buildAmbientPad(ctx, config, masterGain) {
  const nodes = [];
  const padGain = ctx.createGain();
  padGain.gain.value = 0;
  padGain.connect(masterGain);

  // Low-pass filter for warmth
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = config.filterFreq;
  filter.Q.value = 1.5;
  filter.connect(padGain);

  // LFO for gentle movement
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = config.lfoRate;
  lfoGain.gain.value = 15;
  lfo.connect(lfoGain);

  // Chord tones
  config.notes.forEach(freq => {
    const osc = ctx.createOscillator();
    osc.type = config.type;
    osc.frequency.value = freq;
    lfoGain.connect(osc.frequency);
    osc.connect(filter);
    osc.start();
    nodes.push(osc);
  });

  lfo.start();
  nodes.push(lfo);

  return {
    fadeIn(duration = 2) {
      padGain.gain.cancelScheduledValues(ctx.currentTime);
      padGain.gain.setValueAtTime(padGain.gain.value, ctx.currentTime);
      padGain.gain.linearRampToValueAtTime(config.gain, ctx.currentTime + duration);
    },
    fadeOut(duration = 2) {
      padGain.gain.cancelScheduledValues(ctx.currentTime);
      padGain.gain.setValueAtTime(padGain.gain.value, ctx.currentTime);
      padGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    },
    stop() {
      nodes.forEach(n => { try { n.stop(); } catch { /* already stopped */ } });
    },
  };
}

// ─── Sound Effects ──────────────────────────────────────────────

function playDiceRoll(ctx, masterGain) {
  // Simulates dice clatter — short bursts of filtered noise
  const duration = 0.6;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // Clicking/clattering envelope
    const t = i / ctx.sampleRate;
    const clickEnv = Math.exp(-t * 8) * (Math.random() > 0.92 ? 1 : 0.3);
    data[i] = (Math.random() * 2 - 1) * clickEnv;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000;
  filter.Q.value = 2;

  const gain = ctx.createGain();
  gain.gain.value = 0.25;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start();
}

function playRevealTone(ctx, masterGain) {
  // Satisfying "ding" on result reveal
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(ctx.currentTime + 0.8);
}

function playCriticalHitFanfare(ctx, masterGain) {
  // Ascending triumphant chord
  const freqs = [523.3, 659.3, 784.0, 1047]; // C5, E5, G5, C6
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.08;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 1.2);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(start);
    osc.stop(start + 1.2);
  });
}

function playCriticalFailSound(ctx, masterGain) {
  // Descending sad trombone
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.8);
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(ctx.currentTime + 1.0);
}

function playQuestComplete(ctx, masterGain) {
  // Triumphant little jingle: ascending arpeggio
  const notes = [523.3, 659.3, 784.0, 1047, 1319]; // C5-E6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.1;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(start);
    osc.stop(start + 0.6);
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
  const playingRef = useRef(false);

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

    // Fade out existing pad
    if (padRef.current) {
      const old = padRef.current;
      old.fadeOut(1.5);
      setTimeout(() => old.stop(), 2000);
    }

    const pad = buildAmbientPad(ctx, config, masterGainRef.current);
    pad.fadeIn(2);
    padRef.current = pad;
    currentSceneRef.current = sceneId;
    playingRef.current = true;
  }, [ensureContext]);

  const stopAmbient = useCallback(() => {
    if (padRef.current) {
      padRef.current.fadeOut(1);
      const old = padRef.current;
      setTimeout(() => old.stop(), 1500);
      padRef.current = null;
    }
    playingRef.current = false;
  }, []);

  const setMood = useCallback((mood) => {
    currentMoodRef.current = mood;
    if (playingRef.current && currentSceneRef.current) {
      startAmbient(currentSceneRef.current, mood);
    }
  }, [startAmbient]);

  const setVolume = useCallback((vol) => {
    volumeRef.current = vol;
    if (masterGainRef.current) {
      masterGainRef.current.gain.setValueAtTime(vol, ctxRef.current.currentTime);
    }
  }, []);

  // Sound effects
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (padRef.current) { try { padRef.current.stop(); } catch { /* ok */ } }
      if (ctxRef.current) { try { ctxRef.current.close(); } catch { /* ok */ } }
    };
  }, []);

  return {
    startAmbient,
    stopAmbient,
    setMood,
    setVolume,
    sfx,
    isPlaying: () => playingRef.current,
  };
}
