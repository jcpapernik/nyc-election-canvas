const puppeteer = require('puppeteer');

async function testTieAndZeroVotes() {
  console.log('🚀 Testing Tie & Zero-Vote Park Behavior...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window._map && window._useElectionStore, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  const result = await page.evaluate(() => {
    const map = window._map;
    const source = map.getSource('boundary-source');
    const features = source ? source._data.features : [];

    const zeroVoteFeatures = features.filter(f => f.properties.totalVotes === 0 || f.properties.isZeroVotes);
    const tieFeatures = features.filter(f => f.properties.isTie);

    return {
      totalFeatures: features.length,
      zeroVoteCount: zeroVoteFeatures.length,
      zeroVoteSampleOpacity: zeroVoteFeatures.length > 0 ? zeroVoteFeatures[0].properties.fillOpacity : null,
      tieCount: tieFeatures.length,
      tieSampleColor: tieFeatures.length > 0 ? tieFeatures[0].properties.fillColor : null
    };
  });

  console.log('Test Results:', result);
  await browser.close();
}

testTieAndZeroVotes();
