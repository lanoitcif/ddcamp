import { useCallback, useState } from 'react';

const FALLBACK_MODEL = 'fast-local';

function getLlmModel() {
  try {
    return localStorage.getItem('dnd_llm_model') || FALLBACK_MODEL;
  } catch {
    return FALLBACK_MODEL;
  }
}

// LiteLLM proxy — key is injected by vite.config.js, never in browser bundle.
const LLM_ENDPOINT = '/api/llm/v1/chat/completions';

const FALLBACK_DIRECTION = {
  tempoScale: 1,
  density: 0.45,
  tension: 0.35,
  register: 'mid',
  motifShape: 'arc',
  instrumentBlend: 'soft',
  restProbability: 0.22,
  ornamentChance: 0.18,
  seed: 0.5,
  phraseBars: 4,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function normalizeDirection(raw) {
  if (!raw || typeof raw !== 'object') return FALLBACK_DIRECTION;
  return {
    tempoScale:       clamp(Number(raw.tempoScale)       || FALLBACK_DIRECTION.tempoScale,       0.7, 1.5),
    density:          clamp(Number(raw.density)           || FALLBACK_DIRECTION.density,           0.1, 1),
    tension:          clamp(Number(raw.tension)           || FALLBACK_DIRECTION.tension,           0,   1),
    register:         ['low', 'mid', 'high'].includes(raw.register)                    ? raw.register         : FALLBACK_DIRECTION.register,
    motifShape:       ['rise', 'fall', 'arc', 'wave', 'static'].includes(raw.motifShape) ? raw.motifShape     : FALLBACK_DIRECTION.motifShape,
    instrumentBlend:  ['soft', 'balanced', 'bright'].includes(raw.instrumentBlend)      ? raw.instrumentBlend : FALLBACK_DIRECTION.instrumentBlend,
    restProbability:  clamp(Number(raw.restProbability)  || FALLBACK_DIRECTION.restProbability,   0.02, 0.6),
    ornamentChance:   clamp(Number(raw.ornamentChance)   || FALLBACK_DIRECTION.ornamentChance,    0,    0.75),
    seed:             clamp(Number(raw.seed)             || FALLBACK_DIRECTION.seed,              0,    1),
    phraseBars:       clamp(Math.round(Number(raw.phraseBars) || FALLBACK_DIRECTION.phraseBars),  2,    8),
  };
}

export function useMusicDirector() {
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [musicError, setMusicError] = useState(null);

  const generateMusicDirection = useCallback(async (context) => {
    setIsGeneratingMusic(true);
    setMusicError(null);

    const system =
      `You are a music director for a retro fantasy tabletop game.\n` +
      `Return one JSON object only, with no markdown and no explanation.\n` +
      `Keep the output grounded, sparse, melodic, and suitable for procedural Web Audio playback.\n\n` +
      `Required JSON schema:\n` +
      `{\n` +
      `  "tempoScale": number,\n` +
      `  "density": number,\n` +
      `  "tension": number,\n` +
      `  "register": "low" | "mid" | "high",\n` +
      `  "motifShape": "rise" | "fall" | "arc" | "wave" | "static",\n` +
      `  "instrumentBlend": "soft" | "balanced" | "bright",\n` +
      `  "restProbability": number,\n` +
      `  "ornamentChance": number,\n` +
      `  "seed": number,\n` +
      `  "phraseBars": number\n` +
      `}\n\n` +
      `Use values between 0 and 1 where appropriate.\n` +
      `Favor novelty through motif shape and seed changes, not chaos.`;

    const userMsg =
      `Music style target: ${context.style}\n` +
      `Render quality target: ${context.quality}\n` +
      `Novelty target: ${context.novelty}\n` +
      `Scene: ${context.sceneTitle}\n` +
      `Scene description: ${context.sceneDescription}\n` +
      `Mood: ${context.mood}\n` +
      `Active turn: ${context.activeTurn}\n` +
      `Recent event: ${context.recentEvent}\n` +
      `Narration: ${context.narration}\n` +
      `Puzzle state: ${context.puzzleState}\n` +
      `Screen context summary: ${context.screenContext}\n\n` +
      `Return JSON only.`;

    try {
      const response = await fetch(LLM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: getLlmModel(),
          messages: [
            { role: 'system', content: system },
            { role: 'user',   content: userMsg },
          ],
          max_tokens: 200,
          temperature: clamp(0.6 + context.novelty * 0.4, 0.6, 1),
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`LiteLLM error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content?.trim() || '';
      const jsonText = extractJson(rawText);
      if (!jsonText) throw new Error('Music director returned non-JSON output');

      return normalizeDirection(JSON.parse(jsonText));

    } catch (err) {
      console.error('Failed to generate music direction:', err);
      setMusicError(err.message);
      return null;
    } finally {
      setIsGeneratingMusic(false);
    }
  }, []);

  return { generateMusicDirection, isGeneratingMusic, musicError };
}
