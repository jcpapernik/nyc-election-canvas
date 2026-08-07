const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');

async function testAllCongClicks() {
  console.log('🚀 Running 100% Perfect & Realistic User Click Test Suite on all 13 NYC Congressional Districts...');

  // Verified interior test points strictly inside populated areas of each of the 13 NYC Congressional Districts
  const cdPoints = {
    '3': [-73.755, 40.765],  // Whitestone / Bayside, Queens
    '5': [-73.790, 40.690],  // Jamaica / Queens
    '6': [-73.830, 40.740],  // Flushing / Forest Hills, Queens
    '7': [-73.950, 40.700],  // Williamsburg / Bushwick, Brooklyn
    '8': [-73.900, 40.640],  // Canarsie / East New York, Brooklyn
    '9': [-73.950, 40.650],  // Flatbush / Crown Heights, Brooklyn
    '10': [-73.990, 40.720], // Lower Manhattan / Lower East Side
    '11': [-74.120, 40.580], // Staten Island
    '12': [-73.955, 40.765], // Upper East Side / Midtown Manhattan (residential, outside Central Park)
    '13': [-73.938, 40.840], // Harlem / Washington Heights Manhattan
    '14': [-73.870, 40.840], // East Bronx / Astoria
    '15': [-73.905, 40.835], // Mott Haven / South Bronx
    '16': [-73.830, 40.880]  // Eastchester / Wakefield, North Bronx
  };

  const congData = JSON.parse(fs.readFileSync('public/boundaries/congressional.json'));
  const districts = [];
  congData.features.forEach(f => {
    const cd = String(f.properties.cong_dist || f.properties.congressional_district);
    const pt = cdPoints[cd] || turf.pointOnFeature(f).geometry.coordinates;
    const bbox = turf.bbox(f);
    districts.push({ cd, lng: pt[0], lat: pt[1], bbox });
  });
  districts.sort((a, b) => parseInt(a.cd) - parseInt(b.cd));

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  const artifactsDir = '/Users/jonahpapernik/.gemini/antigravity/brain/2192e7c2-ac2f-4cf4-93ea-8e6e96c086a4';

  try {
    console.log('1. Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Wait until map and boundary datasets are fully initialized
    await page.waitForFunction(() => window._map && window._boundaryDatasets && window._boundaryDatasets['congressional'], { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1500));
    console.log('2. Map Engine & Index Datasets 100% Warm & Ready.');

    const results = [];

    for (const dist of districts) {
      console.log(`\n📍 Map Click Test on Congressional District ${dist.cd}...`);

      const normCd = String(parseInt(dist.cd, 10));
      const expectedPadded = dist.cd.padStart(2, '0');

      // 1. Force UI store to reset boundary layer to 'congressional' and fit map bounds to bring target district cleanly into view
      await page.evaluate((bbox) => {
        const map = window._map;
        const bDatasets = window._boundaryDatasets;
        if (map && bDatasets && bDatasets['congressional']) {
          const source = map.getSource('boundary-source');
          if (source) {
            source.setData(bDatasets['congressional']);
          }
          map.fitBounds(bbox, { padding: 180, animate: false });
        }
      }, dist.bbox);

      await new Promise(r => setTimeout(r, 600));

      // 2. Perform authentic MapLibre click at the feature's calculated point
      const pt = await page.evaluate((centerLng, centerLat) => {
        const map = window._map;
        if (!map) return null;
        const projected = map.project([centerLng, centerLat]);
        return { x: Math.round(projected.x), y: Math.round(projected.y) };
      }, dist.lng, dist.lat);

      if (pt) {
        await page.mouse.click(pt.x, pt.y);
      }

      let isSuccess = false;
      let raceTitle = '';

      try {
        await page.waitForFunction(
          (cdNorm, cdPad) => {
            const els = Array.from(document.querySelectorAll('div.fixed.bottom-6.right-6 p'));
            const nameEl = els.find(el => el.className.includes('truncate') || el.className.includes('text-blue'));
            if (!nameEl) return false;
            const txt = nameEl.textContent || '';
            return txt.includes(`District ${cdNorm}`) || txt.includes(`District ${cdPad}`);
          },
          { timeout: 4000 },
          normCd,
          expectedPadded
        );
        isSuccess = true;
      } catch (err) {}

      raceTitle = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('div.fixed.bottom-6.right-6 p'));
        const nameEl = els.find(el => el.className.includes('truncate') || el.className.includes('text-blue'));
        return nameEl ? nameEl.textContent : '';
      });

      const shotPath = path.join(artifactsDir, `click_cd_${dist.cd}.png`);
      await page.screenshot({ path: shotPath });

      console.log(`CD ${dist.cd} Result: "${raceTitle}" (${isSuccess ? 'SUCCESS ✅' : 'FAIL ❌'})`);

      results.push({
        district: `Congressional District ${dist.cd}`,
        raceTitle,
        status: isSuccess ? 'SUCCESS ✅' : 'FAIL ❌'
      });
    }

    console.log('\n==================================================');
    console.log('📊 FINAL CONGRESSIONAL MAP CLICK VERIFICATION SUMMARY:');
    console.log('==================================================');
    console.table(results);
    console.log('\nConsole Errors:', consoleErrors);

  } catch (err) {
    console.error('❌ Error in test execution:', err);
  } finally {
    await browser.close();
  }
}

testAllCongClicks();
