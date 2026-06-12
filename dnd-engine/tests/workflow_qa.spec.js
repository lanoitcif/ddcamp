import { test, expect } from '@playwright/test';

// Workflow QA for routes the other specs don't cover:
// Campaign Builder, XP award → level-up overlay, live LLM monster dialogue,
// and WebSocket multi-context sync (requires PORT=3737 node server/index.js).

const BASE = 'http://localhost:5173';

test('Campaign Builder route renders and can add a character', async ({ page }) => {
  await page.goto(`${BASE}/?mode=builder`);
  await expect(page.getByRole('button', { name: /Export JSON/i })).toBeVisible();
  await page.getByRole('button', { name: 'Characters' }).click();
  const addButton = page.getByRole('button', { name: /Add Character/i });
  await expect(addButton).toBeVisible();
  await addButton.click();
  // A new character editor section should appear without crashing the app
  await expect(page.locator('.App')).not.toContainText('The Dragon Sneezed');
});

test('XP custom award triggers LEVEL UP overlay on player view', async ({ browser }) => {
  const context = await browser.newContext();
  const dmPage = await context.newPage();
  await dmPage.goto(BASE);
  await dmPage.evaluate(() => localStorage.clear());
  await dmPage.reload();

  const playerPage = await context.newPage();
  await playerPage.goto(`${BASE}/?mode=player`);

  // Custom-award 150 XP to the first character (level 2 threshold is 100)
  await dmPage.getByRole('button', { name: /Custom/i }).first().click();
  await dmPage.locator('input[placeholder="XP"]').fill('150');
  await dmPage.getByRole('button', { name: 'Award', exact: true }).click();

  await expect(playerPage.getByText(/LEVEL UP!/i)).toBeVisible({ timeout: 10_000 });
  await context.close();
});

test('Live LLM monster dialogue lands in the narration box', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto(BASE);
  // Seed scene with monsters (woods) so monster cards render
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('dnd_game_state', JSON.stringify({ currentSceneId: 'woods' }));
  });
  await page.reload();

  const monsterCard = page.locator('[data-testid="card-hoot"]');
  await expect(monsterCard).toBeVisible();
  await monsterCard.locator('input[placeholder*="Ask AI"]').fill('The heroes step on a twig');
  await monsterCard.locator('button[title="Generate AI Response"]').click();

  const narration = page.locator('textarea[placeholder="The door creaks open..."]');
  await expect(narration).not.toHaveValue('', { timeout: 60_000 });
  await expect(narration).not.toHaveValue(/Generating AI response/, { timeout: 60_000 });
  await expect(narration).not.toHaveValue(/Failed to generate/);
});

test('WebSocket sync: two isolated contexts share state and show client count', async ({ browser }) => {
  const wsParam = 'ws=localhost:3737&room=qa';

  const dmContext = await browser.newContext();
  const dmPage = await dmContext.newPage();
  await dmPage.goto(`${BASE}/?${wsParam}`);
  await dmPage.evaluate(() => localStorage.clear());
  await dmPage.reload();

  const playerContext = await browser.newContext(); // separate localStorage — only WS can sync them
  const playerPage = await playerContext.newPage();
  await playerPage.goto(`${BASE}/?mode=player&${wsParam}`);

  // clientCount regression: DM badge must show a number, not "?"
  await expect(dmPage.getByText(/Connected \(\d+ clients\)/)).toBeVisible({ timeout: 10_000 });

  // DM switches scene → player (different context) must follow via WS
  await dmPage.getByRole('button', { name: 'The Sparkle Woods' }).click();
  await expect(playerPage.getByRole('heading', { name: 'The Sparkle Woods' })).toBeVisible({ timeout: 10_000 });

  await dmContext.close();
  await playerContext.close();
});
