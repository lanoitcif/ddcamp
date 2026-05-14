# D&D Engine: May UX Update

This document details the upcoming implementation for the Kid-Friendly UX improvements to the D&D Engine. It serves as a blueprint for the current development phase.

## Goal
Reduce friction for the DM and make the game rules inherently easier to understand for young players by utilizing visual math, intuitive iconography, and dynamic state feedback.

## Implementation Steps

### 1. Visual Math & Dice Feedback
- **Current State**: The Player TV shows the total roll prominently, and the math (`d20 X + Y`) is smaller underneath.
- **Implementation**: Update the math readout to use emojis and make it more prominent and kid-friendly (e.g., `🎲 15 + ✨ 5 = 20`).
- **File**: `dnd-engine/src/App.jsx` (PlayerView dice overlay).

### 2. Action Iconography
- **Current State**: Action buttons in the DM console are text-heavy (e.g., "Sneak Attack +5 (1d6+3)").
- **Implementation**: Add `lucide-react` icons to the action buttons based on simple keyword matching in the action name:
  - "Bow" / "Shoot" / "Arrow" ➔ `Crosshair`
  - "Smite" / "Magic" / "Spell" ➔ `Sparkles`
  - Default / Melee ➔ `Sword`
- **File**: `dnd-engine/src/App.jsx` (DM Console Action Buttons).

### 3. Simplified Advantage Mechanics
- **Current State**: The DM Console uses a plain text checkbox labeled "Advantage".
- **Implementation**: Replace the "Advantage" checkbox with a kid-friendly toggle button labeled "✨ Lucky Roll! (Roll Twice)" that stands out visually. This makes it easier for the DM to quickly spot and apply when kids do something creative.
- **File**: `dnd-engine/src/App.jsx` (DM Console controls).

### 4. Dynamic Character Portraits (HP Feedback)
- **Current State**: Portraits only turn grayscale at 0 HP.
- **Implementation**: Add a "Bloodied" or "Tired" state when HP is at or below 50%. The portrait will gain a slight visual filter (like `sepia`) and a pulsing red border to visually indicate they are in danger, reducing the need to read raw HP numbers.
- **File**: `dnd-engine/src/App.jsx` (PlayerView Hero & Monster Bar).

## Next Steps
Once reviewed and approved, we will begin modifying `App.jsx` to introduce these changes iteratively, starting with the Visual Math and Iconography.
