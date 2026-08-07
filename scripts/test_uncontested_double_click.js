const puppeteer = require('puppeteer');

async function testUncontestedDoubleClick() {
  console.log('🚀 Testing Double-Clicking Uncontested Districts & Checking Incumbent Names...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window._map && window._useElectionStore, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  // Check CD 16 incumbent name
  const cd16Race = await page.evaluate(async () => {
    const res = await fetch('/data/elections/democratic_representative_in_congress_16.json');
    return await res.json();
  });

  console.log('CD 16 Winner Candidate:', cd16Race.candidates[0].name);

  // Load CD 16 (George Latimer / District 16 - Uncontested)
  console.log('\nLoading CD 16 (Uncontested)...');
  await page.evaluate(() => {
    window._useElectionStore.getState().setSelectedElectionId('democratic_representative_in_congress_16');
  });

  await page.waitForFunction(() => {
    const d = window._useElectionStore.getState().electionData;
    return d && d.id === 'democratic_representative_in_congress_16';
  }, { timeout: 10000 });

  console.log('Switching to Election District (EDs) view mode...');
  await page.evaluate(() => {
    window._useElectionStore.getState().setActiveBoundaryLayer('eds');
  });

  await page.waitForFunction(() => {
    const fn = window._getCurrentGeoJson;
    const res = fn ? fn() : null;
    return res && res.features && res.features.length > 0;
  }, { timeout: 15000 });

  const edFeaturesState = await page.evaluate(() => {
    try {
      const getGeoJson = window._getCurrentGeoJson;
      const geoJson = getGeoJson ? getGeoJson() : null;
      const features = geoJson ? geoJson.features : [];

      const activeEdFeatures = features.filter(f => f.properties.fillColor === '#2563eb' && f.properties.fillOpacity > 0);
      const whiteOrEmptyFeatures = features.filter(f => !f.properties.fillColor || f.properties.fillColor === '#ffffff');

      return {
        totalFeatures: features.length,
        bluePrecinctCount: activeEdFeatures.length,
        whiteOrEmptyCount: whiteOrEmptyFeatures.length,
        sampleFillColor: activeEdFeatures[0]?.properties.fillColor,
        sampleFillOpacity: activeEdFeatures[0]?.properties.fillOpacity
      };
    } catch (e) {
      return { totalFeatures: 0, error: e.toString() };
    }
  });

  console.log('ED View State for CD 5 (Uncontested):');
  console.log(JSON.stringify(edFeaturesState, null, 2));

  await browser.close();
}

testUncontestedDoubleClick();
