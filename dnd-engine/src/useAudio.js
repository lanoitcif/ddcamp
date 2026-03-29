import { useRef, useCallback, useEffect } from 'react';

// ─── Scene Ambient Definitions ─────────────────────────────────
// Each scene defines 3 moods with dramatically different sonic personalities:
//   calm   → Dreamy sine pad + sparkle bells + breathing filter LFO (Minecraft/Ghibli)
//   tense  → Minor/diminished chords + heartbeat sub-bass + filter sweep (suspenseful)
//   combat → Sawtooth power chords + synthesized kick/snare/hat drum loop (epic battle)
//
// Config keys by mood:
//   calm:   notes, type, detune, filterFreq, gain, sparkle, lfoRate, lfoDepth,
//           delayTime, delayFeedback
//   tense:  notes, type, detune, filterFreq, gain, heartbeatBpm, heartbeatFreq,
//           heartbeatGain, filterSweepRate, filterSweepDepth, rumbleInterval,
//           delayTime, delayFeedback
//   combat: notes, type, detune, filterFreq, gain, percBpm, percGain,
//           filterLfoRate, filterLfoDepth

const SCENE_AMBIENTS = {
  bakery: {
    // Warm, golden bakery — cozy and inviting (C-based)
    calm:   { notes: [261.6, 329.6, 392.0, 493.9, 523.3], type: 'sine', detune: 2, filterFreq: 800, gain: 0.12, sparkle: true, lfoRate: 0.08, lfoDepth: 150, delayTime: 0.5, delayFeedback: 0.35 },
    tense:  { notes: [261.6, 311.1, 370.0, 466.2], type: 'sine', detune: 6, filterFreq: 500, gain: 0.10, heartbeatBpm: 60, heartbeatFreq: 55, heartbeatGain: 0.12, filterSweepRate: 0.06, filterSweepDepth: 300, rumbleInterval: 10000, delayTime: 0.7, delayFeedback: 0.2 },
    combat: { notes: [130.8, 196.0, 185.0], type: 'sawtooth', detune: 8, filterFreq: 900, gain: 0.07, percBpm: 128, percGain: 0.16, filterLfoRate: 0.4, filterLfoDepth: 500 },
  },
  market: {
    // Bright village square — bustling energy (D-based)
    calm:   { notes: [293.7, 370.0, 440.0, 554.4, 587.3], type: 'sine', detune: 3, filterFreq: 900, gain: 0.11, sparkle: true, lfoRate: 0.1, lfoDepth: 180, delayTime: 0.45, delayFeedback: 0.35 },
    tense:  { notes: [293.7, 349.2, 415.3, 493.9], type: 'sine', detune: 7, filterFreq: 550, gain: 0.09, heartbeatBpm: 66, heartbeatFreq: 58, heartbeatGain: 0.13, filterSweepRate: 0.07, filterSweepDepth: 350, rumbleInterval: 9000, delayTime: 0.65, delayFeedback: 0.2 },
    combat: { notes: [146.8, 220.0, 207.7], type: 'sawtooth', detune: 10, filterFreq: 950, gain: 0.07, percBpm: 132, percGain: 0.17, filterLfoRate: 0.45, filterLfoDepth: 550 },
  },
  woods: {
    // Enchanted forest — shimmering, magical (F Lydian)
    calm:   { notes: [349.2, 440.0, 523.3, 659.3, 739.9], type: 'sine', detune: 6, filterFreq: 1200, gain: 0.10, sparkle: true, lfoRate: 0.12, lfoDepth: 250, delayTime: 0.55, delayFeedback: 0.4 },
    tense:  { notes: [349.2, 370.0, 415.3, 493.9], type: 'sine', detune: 12, filterFreq: 600, gain: 0.10, heartbeatBpm: 58, heartbeatFreq: 50, heartbeatGain: 0.11, filterSweepRate: 0.05, filterSweepDepth: 400, rumbleInterval: 7000, delayTime: 0.8, delayFeedback: 0.25 },
    combat: { notes: [174.6, 261.6, 246.9], type: 'sawtooth', detune: 14, filterFreq: 1000, gain: 0.08, percBpm: 126, percGain: 0.15, filterLfoRate: 0.5, filterLfoDepth: 600 },
  },
  glade: {
    // Magical clearing — sparkling, airy (A-based)
    calm:   { notes: [440.0, 554.4, 659.3, 880.0, 987.8], type: 'sine', detune: 4, filterFreq: 1600, gain: 0.11, sparkle: true, lfoRate: 0.09, lfoDepth: 300, delayTime: 0.6, delayFeedback: 0.4 },
    tense:  { notes: [220.0, 233.1, 261.6, 329.6], type: 'sine', detune: 10, filterFreq: 650, gain: 0.09, heartbeatBpm: 62, heartbeatFreq: 52, heartbeatGain: 0.12, filterSweepRate: 0.06, filterSweepDepth: 350, rumbleInterval: 8000, delayTime: 0.75, delayFeedback: 0.22 },
    combat: { notes: [110.0, 164.8, 155.6], type: 'sawtooth', detune: 12, filterFreq: 1100, gain: 0.08, percBpm: 134, percGain: 0.17, filterLfoRate: 0.55, filterLfoDepth: 650 },
  },
  stream: {
    // Flowing water — cool, gentle (Eb-based)
    calm:   { notes: [311.1, 392.0, 466.2, 587.3, 622.3], type: 'sine', detune: 5, filterFreq: 1100, gain: 0.10, sparkle: true, lfoRate: 0.11, lfoDepth: 200, delayTime: 0.5, delayFeedback: 0.38 },
    tense:  { notes: [311.1, 329.6, 370.0, 466.2], type: 'sine', detune: 9, filterFreq: 580, gain: 0.09, heartbeatBpm: 56, heartbeatFreq: 48, heartbeatGain: 0.10, filterSweepRate: 0.05, filterSweepDepth: 300, rumbleInterval: 9000, delayTime: 0.8, delayFeedback: 0.2 },
    combat: { notes: [155.6, 233.1, 220.0], type: 'sawtooth', detune: 12, filterFreq: 950, gain: 0.07, percBpm: 130, percGain: 0.16, filterLfoRate: 0.45, filterLfoDepth: 550 },
  },
  goblin_camp: {
    // Mischievous goblin territory — sneaky and chaotic (D minor)
    calm:   { notes: [293.7, 349.2, 440.0, 523.3, 261.6], type: 'sine', detune: 8, filterFreq: 700, gain: 0.08, sparkle: false, lfoRate: 0.07, lfoDepth: 120, delayTime: 0.4, delayFeedback: 0.3 },
    tense:  { notes: [293.7, 311.1, 349.2, 440.0], type: 'sine', detune: 14, filterFreq: 450, gain: 0.10, heartbeatBpm: 72, heartbeatFreq: 60, heartbeatGain: 0.15, filterSweepRate: 0.09, filterSweepDepth: 400, rumbleInterval: 5000, delayTime: 0.6, delayFeedback: 0.18 },
    combat: { notes: [146.8, 220.0, 207.7, 174.6], type: 'square', detune: 18, filterFreq: 850, gain: 0.07, percBpm: 140, percGain: 0.19, filterLfoRate: 0.6, filterLfoDepth: 700 },
  },
  caves: {
    // Underground — echoey, crystalline, dripping (B Phrygian)
    calm:   { notes: [246.9, 261.6, 329.6, 370.0, 493.9], type: 'sine', detune: 2, filterFreq: 1800, gain: 0.13, sparkle: true, lfoRate: 0.06, lfoDepth: 350, delayTime: 0.7, delayFeedback: 0.45 },
    tense:  { notes: [246.9, 261.6, 293.7, 370.0], type: 'sine', detune: 6, filterFreq: 700, gain: 0.11, heartbeatBpm: 54, heartbeatFreq: 45, heartbeatGain: 0.14, filterSweepRate: 0.04, filterSweepDepth: 500, rumbleInterval: 6000, delayTime: 0.9, delayFeedback: 0.3 },
    combat: { notes: [123.5, 185.0, 174.6], type: 'sawtooth', detune: 10, filterFreq: 1200, gain: 0.09, percBpm: 124, percGain: 0.18, filterLfoRate: 0.5, filterLfoDepth: 700 },
  },
  bridge: {
    // High exposed bridge — windy, precarious (F#-based)
    calm:   { notes: [370.0, 440.0, 554.4, 659.3, 739.9], type: 'sine', detune: 6, filterFreq: 1300, gain: 0.12, sparkle: true, lfoRate: 0.13, lfoDepth: 250, delayTime: 0.55, delayFeedback: 0.38 },
    tense:  { notes: [370.0, 392.0, 440.0, 554.4], type: 'sine', detune: 11, filterFreq: 600, gain: 0.11, heartbeatBpm: 68, heartbeatFreq: 55, heartbeatGain: 0.13, filterSweepRate: 0.08, filterSweepDepth: 400, rumbleInterval: 7000, delayTime: 0.7, delayFeedback: 0.22 },
    combat: { notes: [185.0, 277.2, 261.6], type: 'sawtooth', detune: 14, filterFreq: 1050, gain: 0.08, percBpm: 136, percGain: 0.17, filterLfoRate: 0.55, filterLfoDepth: 600 },
  },
  camp: {
    // Nighttime campfire — lullaby warmth, safe (Bb-based)
    calm:   { notes: [233.1, 293.7, 349.2, 440.0, 466.2], type: 'sine', detune: 2, filterFreq: 600, gain: 0.13, sparkle: true, lfoRate: 0.06, lfoDepth: 100, delayTime: 0.6, delayFeedback: 0.35 },
    tense:  { notes: [233.1, 246.9, 277.2, 349.2], type: 'sine', detune: 5, filterFreq: 400, gain: 0.10, heartbeatBpm: 58, heartbeatFreq: 48, heartbeatGain: 0.11, filterSweepRate: 0.04, filterSweepDepth: 250, rumbleInterval: 11000, delayTime: 0.8, delayFeedback: 0.2 },
    combat: { notes: [116.5, 174.6, 164.8], type: 'sawtooth', detune: 8, filterFreq: 800, gain: 0.07, percBpm: 120, percGain: 0.15, filterLfoRate: 0.4, filterLfoDepth: 450 },
  },
  ruins: {
    // Ancient crumbling stone — mysterious, reverent (E Dorian)
    calm:   { notes: [164.8, 185.0, 220.0, 246.9, 329.6], type: 'sine', detune: 3, filterFreq: 900, gain: 0.11, sparkle: true, lfoRate: 0.07, lfoDepth: 180, delayTime: 0.65, delayFeedback: 0.4 },
    tense:  { notes: [164.8, 174.6, 207.7, 246.9], type: 'sine', detune: 8, filterFreq: 500, gain: 0.10, heartbeatBpm: 52, heartbeatFreq: 42, heartbeatGain: 0.14, filterSweepRate: 0.04, filterSweepDepth: 350, rumbleInterval: 7000, delayTime: 0.85, delayFeedback: 0.25 },
    combat: { notes: [110.0, 164.8, 155.6], type: 'sawtooth', detune: 14, filterFreq: 900, gain: 0.08, percBpm: 122, percGain: 0.16, filterLfoRate: 0.45, filterLfoDepth: 550 },
  },
  peak: {
    // Mountaintop — airy, epic, vast (G Lydian)
    calm:   { notes: [392.0, 493.9, 587.3, 784.0, 987.8], type: 'sine', detune: 3, filterFreq: 1500, gain: 0.14, sparkle: true, lfoRate: 0.1, lfoDepth: 300, delayTime: 0.6, delayFeedback: 0.42 },
    tense:  { notes: [196.0, 207.7, 246.9, 293.7], type: 'sine', detune: 7, filterFreq: 650, gain: 0.12, heartbeatBpm: 64, heartbeatFreq: 52, heartbeatGain: 0.13, filterSweepRate: 0.06, filterSweepDepth: 400, rumbleInterval: 8000, delayTime: 0.8, delayFeedback: 0.25 },
    combat: { notes: [196.0, 293.7, 277.2], type: 'sawtooth', detune: 12, filterFreq: 1200, gain: 0.09, percBpm: 138, percGain: 0.18, filterLfoRate: 0.55, filterLfoDepth: 650 },
  },
  celebration: {
    // Victory! Bright and festive — positive across all moods (C Major)
    calm:   { notes: [261.6, 329.6, 392.0, 523.3, 659.3], type: 'sine', detune: 2, filterFreq: 1400, gain: 0.14, sparkle: true, lfoRate: 0.12, lfoDepth: 250, delayTime: 0.45, delayFeedback: 0.4 },
    tense:  { notes: [261.6, 329.6, 392.0, 493.9], type: 'sine', detune: 3, filterFreq: 1000, gain: 0.12, heartbeatBpm: 80, heartbeatFreq: 65, heartbeatGain: 0.08, filterSweepRate: 0.1, filterSweepDepth: 200, rumbleInterval: 15000, delayTime: 0.5, delayFeedback: 0.3 },
    combat: { notes: [261.6, 392.0, 523.3], type: 'square', detune: 4, filterFreq: 1100, gain: 0.09, percBpm: 144, percGain: 0.18, filterLfoRate: 0.6, filterLfoDepth: 500 },
  },
};

