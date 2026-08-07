const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testApp() {
  console.log('🚀 Starting Automated Puppeteer Browser Test for NYC Election Canvas...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleLogs = [];
  const errors = [];

  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    errors.push(err.toString());
  });

  try {
    console.log('1. Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    const artifactsDir = '/Users/jonahpapernik/.gemini/antigravity/brain/2192e7c2-ac2f-4cf4-93ea-8e6e96c086a4';

    await page.screenshot({ path: path.join(artifactsDir, 'test_step1_initial_load.png') });
    console.log('📸 Step 1 Screenshot Saved: test_step1_initial_load.png');

    // TEST 2: Inspect Header & Boundary Select
    console.log('2. Inspecting Boundary Dropdown element...');
    const selectValue = await page.$eval('select', el => el.value);
    console.log('Current Active Boundary Layer in UI:', selectValue);

    // TEST 3: Click map at canvas center (Upper Manhattan / CD 13 area)
    console.log('3. Clicking Map Canvas Center (Upper Manhattan)...');
    await page.mouse.click(720, 450);
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(artifactsDir, 'test_step2_click_map.png') });
    console.log('📸 Step 2 Screenshot Saved: test_step2_click_map.png');

    // TEST 4: Switch Boundary Layer to Election Districts (eds)
    console.log('4. Switching Boundary Dropdown to Election Districts (eds)...');
    await page.select('select', 'eds');
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(artifactsDir, 'test_step3_switch_eds.png') });
    console.log('📸 Step 3 Screenshot Saved: test_step3_switch_eds.png');

    // TEST 5: Hover over Map Canvas
    console.log('5. Moving mouse over precinct area to trigger hover popup...');
    await page.mouse.move(720, 450);
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(artifactsDir, 'test_step4_hover_popup.png') });
    console.log('📸 Step 4 Screenshot Saved: test_step4_hover_popup.png');

    // TEST 6: Open Race Selector Modal and Pick Another Race (e.g. State Assembly or CD 12)
    console.log('6. Opening Race Selector Modal...');
    const raceBtn = await page.$('button span');
    if (raceBtn) {
      await page.click('header button');
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(artifactsDir, 'test_step5_race_modal.png') });
      console.log('📸 Step 5 Screenshot Saved: test_step5_race_modal.png');
    }

    console.log('✅ Automated Test Completed Successfully!');
    console.log('Captured Console Logs:', consoleLogs.slice(0, 10));
    console.log('Captured Page Errors:', errors);

  } catch (err) {
    console.error('❌ Test execution error:', err);
  } finally {
    await browser.close();
  }
}

testApp();
