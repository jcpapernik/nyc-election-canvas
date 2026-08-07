const puppeteer = require('puppeteer');
const fs = require('fs');

async function testUserClickFlow() {
  console.log('🚀 Testing exact user click flow from District 13 -> District 12...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  const artifactsDir = '/Users/jonahpapernik/.gemini/antigravity/brain/2192e7c2-ac2f-4cf4-93ea-8e6e96c086a4';

  console.log('1. Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window._map && window._boundaryDatasets && window._boundaryDatasets['congressional'], { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: `${artifactsDir}/step1_initial_cd13.png` });
  console.log('Step 1 Screenshot saved: step1_initial_cd13.png');

  // Click on District 12 on map at [-73.965, 40.775]
  console.log('2. User clicks on District 12 on map...');
  const pt = await page.evaluate(() => {
    window._map.jumpTo({ center: [-73.965, 40.775], zoom: 12 });
    const projected = window._map.project([-73.965, 40.775]);
    return { x: Math.round(projected.x), y: Math.round(projected.y) };
  });
  console.log('Projected pt:', pt);
  await new Promise(r => setTimeout(r, 400));
  await page.mouse.click(pt.x, pt.y);

  await new Promise(r => setTimeout(r, 2500));

  const debugObj = await page.evaluate(() => {
    const s = window._useElectionStore.getState();
    const map = window._map;
    const source = map.getSource('boundary-source');
    const features = source ? source._data.features : [];

    const cd12F = features.find(f => String(f.properties.cong_dist) === '12');

    return {
      selectedElectionId: s.selectedElectionId,
      activeBoundaryLayer: s.activeBoundaryLayer,
      hasElectionData: !!s.electionData,
      electionId: s.electionData ? s.electionData.id : null,
      districtKeyInElectionData: s.electionData ? s.electionData.districtKey : null,
      districtTypeInElectionData: s.electionData ? s.electionData.districtType : null,
      resultsInElectionData: s.electionData ? Object.keys(s.electionData.results || {}) : [],
      cd12FeatureProps: cd12F ? cd12F.properties : null
    };
  });

  console.log('Detailed Debug Object after 2.5s:');
  console.log(JSON.stringify(debugObj, null, 2));

  await browser.close();
}

testUserClickFlow();
