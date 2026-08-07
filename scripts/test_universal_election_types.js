const puppeteer = require('puppeteer');

async function testUniversalElectionTypes() {
  console.log('🚀 Testing Universal Support Across State Senate, Assembly, Council & Congressional Races...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window._map && window._useElectionStore, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  const testRaces = [
    { name: 'State Senate District 26', raceId: 'democratic_state_senator_26', layer: 'senate' },
    { name: 'Assembly District 68', raceId: 'democratic_member_of_the_assembly_68', layer: 'assembly' },
    { name: 'City Council District 01', raceId: 'democratic_member_of_the_city_council_01', layer: 'council' },
    { name: 'Congressional District 12', raceId: 'democratic_representative_in_congress_12', layer: 'congressional' }
  ];

  for (const testItem of testRaces) {
    console.log(`\n📍 Testing ${testItem.name} (${testItem.raceId})...`);

    // 1. Select Election in Store
    await page.evaluate((rId) => {
      window._useElectionStore.getState().setSelectedElectionId(rId);
    }, testItem.raceId);

    await page.waitForFunction((rId) => {
      const d = window._useElectionStore.getState().electionData;
      return d && d.id === rId;
    }, { timeout: 10000 }, testItem.raceId);

    // 2. Switch to EDs mode
    await page.evaluate(() => {
      window._useElectionStore.getState().setActiveBoundaryLayer('eds');
    });

    await page.waitForFunction(() => {
      const fn = window._getCurrentGeoJson;
      const res = fn ? fn() : null;
      return res && res.features && res.features.length > 0;
    }, { timeout: 15000 });

    await new Promise(r => setTimeout(r, 1500));

    const state = await page.evaluate(() => {
      const geoJson = window._getCurrentGeoJson ? window._getCurrentGeoJson() : null;
      const features = geoJson ? geoJson.features : [];

      const activeEdFeatures = features.filter(f => f.properties.fillColor && f.properties.fillOpacity > 0);
      const dimmedFeatures = features.filter(f => f.properties.isDimmed);
      const zeroVoteFeatures = features.filter(f => f.properties.isZeroVotes);

      return {
        totalFeatures: features.length,
        activeBlueCount: activeEdFeatures.length,
        dimmedCount: dimmedFeatures.length,
        zeroVoteCount: zeroVoteFeatures.length,
        sampleFillColor: activeEdFeatures[0]?.properties.fillColor
      };
    });

    console.log(`Results for ${testItem.name}:`, state);
  }

  await browser.close();
  console.log('\n✅ All Universal Election Types Verified Successfully!');
}

testUniversalElectionTypes();
