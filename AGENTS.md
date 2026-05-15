# Repository Guidelines

## Project Structure & Module Organization
- `dnd-engine/` is the main gameplay app: React + Vite frontend in `src/`, static assets in `public/`, and a small Node sync server in `server/`.
- `dnd-engine/tests/` and `*.spec.js` files cover UI and playtest flows; `*.test.js` files cover unit/security logic.
- `life-is-something-more/` is a separate Vite app for music/procedural audio experiments, with shared helpers in `utils/` and UI in `components/`.
- `demo/` contains capture and rendering scripts for the gameplay trailer. `screenshots/` and top-level `.md` files hold reference assets and design notes.

## Build, Test, and Development Commands
- `cd dnd-engine && npm install && npm run dev` starts the main app on Vite.
- `cd dnd-engine && npm run build` creates a production build.
- `cd dnd-engine && npm run lint` runs the ESLint flat config for `js`/`jsx`.
- `cd dnd-engine/server && npm install && npm run dev` starts the local Node sync server with file watching.
- `cd life-is-something-more && npm install && npm run dev` starts the secondary audio app.
- `cd life-is-something-more && npm test` runs Node’s built-in test runner for `*.test.ts`.
- `cd /home/lanoitcif/ddcamp && node demo/render_demo.mjs 90` renders the 90-second demo video.

## Coding Style & Naming Conventions
- Use 2-space indentation in JS, JSX, and TS files.
- Prefer `PascalCase` for React components, `camelCase` for hooks/utilities, and `*.spec.js` or `*.test.ts` for tests.
- Follow existing hook naming such as `useAudio.js`, `useOllama.js`, and `useMusicDirector.js`.
- Run `npm run lint` in `dnd-engine` before handing off frontend changes.

## Testing Guidelines
- Add fast unit tests beside logic modules when possible, especially for campaign parsing, security, and utilities.
- Use Playwright-style `*.spec.js` files for browser/gameplay flows and Node `*.test.ts` or `*.test.js` for isolated logic.
- For targeted verification, run specific files with `node --test path/to/file.test.js` or `npx playwright test path/to/spec.js` from `dnd-engine/`.

## Commit & Pull Request Guidelines
- Match the existing history: concise conventional commits such as `feat:`, `fix:`, or focused security/test messages.
- Keep each commit scoped to one change set. Mention affected areas in the subject, for example: `feat: improve local music director cadence`.
- PRs should include a short summary, validation steps, linked issues if any, and screenshots/video for UI changes.

## Security & Configuration Tips
- Do not commit secrets or local API keys. Keep model/service settings in local env files only.
- Treat Ollama, Vite proxy, and sync-server port assumptions as environment-specific; verify `5173`, `11434`, and any websocket port before demos.
