/* ─── LLM configuration: single source of truth ──────────────────────
 * Every AI feature (monster dialogue, music director, Optinio the goblin)
 * imports its model + endpoint from here, so swapping models is a one-place
 * change instead of editing three hooks and a JSX dropdown.
 *
 * The browser sends a model NAME to the LiteLLM proxy (Vite forwards
 * /api/llm/* → 127.0.0.1:4000, injecting the master key server-side). The
 * names below are LiteLLM aliases/model_names defined in the proxy's
 * config.yaml — see litellm.config.example.yaml for the alias → backend map.
 */

// All requests go to /api/llm (Vite proxy → LiteLLM :4000). The proxy injects
// the master key — the browser never sees it.
export const LLM_ENDPOINT = '/api/llm/v1/chat/completions';

// Default model. A VITE_-prefixed env var is fine here: a model NAME is not a
// secret (unlike LITELLM_KEY), and this lets the default be swapped at build
// time without touching code. Falls back to the 'fast-local' alias.
export const DEFAULT_LLM_MODEL =
  import.meta.env.VITE_DEFAULT_LLM_MODEL || 'fast-local';

// Where the DM Console model override lives.
const STORAGE_KEY = 'dnd_llm_model';

// The selectable models shown in the DM Console "AI Model" dropdown. Edit this
// list (and litellm.config.example.yaml) when the proxy's aliases change.
export const LLM_MODEL_OPTIONS = [
  { group: 'Aliases', value: 'fast-local',        label: 'fast-local (default)' },
  { group: 'Aliases', value: 'hermes-default',    label: 'hermes-default' },
  { group: 'Aliases', value: 'large-context',     label: 'large-context' },
  { group: 'Ollama Models', value: 'ollama-qwen35-9b',  label: 'qwen3.5 9B' },
  { group: 'Ollama Models', value: 'ollama-llama31-8b', label: 'llama 3.1 8B' },
  { group: 'Ollama Models', value: 'ollama-gemma3-12b', label: 'gemma3 12B' },
];

/** Returns the DM-selected model, or the default if none is set / storage fails. */
export function getLlmModel() {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LLM_MODEL;
  } catch {
    return DEFAULT_LLM_MODEL;
  }
}

/** Persists the DM's model choice (best-effort; ignores storage failures). */
export function setLlmModel(value) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
  } catch (err) {
    console.warn(err);
  }
}
