# D&D Engine Documentation

## Overview

The D&D Engine is a dual-view VTT for **The Dragon of Whispering Peak**. The DM uses `/`, players watch `/?mode=player`, and campaign editing lives at `/?mode=builder`.

Core stack:

- React + Vite frontend
- `useCampaign.js` for game state
- `useSync.js` for local or remote sync
- `useAudio.js` for procedural ambience and SFX
- LiteLLM-backed `useOllama.js` and `useMusicDirector.js` for LLM features
  (shared model config in `llmConfig.js`)

## Current Feature Set

- 12 scenes, 10 monsters, 17 quests from `src/campaign_data.json`
- synced HP, quests, narration, overlays, initiative, reactions, handouts, and puzzles
- campaign builder with validation/export/import
- procedural ambience with scene, mood, novelty, quality, and style controls
- context-aware music direction driven by synced game state
- monster dialogue generation via the LiteLLM proxy (DM-selectable model)
- optional WebSocket relay for cross-device sync

## Runtime Notes

Recommended dev launch:

```bash
cd dnd-engine
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

Important ports:

- `5173` Vite app
- `4000` LiteLLM proxy (primary LLM endpoint)
- `11434` Ollama (LiteLLM's usual local backend; legacy direct proxy too)
- `3001` optional WebSocket relay

The browser does not call the LLM directly. Vite proxies `/api/llm/*` to
`http://127.0.0.1:4000` (LiteLLM) and injects the master key server-side. The
model name (a LiteLLM alias, default `fast-local`) is chosen in the DM Console
and stored in `localStorage['dnd_llm_model']`; see `dnd-engine/README.md` and
`dnd-engine/litellm.config.example.yaml` for the alias → backend map and how to
swap models during an outage.

## Important Files

- `src/App.jsx` — DM, player, and builder routing/UI
- `src/useCampaign.js` — main game-state hook
- `src/useSync.js` — BroadcastChannel and WebSocket sync
- `src/useAudio.js` — procedural audio engine
- `src/useMusicDirector.js` — LLM music-direction hook
- `src/useOllama.js` — LLM monster/character response generation
- `src/llmConfig.js` — shared LLM endpoint, default model, and selector options
- `src/Puzzles.jsx` — puzzle registry and scene puzzle logic
- `src/campaignSchema.js` — campaign validation/factories
- `server/index.js` — relay server

## Validation

```bash
cd dnd-engine
npm run build
npm run lint
```

Demo automation:

```bash
cd /home/lanoitcif/ddcamp
node demo/capture_playtest.mjs
node demo/render_demo.mjs 90
ffmpeg -i demo/creative_llm_demo.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart -c:a aac demo/creative_llm_demo.mp4
```
