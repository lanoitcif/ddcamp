import { useState, useCallback } from 'react';

// Default model — one of the LiteLLM aliases or explicit Ollama-backed names.
// The DM Console model selector writes to localStorage('dnd_llm_model') to override.
const FALLBACK_MODEL = 'fast-local';

function getLlmModel() {
  try {
    return localStorage.getItem('dnd_llm_model') || FALLBACK_MODEL;
  } catch {
    return FALLBACK_MODEL;
  }
}

// All requests go to /api/llm (Vite proxy → LiteLLM :4000).
// The proxy injects the master key — the browser never sees it.
const LLM_ENDPOINT = '/api/llm/v1/chat/completions';

export function useOllama() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Calls LiteLLM to generate an in-character monster response.
   *
   * @param {Object} activeMonster  - The monster being spoken as.
   * @param {Object} activeScene    - Current scene for context.
   * @param {string} playerAction   - The DM's typed action/prompt.
   * @returns {Promise<string|null>} Generated dialogue text, or null on error.
   */
  const generateResponse = useCallback(async (activeMonster, activeScene, playerAction) => {
    setIsGenerating(true);
    setError(null);

    const basePrompt = activeMonster.aiPrompt || `You are ${activeMonster.name}. You are a monster.`;
    const sceneContext = activeScene
      ? `\nCurrent Scene: ${activeScene.title}. ${activeScene.description}` +
        (activeScene.dmNotes?.npcs ? `\nNPCs present: ${activeScene.dmNotes.npcs}` : '') +
        `\nYour Tactics: ${activeScene.dmNotes?.tactics || 'Fight to the bitter end.'}`
      : '';

    const systemPrompt =
      `${basePrompt}${sceneContext}\n\nINSTRUCTIONS:\n` +
      `- Respond IN CHARACTER.\n` +
      `- Limit your response to 2 or 3 short sentences.\n` +
      `- Do NOT provide mechanical damage numbers, just roleplay.\n` +
      `- Do NOT wrap your text in quotes unless you are explicitly speaking aloud.`;

    try {
      const response = await fetch(LLM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: getLlmModel(),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Player action: "${playerAction}"` },
          ],
          max_tokens: 150,
          temperature: 0.8,
          stream: false,
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`LiteLLM error ${response.status}: ${details}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error('LiteLLM returned an empty response');
      return text;

    } catch (err) {
      console.error('Failed to generate AI response:', err);
      setError(err.message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generateResponse, isGenerating, error };
}