const DEFAULT_AMBIENT = SCENE_AMBIENTS.bakery;

function getAmbientConfig(sceneId, mood) {
  const scene = SCENE_AMBIENTS[sceneId] || DEFAULT_AMBIENT;
  return scene[mood] || scene.calm;
}

// ─── Ambient Pad Builders (Mood-Aware Engine) ──────────────────
// Each mood gets its own audio graph architecture:
//   calm   → sine pads + sparkle + delay + breathing LFO
//   tense  → dissonant pads + heartbeat pulse + rumble + filter sweep
//   combat → sawtooth power chords + kick/snare/hat percussion loop

function buildAmbientPad(ctx, config, mood, masterGain) {
  switch (mood) {
    case 'tense':  return buildTensePad(ctx, config, masterGain);
    case 'combat': return buildCombatPad(ctx, config, masterGain);
    default:       return buildCalmPad(ctx, config, masterGain);
  }
}

// ── CALM: Dreamy, safe, exploratory (Minecraft/Ghibli feel) ────

function buildCalmPad(ctx, config, masterGain) {
  const nodes = [];
  const intervals = [];

  const padGain = ctx.createGain();
  padGain.gain.value = 0;

  // Spacious delay/reverb effect
  const delay = ctx.createDelay();
  delay.delayTime.value = config.delayTime || 0.5;
  const delayGain = ctx.createGain();
  delayGain.gain.value = config.delayFeedback || 0.35;

  padGain.connect(masterGain);
  padGain.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(delay);
  delayGain.connect(masterGain);

  // Lowpass filter with gentle breathing LFO (inhale/exhale)
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = config.filterFreq;
  filter.Q.value = 1;
  filter.connect(padGain);

  const lfo = ctx.createOscillator();
  const lfoGainNode = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = config.lfoRate || 0.1;
  lfoGainNode.gain.value = config.lfoDepth || 200;
  lfo.connect(lfoGainNode);
  lfoGainNode.connect(filter.frequency);
  lfo.start();
  nodes.push(lfo);

  // Sparkle bells — random chord tones with soft pluck envelope
  if (config.sparkle) {
    const sparkleId = setInterval(() => {
      if (Math.random() > 0.65) {
        const freq = config.notes[Math.floor(Math.random() * config.notes.length)];
        const osc = ctx.createOscillator();
        const vca = ctx.createGain();
        osc.type = 'sine';
        // Occasionally play an octave up for bell-like shimmer
        osc.frequency.value = freq * (Math.random() > 0.5 ? 2 : 1);
        vca.gain.setValueAtTime(0, ctx.currentTime);
        vca.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.15);
        vca.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.0);
        osc.connect(vca);
        vca.connect(filter);
        osc.start();
        osc.stop(ctx.currentTime + 4.1);
      }
    }, 2200);
    intervals.push(sparkleId);
  }

  // Base pad — layered sine tones, very quiet and warm
  config.notes.slice(0, 3).forEach(freq => {
    const osc = ctx.createOscillator();
    osc.type = config.type;
    osc.frequency.value = freq + (Math.random() * config.detune);
    const vca = ctx.createGain();
    vca.gain.value = 0.02;
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
      intervals.forEach(id => clearInterval(id));
      nodes.forEach(n => { try { n.stop(); n.disconnect(); } catch { /* already stopped */ } });
      try { padGain.disconnect(); delayGain.disconnect(); delay.disconnect(); filter.disconnect(); lfoGainNode.disconnect(); } catch { /* ok */ }
    },
  };
}

