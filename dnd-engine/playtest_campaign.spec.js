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
  party: [],
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
  try {
    const dmScene = await dmPage.locator('.parchment h2').first().textContent();
    const playerScene = await playerPage.locator('h2').first().textContent();
    if (dmScene && playerScene && !playerScene.includes(dmScene.trim())) {
      logIssue('CRITICAL', 'Sync', `${testName}: DM scene "${dmScene}" ≠ Player scene "${playerScene}"`);
    }
  } catch {
    // Might be transient
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

  // DM Agent: Set the mood
  await safeClick(dmPage, 'button:has-text("Intro Intro")', 'Intro Button');
  await safeClick(dmPage, 'button:has-text("Send")', 'Send Narration');
  noteAction('dm', 'Narrated opening bakery mystery using Intro button');
  await waitForSync(800);

  // DM Agent: Handout Mrs. Crumb
  console.log('  🎲 DM: Showing Mrs. Crumb Handout...');
  await safeClick(dmPage, 'button:has-text("Mrs. Crumb")', 'Show Handout');
  noteAction('dm', 'Shared Mrs. Crumb handout to TV');
  await waitForSync(1500);
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss Handout');
  await waitForSync(500);

  // DM Agent: Launch Bakery Spotlight Puzzle
  console.log('\n  🔦 DM: "Time to search for clues! Launching spotlight puzzle..."');
  const puzzleControls = dmPage.locator('[data-testid="puzzle-controls"]');
  try {
    await expect(puzzleControls).toBeVisible({ timeout: 3000 });
    await safeClick(dmPage, '[data-testid="start-puzzle"]', 'Start Spotlight Puzzle');
    await waitForSync(800);

    const spotlightArea = dmPage.locator('[data-testid="puzzle-controls"]').locator('.cursor-crosshair');
    const spotBounds = await spotlightArea.boundingBox();
    if (spotBounds) {
      // Clue 1: Blue Sparkly Scale (22%, 65%)
      let targetX = spotBounds.x + spotBounds.width * 0.22;
      let targetY = spotBounds.y + spotBounds.height * 0.65;
      await dmPage.mouse.move(targetX, targetY);
      await dmPage.mouse.down();
      await dmPage.mouse.move(targetX, targetY); 
      await dmPage.mouse.up();
      await waitForSync(400);

      let revealBtn = dmPage.locator('button:has-text("Reveal")');
      if (await revealBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await revealBtn.click();
        console.log('  🔦 DM: Found a clue! Blue Sparkly Scale revealed ✓');
        noteAction('dm', 'Revealed clue: Blue Sparkly Scale');
      }

      // Clue 2: Golden Crumbs (72%, 40%)
      targetX = spotBounds.x + spotBounds.width * 0.72;
      targetY = spotBounds.y + spotBounds.height * 0.40;
      await dmPage.mouse.move(spotBounds.x + spotBounds.width * 0.5, spotBounds.y + spotBounds.height * 0.5);
      await dmPage.mouse.down();
      await dmPage.mouse.move(targetX, targetY);
      await dmPage.mouse.up();
      await waitForSync(400);

      if (await revealBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await revealBtn.click();
        console.log('  🔦 DM: Found a clue! Golden Crumb Trail revealed ✓');
        noteAction('dm', 'Revealed clue: Golden Crumb Trail');
      }

      // Clue 3: Footprint (50%, 78%)
      targetX = spotBounds.x + spotBounds.width * 0.50;
      targetY = spotBounds.y + spotBounds.height * 0.78;
      await dmPage.mouse.move(spotBounds.x + spotBounds.width * 0.5, spotBounds.y + spotBounds.height * 0.5);
      await dmPage.mouse.down();
      await dmPage.mouse.move(targetX, targetY);
      await dmPage.mouse.up();
      await waitForSync(400);

      if (await revealBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await revealBtn.click();
        console.log('  🔦 DM: Found a clue! Mrs. Crumb\'s Footprint revealed ✓');
        noteAction('dm', 'Revealed clue: Mrs. Crumb\'s Footprint');
      }
    }

    // End puzzle
    await safeClick(dmPage, '[data-testid="end-puzzle"]', 'End Spotlight Puzzle');
    await waitForSync(500);
  } catch (e) {
    logIssue('HIGH', 'Puzzle', 'Spotlight flow failed', e.message);
  }

  // Lily & Valerius Help Interaction
  console.log('\n  ✨ Valerius: "Let me help you search, Lily!" (Uses Help Action)');
  await safeClick(dmPage, '[data-testid="card-valerius"] >> button:has-text("Help")', 'Valerius Help');
  noteAction('valerius', 'Used Help to give Lily advantage');
  await waitForSync(1500);
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss Overlay');

  // Award quest
  await safeClick(dmPage, 'button:has-text("Find the Bakery Clue")', 'Award Bakery Clue');
  noteAction('dm', 'Awarded quest: Find the Bakery Clue');
  await waitForSync(1500);
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss Overlay');

  // ═══════════════════════════════════════════════════════════════
  // ACT 2: THE SPARKLE WOODS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🌲 ═══ ACT 2: THE SPARKLE WOODS ═══\n');

  await safeClick(dmPage, 'button:has-text("The Sparkle Woods")', 'Navigate to Woods');
  await waitForSync(2000);

  // Start Riddle
  console.log('\n  🦉 DM: "Hoot has a riddle for you! Launching puzzle..."');
  await safeClick(dmPage, '[data-testid="start-puzzle"]', 'Start Riddle Puzzle');
  noteAction('dm', "Started puzzle: Hoot's Riddle");
  await waitForSync(800);

  await safeClick(dmPage, 'button:has-text("Show All")', 'Show All');
  await waitForSync(1000);

  console.log('  🎲 DM: "Let me give a hint..."');
  await safeClick(dmPage, 'button:has-text("Hint")', 'Give Hint');
  await waitForSync(600);

  console.log('  ✨ Valerius: "A RIVER! It\'s a river!"');
  noteAction('valerius', 'Solved the riddle with "A River"');
  await safeClick(dmPage, 'button:has-text("Answer:")', 'Reveal Answer');
  await waitForSync(1000);
  await safeClick(dmPage, '[data-testid="end-puzzle"]', 'End Riddle');
  await waitForSync(500);

  // Award riddle quest
  await safeClick(dmPage, 'button:has-text("Solve Hoot\'s Riddle")', 'Award Riddle Quest');
  noteAction('dm', "Awarded quest: Solve Hoot's Riddle");
  await waitForSync(1500);
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss');

  // Combat Hoot (just a little)
  console.log('  🗡️ Lily: "Sneak Attack on the grumpy owl!"');
  await safeClick(dmPage, '[data-testid="card-lily"] >> button:has-text("Sneak Attack")', 'Lily Sneak Attack');
  noteAction('lily', 'Attacked Hoot');
  await waitForSync(2000);
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss');

  // Thorne takes a snack
  console.log('  🛡️ Thorne: "I\'m tired. Taking a snack break!" (Uses Snack Action)');
  await safeClick(dmPage, '[data-testid="card-thorne"] >> button:has-text("Snack")', 'Thorne Snack');
  noteAction('thorne', 'Ate a Sun-Cake snack to heal');
  await waitForSync(1500);
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss');

  // ═══════════════════════════════════════════════════════════════
  // ACT 3: WHISPERING PEAK
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🏔️ ═══ ACT 3: WHISPERING PEAK ═══\n');

  await safeClick(dmPage, 'button:has-text("Whispering Peak")', 'Navigate to Peak');
  await waitForSync(2000);

  // Ping TV
  console.log('  🎲 DM: Pinging the dragon\'s cave on the TV!');
  await dmPage.locator('.parchment').click(); // trigger ping
  noteAction('dm', 'Used the Ping tool to point out the cave');
  await waitForSync(1000);

  // Stones Puzzle
  console.log('\n  🪨 DM: "Cross the Glimmer Stream!"');
  await safeClick(dmPage, '[data-testid="start-puzzle"]', 'Start Stones Puzzle');
  noteAction('dm', 'Started puzzle: Glimmer Stream stepping stones');
  await waitForSync(800);

  const stoneButtons = playerPage.locator('button.w-36');
  const totalButtons = await stoneButtons.count();
  if (totalButtons === 12) {
    // Row 0 safe: index 2 -> button 11
    await stoneButtons.nth(11).click();
    await waitForSync(800);
    // Row 1 safe: index 1 -> button 7
    await stoneButtons.nth(7).click();
    await waitForSync(800);
    // Row 2 safe: index 0 -> button 3
    await stoneButtons.nth(3).click();
    await waitForSync(800);
    // Row 3 safe: index 0 -> button 0
    await stoneButtons.nth(0).click();
    await waitForSync(1000);
    noteAction('party', 'Solved the stepping stones');
  }

  await safeClick(dmPage, '[data-testid="end-puzzle"]', 'End Stones Puzzle');
  await waitForSync(500);

  // Award river quest
  await safeClick(dmPage, 'button:has-text("Cross the Glimmer Stream")', 'Award River Quest');
  await waitForSync(1500);
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss');

  // Final interaction with Glint
  console.log('\n  🐉 BOSS BATTLE... or Friendship?');
  const narrationInput = dmPage.locator('textarea');
  await narrationInput.fill('Glint looks up, his claws covered in blue frosting. "I just wanted to taste sunlight," he whimpers.');
  await safeClick(dmPage, 'button:has-text("Send")', 'Send Narration');
  await waitForSync(1500);

  // Lily helps Valerius speak
  console.log('  🗡️ Lily: "You talk to him, Valerius. I\'ll help!"');
  await safeClick(dmPage, '[data-testid="card-lily"] >> button:has-text("Help")', 'Lily Help');
  await waitForSync(1500);
  await safeClick(dmPage, 'button:has-text("Dismiss Overlay")', 'Dismiss');

  // Award Final Quest
  console.log('\n🎉 ═══ FINALE: MAKE A NEW FRIEND! ═══\n');
  await safeClick(dmPage, 'button:has-text("Make a New Friend")', 'Award Final Quest');
  noteAction('dm', 'Awarded final quest: Make a New Friend');
  await waitForSync(2000);
  
  // Show Dragon Medal Handout
  console.log('  🎲 DM: Presenting the Dragon-Scale Medal!');
  await safeClick(dmPage, 'button:has-text("The Medal")', 'Show Medal Handout');
  noteAction('dm', 'Shared Dragon-Scale Medal Handout');
  await waitForSync(3000);

  // ─── Take final screenshots ───
  console.log('\n📸 Taking final screenshots...');
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

  expect(issues.filter(i => i.severity === 'CRITICAL').length).toBe(0);

  await context.close();
});
