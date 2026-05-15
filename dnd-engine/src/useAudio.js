import { useRef, useCallback, useEffect } from 'react';

const SCALES = {
  C_maj: [48, 50, 52, 55, 57, 60, 62, 64, 67, 69, 72],
  D_min: [50, 53, 55, 57, 60, 62, 65, 67, 69, 72, 74],
  F_lyd: [53, 55, 57, 59, 60, 65, 67, 69, 71, 72, 77],
  A_maj: [45, 47, 49, 52, 54, 57, 59, 61, 64, 66, 69],
  E_dor: [52, 54, 55, 57, 59, 64, 66, 67, 69, 71, 76]
};

const SCENE_THEMES = {
  bakery: { scale: 'C_maj', bpm: 78, bass: [0, -1, 2, -1], lead: [5, 7, 9, 7, 5, 4, 5, -1] },
  market: { scale: 'C_maj', bpm: 104, bass: [0, 2, -1, 4], lead: [5, 6, 7, 8, 7, 6, 5, -1] },
  woods: { scale: 'F_lyd', bpm: 68, bass: [0, -1, -1, -1, -2, -1, -1, -1], lead: [5, 7, 8, 7, 5, 4, 5, -1] },
  glade: { scale: 'A_maj', bpm: 84, bass: [0, -1, 2, -1], lead: [8, 7, 5, 4, 5, 7, 8, -1] },
  stream: { scale: 'F_lyd', bpm: 92, bass: [0, -1, -1, 2, -1, -1, 0, -1], lead: [5, 6, 7, 8, 7, 6, 5, 4] },
  goblin_camp: { scale: 'D_min', bpm: 96, bass: [0, 2, 0, 3], lead: [5, 4, 5, 7, 6, 5, 4, -1] },
  caves: { scale: 'D_min', bpm: 62, bass: [0, -1, -1, -1, -1, -1, -1, -1], lead: [5, -1, 7, -1, 6, -1, 8, -1] },
  bridge: { scale: 'E_dor', bpm: 74, bass: [0, -1, 2, -1], lead: [5, 7, 9, 8, 7, 5, 4, -1] },
  camp: { scale: 'C_maj', bpm: 58, bass: [0, -1, -1, -1], lead: [5, -1, 4, -1, 5, -1, 7, -1] },
  ruins: { scale: 'E_dor', bpm: 70, bass: [0, -1, -1, -1], lead: [5, 6, 8, 7, 5, 4, -1, -1] },
  peak: { scale: 'A_maj', bpm: 80, bass: [0, -1, -2, -1], lead: [5, 7, 8, 9, 8, 7, 5, -1] },
  celebration: { scale: 'C_maj', bpm: 118, bass: [0, -1, 2, 3], lead: [5, 7, 9, 10, 9, 7, 5, 4] }
};

const MOODS = {
  calm: { speed: 0.95, leadVol: 0.1, bassVol: 0.12, padVol: 0.05, perc: 0.08, filterFreq: 1000, env: 0.75 },
  tense: { speed: 1, leadVol: 0.095, bassVol: 0.15, padVol: 0.04, perc: 0.15, filterFreq: 750, env: 0.45 },
  combat: { speed: 1.18, leadVol: 0.13, bassVol: 0.18, padVol: 0.025, perc: 0.22, filterFreq: 1800, env: 0.28 }
};

const STYLE_PROFILES = {
  alpha: { leadWave: 'triangle', echo: 0.28, padWave: 'sine', pulseWave: 'triangle', humanize: 0.01 },
  chiptune: { leadWave: 'square', echo: 0.2, padWave: 'triangle', pulseWave: 'square', humanize: 0.004 },
  hybrid: { leadWave: 'square', echo: 0.32, padWave: 'sine', pulseWave: 'triangle', humanize: 0.008 }
};

const QUALITY_PROFILES = {
  sketch: { counterMelody: false, pulseLayer: false, ghostNotes: false },
  full: { counterMelody: true, pulseLayer: true, ghostNotes: true }
};