// ── TENSE: Suspenseful, heartbeat pulse, dark (something bad might happen) ──

function buildTensePad(ctx, config, masterGain) {
  const nodes = [];
  const intervals = [];

  const padGain = ctx.createGain();
  padGain.gain.value = 0;

  // Subtle delay for eeriness
  const delay = ctx.createDelay();
  delay.delayTime.value = config.delayTime || 0.7;
  const delayGain = ctx.createGain();
  delayGain.gain.value = config.delayFeedback || 0.2;

  padGain.connect(masterGain);
  padGain.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(delay);
  delayGain.connect(masterGain);

  // Filter with slow automated sweep — creates creeping unease
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = config.filterFreq;
  filter.Q.value = 3;
  filter.connect(padGain);

  const sweepLfo = ctx.createOscillator();
  const sweepGainNode = ctx.createGain();
  sweepLfo.type = 'sine';
  sweepLfo.frequency.value = config.filterSweepRate || 0.08;
  sweepGainNode.gain.value = config.filterSweepDepth || 400;
  sweepLfo.connect(sweepGainNode);
  sweepGainNode.connect(filter.frequency);
  sweepLfo.start();
  nodes.push(sweepLfo);

  // Minor/diminished pad — detuned oscillators for dissonance
  config.notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    // Push oscillators apart for beating/unease
    osc.frequency.value = freq + ((i % 2 === 0 ? 1 : -1) * Math.random() * config.detune);
    const vca = ctx.createGain();
    vca.gain.value = 0.025;
    osc.connect(vca);
    vca.connect(filter);
    osc.start();
    nodes.push(osc);
  });

  // Heartbeat — sub-bass double-pulse (lub-DUB) like a real heartbeat
  const beatMs = (60 / (config.heartbeatBpm || 65)) * 1000;
  const heartbeatId = setInterval(() => {
    const now = ctx.currentTime;
    [0, 0.2].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const vca = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = config.heartbeatFreq || 55;
      const level = (config.heartbeatGain || 0.12) * (i === 0 ? 0.6 : 1.0);
      const t = now + offset;
      vca.gain.setValueAtTime(0, t);
      vca.gain.linearRampToValueAtTime(level, t + 0.04);
      vca.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(vca);
      vca.connect(masterGain); // Bypass filter for sub-bass punch
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }, beatMs);
  intervals.push(heartbeatId);

  // Occasional low rumble hits — noise burst through heavy lowpass
  const rumbleId = setInterval(() => {
    if (Math.random() > 0.4) {
      const now = ctx.currentTime;
      const bufLen = Math.floor(ctx.sampleRate * 0.8);
      const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-(i / ctx.sampleRate) * 4);
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.value = 120;
      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.06, now);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      source.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(masterGain);
      source.start(now);
    }
  }, config.rumbleInterval || 8000);
  intervals.push(rumbleId);

  return {
    fadeIn(duration = 4) {
      padGain.gain.linearRampToValueAtTime(config.gain, ctx.currentTime + duration);
    },
    fadeOut(duration = 2) {
      padGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    },
    stop() {
      intervals.forEach(id => clearInterval(id));
      nodes.forEach(n => { try { n.stop(); n.disconnect(); } catch { /* already stopped */ } });
      try { padGain.disconnect(); delayGain.disconnect(); delay.disconnect(); filter.disconnect(); sweepGainNode.disconnect(); } catch { /* ok */ }
    },
  };
}

