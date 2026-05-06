import { test, expect } from '@playwright/test';

test('Reaction should clear and not show auto', async ({ page }) => {
  await page.goto('http://localhost:5173/?mode=player');
  await page.evaluate(() => {
    localStorage.setItem('dnd_game_state', JSON.stringify({
      reaction: { emoji: '👍', id: Date.now() - 5000 }
    }));
  });
  await page.reload();

  const reactionLayer = page.locator('div.text-\\[15rem\\]');

  // It shouldn't be visible since it was loaded from initial state
  await expect(reactionLayer).not.toBeVisible();
});
