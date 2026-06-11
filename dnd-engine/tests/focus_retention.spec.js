import { test, expect } from '@playwright/test';

// Regression: EntityCard used to be defined inside DMControl, so each keystroke
// re-rendered DMControl, recreated the component type, and React remounted the
// card — blurring the input after every character.
test('HP and speak inputs keep focus while typing multiple characters', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const card = page.locator('[data-testid^="card-"]').first();
  const hpInput = card.locator('input[placeholder="±HP"]');
  await hpInput.click();
  await hpInput.pressSequentially('123', { delay: 50 });
  await expect(hpInput).toHaveValue('123');
  await expect(hpInput).toBeFocused();

  const speakInput = card.locator('input[placeholder*="Speak"]');
  await speakInput.click();
  await speakInput.pressSequentially('hello brave heroes', { delay: 25 });
  await expect(speakInput).toHaveValue('hello brave heroes');
  await expect(speakInput).toBeFocused();
});