// ── COMBAT: Epic battle energy — driving drums + aggressive chords ──

function buildCombatPad(ctx, config, masterGain) {
  const nodes = [];
  const intervals = [];

  const padGain = ctx.createGain();
  padGain.gain.value = 0;
  padGain.connect(masterGain);

  // Filter with fast LFO for rhythmic energy
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = config.filterFreq;
  filter.Q.value = 4;
  filter.connect(padGain);

  const lfo = ctx.createOscillator();
  const lfoGainNode = ctx.createGain();
  lfo.type = 'triangle';
  lfo.frequency.value = config.filterLfoRate || 0.5;
  lfoGainNode.gain.value = config.filterLfoDepth || 600;
  lfo.connect(lfoGainNode);
  lfoGainNode.connect(filter.frequency);
  lfo.start();
  nodes.push(lfo);

  // Power chord pad — sawtooth/square for aggressive harmonics
  config.notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = config.type;
    osc.frequency.value = freq + ((i % 2 === 0 ? 1 : -1) * Math.random() * config.detune);
    const vca = ctx.createGain();
    vca.gain.value = 0.03;
    osc.connect(vca);
    vca.connect(filter);
    osc.start();
    nodes.push(osc);

    // Sub-octave on root note for extra weight
    if (i === 0) {
      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.value = freq / 2;
      const subGain = ctx.createGain();
      subGain.gain.value = 0.04;
      sub.connect(subGain);
      subGain.connect(filter);
      sub.start();
      nodes.push(sub);
    }
  });

  // Pre-create reusable noise buffer for percussion
  const noiseLen = Math.floor(ctx.sampleRate * 0.2);
  const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const noiseData = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) noiseData[i] = Math.random() * 2 - 1;

  // Percussion loop: kick-hat-snare-hat at configured BPM
  const eighthMs = (60 / (config.percBpm || 130)) * 1000 / 2;
  let percStep = 0;

  const percId = setInterval(() => {
    const now = ctx.currentTime;
    const step = percStep % 4;
    const pGain = config.percGain || 0.18;

    if (step === 0) {
      // KICK: sine pitch sweep 150Hz→40Hz (punchy sub thump)
      const kickOsc = ctx.createOscillator();
      const kickVca = ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(150, now);
      kickOsc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
      kickVca.gain.setValueAtTime(pGain, now);
      kickVca.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      kickOsc.connect(kickVca);
      kickVca.connect(masterGain);
      kickOsc.start(now);
      kickOsc.stop(now + 0.25);

      // Short noise click for attack transient
      const clickSrc = ctx.createBufferSource();
      clickSrc.buffer = noiseBuf;
      const clickFilt = ctx.createBiquadFilter();
      clickFilt.type = 'lowpass';
      clickFilt.frequency.value = 400;
      const clickVca = ctx.createGain();
      clickVca.gain.setValueAtTime(pGain * 0.4, now);
      clickVca.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      clickSrc.connect(clickFilt);
      clickFilt.connect(clickVca);
      clickVca.connect(masterGain);
      clickSrc.start(now);
      clickSrc.stop(now + 0.04);
    }
    else if (step === 2) {
      // SNARE: noise burst through bandpass ~200Hz
      const snareSrc = ctx.createBufferSource();
      snareSrc.buffer = noiseBuf;
      const snareFilt = ctx.createBiquadFilter();
      snareFilt.type = 'bandpass';
      snareFilt.frequency.value = 200;
      snareFilt.Q.value = 1;
      const snareVca = ctx.createGain();
      snareVca.gain.setValueAtTime(pGain * 0.7, now);
      snareVca.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      snareSrc.connect(snareFilt);
      snareFilt.connect(snareVca);
      snareVca.connect(masterGain);
      snareSrc.start(now);
      snareSrc.stop(now + 0.13);
    }
    else {
      // HI-HAT: very short noise through highpass ~8000Hz
      const hatSrc = ctx.createBufferSource();
      hatSrc.buffer = noiseBuf;
      const hatFilt = ctx.createBiquadFilter();
      hatFilt.type = 'highpass';
      hatFilt.frequency.value = 8000;
      const hatVca = ctx.createGain();
      hatVca.gain.setValueAtTime(pGain * 0.3, now);
      hatVca.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      hatSrc.connect(hatFilt);
      hatFilt.connect(hatVca);
      hatVca.connect(masterGain);
      hatSrc.start(now);
      hatSrc.stop(now + 0.05);
    }

    percStep++;
  }, eighthMs);
  intervals.push(percId);

  return {
    fadeIn(duration = 3) {
      padGain.gain.linearRampToValueAtTime(config.gain, ctx.currentTime + duration);
    },
    fadeOut(duration = 2) {
      padGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    },
    stop() {
      intervals.forEach(id => clearInterval(id));
      nodes.forEach(n => { try { n.stop(); n.disconnect(); } catch { /* already stopped */ } });
      try { padGain.disconnect(); filter.disconnect(); lfoGainNode.disconnect(); } catch { /* ok */ }
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
    try {
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
    } catch (e) {
      console.warn('Web Audio not available:', e.message);
      return null;
    }
  }, []);

  const startAmbient = useCallback((sceneId, mood) => {
    const ctx = ensureContext();
    if (!ctx) return;
    const resolvedMood = mood || currentMoodRef.current;
    const config = getAmbientConfig(sceneId, resolvedMood);

    if (padRef.current) {
      const old = padRef.current;
      old.fadeOut(2);
      setTimeout(() => old.stop(), 2500);
    }

    const pad = buildAmbientPad(ctx, config, resolvedMood, masterGainRef.current);
    pad.fadeIn(4);
    padRef.current = pad;
    currentSceneRef.current = sceneId;
    currentMoodRef.current = resolvedMood;
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
    if (!ctx) return;
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
      if (padRef.current) { try { padRef.current.stop(); } catch { /* cleanup */ } }
      if (ctxRef.current) { try { ctxRef.current.close(); } catch { /* cleanup */ } }
    };
  }, []);

  return { startAmbient, stopAmbient, setVolume, sfx };
}
