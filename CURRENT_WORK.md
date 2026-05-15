# Current Work

## Current objective(s)
- Keep the `dnd-engine` playtest flow stable on a predictable LAN/Tailscale URL.
- Preserve the local-LLM music/dialogue path and the refreshed demo video workflow for later iteration.

## What has been implemented so far
- `dnd-engine/src/App.jsx` was expanded heavily to add:
  - LLM-driven music director state and refresh loop.
  - richer audio controls for style, quality, novelty, refresh rate, and context-awareness.
  - player/DM ambient sync using `audioSettings` + `audioDirector`.
  - UI hooks used by the capture script (`audio-toggle`, puzzle controls, AI prompt flow, player mode window).
- `dnd-engine/src/useMusicDirector.js` exists and now targets local Ollama through the Vite proxy, with `qwen3:8b` as the default music-director model.
- `dnd-engine/src/useOllama.js` was switched from direct localhost calls to the same Vite proxy path, and now also defaults to `qwen3:8b`.
- `dnd-engine/vite.config.js` now proxies `/api/ollama/*` to `http://127.0.0.1:11434`.
- `dnd-engine/src/useAudio.js` contains the procedural Web Audio engine plus fallback director logic.
- Demo assets/scripts were added under `demo/`:
  - `render_demo.mjs` renders `demo/trailer.html` to `.webm`, with Playwright auto-launch fallback if CDP is unavailable.
  - `capture_playtest.mjs` drives the live app in DM/player mode and captures screenshots.
  - `creative_llm_demo.webm`, `creative_llm_demo_8s.webm`, and `creative_llm_demo.mp4` are generated.
- `dnd-engine/public/creative_llm_demo.webm` was added for in-app/public serving.

## Current app/runtime status
- Current repo path: `/home/lanoitcif/ddcamp`
- Active dev server target: `dnd-engine` should be run as `npm run dev -- --host 0.0.0.0 --port 5173 --strictPort`.
- Current known-good network URLs:
  - LAN: `http://192.168.1.219:5173`
  - Tailscale: `http://100.86.226.123:5173`
- Ollama target: `127.0.0.1:11434`
- Validation already run after the latest fixes:
  - `npm run build` passed
  - `npm run lint` passed
  - automated playtest capture completed successfully

## Known issues and risks
- `5173` was previously hijacked by a stale loopback-only Vite process. If the app unexpectedly comes up on `5174`, inspect and kill old Vite sessions before restarting.
- Cross-device remote sync via the optional relay is still dependent on port `3001` being available.
- Browser-recorded `.webm` output has weak timestamp metadata; use the generated `.mp4` for upload/sharing workflows.
- Concurrent edits are already present in tracked app files. Do not revert or restage blindly.

## Video/demo work completed and remaining
- Completed:
  - Trailer source page: `demo/trailer.html`
  - Renderer: `demo/render_demo.mjs`
  - Live capture flow: `demo/capture_playtest.mjs`
  - Generated outputs: `demo/creative_llm_demo.webm`, `demo/creative_llm_demo_8s.webm`, `demo/creative_llm_demo.mp4`, `dnd-engine/public/creative_llm_demo.webm`
- Remaining:
  - If the video changes again, re-run capture + render and regenerate the MP4 compatibility copy.
  - If remote review is needed, consider adding frame-based local VLM review.

## Local model findings and recommendations
- Locally listed models include: `qwen3:8b`, `mistral:7b`, `llama3.1:8b`, `phi4:14b`, `gemma3:4b`, `gemma3:12b`, plus larger Qwen/GLM/DeepSeek variants.
- Current code choice is `qwen3:8b` for both music direction and monster response generation.
- Recommendation: keep `qwen3:8b` as the default low-latency local runtime unless a larger model demonstrably improves output quality enough to justify the slower loop.

## Exact key files changed
- `dnd-engine/src/App.jsx`
- `dnd-engine/src/useMusicDirector.js`
- `dnd-engine/src/useOllama.js`
- `dnd-engine/vite.config.js`
- `dnd-engine/src/useAudio.js`
- `demo/render_demo.mjs`
- `demo/capture_playtest.mjs`
- `demo/trailer.html`
- `demo/creative_llm_demo.webm`
- `demo/creative_llm_demo_8s.webm`
- `dnd-engine/public/creative_llm_demo.webm`

## Exact commands or scripts relevant to resume the work
```bash
cd /home/lanoitcif/ddcamp/dnd-engine
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

```bash
cd /home/lanoitcif/ddcamp
curl -sS http://127.0.0.1:11434/api/tags
lsof -nP -iTCP:5173 -sTCP:LISTEN
curl -I http://127.0.0.1:5173
```

```bash
cd /home/lanoitcif/ddcamp
node demo/render_demo.mjs
node demo/render_demo.mjs 8
node demo/capture_playtest.mjs
ffmpeg -i demo/creative_llm_demo.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart -c:a aac demo/creative_llm_demo.mp4
```

```bash
cd /home/lanoitcif/ddcamp
git status --short
git diff -- dnd-engine/src/App.jsx dnd-engine/src/useMusicDirector.js dnd-engine/src/useOllama.js dnd-engine/vite.config.js
```