const DEFAULT_SETTINGS = {
  style: 'alpha',
  quality: 'full',
  novelty: 0.72
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mtof(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function createRng(seed) {
  let state = Math.floor(clamp(seed, 0.001, 0.999) * 2147483647) || 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function pickWave(blend, preferred, fallback) {
  if (blend === 'bright') return preferred;
  if (blend === 'soft') return fallback;
  return Math.random() > 0.5 ? preferred : fallback;
}

function normalizeSettings(settings) {
  return {
    ...DEFAULT_SETTINGS,
    ...(settings || {}),
  };
}

function buildFallbackDirector(sceneId, mood, settings) {
  const sceneHash = Array.from(sceneId || 'bakery').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const moodBias = mood === 'combat' ? 0.82 : mood === 'tense' ? 0.58 : 0.34;
  return {
    tempoScale: 1,
    density: clamp(0.35 + settings.novelty * 0.35, 0.2, 0.9),
    tension: moodBias,
    register: mood === 'combat' ? 'high' : 'mid',
    motifShape: mood === 'combat' ? 'rise' : sceneHash % 2 === 0 ? 'arc' : 'wave',
    instrumentBlend: settings.style === 'alpha' ? 'soft' : settings.style === 'chiptune' ? 'bright' : 'balanced',
    restProbability: clamp(0.3 - settings.novelty * 0.15, 0.08, 0.32),
    ornamentChance: clamp(0.1 + settings.novelty * 0.3, 0.05, 0.45),
    seed: ((sceneHash % 97) / 97),
    phraseBars: mood === 'combat' ? 2 : 4,
  };
}

class ChiptuneSequencer {
  constructor(ctx, masterGain) {
    this.ctx = ctx;
    this.masterGain = masterGain;
    this.isPlaying = false;
    this.step = 0;
    this.nextNoteTime = 0;
    this.currentPhrase = null;
    this.currentPhraseIndex = -1;
    this.profileKey = '';

    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';

    this.delay = ctx.createDelay();
    this.delay.delayTime.value = 0.32;
    this.delayFeedback = ctx.createGain();
    this.delayFeedback.gain.value = 0.22;

    this.musicGain.connect(this.filter);
    this.filter.connect(this.masterGain);
    this.filter.connect(this.delay);
    this.delay.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delay);
    this.delayFeedback.connect(this.masterGain);

    this.noiseBuffer = this.createNoiseBuffer();
  }

  createNoiseBuffer() {
    const len = this.ctx.sampleRate * 0.2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  updateProfile(sceneId, moodId, settings, director) {
    this.scene = sceneId;
    this.mood = moodId || 'calm';
    this.settings = normalizeSettings(settings);
    this.director = director || buildFallbackDirector(sceneId, this.mood, this.settings);

    const moodConf = MOODS[this.mood] || MOODS.calm;
    const styleConf = STYLE_PROFILES[this.settings.style] || STYLE_PROFILES.alpha;
    this.filter.frequency.setTargetAtTime(
      clamp(moodConf.filterFreq + this.director.tension * 700, 300, 2600),
      this.ctx.currentTime,
      0.2
    );
    this.delay.delayTime.setTargetAtTime(
      this.settings.style === 'alpha' ? 0.38 : 0.24,
      this.ctx.currentTime,
      0.2
    );
    this.delayFeedback.gain.setTargetAtTime(styleConf.echo, this.ctx.currentTime, 0.2);

    const nextKey = JSON.stringify({
      sceneId,
      moodId,
      style: this.settings.style,
      quality: this.settings.quality,
      novelty: this.settings.novelty,
      seed: this.director.seed,
      density: this.director.density,
      tension: this.director.tension,
      register: this.director.register,
      motifShape: this.director.motifShape,
    });

    if (this.profileKey !== nextKey) {
      this.profileKey = nextKey;
      this.currentPhrase = null;
      this.currentPhraseIndex = -1;
    }
  }

  playVoice(freq, time, vol, wave, duration, attack = 0.01) {
    if (!freq || freq <= 0) return;
    const osc = this.ctx.createOscillator();
    const vca = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, time);

    vca.gain.setValueAtTime(0, time);
    vca.gain.linearRampToValueAtTime(vol, time + attack);
    vca.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(vca);
    vca.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  playPerc(time, brightness) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const flt = this.ctx.createBiquadFilter();
    flt.type = brightness > 0.5 ? 'highpass' : 'lowpass';
    flt.frequency.value = brightness > 0.5 ? 4800 : 220;
    const vca = this.ctx.createGain();
    vca.gain.setValueAtTime(brightness > 0.5 ? 0.04 : 0.08, time);
    vca.gain.exponentialRampToValueAtTime(0.001, time + (brightness > 0.5 ? 0.06 : 0.12));

    src.connect(flt);
    flt.connect(vca);
    vca.connect(this.masterGain);
    src.start(time);
    src.stop(time + 0.12);
  }

  maybeStartPhrase(theme, stepsPerBar) {
    const phraseLength = Math.max(stepsPerBar * (this.director.phraseBars || 4), stepsPerBar);
    const phraseIndex = Math.floor(this.step / phraseLength);
    if (phraseIndex !== this.currentPhraseIndex) {
      this.currentPhraseIndex = phraseIndex;
      this.currentPhrase = this.generatePhrase(theme, phraseIndex, phraseLength);
    }
  }

  generatePhrase(theme, phraseIndex, phraseLength) {
    const scale = SCALES[theme.scale];
    const moodConf = MOODS[this.mood] || MOODS.calm;
    const styleConf = STYLE_PROFILES[this.settings.style] || STYLE_PROFILES.alpha;
    const qualityConf = QUALITY_PROFILES[this.settings.quality] || QUALITY_PROFILES.full;
    const seed = clamp(
      this.director.seed + phraseIndex * 0.137 + this.settings.novelty * 0.311 + this.director.tension * 0.07,
      0,
      1
    );
    const rng = createRng(seed);
    const density = clamp((this.director.density + this.settings.novelty) / 2, 0.12, 0.98);
    const melody = [];
    const bass = [];
    const counter = [];
    const pulse = [];
    const registerOffset = this.director.register === 'high' ? 2 : this.director.register === 'low' ? -1 : 0;
    const baseContour = { rise: 1, fall: -1, arc: 0, wave: 0, static: 0 }[this.director.motifShape] ?? 0;
    let lastLead = theme.lead[0] >= 0 ? theme.lead[0] : 5;

    for (let i = 0; i < phraseLength; i++) {
      const themeLead = theme.lead[i % theme.lead.length];
      const themeBass = theme.bass[i % theme.bass.length];
      const onBeat = i % 2 === 0;
      const strongBeat = i % 4 === 0;
      const restRoll = rng();
      let leadDegree = themeLead >= 0 ? themeLead : lastLead;

      if (this.director.motifShape === 'rise' && onBeat) leadDegree += 1;
      if (this.director.motifShape === 'fall' && onBeat) leadDegree -= 1;
      if (this.director.motifShape === 'wave') leadDegree += i % 4 < 2 ? 1 : -1;
      if (this.director.motifShape === 'arc') leadDegree += i < phraseLength / 2 ? 1 : -1;
      if (rng() < this.settings.novelty * 0.22) {
        leadDegree += rng() > 0.5 ? 2 : -2;
      }

      leadDegree = clamp(leadDegree + registerOffset, 3, scale.length - 2);
      lastLead = leadDegree;

      melody.push(restRoll < this.director.restProbability && !strongBeat ? null : {
        midi: scale[leadDegree],
        vol: moodConf.leadVol * (strongBeat ? 1.1 : 0.8 + density * 0.35),
        dur: strongBeat ? moodConf.env * 1.1 : moodConf.env * 0.7,
        wave: pickWave(this.director.instrumentBlend, styleConf.leadWave, 'triangle'),
      });

      if (themeBass >= 0 && (strongBeat || rng() < 0.25 + this.director.tension * 0.2)) {
        bass.push({
          midi: scale[clamp(themeBass + (this.director.tension > 0.7 ? 1 : 0), 0, scale.length - 4)] - 12,
          vol: moodConf.bassVol * (strongBeat ? 1.05 : 0.82),
          dur: moodConf.env * 1.5,
          wave: styleConf.pulseWave,
        });
      } else {
        bass.push(null);
      }

      if (qualityConf.counterMelody && !strongBeat && rng() < density * 0.45) {
        const counterDegree = clamp(leadDegree - (rng() > 0.5 ? 2 : 3), 1, scale.length - 4);
        counter.push({
          midi: scale[counterDegree],
          vol: moodConf.leadVol * 0.48,
          dur: moodConf.env * 0.6,
          wave: styleConf.padWave,
        });
      } else {
        counter.push(null);
      }

      if (qualityConf.pulseLayer && onBeat) {
        pulse.push({
          midi: scale[clamp(themeBass >= 0 ? themeBass + 2 : 4 + baseContour, 2, scale.length - 3)],
          vol: moodConf.padVol * (0.8 + this.director.tension * 0.4),
          dur: moodConf.env * 1.8,
          wave: styleConf.padWave,
        });
      } else {
        pulse.push(null);
      }

      if (qualityConf.ghostNotes && melody[i] && rng() < this.director.ornamentChance) {
        melody[i].ornament = rng() > 0.5 ? 2 : -2;
      }
    }

    return { melody, bass, counter, pulse };
  }

  scheduleStep(theme, styleConf, qualityConf, moodConf, stepDuration) {
    this.maybeStartPhrase(theme, 8);
    const phraseStep = this.step % this.currentPhrase.melody.length;
    const lead = this.currentPhrase.melody[phraseStep];
    const bass = this.currentPhrase.bass[phraseStep];
    const counter = this.currentPhrase.counter[phraseStep];
    const pulse = this.currentPhrase.pulse[phraseStep];
    const time = this.nextNoteTime;
    const humanize = styleConf.humanize * (Math.random() - 0.5);

    if (lead) {
      this.playVoice(mtof(lead.midi), time, lead.vol, lead.wave, lead.dur, 0.01);
      if (lead.ornament) {
        this.playVoice(mtof(lead.midi + lead.ornament), time + stepDuration * 0.18, lead.vol * 0.45, lead.wave, lead.dur * 0.35, 0.005);
      }
    }
    if (bass) {
      this.playVoice(mtof(bass.midi), time, bass.vol, bass.wave, bass.dur, 0.008);
    }
    if (counter) {
      this.playVoice(mtof(counter.midi), time + stepDuration * 0.1, counter.vol, counter.wave, counter.dur, 0.01);
    }
    if (pulse) {
      this.playVoice(mtof(pulse.midi), time, pulse.vol, pulse.wave, pulse.dur, 0.02);
    }

    if (Math.random() < moodConf.perc) {
      this.playPerc(time + stepDuration * 0.05, this.director.tension);
      if (qualityConf.ghostNotes && this.director.tension > 0.65 && this.step % 4 === 2) {
        this.playPerc(time + stepDuration * 0.33, 1);
      }
    }

    this.nextNoteTime += stepDuration + humanize;
    this.step++;
  }

  schedule() {
    if (!this.isPlaying) return;
    const theme = SCENE_THEMES[this.scene] || SCENE_THEMES.bakery;
    const moodConf = MOODS[this.mood] || MOODS.calm;
    const styleConf = STYLE_PROFILES[this.settings.style] || STYLE_PROFILES.alpha;
    const qualityConf = QUALITY_PROFILES[this.settings.quality] || QUALITY_PROFILES.full;
    const tempoScale = clamp((this.director.tempoScale || 1) * moodConf.speed, 0.55, 1.8);
    const stepDuration = (60 / (theme.bpm * tempoScale)) / 2;

    while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
      this.scheduleStep(theme, styleConf, qualityConf, moodConf, stepDuration);
    }

    this.timer = setTimeout(() => this.schedule(), 30);
  }

  start(sceneId, moodId, settings, director) {
    this.updateProfile(sceneId, moodId, settings, director);

    if (!this.isPlaying) {
      this.isPlaying = true;
      this.step = 0;
      this.nextNoteTime = this.ctx.currentTime + 0.05;
      this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.musicGain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 1.8);
      this.schedule();
      return;
    }

    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.2);
  }

  stop() {
    this.isPlaying = false;
    clearTimeout(this.timer);
    if (this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
    }
  }
}

