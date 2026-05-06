# Art Asset Inventory and Update Document

## Goal
Update all art assets to align with a **cartoony, fantasy style**.

## Changes Made
Replaced the previous mix of `bottts` (robot avatars) and generic Unsplash photography with a unified set of cartoonish SVGs from DiceBear to establish a consistent, cartoony fantasy visual style for the entire application.

### 1. Player Characters
*   **Original:** `https://api.dicebear.com/7.x/adventurer/svg?seed=[Name]`
*   **Updated:** `https://api.dicebear.com/9.x/adventurer/svg?seed=[Name]`
*   **Reasoning:** The 'adventurer' style is perfect for fantasy characters (rogues, fighters, paladins). We upgraded to DiceBear v9 for the latest rendering and kept the same seeds to maintain character likeness.

### 2. Monsters
*   **Original:** A mix of `bottts` (robots) and `identicon` (abstract geometric).
*   **Updated:** `https://api.dicebear.com/9.x/fun-emoji/svg?seed=[Name]&backgroundColor=e6f0fa`
*   **Reasoning:** `bottts` did not fit a fantasy game. The `fun-emoji` style provides expressive, cartoony faces that look like quirky creatures (goblins, sprites, dragons), which is perfect for a family-friendly D&D game.

### 3. Scenes / Backgrounds
*   **Original:** High-resolution Unsplash photography (e.g., real forests, real caves).
*   **Updated:** `https://api.dicebear.com/9.x/shapes/svg?seed=[Title]&backgroundColor=000000,1a1a1a&shape1Color=c0aede,d1d4f9,ffd5dc,ffdfbf`
*   **Reasoning:** Photography clashed with the drawn UI style. We replaced these with abstract, colorful SVG shapes. While not literal paintings of landscapes, they provide a thematic, stylized, and colorful cartoony backdrop that fits the engine's aesthetic seamlessly.

### 4. Handouts / Items (if present)
*   **Original:** Unsplash photography.
*   **Updated:** `https://api.dicebear.com/9.x/icons/svg?seed=[Title]&backgroundColor=f8f9fa`
*   **Reasoning:** Cartoony flat icons fit much better than photorealistic pictures for D&D clues and items like the "Golden Crumb" or "Dragon-Scale Medal".

## Summary
The entire game's visual asset library is now purely SVG-based, ensuring fast load times, perfect scaling on the TV view, and a cohesive, playful, and cartoony D&D aesthetic suitable for a campaign with kids.
