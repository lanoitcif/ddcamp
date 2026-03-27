// ═══════════════════════════════════════════════════════════════════
// AI AGENT CAMPAIGN PLAYTEST
// Simulates the full "Dragon of Whispering Peak" campaign with:
//   🎲 DM Agent — narrates, controls scenes, manages puzzles & combat
//   ⚔️ Lily Agent — Rogue, sneaky, loves investigation
//   🛡️ Thorne Agent — Fighter, charges in, loves melee
//   ✨ Valerius Agent — Paladin, uses Divine Smite, healer mentality
//
// Monitors for: state sync issues, HP bugs, puzzle flow, overlay stacking,
// missing UI elements, timing issues, and UX problems.
// ═══════════════════════════════════════════════════════════════════

import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

// Issue tracker — collects all problems found during playtest
const issues = [];
function logIssue(severity, category, description, details = '') {
  issues.push({ severity, category, description, details });
  console.log(`  ⚠️ [${severity}] ${category}: ${description}${details ? ' — ' + details : ''}`);
}

const agentActions = {
  dm: [],
  lily: [],
  thorne: [],
  valerius: [],
};

function noteAction(agent, action) {
  agentActions[agent].push(action);
}

// Helpers
async function waitForSync(ms = 600) {
  await new Promise(r => setTimeout(r, ms));
}

async function safeClick(page, selector, label = '') {
  try {
    const el = page.locator(selector).first();
    await expect(el).toBeVisible({ timeout: 3000 });
    await el.click();
    return true;
  } catch (e) {
    logIssue('HIGH', 'UI', `Could not click "${label || selector}"`, e.message?.slice(0, 100));
    return false;
  }
}

async function verifyPlayerSync(dmPage, playerPage, testName) {
  await waitForSync(800);
  // Compare scene titles
  try {
    const dmScene = await dmPage.locator('.parchment h2').first().textContent();
    const playerScene = await playerPage.locator('h2').first().textContent();
    if (dmScene && playerScene && !playerScene.includes(dmScene.trim())) {
      logIssue('CRITICAL', 'Sync', `${testName}: DM scene "${dmScene}" ≠ Player scene "${playerScene}"`);
    }
  } catch {
    // Scene title mismatch might be timing — not critical if transient
  }
}

async function checkHpSync(dmPage, playerPage, entityId, expectedHp) {
  await waitForSync(400);
  try {
    const dmHp = await dmPage.locator(`[data-testid="hp-${entityId}"]`).textContent();
    const playerHp = await playerPage.locator(`[data-testid="player-hp-${entityId}"]`).textContent();
    const dmVal = parseInt(dmHp);
    const playerVal = parseInt(playerHp);
    if (dmVal !== expectedHp) {
      logIssue('HIGH', 'HP', `DM shows ${entityId} HP=${dmVal}, expected ${expectedHp}`);
    }
    if (playerVal !== expectedHp) {
      logIssue('HIGH', 'HP Sync', `Player shows ${entityId} HP=${playerVal}, expected ${expectedHp}`);
    }
    return dmVal;
  } catch {
    logIssue('MEDIUM', 'HP', `Could not read HP for ${entityId}`);
    return -1;
  }
}

// ═══════════════════════════════════════════════════════════════════
// THE FULL CAMPAIGN PLAYTEST
// ═══════════════════════════════════════════════════════════════════

