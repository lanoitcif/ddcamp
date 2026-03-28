import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Extra Edge Cases and Stability', () => {
  let dmPage;
  let playerPage;
  let context;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    dmPage = await context.newPage();
    playerPage = await context.newPage();

    // Clear any persisted state
    await dmPage.goto('http://localhost:5173');
    await dmPage.evaluate(() => localStorage.removeItem('dnd_game_state'));
    await dmPage.goto('http://localhost:5173');
    await playerPage.goto('http://localhost:5173/?mode=player');

    await expect(dmPage.locator('h1')).toContainText('The Dragon of Whispering Peak');
    await expect(playerPage.locator('h2').first()).toContainText("Mrs. Crumb's Bakery");
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('Rapid state changes (Next Turn spam)', async () => {
    const nextTurnBtn = dmPage.locator('button:has-text("Next Turn")');
    for (let i = 0; i < 20; i++) {
        await nextTurnBtn.click();
    }
    // Just verifying the app didn't crash
    await expect(dmPage.locator('h1')).toContainText('The Dragon of Whispering Peak');
  });

  test('Very long narration text handling', async () => {
    const longText = 'A'.repeat(500);
    const narrationInput = dmPage.locator('textarea');
    await narrationInput.fill(longText);
    await dmPage.locator('button:has-text("Send")').click();

    // The text should be sent to the player view.
    const playerNarration = playerPage.locator('p').filter({ hasText: longText });
    await expect(playerNarration).toBeVisible();

    // Clear narration
    await dmPage.locator('button:has-text("Clear")').click();
    await expect(playerNarration).not.toBeVisible();
  });

  test('HP boundary using input field', async () => {
    const lilyCard = dmPage.locator('[data-testid="card-lily"]');
    const hpInput = lilyCard.locator('input[placeholder="±HP"]');
    const applyBtn = lilyCard.locator('button:has-text("Apply")');
    const hpDisplay = lilyCard.locator('[data-testid="hp-lily"]');

    // Lily starts at 9. Subtract 15
    await hpInput.fill('-15');
    await applyBtn.click();
    await expect(hpDisplay).toHaveText('0');

    // Add 20
    await hpInput.fill('20');
    await applyBtn.click();
    await expect(hpDisplay).toHaveText('9');
  });

  test('Spamming action buttons', async () => {
    const lilyCard = dmPage.locator('[data-testid="card-lily"]');
    const sneakAttack = lilyCard.locator('button:has-text("Sneak Attack")');

    for (let i = 0; i < 10; i++) {
        await sneakAttack.click();
    }

    // Verify overlay appears
    const overlay = playerPage.locator('.backdrop-blur-xl').first();
    await expect(overlay).toBeVisible();

    // Let the overlay timeout or dismiss it manually
    await dmPage.locator('button:has-text("Dismiss Overlay")').click();
    await expect(overlay).not.toBeVisible();
  });

  test('Puzzle bounds checking', async () => {
    // Go to Sparkle Woods
    await dmPage.locator('button:has-text("The Sparkle Woods")').click();
    await playerPage.waitForTimeout(1000);

    await dmPage.locator('[data-testid="start-puzzle"]').click();
    const revealMoreBtn = dmPage.locator('button:has-text("Reveal More")');
    const showAllBtn = dmPage.locator('button:has-text("Show All")');

    // Spam reveal more
    for (let i = 0; i < 20; i++) {
        if (await revealMoreBtn.isEnabled()) {
            await revealMoreBtn.click();
        }
    }

    // It should eventually become disabled
    await expect(revealMoreBtn).toBeDisabled();
    await expect(showAllBtn).toBeDisabled();

    // Verify Player TV shows puzzle solved correctly
    await dmPage.locator('button:has-text("Answer: A Map")').click();
    await expect(playerPage.locator('text=A Map!')).toBeVisible();

    await dmPage.locator('[data-testid="end-puzzle"]').click();
  });
});
