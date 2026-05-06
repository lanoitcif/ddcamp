import { test, expect } from '@playwright/test';

test('Handles corrupted localStorage by falling back to defaults', async ({ page }) => {
  // Inject corrupted JSON into localStorage before the page loads
  await page.addInitScript(() => {
    window.localStorage.setItem('dnd_game_state', '{ bad_json }');
  });

  await page.goto('http://localhost:5173');

  // Verify that it fell back to defaultState
  // The default scene should be Mrs. Crumb's Bakery
  await expect(page.locator('.parchment h2')).toHaveText("Mrs. Crumb's Bakery");

  // Verify characters are present (part of defaultState)
  await expect(page.locator('[data-testid="card-lily"]')).toBeVisible();
  await expect(page.locator('[data-testid="card-thorne"]')).toBeVisible();
  await expect(page.locator('[data-testid="card-valerius"]')).toBeVisible();
});
