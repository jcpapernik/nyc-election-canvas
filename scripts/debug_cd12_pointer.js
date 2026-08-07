const puppeteer = require('puppeteer');

async function debugCd12Pointer() {
  console.log('🚀 Debugging why CD 12 has different mouse pointer and cannot be clicked...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window._map && window._useElectionStore, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1500));

  const initialFeatures = await page.evaluate(() => {
    const map = window._map;
    const source = map.getSource('boundary-source');
    const features = source ? source._data.features : [];
    return features.map(f => ({
      cd: f.properties.cong_dist,
      totalVotes: f.properties.totalVotes,
      isZeroVotes: f.properties.isZeroVotes,
      fillOpacity: f.properties.fillOpacity,
      isDimmed: f.properties.isDimmed
    }));
  });

  console.log('Features on initial load (CD 13 active):');
  console.table(initialFeatures);

  // Now click CD 12
  console.log('\nClicking CD 12...');
  const pt = await page.evaluate(() => {
    window._map.jumpTo({ center: [-73.965, 40.775], zoom: 12 });
    const projected = window._map.project([-73.965, 40.775]);
    return { x: Math.round(projected.x), y: Math.round(projected.y) };
  });

  await page.mouse.click(pt.x, pt.y);
  await new Promise(r => setTimeout(r, 2000));

  const afterClickFeatures = await page.evaluate(() => {
    const s = window._useElectionStore.getState();
    const map = window._map;
    const source = map.getSource('boundary-source');
    const features = source ? source._data.features : [];
    return {
      selectedElectionId: s.selectedElectionId,
      activeBoundaryLayer: s.activeBoundaryLayer,
      cd12Feature: features.find(f => String(f.properties.cong_dist) === '12')?.properties
    };
  });

  console.log('After clicking CD 12 state:');
  console.log(JSON.stringify(afterClickFeatures, null, 2));

  await browser.close();
}

debugCd12Pointer();
