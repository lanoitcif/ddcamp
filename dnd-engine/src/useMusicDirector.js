import { useCallback, useState } from 'react';

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const DEFAULT_MODEL = 'llama3.1';

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
    tempoScale: clamp(Number(raw.tempoScale) || FALLBACK_DIRECTION.tempoScale, 0.7, 1.5),
    density: clamp(Number(raw.density) || FALLBACK_DIRECTION.density, 0.1, 1),
    tension: clamp(Number(raw.tension) || FALLBACK_DIRECTION.tension, 0, 1),
    register: ['low', 'mid', 'high'].includes(raw.register) ? raw.register : FALLBACK_DIRECTION.register,
    motifShape: ['rise', 'fall', 'arc', 'wave', 'static'].includes(raw.motifShape) ? raw.motifShape : FALLBACK_DIRECTION.motifShape,
    instrumentBlend: ['soft', 'balanced', 'bright'].includes(raw.instrumentBlend) ? raw.instrumentBlend : FALLBACK_DIRECTION.instrumentBlend,
    restProbability: clamp(Number(raw.restProbability) || FALLBACK_DIRECTION.restProbability, 0.02, 0.6),
    ornamentChance: clamp(Number(raw.ornamentChance) || FALLBACK_DIRECTION.ornamentChance, 0, 0.75),
    seed: clamp(Number(raw.seed) || FALLBACK_DIRECTION.seed, 0, 1),
    phraseBars: clamp(Math.round(Number(raw.phraseBars) || FALLBACK_DIRECTION.phraseBars), 2, 8),
  };
}

export function useMusicDirector() {
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [musicError, setMusicError] = useState(null);

  const generateMusicDirection = useCallback(async (context) => {
    setIsGeneratingMusic(true);
    setMusicError(null);

    const system = `
You are a music director for a retro fantasy tabletop game.
Return one JSON object only, with no markdown and no explanation.
Keep the output grounded, sparse, melodic, and suitable for procedural Web Audio playback.

Required JSON schema:
{
  "tempoScale": number,
  "density": number,
  "tension": number,
  "register": "low" | "mid" | "high",
  "motifShape": "rise" | "fall" | "arc" | "wave" | "static",
  "instrumentBlend": "soft" | "balanced" | "bright",
  "restProbability": number,
  "ornamentChance": number,
  "seed": number,
  "phraseBars": number
}

Use values between 0 and 1 where appropriate.
Favor novelty through motif shape and seed changes, not chaos.
`.trim();

    const prompt = `
Music style target: ${context.style}
Render quality target: ${context.quality}
Novelty target: ${context.novelty}
Scene: ${context.sceneTitle}
Scene description: ${context.sceneDescription}
Mood: ${context.mood}
Active turn: ${context.activeTurn}
Recent event: ${context.recentEvent}
Narration: ${context.narration}
Puzzle state: ${context.puzzleState}
Screen context summary: ${context.screenContext}

Return JSON only.
`.trim();

    try {
      const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          system,
          prompt,
          stream: false,
          options: {
            temperature: clamp(0.6 + context.novelty * 0.4, 0.6, 1),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama Server Error: ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data?.response?.trim() || '';
      const jsonText = extractJson(rawText);
      if (!jsonText) {
        throw new Error('Music director returned non-JSON output');
      }

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