function playDiceRoll(ctx, masterGain) {
  const duration = 0.5;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-(i / ctx.sampleRate) * 10) * 0.4;
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
  osc.type = 'square';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(ctx.currentTime + 1.5);
}

function playCriticalHitFanfare(ctx, masterGain) {
  [523.3, 659.3, 784.0, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
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
  osc.type = 'square';
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
  [1047, 1319, 1568, 2093].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
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

export function useAudio() {
  const ctxRef = useRef(null);
  const masterGainRef = useRef(null);
  const seqRef = useRef(null);
  const volumeRef = useRef(0.7);

  const ensureContext = useCallback(() => {
    try {
      if (!ctxRef.current || ctxRef.current.state === 'closed') {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        ctxRef.current = ctx;
        const master = ctx.createGain();
        master.gain.value = volumeRef.current;
        master.connect(ctx.destination);
        masterGainRef.current = master;
        seqRef.current = new ChiptuneSequencer(ctx, master);
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

  const startAmbient = useCallback((sceneId, mood, settings, director) => {
    ensureContext();
    if (seqRef.current) {
      seqRef.current.start(sceneId, mood || 'calm', settings, director);
    }
  }, [ensureContext]);

  const stopAmbient = useCallback(() => {
    if (seqRef.current) {
      seqRef.current.stop();
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

  useEffect(() => () => {
    if (seqRef.current) seqRef.current.stop();
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      ctxRef.current.close().catch(() => {});
    }
  }, []);

  return { startAmbient, stopAmbient, setVolume, sfx };
}
