import { useState, useCallback } from 'react';

// Default Ollama REST endpoint if running locally
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const DEFAULT_MODEL = 'llama3.1'; // Can be changed based on what's explicitly installed locally

export function useOllama() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Calls the local Ollama API to generate a response in-character.
   * 
   * @param {Object} activeMonster - The monster the user clicked on.
   * @param {Object} activeScene - The current active scene to pull context from.
   * @param {string} playerAction - The action the DM typed that requires an AI response.
   * @returns {Promise<string>} - The generated dialog text.
   */
  const generateResponse = useCallback(async (activeMonster, activeScene, playerAction) => {
    setIsGenerating(true);
    setError(null);

    // Build the system prompt using the rich v3.0 metadata
    const basePrompt = activeMonster.aiPrompt || `You are ${activeMonster.name}. You are a monster.`;
    const sceneContext = activeScene ? `
Current Scene: ${activeScene.title}. ${activeScene.description}
Additional Context: ${activeScene.dmNotes?.npcs ? 'NPCs present: ' + activeScene.dmNotes.npcs : ''}
Your Tactics: ${activeScene.dmNotes?.tactics || 'Fight to the bitter end.'}` : '';

    const systemPrompt = `
${basePrompt}
${sceneContext}

INSTRUCTIONS:
- Respond IN CHARACTER.
- Limit your response to 2 or 3 short sentences.
- Do NOT provide mechanical damage numbers, just roleplay.
- Do NOT wrap your text in quotes unless you are explicitly speaking aloud.
`.trim();

    try {
      const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          system: systemPrompt,
          prompt: `Player action: "${playerAction}"`,
          stream: false // Await the whole response for simplicity in the UI
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama Server Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response.trim();

    } catch (err) {
      console.error('Failed to generate AI response:', err);
      // If it's a fetch error, it's likely CORS or Ollama is not running
      if (err.message.includes('Failed to fetch')) {
        setError("Could not connect to Ollama. Ensure it is running with 'OLLAMA_ORIGINS=\"*\" ollama serve'");
      } else {
        setError(err.message);
      }
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generateResponse, isGenerating, error };
}
