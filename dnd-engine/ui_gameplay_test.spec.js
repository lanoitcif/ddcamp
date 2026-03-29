import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('D&D Engine Exhaustive UI and Gameplay Tests', () => {
  let dmPage;
  let playerPage;
  let context;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    dmPage = await context.newPage();
    playerPage = await context.newPage();
    
    // Clear any persisted state from prior runs
    await dmPage.goto('http://localhost:5173');
    await dmPage.evaluate(() => localStorage.removeItem('dnd_game_state'));
    
    // Mock Math.random to always return 0.99 for a critical hit (20)
    await dmPage.addInitScript(() => {
      window.Math.random = () => 0.99;
    });

    await dmPage.goto('http://localhost:5173');
    await playerPage.goto('http://localhost:5173/?mode=player');
    
    // Wait for initial load
    await expect(dmPage.locator('h1')).toContainText('The Dragon of Whispering Peak');
    await expect(playerPage.locator('h2').first()).toContainText("Mrs. Crumb's Bakery");
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('UI Responsiveness - DM View', async () => {
    // Sidebar Scenes
    await expect(dmPage.locator('h2:has-text("Scenes")')).toBeVisible();
    await expect(dmPage.locator('button:has-text("Mrs. Crumb\'s Bakery")').first()).toBeVisible();
    await expect(dmPage.locator('button:has-text("The Sparkle Woods")').first()).toBeVisible();
    await expect(dmPage.locator('button:has-text("Whispering Peak")').first()).toBeVisible();
    
    // Character Cards
    await expect(dmPage.locator('.dnd-card')).toHaveCount(3);
    const lilyCard = dmPage.locator('[data-testid="card-lily"]');
    await expect(lilyCard).toBeVisible();
    await expect(lilyCard.locator('button:has-text("Sneak Attack")')).toBeVisible();
    
    // Scene Parchment
    await expect(dmPage.locator('.parchment')).toBeVisible();
    await expect(dmPage.locator('.parchment h2')).toHaveText("Mrs. Crumb's Bakery");
  });

  test('Visual Feedback (Juice) - Critical Hit', async () => {
    // Action: Click "Sneak Attack" for Lily
    const lilyCard = dmPage.locator('[data-testid="card-lily"]');
    await lilyCard.locator('button:has-text("Sneak Attack")').click();

    // Verify Dice Overlay on Player View
    const overlay = playerPage.locator('.backdrop-blur-xl').first();
    await expect(overlay).toBeVisible();
    
    // Lily's Sneak Attack has +5 bonus. 
    // Math.random() = 0.99 -> floor(0.99 * 20) + 1 = 20.
    // Total: 20 + 5 = 25
    await expect(overlay.locator('[data-testid="dice-display"]')).toContainText('25', { timeout: 5000 });
    
    // Check Critical Hit!
    await expect(overlay.locator('text=Critical Hit!')).toBeVisible();
    
    // Check damage is shown (1d6+3)
    await expect(overlay.locator('text=damage')).toBeVisible();
    
    // Wait for overlay to disappear
    await expect(overlay).not.toBeVisible({ timeout: 6000 });
  });

  test('Character State (Gameplay) - HP capped at max', async () => {
    const lilyCard = dmPage.locator('[data-testid="card-lily"]');
    const plusButton = lilyCard.getByRole('button', { name: '+', exact: true });
    const hpDisplay = lilyCard.locator('[data-testid="hp-lily"]');
    
    // Current HP is 9 (initial). Max HP is 9.
    await expect(hpDisplay).toHaveText('9');
    
    // Click plus once — should stay at 9 (now capped at maxHp)
    await plusButton.click();
    await expect(hpDisplay).toHaveText('9');
  });

  test('Character State (Gameplay) - Reduce to 0 and BONKED', async () => {
    const thorneCard = dmPage.locator('[data-testid="card-thorne"]');
    const minusButton = thorneCard.getByRole('button', { name: '-', exact: true });
    const hpDisplay = thorneCard.locator('[data-testid="hp-thorne"]');
    
    // Thorne initial HP is 12.
    await expect(hpDisplay).toHaveText('12');
    
    for (let i = 0; i < 12; i++) {
      await minusButton.click();
    }
    
    await expect(hpDisplay).toHaveText('0');
    
    // Extra click — should stay at 0 (capped at floor)
    await minusButton.click();
    await expect(hpDisplay).toHaveText('0');
    
    // Check Player View for BONKED
    const thorneBonked = playerPage.locator('[data-testid="hero-thorne"]').locator('text=BONKED');
    await expect(thorneBonked).toBeVisible();
  });

  test('Character State (Gameplay) - HP Bar Color Change', async () => {
    const valeriusCard = dmPage.locator('[data-testid="card-valerius"]');
    const minusButton = valeriusCard.getByRole('button', { name: '-', exact: true });
    const hpDisplay = valeriusCard.locator('[data-testid="hp-valerius"]');
    
    // Valerius initial HP is 12.
    await expect(hpDisplay).toHaveText('12');
    
    // 3/12 = 0.25 (25%), which is < 0.3.
    for (let i = 0; i < 9; i++) {
      await minusButton.click();
    }
    
    await expect(hpDisplay).toHaveText('3');
    
    // Check Player View HP Bar color — should be red
    const hpBar = playerPage.locator('[data-testid="hero-valerius"] .h-4 .h-full');
    await expect(hpBar).toHaveClass(/from-red-600/);
    
    // Heal back to 4/12 = 33.3%, should turn green
    const plusButton = valeriusCard.getByRole('button', { name: '+', exact: true });
    await plusButton.click();
    await expect(hpDisplay).toHaveText('4');
    await expect(hpBar).toHaveClass(/from-green-600/);
  });

  test('HP numbers visible on Player View', async () => {
    const lilyHp = playerPage.locator('[data-testid="player-hp-lily"]');
    await expect(lilyHp).toBeVisible();
    await expect(lilyHp).toContainText('9');
    await expect(lilyHp).toContainText('/ 9');
  });

  test('YOUR TURN banner visible on Player View', async () => {
    const turnBanner = playerPage.locator('[data-testid="turn-banner"]');
    await expect(turnBanner).toBeVisible();
    await expect(turnBanner).toContainText('TURN');
  });

  test('Scene Transitions - Background Change', async () => {
    // Select Sparkle Woods
    await dmPage.locator('button:has-text("The Sparkle Woods")').click();
    
    // Verify title update on Player View
    await expect(playerPage.locator('h2').first()).toHaveText("The Sparkle Woods", { timeout: 3000 });
  });

  test('Persistence - Refresh DM Page', async () => {
    // Current Lily HP should be 9
    const lilyCard = dmPage.locator('[data-testid="card-lily"]');
    await expect(lilyCard.locator('[data-testid="hp-lily"]')).toHaveText('9');

    // Reload
    await dmPage.reload();
    
    // Restore the Math.random mock after reload
    await dmPage.evaluate(() => { window.Math.random = () => 0.99; });
    
    // Check again
    const lilyCardReloaded = dmPage.locator('[data-testid="card-lily"]');
    await expect(lilyCardReloaded.locator('[data-testid="hp-lily"]')).toHaveText('9');
    
    // Thorne should still be 0
    const thorneCard = dmPage.locator('[data-testid="card-thorne"]');
    await expect(thorneCard.locator('[data-testid="hp-thorne"]')).toHaveText('0');
  });

  test('Split Narration Buttons - Text Only and TTS', async () => {
    // Verify both narration buttons exist
    await expect(dmPage.locator('button:has-text("Text Only")')).toBeVisible();
    await expect(dmPage.locator('button:has-text("Send & Speak")')).toBeVisible();

    // Test Text Only sends narration without voiceId
    const narrationInput = dmPage.locator('textarea');
    await narrationInput.fill('Testing text-only narration');
    await dmPage.locator('button:has-text("Text Only")').click();

    // Verify narration appears on Player View
    await expect(playerPage.locator('text=Testing text-only narration')).toBeVisible({ timeout: 3000 });

    // Verify no voiceId in state
    const state = await dmPage.evaluate(() => JSON.parse(localStorage.getItem('dnd_game_state')));
    expect(state.narration.voiceId).toBeUndefined();

    // Clear narration
    await dmPage.locator('button:has-text("Clear")').click();
  });

  test('TTS Narration includes voiceId in game state', async () => {
    const narrationInput = dmPage.locator('textarea');
    await narrationInput.fill('Testing TTS narration');
    await dmPage.locator('button:has-text("Send & Speak")').click();

    // Verify narration appears on Player View
    await expect(playerPage.locator('text=Testing TTS narration')).toBeVisible({ timeout: 3000 });

    // Verify voiceId is set in state
    const state = await dmPage.evaluate(() => JSON.parse(localStorage.getItem('dnd_game_state')));
    expect(state.narration.voiceId).toBeTruthy();

    // Clear narration
    await dmPage.locator('button:has-text("Clear")').click();
  });

  test('Monster AI Prompt Input visible on monster cards', async () => {
    // Navigate to Whispering Peak which has monsters
    await dmPage.locator('button:has-text("Whispering Peak")').click();
    await new Promise(r => setTimeout(r, 1500));

    // Verify monster section exists
    await expect(dmPage.locator('text=Monsters in Scene')).toBeVisible();

    // Verify AI prompt input is visible on monster cards
    const aiInput = dmPage.locator('input[placeholder="Ask AI via Player Action..."]').first();
    await expect(aiInput).toBeVisible();

    // Verify AI button is visible
    const aiButton = dmPage.locator('button[title="Generate AI Response"]').first();
    await expect(aiButton).toBeVisible();

    // Type in the AI prompt
    await aiInput.fill('I approach the dragon cautiously');
    await expect(aiInput).toHaveValue('I approach the dragon cautiously');
  });
});
