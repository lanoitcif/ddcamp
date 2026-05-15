# life-is-something-more

This directory is a separate experimental Vite app focused on live music and prompt-driven audio interaction. It is not the main D&D playtest app, but it remains useful as a reference sandbox for audio and controller ideas.

## Run Locally

```bash
cd life-is-something-more
npm install
npm run dev
```

Other commands:

```bash
npm run build
npm run preview
npm test
```

## Structure

- `components/` — UI controls such as prompt and playback widgets
- `utils/` — audio, MIDI, throttling, and helper logic
- `utils/throttle.test.ts` — example Node test coverage

## Notes

- This app is independent from `dnd-engine/`
- It currently includes `@google/genai` and `lit`, but it should be treated as an experiment/prototype workspace rather than a production dependency of the D&D app
