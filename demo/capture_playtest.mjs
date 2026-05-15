import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import playwrightPkg from '../dnd-engine/node_modules/playwright/index.js';

const { chromium } = playwrightPkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, 'captures');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function safeClick(page, selector) {
  const target = page.locator(selector).first();
  await target.waitFor({ state: 'visible', timeout: 10000 });
  await target.click();
}

async function writeNarration(page, text, mode = 'text') {
  const area = page.locator('textarea').first();
  await area.fill(text);
  if (mode === 'speak') {
    await safeClick(page, 'button:has-text("Send & Speak")');
  } else {
    await safeClick(page, 'button:has-text("Text Only")');
  }
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  let browser;
  try {
    browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  } catch {
    browser = await chromium.launch({
      headless: true,
      args: ['--autoplay-policy=no-user-gesture-required'],
    });
  }

  const context = browser.contexts()[0] || await browser.newContext();
  const dmPage = await context.newPage();
  const playerPage = await context.newPage();

  try {
    await dmPage.setViewportSize({ width: 1920, height: 1080 });
    await playerPage.setViewportSize({ width: 1920, height: 1080 });

    await dmPage.goto('http://localhost:5173');
    await dmPage.evaluate(() => localStorage.removeItem('dnd_game_state'));
    await dmPage.goto('http://localhost:5173');
    await playerPage.goto('http://localhost:5173/?mode=player');
    await wait(2000);

    await safeClick(dmPage, '[data-testid="audio-toggle"]');
    await wait(1200);

    await dmPage.locator('[data-testid="audio-controls"] select').nth(0).selectOption('hybrid');
    await dmPage.locator('[data-testid="audio-controls"] select').nth(1).selectOption('full');
    await wait(800);

    await writeNarration(
      dmPage,
      'Dad: Okay team, the Sun-Cakes are missing. Lily checks under the tables, Thorne wants to kick the pantry door, and the chaotic kid throws flour everywhere to reveal clues.',
      'text'
    );
    await wait(1800);

    await dmPage.locator('[data-testid="audio-controls"]').scrollIntoViewIfNeeded();
    await dmPage.screenshot({ path: path.join(outputDir, '01_dm_current_dashboard.png') });
    await playerPage.screenshot({ path: path.join(outputDir, '02_player_intro_current.png') });

    await safeClick(dmPage, 'button:has-text("Sun-Cakes")');
    await wait(1400);
    await safeClick(dmPage, 'button:has-text("🔥")');
    await wait(1200);
    await playerPage.screenshot({ path: path.join(outputDir, '03_player_handout_reaction.png') });
    await safeClick(dmPage, 'button:has-text("Dismiss Overlay")');
    await wait(700);

    await safeClick(dmPage, '[data-testid="start-puzzle"]');
    await wait(1000);
    await dmPage.screenshot({ path: path.join(outputDir, '04_dm_puzzle_live.png') });
    await playerPage.screenshot({ path: path.join(outputDir, '05_player_puzzle_live.png') });
    await safeClick(dmPage, '[data-testid="end-puzzle"]');
    await wait(700);

    await safeClick(dmPage, 'button:has-text("Whispering Peak")');
    await wait(2000);
    await dmPage.locator('[data-testid="card-glint"]').waitFor({ state: 'visible', timeout: 15000 });

    const aiInput = dmPage.locator('[data-testid="card-glint"] input[placeholder="Ask AI or Type to Speak..."]').first();
    await aiInput.fill('An adversarial kid tries to befriend the dragon, blame dad for everything, and ask for treasure anyway. Respond in character.');
    await dmPage.locator('button[title="Generate AI Response"]').first().click();
    await wait(7000);
    await dmPage.screenshot({ path: path.join(outputDir, '06_dm_local_llm_prompt.png') });

    await writeNarration(
      dmPage,
      'The dragon tilts its head. The brave idea almost works, but now everyone has to improvise together.',
      'text'
    );
    await wait(1200);
    await playerPage.screenshot({ path: path.join(outputDir, '07_player_dragon_narration.png') });

    await dmPage.locator('[data-testid="card-lily"]').locator('button:has-text("Sneak Attack")').click();
    await wait(1800);
    await playerPage.screenshot({ path: path.join(outputDir, '08_player_combat_overlay.png') });
    await dmPage.screenshot({ path: path.join(outputDir, '09_dm_combat_state.png') });

    await safeClick(dmPage, 'button:has-text("Make a New Friend")');
    await wait(1500);
    await playerPage.screenshot({ path: path.join(outputDir, '10_player_quest_reward.png') });
    await safeClick(dmPage, 'button:has-text("Dismiss Overlay")');

    console.log(`Wrote fresh captures to ${outputDir}`);
  } finally {
    await dmPage.close();
    await playerPage.close();
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
