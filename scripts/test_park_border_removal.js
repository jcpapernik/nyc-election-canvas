const puppeteer = require('puppeteer');

async function testParkBorderRemoval() {
  console.log('🚀 Verifying border stroke removal for 078/68 & zero-vote park precincts...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window._map && window._useElectionStore, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  // Load Assembly District / EDs view or Congressional 13
  await page.evaluate(() => {
    window._useElectionStore.getState().setSelectedElectionId('democratic_representative_in_congress_13');
    window._useElectionStore.getState().setActiveBoundaryLayer('eds');
  });

  await page.waitForFunction(() => window._boundaryDatasets && window._boundaryDatasets['eds'], { timeout: 15000 });
  await new Promise(r => setTimeout(r, 2500));

  const parkBorderResults = await page.evaluate(() => {
    const map = window._map;
    const source = map.getSource('boundary-source');
    const features = source ? source._data.features : [];

    const ed078 = features.find(f => {
      const ed = String(f.properties.elect_dist || '');
      return ed.includes('078') || ed.includes('78');
    });

    const ed069 = features.find(f => {
      const ed = String(f.properties.elect_dist || '');
      return ed.includes('069') || ed.includes('69');
    });

    const zeroVoteFeatures = features.filter(f => f.properties.isZeroVotes);

    return {
      totalZeroVoteFeatures: zeroVoteFeatures.length,
      ed078Found: Boolean(ed078),
      ed078IsZeroVotes: ed078?.properties.isZeroVotes,
      ed078FillOpacity: ed078?.properties.fillOpacity,
      ed069Found: Boolean(ed069),
      ed069IsZeroVotes: ed069?.properties.isZeroVotes,
      ed069FillOpacity: ed069?.properties.fillOpacity
    };
  });

  console.log('Park Border Results:', parkBorderResults);
  await browser.close();
}

testParkBorderRemoval();
