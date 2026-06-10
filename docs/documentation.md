# D&D Engine Documentation

## Overview

The D&D Engine is a dual-view VTT for **The Dragon of Whispering Peak**. The DM uses `/`, players watch `/?mode=player`, and campaign editing lives at `/?mode=builder`.

Core stack:

- React + Vite frontend
- `useCampaign.js` for game state
- `useSync.js` for local or remote sync
- `useAudio.js` for procedural ambience and SFX
- Ollama-backed `useOllama.js` and `useMusicDirector.js` for local LLM features

## Current Feature Set

- 12 scenes, 10 monsters, 17 quests from `src/campaign_data.json`
- synced HP, quests, narration, overlays, initiative, reactions, handouts, and puzzles
- campaign builder with validation/export/import
- procedural ambience with scene, mood, novelty, quality, and style controls
- context-aware music direction driven by synced game state
- local monster dialogue generation through Ollama
- optional WebSocket relay for cross-device sync

## Runtime Notes

Recommended dev launch:

```bash
cd dnd-engine
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

Important ports:

- `5173` Vite app
- `11434` Ollama
- `3001` optional WebSocket relay

The browser does not call Ollama directly. Vite proxies `/api/ollama/*` to `http://127.0.0.1:11434`.

## Important Files

- `src/App.jsx` — DM, player, and builder routing/UI
- `src/useCampaign.js` — main game-state hook
- `src/useSync.js` — BroadcastChannel and WebSocket sync
- `src/useAudio.js` — procedural audio engine
- `src/useMusicDirector.js` — LLM music-direction hook
- `src/useOllama.js` — local LLM response generation
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