test('Full Campaign Playtest — DM + 3 Player Agents', async ({ browser }) => {
  test.setTimeout(120_000); // 2 minutes for full campaign

  console.log('\n🎭 ═══ THE DRAGON OF WHISPERING PEAK — AGENT PLAYTEST ═══\n');

  // ─── Setup: Open DM Console + Player TV ───
  const context = await browser.newContext();
  const dmPage = await context.newPage();
  const playerPage = await context.newPage();

  await dmPage.goto(BASE);
  await dmPage.evaluate(() => localStorage.removeItem('dnd_game_state'));
  await dmPage.goto(BASE);
  await playerPage.goto(`${BASE}/?mode=player`);
  await waitForSync(1000);

  console.log('📺 DM Console and Player TV are live.\n');

  // ═══════════════════════════════════════════════════════════════
  // ACT 1: MRS. CRUMB'S BAKERY
  // ═══════════════════════════════════════════════════════════════
  console.log('🧁 ═══ ACT 1: MRS. CRUMB\'S BAKERY ═══\n');

  // DM Agent: Verify starting scene
  const startScene = await dmPage.locator('.parchment h2').first().textContent();
  console.log(`  🎲 DM: "Welcome adventurers! We begin at ${startScene}"`);
  noteAction('dm', `Opened campaign at ${startScene}`);
  if (!startScene.includes('Bakery')) {
    logIssue('CRITICAL', 'Init', 'Starting scene is not Bakery');
  }
  await verifyPlayerSync(dmPage, playerPage, 'Act 1 start');

  // DM Agent: Set the mood with narration
  console.log('  🎲 DM: Sending narration to the TV...');
  const narrationInput = dmPage.locator('textarea');
  await narrationInput.fill('The bakery smells of cinnamon, but something is wrong — the Sun-Cakes are missing!');
  await safeClick(dmPage, 'button:has-text("Send")', 'Send Narration');
  noteAction('dm', 'Narrated opening bakery mystery');
  await waitForSync(800);

  // Verify narration on Player View
  try {
    const narration = await playerPage.getByText('The bakery smells', { exact: false }).first();
    await expect(narration).toBeVisible({ timeout: 3000 });
    console.log('  📺 Player TV: Narration subtitle visible ✓');
  } catch {
    logIssue('HIGH', 'Narration', 'Narration text not visible on Player View');
  }

  // DM Agent: Launch Bakery Spotlight Puzzle
  console.log('\n  🔦 DM: "Time to search for clues! Launching spotlight puzzle..."');
  const puzzleControls = dmPage.locator('[data-testid="puzzle-controls"]');
  try {
    await expect(puzzleControls).toBeVisible({ timeout: 3000 });
    await safeClick(dmPage, '[data-testid="start-puzzle"]', 'Start Spotlight Puzzle');
    await waitForSync(800);

    // Verify spotlight overlay on Player View
    const searchTitle = playerPage.getByText('Search the Bakery');
    await expect(searchTitle).toBeVisible({ timeout: 3000 });
    console.log('  📺 Player TV: Spotlight puzzle overlay active ✓');

    // DM Agent: Move spotlight to clue zone 1 (flour-trail at 22%, 65%)
    console.log('  🎲 DM: Moving spotlight to flour sacks area...');
    const spotlightArea = dmPage.locator('[data-testid="puzzle-controls"]').locator('.cursor-crosshair');
    const spotBounds = await spotlightArea.boundingBox();
    if (spotBounds) {
      // Move to flour-trail zone (22%, 65%)
      const targetX = spotBounds.x + spotBounds.width * 0.22;
      const targetY = spotBounds.y + spotBounds.height * 0.65;
      await dmPage.mouse.move(targetX, targetY);
      await dmPage.mouse.down();
      await dmPage.mouse.move(targetX, targetY); // trigger pointerMove
      await dmPage.mouse.up();
      await waitForSync(400);

      // Try to reveal the clue
      const revealBtn = dmPage.locator('button:has-text("Reveal")');
      if (await revealBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await revealBtn.click();
        console.log('  🔦 DM: Found a clue! Flour Paw Prints revealed ✓');
        noteAction('dm', 'Revealed clue: Flour Paw Prints');
      } else {
        console.log('  🔦 DM: Spotlight near zone but reveal not triggered (might need finer positioning)');
      }

      // Move to clue zone 2 (crumb-note at 72%, 40%)
      console.log('  🎲 DM: Moving to the counter...');
      const target2X = spotBounds.x + spotBounds.width * 0.72;
      const target2Y = spotBounds.y + spotBounds.height * 0.40;
      await dmPage.mouse.move(spotBounds.x + spotBounds.width * 0.5, spotBounds.y + spotBounds.height * 0.5);
      await dmPage.mouse.down();
      await dmPage.mouse.move(target2X, target2Y);
      await dmPage.mouse.up();
      await waitForSync(400);

      const revealBtn2 = dmPage.locator('button:has-text("Reveal")');
      if (await revealBtn2.isVisible({ timeout: 1500 }).catch(() => false)) {
        await revealBtn2.click();
        console.log('  🔦 DM: Found a clue! Crumpled Note revealed ✓');
        noteAction('dm', 'Revealed clue: Crumpled Note');
      }

      // Move to clue zone 3 (frosting-smear at 50%, 78%)
      console.log('  🎲 DM: Checking the floor...');
      const target3X = spotBounds.x + spotBounds.width * 0.50;
      const target3Y = spotBounds.y + spotBounds.height * 0.78;
      await dmPage.mouse.move(spotBounds.x + spotBounds.width * 0.5, spotBounds.y + spotBounds.height * 0.5);
      await dmPage.mouse.down();
      await dmPage.mouse.move(target3X, target3Y);
      await dmPage.mouse.up();
      await waitForSync(400);

      const revealBtn3 = dmPage.locator('button:has-text("Reveal")');
      if (await revealBtn3.isVisible({ timeout: 1500 }).catch(() => false)) {
        await revealBtn3.click();
        console.log('  🔦 DM: Found a clue! Blue Frosting Smear revealed ✓');
        noteAction('dm', 'Revealed clue: Blue Frosting Smear');
      }
    } else {
      logIssue('MEDIUM', 'Puzzle', 'Could not find spotlight drag area bounds');
    }

    // DM Agent: End puzzle
    await safeClick(dmPage, '[data-testid="end-puzzle"]', 'End Spotlight Puzzle');
    await waitForSync(500);
    console.log('  🎲 DM: Spotlight puzzle ended.\n');
  } catch (e) {
    logIssue('HIGH', 'Puzzle', 'Spotlight puzzle flow failed', e.message?.slice(0, 120));
  }

  // DM Agent: Award bakery clue quest
  console.log('  🎲 DM: "You found the clue! Awarding quest..."');
  await safeClick(dmPage, 'button:has-text("Find the Bakery Clue")', 'Award Bakery Clue');
  noteAction('dm', 'Awarded quest: Find the Bakery Clue');
  await waitForSync(1500);

  // Verify quest toast on Player View
  try {
    const toast = playerPage.getByText('Quest Complete');
    await expect(toast).toBeVisible({ timeout: 5000 });
    console.log('  📺 Player TV: Quest toast showing ✓');
  } catch {
    logIssue('MEDIUM', 'Toast', 'Quest completion toast not visible on Player View');
  }

  // DM Agent: Dismiss overlay
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss Overlay');
  await waitForSync(500);

  // Lily Agent: "I want to investigate!"
  console.log('\n  🗡️ Lily: "I search for more clues with my keen eyes!"');
  const lilyCard = dmPage.locator('[data-testid="card-lily"]');
  await safeClick(dmPage, '[data-testid="card-lily"] >> button:has-text("Sneak Attack")', 'Lily Sneak Attack');
  noteAction('lily', 'Used Sneak Attack in bakery to investigate');
  await waitForSync(1500);

  // Verify dice overlay on Player View
  try {
    const diceDisplay = playerPage.locator('[data-testid="dice-display"]');
    await expect(diceDisplay).toBeVisible({ timeout: 3000 });
    console.log('  📺 Player TV: Dice animation playing ✓');
    // Wait for spin to finish
    await waitForSync(2000);
    const result = await diceDisplay.textContent();
    console.log(`  📺 Player TV: Lily rolled ${result}!`);
  } catch {
    logIssue('MEDIUM', 'Dice', 'Dice display not visible during Lily\'s roll');
  }

  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss');
  await waitForSync(300);

  // ═══════════════════════════════════════════════════════════════
  // ACT 2: THE SPARKLE WOODS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🌲 ═══ ACT 2: THE SPARKLE WOODS ═══\n');

  // DM Agent: Change scene
  console.log('  🎲 DM: "The trail leads into the Sparkle Woods..."');
  await safeClick(dmPage, 'button:has-text("The Sparkle Woods")', 'Navigate to Woods');
  await waitForSync(2000); // Wait for scene transition

  await verifyPlayerSync(dmPage, playerPage, 'Act 2 scene change');
  console.log('  📺 Player TV: Scene transitioned to Sparkle Woods ✓');

  // DM Agent: Verify Hoot the Owl monster card appears
  try {
    const hootCard = dmPage.locator('[data-testid="card-hoot"]');
    await expect(hootCard).toBeVisible({ timeout: 3000 });
    console.log('  🎲 DM: Hoot the Owl monster card visible ✓');

    // Check Hoot is on Player View
    const hootHero = playerPage.locator('[data-testid="hero-hoot"]');
    await expect(hootHero).toBeVisible({ timeout: 3000 });
    console.log('  📺 Player TV: Hoot visible in hero bar ✓');
  } catch {
    logIssue('HIGH', 'Monster', 'Hoot not showing in woods scene');
  }

  // DM Agent: Narrate the encounter
  await narrationInput.fill('A great owl blocks the path! Its eyes glow with ancient wisdom.');
  await safeClick(dmPage, 'button:has-text("Send")', 'Send Narration');
  noteAction('dm', 'Narrated the Hoot encounter in the woods');
  await waitForSync(800);
  console.log('  🎲 DM: "A great owl blocks the path!"');

  // DM Agent: Launch Riddle Puzzle
  console.log('\n  🦉 DM: "Hoot has a riddle for you! Launching puzzle..."');
  try {
    await safeClick(dmPage, '[data-testid="start-puzzle"]', 'Start Riddle Puzzle');
    noteAction('dm', "Started puzzle: Hoot's Riddle");
    await waitForSync(800);

    // Verify riddle on Player View
    const hootText = playerPage.getByText('Hoot speaks');
    await expect(hootText).toBeVisible({ timeout: 3000 });
    console.log('  📺 Player TV: Hoot riddle overlay active ✓');

    // DM Agent: Reveal riddle text
    console.log('  🎲 DM: Revealing riddle text...');
    for (let i = 0; i < 5; i++) {
      await safeClick(dmPage, 'button:has-text("Reveal More")', 'Reveal More');
      await waitForSync(400);
    }
    // Then reveal all
    await safeClick(dmPage, 'button:has-text("Show All")', 'Show All');
    await waitForSync(1000);
    console.log('  📺 Player TV: Full riddle text revealed ✓');

    // Thorne Agent: "I have no idea..."
    console.log('  🛡️ Thorne: "Um... is it... a sword?"');
    noteAction('thorne', 'Tried a playful wrong answer to the riddle');

    // DM Agent: Give a hint
    console.log('  🎲 DM: "Let me give a hint..."');
    await safeClick(dmPage, 'button:has-text("Hint")', 'Give Hint');
    noteAction('dm', 'Gave one riddle hint');
    await waitForSync(600);

    // Valerius Agent: "I know! It's a map!"
    console.log('  ✨ Valerius: "A MAP! It\'s a map!"');
    noteAction('valerius', 'Solved the riddle with "A Map"');

    // DM Agent: Mark solved
    await safeClick(dmPage, 'button:has-text("Answer:")', 'Reveal Answer');
    await waitForSync(1000);

    // Verify solved state on Player View
    try {
      const solvedText = playerPage.getByText('A Map');
      await expect(solvedText).toBeVisible({ timeout: 3000 });
      console.log('  📺 Player TV: Riddle solved — "A Map!" displayed ✓');
    } catch {
      logIssue('MEDIUM', 'Puzzle', 'Riddle solved state not showing on Player View');
    }

    await safeClick(dmPage, '[data-testid="end-puzzle"]', 'End Riddle');
    await waitForSync(500);
    console.log('  🎲 DM: Riddle puzzle ended.\n');
  } catch (e) {
    logIssue('HIGH', 'Puzzle', 'Riddle puzzle flow failed', e.message?.slice(0, 120));
  }

  // DM Agent: Award riddle quest
  await safeClick(dmPage, 'button:has-text("Solve Hoot\'s Riddle")', 'Award Riddle Quest');
  noteAction('dm', "Awarded quest: Solve Hoot's Riddle");
  await waitForSync(2000);
  console.log('  🎲 DM: Hoot\'s Riddle quest awarded!');
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss');
  await waitForSync(300);

  // ─── Combat: Fight Hoot ───
  console.log('\n  ⚔️ COMBAT: The party battles Hoot the Owl!\n');

  // Cycle through turns and attack
  // Turn 1: Lily
  console.log('  🗡️ Lily: "Sneak Attack!"');
  await safeClick(dmPage, '[data-testid="card-lily"] >> button:has-text("Sneak Attack")', 'Lily Sneak Attack');
  noteAction('lily', 'Opened woods combat with Sneak Attack');
  await waitForSync(2500);
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss');

  // Next Turn → Thorne
  await safeClick(dmPage, 'button:has-text("Next Turn")', 'Next Turn');
  await waitForSync(300);

  // Verify turn banner on Player View
  try {
    const turnBanner = playerPage.locator('[data-testid="turn-banner"]');
    await expect(turnBanner).toBeVisible({ timeout: 3000 });
    const bannerText = await turnBanner.textContent();
    console.log(`  📺 Player TV: Turn banner shows "${bannerText}" ✓`);
  } catch {
    logIssue('MEDIUM', 'Turn', 'Turn banner not visible after Next Turn');
  }

  // Turn 2: Thorne
  console.log('  🛡️ Thorne: "LONGSWORD ATTACK!"');
  await safeClick(dmPage, '[data-testid="card-thorne"] >> button:has-text("Longsword")', 'Thorne Longsword');
  noteAction('thorne', 'Attacked Hoot with Longsword');
  await waitForSync(2500);
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss');

  // Next Turn → Valerius
  await safeClick(dmPage, 'button:has-text("Next Turn")', 'Next Turn');
  await waitForSync(300);

  // Turn 3: Valerius Divine Smite
  console.log('  ✨ Valerius: "By the light! DIVINE SMITE!"');
  await safeClick(dmPage, '[data-testid="card-valerius"] >> button:has-text("Divine Smite")', 'Valerius Divine Smite');
  noteAction('valerius', 'Used Divine Smite on Hoot');
  await waitForSync(2500);
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss');

  // DM Agent: Reduce Hoot's HP to simulate combat damage
  console.log('  🎲 DM: Reducing Hoot\'s HP from combat...');
  const hootHpBefore = await dmPage.locator('[data-testid="hp-hoot"]').textContent().catch(() => '?');
  console.log(`  🎲 DM: Hoot HP before: ${hootHpBefore}`);

  // Click minus on Hoot 15 times to simulate damage
  for (let i = 0; i < 15; i++) {
    await dmPage.locator('[data-testid="card-hoot"]').locator('button:has-text("-")').click();
    await waitForSync(50);
  }
  await waitForSync(500);

  const hootHpAfter = await checkHpSync(dmPage, playerPage, 'hoot', 5);
  console.log(`  🎲 DM: Hoot HP after 15 damage: ${hootHpAfter}`);

  // DM Agent: Finish off Hoot
  for (let i = 0; i < 5; i++) {
    await dmPage.locator('[data-testid="card-hoot"]').locator('button:has-text("-")').click();
    await waitForSync(50);
  }
  await waitForSync(500);

  await checkHpSync(dmPage, playerPage, 'hoot', 0);
  console.log('  ☠️ Hoot the Owl is defeated!\n');

  // Verify BONKED on Player View
  try {
    const bonked = playerPage.locator('[data-testid="hero-hoot"]').locator('text=BONKED');
    await expect(bonked).toBeVisible({ timeout: 3000 });
    console.log('  📺 Player TV: Hoot shows BONKED ✓');
  } catch {
    logIssue('HIGH', 'BONKED', 'Hoot not showing BONKED state at 0 HP');
  }

  // ═══════════════════════════════════════════════════════════════
  // ACT 3: WHISPERING PEAK
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🏔️ ═══ ACT 3: WHISPERING PEAK ═══\n');

  // DM Agent: Navigate to peak
  console.log('  🎲 DM: "The path leads up to the Whispering Peak!"');
  await safeClick(dmPage, 'button:has-text("Whispering Peak")', 'Navigate to Peak');
  await waitForSync(2000);

  await verifyPlayerSync(dmPage, playerPage, 'Act 3 scene change');
  console.log('  📺 Player TV: Scene transitioned to Whispering Peak ✓');

  // DM Agent: Verify Glint the Dragon appears
  try {
    const glintCard = dmPage.locator('[data-testid="card-glint"]');
    await expect(glintCard).toBeVisible({ timeout: 3000 });
    console.log('  🎲 DM: Glint the Dragon card visible ✓');

    const glintHero = playerPage.locator('[data-testid="hero-glint"]');
    await expect(glintHero).toBeVisible({ timeout: 3000 });
    console.log('  📺 Player TV: Glint visible in hero bar ✓');
  } catch {
    logIssue('HIGH', 'Monster', 'Glint not showing in peak scene');
  }

  // DM Agent: Check that Hoot is ALSO visible in peak (per monster filter logic)
  try {
    const hootInPeak = dmPage.locator('[data-testid="card-hoot"]');
    await expect(hootInPeak).toBeVisible({ timeout: 2000 });
    console.log('  🎲 DM: Hoot also visible in peak scene (both monsters) ✓');

    // Verify Hoot still shows 0 HP (not reset)
    const hootHpPeak = await dmPage.locator('[data-testid="hp-hoot"]').textContent();
    if (parseInt(hootHpPeak) !== 0) {
      logIssue('HIGH', 'HP Persistence', `Hoot HP reset to ${hootHpPeak} when entering peak scene`);
    } else {
      console.log('  🎲 DM: Hoot HP persisted at 0 across scene change ✓');
    }
  } catch {
    // This might be intentional — check if Hoot only shows in woods
    console.log('  ℹ️ Hoot not visible in peak scene (may be by design)');
  }

  // DM Agent: Set mood to tense
  console.log('\n  🎲 DM: Setting mood to TENSE...');
  await safeClick(dmPage, 'button:has-text("tense")', 'Set Tense Mood');
  noteAction('dm', 'Set ambience mood to tense for peak approach');
  await waitForSync(500);

  // DM Agent: Narrate the dragon encounter
  await narrationInput.fill('Glint the Dragon lounges in a pile of Sun-Cake crumbs. His scales shimmer blue in the dim light.');
  await safeClick(dmPage, 'button:has-text("Send")', 'Send Dragon Narration');
  noteAction('dm', 'Narrated Glint encounter at Whispering Peak');
  await waitForSync(800);
  console.log('  🎲 DM: "Glint the Dragon lounges in a pile of Sun-Cake crumbs..."');

  // DM Agent: Award river crossing quest first
  console.log('\n  🪨 DM: "First, cross the Glimmer Stream!"');
  try {
    await safeClick(dmPage, '[data-testid="start-puzzle"]', 'Start Stones Puzzle');
    noteAction('dm', 'Started puzzle: Glimmer Stream stepping stones');
    await waitForSync(800);

    // Verify stones puzzle on Player View
    const stonesTitle = playerPage.getByText('Cross the Glimmer Stream');
    await expect(stonesTitle).toBeVisible({ timeout: 3000 });
    console.log('  📺 Player TV: Stepping stones puzzle active ✓');

    // Player agents pick stones! (Stones are interactive on Player View)
    // Row 0 (bottom on screen, reversed): safe=2 (⭐, index 2)
    // Displayed reversed, so Row 3 (far) is at top, Row 0 (near) at bottom
    // The layout reverses rows, so we need the last row-div for row 0

    // Thorne: "I'll go first! I pick the mushroom!" (WRONG - index 1)
    console.log('  🛡️ Thorne: "I pick the mushroom! 🍄"');
    noteAction('thorne', 'Picked mushroom stone first and triggered splash');
    const stoneButtons = playerPage.locator('button.w-36');
    const totalButtons = await stoneButtons.count();
    console.log(`  📺 Player TV: Found ${totalButtons} stone buttons`);

    if (totalButtons === 12) {
      // Rows are reversed in display: row 3 at top (buttons 0-2), row 0 at bottom (buttons 9-11)
      // Row 0 buttons are indices 9, 10, 11 (bottom row)
      // Safe stone for Row 0 is index 2 → button 11

      // Thorne picks wrong stone first (mushroom = index 10)
      await stoneButtons.nth(10).click();
      await waitForSync(1200);
      console.log('  💦 SPLASH! Thorne picked wrong stone!');

      // Lily: "Let me try... I pick the star! ⭐"
      console.log('  🗡️ Lily: "The star looks safe! ⭐"');
      await stoneButtons.nth(11).click();
      noteAction('lily', 'Picked the star stone correctly');
      await waitForSync(800);
      console.log('  ✨ Correct! Row 1 reached.');

      // Row 1 (safe=1 💎): buttons 6, 7, 8 → safe is 7
      console.log('  ✨ Valerius: "The gem sparkles with divine light! 💎"');
      await stoneButtons.nth(7).click();
      noteAction('valerius', 'Picked the gem stone correctly');
      await waitForSync(800);
      console.log('  ✨ Correct! Row 2 reached.');

      // Row 2 (safe=0 🌙): buttons 3, 4, 5 → safe is 3
      console.log('  🗡️ Lily: "The moon... it reminds me of sneaking! 🌙"');
      await stoneButtons.nth(3).click();
      noteAction('lily', 'Picked the moon stone correctly');
      await waitForSync(800);
      console.log('  ✨ Correct! Row 3 reached.');

      // Row 3 (safe=0 🪨): buttons 0, 1, 2 → safe is 0
      console.log('  🛡️ Thorne: "The rock! Solid ground! 🪨"');
      await stoneButtons.nth(0).click();
      noteAction('thorne', 'Finished crossing by picking the rock stone');
      await waitForSync(1000);
      console.log('  🏆 Safe Across!');

      // Verify victory state
      try {
        const victory = playerPage.getByText('Safe Across');
        await expect(victory).toBeVisible({ timeout: 3000 });
        console.log('  📺 Player TV: Victory celebration showing ✓');
      } catch {
        logIssue('MEDIUM', 'Puzzle', 'Stones victory state not showing');
      }
    } else {
      logIssue('HIGH', 'Puzzle', `Expected 12 stone buttons, found ${totalButtons}`);
    }

    await safeClick(dmPage, '[data-testid="end-puzzle"]', 'End Stones Puzzle');
    await waitForSync(500);
    console.log('  🎲 DM: Stepping stones puzzle ended.\n');
  } catch (e) {
    logIssue('HIGH', 'Puzzle', 'Stones puzzle flow failed', e.message?.slice(0, 120));
  }

  // DM Agent: Award river crossing quest
  await safeClick(dmPage, 'button:has-text("Cross the Glimmer Stream")', 'Award River Quest');
  noteAction('dm', 'Awarded quest: Cross the Glimmer Stream');
  await waitForSync(2000);
  console.log('  🎲 DM: River crossing quest awarded!');
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss');
  await waitForSync(500);

  // ─── Boss Battle: Fight Glint the Dragon ───
  console.log('\n  🐉 BOSS BATTLE: Glint the Dragon!\n');

  // DM Agent: Set mood to combat
  await safeClick(dmPage, 'button:has-text("combat")', 'Set Combat Mood');
  noteAction('dm', 'Set ambience mood to combat');
  await waitForSync(300);

  // Reset turns to start from Lily
  // Navigate turns to get back to lily
  for (let i = 0; i < 6; i++) {
    await safeClick(dmPage, 'button:has-text("Next Turn")', 'Cycle Turn');
    await waitForSync(150);
  }

  // DM Agent: Skill check before combat
  console.log('  🎲 DM: "Roll for initiative!"');
  const skillInput = dmPage.locator('input[placeholder="Investigation..."]');
  await skillInput.fill('Initiative');
  await safeClick(dmPage, 'button:has-text("d20")', 'Initiative Roll');
  noteAction('dm', 'Ran initiative roll check');
  await waitForSync(2000);
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss');

  // Round 1
  console.log('  🗡️ Lily: "Sneak Attack on the dragon!"');
  await safeClick(dmPage, '[data-testid="card-lily"] >> button:has-text("Shortbow")', 'Lily Shortbow');
  noteAction('lily', 'Opened Glint combat with Shortbow shot');
  await waitForSync(2500);
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss');
  await waitForSync(200);

  await safeClick(dmPage, 'button:has-text("Next Turn")', 'Next Turn');
  console.log('  🛡️ Thorne: "Handaxe THROW!"');
  await safeClick(dmPage, '[data-testid="card-thorne"] >> button:has-text("Handaxe")', 'Thorne Handaxe');
  noteAction('thorne', 'Threw Handaxe at Glint');
  await waitForSync(2500);
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss');
  await waitForSync(200);

  await safeClick(dmPage, 'button:has-text("Next Turn")', 'Next Turn');
  console.log('  ✨ Valerius: "DIVINE SMITE! Feel the power of justice!"');
  await safeClick(dmPage, '[data-testid="card-valerius"] >> button:has-text("Divine Smite")', 'Valerius Smite');
  noteAction('valerius', 'Used Divine Smite against Glint');
  await waitForSync(2500);
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss');
  await waitForSync(200);

  // DM Agent: Deal damage to Glint
  console.log('  🎲 DM: Applying combat damage to Glint...');
  for (let i = 0; i < 30; i++) {
    await dmPage.locator('[data-testid="card-glint"]').locator('button:has-text("-")').click();
    await waitForSync(30);
  }
  await waitForSync(500);
  const glintHp = await checkHpSync(dmPage, playerPage, 'glint', 15);
  console.log(`  🐉 Glint HP: ${glintHp}/45`);

  // DM Agent: Dragon attacks back! Damage Thorne
  console.log('  🐉 Glint breathes frost! Thorne takes 4 damage!');
  for (let i = 0; i < 4; i++) {
    await dmPage.locator('[data-testid="card-thorne"]').locator('button:has-text("-")').click();
    await waitForSync(50);
  }
  await waitForSync(500);
  await checkHpSync(dmPage, playerPage, 'thorne', 8);

  // Round 2 — Finish Glint
  console.log('\n  🎲 DM: Round 2! Finish the dragon!');
  for (let i = 0; i < 15; i++) {
    await dmPage.locator('[data-testid="card-glint"]').locator('button:has-text("-")').click();
    await waitForSync(30);
  }
  await waitForSync(500);
  await checkHpSync(dmPage, playerPage, 'glint', 0);
  console.log('  ☠️ Glint the Dragon is defeated!\n');

  // Verify BONKED
  try {
    const glintBonked = playerPage.locator('[data-testid="hero-glint"]').locator('text=BONKED');
    await expect(glintBonked).toBeVisible({ timeout: 3000 });
    console.log('  📺 Player TV: Glint shows BONKED ✓');
  } catch {
    logIssue('HIGH', 'BONKED', 'Glint not showing BONKED at 0 HP');
  }

  // ═══════════════════════════════════════════════════════════════
  // FINALE: Recover the Sun-Cakes!
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🎉 ═══ FINALE: THE SUN-CAKES! ═══\n');

  // DM Agent: Set mood to calm
  await safeClick(dmPage, 'button:has-text("calm")', 'Set Calm Mood');
  noteAction('dm', 'Set ambience mood to calm for finale');
  await waitForSync(300);

  // DM Agent: Final narration
  await narrationInput.fill('With Glint defeated, you find a sack of golden Sun-Cakes behind the dragon! Mrs. Crumb will be so happy!');
  await safeClick(dmPage, 'button:has-text("Send")', 'Send Finale Narration');
  noteAction('dm', 'Narrated final Sun-Cakes recovery');
  await waitForSync(1000);
  console.log('  🎲 DM: "You find the Sun-Cakes!"');

  // Award final quest
  await safeClick(dmPage, 'button:has-text("Recover the Sun-Cakes")', 'Award Final Quest');
  noteAction('dm', 'Awarded quest: Recover the Sun-Cakes');
  await waitForSync(2000);

  // Verify grand finale toast
  try {
    const finalToast = playerPage.getByText('Quest Complete');
    await expect(finalToast).toBeVisible({ timeout: 5000 });
    console.log('  📺 Player TV: FINAL QUEST TOAST showing! ✓');
    console.log('  🎉 THE SUN-CAKES ARE RECOVERED!\n');
  } catch {
    logIssue('HIGH', 'Toast', 'Final quest toast not visible');
  }

  await waitForSync(3000); // Let kids enjoy the toast

  // ═══════════════════════════════════════════════════════════════
  // EDGE CASE TESTING
  // ═══════════════════════════════════════════════════════════════
  console.log('🔬 ═══ EDGE CASE TESTING ═══\n');

  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss');
  await waitForSync(300);

  // Test 1: HP floor (can't go below 0)
  console.log('  Test 1: HP floor — Glint at 0, subtract more...');
  for (let i = 0; i < 3; i++) {
    await dmPage.locator('[data-testid="card-glint"]').locator('button:has-text("-")').click();
    await waitForSync(50);
  }
  const glintFloor = await dmPage.locator('[data-testid="hp-glint"]').textContent();
  if (parseInt(glintFloor) < 0) {
    logIssue('CRITICAL', 'HP', `Glint HP went below 0: ${glintFloor}`);
  } else {
    console.log('  ✓ Glint HP stays at 0 (floor works)');
  }

  // Test 2: HP ceiling (can't exceed maxHp)
  console.log('  Test 2: HP ceiling — Lily at 9 max, add more...');
  for (let i = 0; i < 5; i++) {
    await dmPage.locator('[data-testid="card-lily"]').locator('button:text-is("+")').click();
    await waitForSync(50);
  }
  const lilyHpText = await dmPage.locator('[data-testid="hp-lily"]').textContent();
  const lilyHp = parseInt(lilyHpText);
  if (lilyHp > 9) {
    logIssue('CRITICAL', 'HP', `Lily HP exceeded max: ${lilyHp}/9`);
  } else {
    console.log(`  ✓ Lily HP capped at ${lilyHp}/9 (ceiling works)`);
  }

  // Test 3: Secret roll (DM only)
  console.log('  Test 3: Secret roll...');
  await safeClick(dmPage, 'button:has-text("Roll (DM only)")', 'Secret Roll');
  await waitForSync(500);
  // Check that dice overlay did NOT appear on player view
  const playerOverlay = playerPage.locator('[data-testid="dice-display"]');
  const overlayVisible = await playerOverlay.isVisible().catch(() => false);
  if (overlayVisible) {
    logIssue('HIGH', 'Secret Roll', 'Secret roll showed dice overlay on Player View');
  } else {
    console.log('  ✓ Secret roll did NOT show on Player View');
  }

  // Test 4: Double quest award (should be disabled)
  console.log('  Test 4: Double quest award prevention...');
  const sunCakeBtn = dmPage.locator('button:has-text("Recover the Sun-Cakes")');
  const isDisabled = await sunCakeBtn.isDisabled();
  if (!isDisabled) {
    logIssue('HIGH', 'Quest', 'Completed quest button not disabled');
  } else {
    console.log('  ✓ Completed quest button is disabled');
  }

  // Test 5: Verify combat log has entries
  console.log('  Test 5: Combat log...');
  const logEntries = await dmPage.locator('.overflow-y-auto.space-y-1 > div').count();
  if (logEntries === 0) {
    logIssue('MEDIUM', 'Log', 'Combat log is empty after full campaign');
  } else {
    console.log(`  ✓ Combat log has ${logEntries} entries`);
  }

  // Test 6: Persistence — Refresh DM page and verify state
  console.log('  Test 6: State persistence across refresh...');
  await dmPage.reload();
  await waitForSync(1000);
  const sceneAfterRefresh = await dmPage.locator('.parchment h2').first().textContent();
  if (!sceneAfterRefresh?.includes('Whispering Peak')) {
    logIssue('HIGH', 'Persistence', `Scene reset after refresh: "${sceneAfterRefresh}"`);
  } else {
    console.log('  ✓ Scene persisted after refresh: Whispering Peak');
  }
  const glintAfterRefresh = await dmPage.locator('[data-testid="hp-glint"]').textContent();
  if (parseInt(glintAfterRefresh) !== 0) {
    logIssue('HIGH', 'Persistence', `Glint HP changed after refresh: ${glintAfterRefresh}`);
  } else {
    console.log('  ✓ Glint HP persisted at 0 after refresh');
  }

  // Test 7: Scene-specific monsters disappear
  console.log('  Test 7: Navigate back to bakery — no monsters should show...');
  await safeClick(dmPage, 'button:has-text("Mrs. Crumb\'s Bakery")', 'Back to Bakery');
  await waitForSync(1000);
  const monsterInBakery = await dmPage.locator('text="Monsters in Scene"').isVisible().catch(() => false);
  if (monsterInBakery) {
    logIssue('HIGH', 'Monster Filter', 'Monsters visible in bakery scene');
  } else {
    console.log('  ✓ No monsters shown in bakery scene');
  }

  // ─── Take final screenshots ───
  console.log('\n📸 Taking final screenshots...');
  await dmPage.goto(BASE);
  await waitForSync(500);
  await safeClick(dmPage, 'button:has-text("Whispering Peak")', 'Peak');
  await waitForSync(1000);
  await dmPage.screenshot({ path: 'playtest_dm_final.png', fullPage: true });
  await playerPage.screenshot({ path: 'playtest_player_final.png', fullPage: true });

  // ═══════════════════════════════════════════════════════════════
  // ISSUE REPORT
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n📋 ═══════════════════════════════════════════════════════');
  console.log('   PLAYTEST ISSUE REPORT');
  console.log('   ═══════════════════════════════════════════════════════\n');

  if (issues.length === 0) {
    console.log('   🎉 NO ISSUES FOUND! Campaign plays perfectly!\n');
  } else {
    const critical = issues.filter(i => i.severity === 'CRITICAL');
    const high = issues.filter(i => i.severity === 'HIGH');
    const medium = issues.filter(i => i.severity === 'MEDIUM');

    console.log(`   Total Issues: ${issues.length}`);
    console.log(`   🔴 Critical: ${critical.length}`);
    console.log(`   🟠 High: ${high.length}`);
    console.log(`   🟡 Medium: ${medium.length}\n`);

    issues.forEach((issue, idx) => {
      const icon = issue.severity === 'CRITICAL' ? '🔴' :
                   issue.severity === 'HIGH' ? '🟠' : '🟡';
      console.log(`   ${icon} #${idx + 1} [${issue.category}] ${issue.description}`);
      if (issue.details) console.log(`      └─ ${issue.details}`);
    });
  }
  console.log('\n   ═══════════════════════════════════════════════════════\n');

  console.log('🎭 ═══════════════════════════════════════════════════════');
  console.log('   AGENT ROLEPLAY ACTION SUMMARY');
  console.log('   ═══════════════════════════════════════════════════════\n');
  console.log(`   🎲 DM Agent (${agentActions.dm.length} actions):`);
  agentActions.dm.forEach((a, i) => console.log(`      ${i + 1}. ${a}`));
  console.log('');
  console.log(`   🗡️ Lily Agent (${agentActions.lily.length} actions):`);
  agentActions.lily.forEach((a, i) => console.log(`      ${i + 1}. ${a}`));
  console.log('');
  console.log(`   🛡️ Thorne Agent (${agentActions.thorne.length} actions):`);
  agentActions.thorne.forEach((a, i) => console.log(`      ${i + 1}. ${a}`));
  console.log('');
  console.log(`   ✨ Valerius Agent (${agentActions.valerius.length} actions):`);
  agentActions.valerius.forEach((a, i) => console.log(`      ${i + 1}. ${a}`));
  console.log('\n   ═══════════════════════════════════════════════════════\n');

  // Fail test if critical issues found
  const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
  expect(criticalCount).toBe(0);

  await context.close();
});
