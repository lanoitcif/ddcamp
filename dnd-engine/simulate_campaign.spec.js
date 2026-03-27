import { test, expect } from '@playwright/test';

test('Campaign Simulation', async ({ browser }) => {
  // 1. Launch ONE browser context and TWO pages: dm and player
  const context = await browser.newContext();

  const dmPage = await context.newPage();
  const playerPage = await context.newPage();

  // Clear persisted state
  await dmPage.goto('http://localhost:5173');
  await dmPage.evaluate(() => localStorage.removeItem('dnd_game_state'));
  await dmPage.goto('http://localhost:5173');
  await playerPage.goto('http://localhost:5173/?mode=player');

  // VERIFY: Scene 1 "Mrs. Crumb's Bakery" is visible on both.
  await expect(dmPage.locator('.parchment h2')).toHaveText("Mrs. Crumb's Bakery");
  await expect(playerPage.locator('h2').first()).toContainText("Mrs. Crumb's Bakery");

  // ACT: In DM, click "The Sparkle Woods" scene.
  await dmPage.click('button:has-text("The Sparkle Woods")');

  // VERIFY: Player view updates its title to "The Sparkle Woods".
  await expect(playerPage.locator('h2').first()).toContainText("The Sparkle Woods", { timeout: 3000 });

  // ACT: In DM, click "Lily the Silent: Sneak Attack".
  const lilyCard = dmPage.locator('[data-testid="card-lily"]');
  await lilyCard.locator('button:has-text("Sneak Attack")').click();

  // VERIFY: Player view shows a dice overlay
  const diceOverlay = playerPage.locator('.backdrop-blur-xl').first();
  await expect(diceOverlay).toBeVisible();

  // ACT: In DM, decrease "Brave Thorne" HP by 5.
  const thorneCard = dmPage.locator('[data-testid="card-thorne"]');
  const minusButton = thorneCard.getByRole('button', { name: '-', exact: true });
  for (let i = 0; i < 5; i++) {
    await minusButton.click();
  }

  // VERIFY: HP display shows 7
  await expect(thorneCard.locator('[data-testid="hp-thorne"]')).toHaveText('7');

  // VERIFY: Player view HP text reflects lower HP
  const thornePlayerHp = playerPage.locator('[data-testid="player-hp-thorne"]');
  await expect(thornePlayerHp).toContainText('7');

  // ACT: Final "Whispering Peak" scene.
  await dmPage.click('button:has-text("Whispering Peak")');
  await expect(playerPage.locator('h2').first()).toContainText("Whispering Peak", { timeout: 3000 });

  // VERIFY: Monster cards appear for Whispering Peak scene
  await expect(dmPage.locator('text=Monsters in Scene')).toBeVisible();

  // TAKE SCREENSHOTS of both DM and Player views.
  await dmPage.screenshot({ path: 'dm_final_scene.png' });
  await playerPage.screenshot({ path: 'player_final_scene.png' });

  await context.close();
});
