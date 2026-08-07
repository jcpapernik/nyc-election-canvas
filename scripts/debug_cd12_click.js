const puppeteer = require('puppeteer');

async function debugCd12() {
  console.log('🚀 Debugging District 13 -> District 12 Map Click...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window._map && window._boundaryDatasets && window._boundaryDatasets['congressional'], { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1500));

  // Inspect state before click
  const initialState = await page.evaluate(() => {
    const s = window._useElectionStore ? window._useElectionStore.getState() : {};
    return {
      selectedElectionId: s.selectedElectionId,
      activeBoundaryLayer: s.activeBoundaryLayer,
      drillDownParentDistrict: s.drillDownParentDistrict,
      hasElectionData: !!s.electionData,
      electionId: s.electionData ? s.electionData.id : null,
      resultsKeys: s.electionData && s.electionData.results ? Object.keys(s.electionData.results) : []
    };
  });
  console.log('Initial State:', initialState);

  // Click on District 12 point [-73.965, 40.775]
  console.log('\nClicking on District 12 point [-73.965, 40.775]...');
  const pt = await page.evaluate(() => {
    window._map.jumpTo({ center: [-73.965, 40.775], zoom: 12 });
    const projected = window._map.project([-73.965, 40.775]);
    return { x: Math.round(projected.x), y: Math.round(projected.y) };
  });
  console.log('Projected point for CD 12:', pt);
  await new Promise(r => setTimeout(r, 300));
  await page.mouse.click(pt.x, pt.y);

  await new Promise(r => setTimeout(r, 2000));

  // Inspect state after click
  const afterState = await page.evaluate(() => {
    const s = window._useElectionStore ? window._useElectionStore.getState() : {};
    const map = window._map;
    const source = map.getSource('boundary-source');
    const geojson = source ? source._data : null;

    const cd12Feature = geojson && geojson.features
      ? geojson.features.find(f => f.properties && String(f.properties.cong_dist) === '12')
      : null;

    return {
      selectedElectionId: s.selectedElectionId,
      activeBoundaryLayer: s.activeBoundaryLayer,
      drillDownParentDistrict: s.drillDownParentDistrict,
      electionId: s.electionData ? s.electionData.id : null,
      resultsKeys: s.electionData && s.electionData.results ? Object.keys(s.electionData.results) : [],
      cd12FeatureProps: cd12Feature ? cd12Feature.properties : null
    };
  });

  console.log('\nAfter Click State:', afterState);

  await page.screenshot({ path: '/Users/jonahpapernik/.gemini/antigravity/brain/2192e7c2-ac2f-4cf4-93ea-8e6e96c086a4/debug_cd12_click.png' });
  await browser.close();
}

debugCd12();
