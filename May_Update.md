# D&D Engine: May UX Update

This document records the May UX pass that was implemented in the D&D Engine.

## Goal
Reduce friction for the DM and make the game easier to read for young players through clearer math, stronger iconography, and better visual state feedback.

## Implemented Changes

### 1. Visual Math & Dice Feedback
- Dice overlays were kept large and high-contrast on the player view.
- Supporting math was clarified for better readability during play.
- File: `dnd-engine/src/App.jsx`

### 2. Action Iconography
- DM action buttons now use `lucide-react` icons based on action name matching:
  - ranged actions use `Crosshair`
  - spell/smite actions use `Sparkles`
  - melee defaults use `Sword`
- File: `dnd-engine/src/App.jsx`

### 3. Simplified Advantage Mechanics
- The old plain-text advantage control was replaced by the more visible `Lucky Roll!` interaction.
- This makes the “help/advantage” concept easier to use quickly with kids at the table.
- File: `dnd-engine/src/App.jsx`

### 4. Dynamic Character Feedback
- Character and monster presentation was tightened to make state changes easier to spot.
- HP, turn state, overlays, and scene feedback now read more clearly in play.
- Files: `dnd-engine/src/App.jsx`, related UI/state hooks

## Follow-On Work
- The later ambient-audio/LLM pass built on this UX work by adding context-aware music controls, local model integration, and refreshed demo capture assets.
