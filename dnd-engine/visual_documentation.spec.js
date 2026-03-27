import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = '/home/lanoitcif/ddcamp/screenshots';

test.describe('Visual Documentation Suite', () => {
  let dmPage;
  let playerPage;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
    dmPage = await context.newPage();
    playerPage = await context.newPage();

    // Clear persisted state for clean screenshots
    await dmPage.goto('http://localhost:5173');
    await dmPage.evaluate(() => localStorage.removeItem('dnd_game_state'));

    await dmPage.goto('http://localhost:5173');
    await playerPage.goto('http://localhost:5173/?mode=player');
    
    // Ensure both are loaded
    await expect(dmPage.locator('h1')).toContainText('Dragon of Whispering Peak');
    await expect(playerPage.locator('h2').first()).toContainText('Bakery');
  });

  test('Scenario 1: The DM\'s War Room', async () => {
    await dmPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'scenario1_dm_dashboard.png'), fullPage: true });
  });

  test('Scenario 2: The Cinematic TV Experience', async () => {
    await playerPage.waitForTimeout(1000); 
    await playerPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'scenario2_tv_view.png'), fullPage: true });
  });

  test('Scenario 3: The Moment of Glory', async () => {
    // Mock Math.random for a critical hit before page reload
    await dmPage.addInitScript(() => {
        window.Math.random = () => 0.99;
    });
    await dmPage.reload();
    await expect(dmPage.locator('h1')).toContainText('Dragon of Whispering Peak');
    
    await dmPage.click('button:has-text("Warhammer")');
    
    // Check TV view for critical hit
    await expect(playerPage.locator('text=Critical Hit!')).toBeVisible();
    await playerPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'scenario3_critical_hit.png'), fullPage: true });
  });

  test('Scenario 4: High Stakes', async () => {
    // Clear the random mock and reload for clean state
    await dmPage.addInitScript(() => {});
    await dmPage.reload();
    await expect(dmPage.locator('h1')).toContainText('Dragon of Whispering Peak');

    // Reduce Lily to 0 HP using data-testid selectors
    const lilyMinus = dmPage.locator('[data-testid="card-lily"]').getByRole('button', { name: '-', exact: true });
    for (let i = 0; i < 9; i++) {
        await lilyMinus.click();
    }
    
    // Reduce Thorne to low HP (starts at 12, reduce to 3)
    const thorneMinus = dmPage.locator('[data-testid="card-thorne"]').getByRole('button', { name: '-', exact: true });
    for (let i = 0; i < 9; i++) {
        await thorneMinus.click();
    }

    // Verify Player View
    await expect(playerPage.locator('[data-testid="hero-lily"]').locator('text=BONKED')).toBeVisible();

    await playerPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'scenario4_high_stakes.png'), fullPage: true });
  });

  test('Scenario 5: Narrative Transition', async () => {
    // Switch to "The Sparkle Woods" scene
    await dmPage.click('button:has-text("The Sparkle Woods")');
    await expect(playerPage.locator('h2').first()).toContainText('The Sparkle Woods', { timeout: 3000 });
    
    // Trigger a Quest Award
    await dmPage.click('button:has-text("Solve Hoot\'s Riddle")');
    await expect(playerPage.locator('text=Quest Complete!')).toBeVisible();
    
    await playerPage.waitForTimeout(1000);
    await playerPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'scenario5_narrative_transition.png'), fullPage: true });
  });
});
