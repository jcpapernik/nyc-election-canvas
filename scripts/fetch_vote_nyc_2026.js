const https = require('https');
const fs = require('fs');
const path = require('path');

const SUMMARY_URL = 'https://vote.nyc/page/election-results-summary';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) redirectUrl = 'https://vote.nyc' + redirectUrl;
        return resolve(fetchUrl(redirectUrl));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching live 2026 election result links from vote.nyc...');
  try {
    const { body } = await fetchUrl(SUMMARY_URL);

    // Extract all 2026 CSV file links
    const csvRegex = /href="([^"]*2026[^"]*\.csv)"/gi;
    let match;
    const csvUrls = [];
    while ((match = csvRegex.exec(body)) !== null) {
      let csvPath = match[1];
      if (csvPath.startsWith('/')) csvPath = 'https://vote.nyc' + csvPath;
      csvUrls.push(csvPath);
    }

    console.log(`Found ${csvUrls.length} official 2026 CSV election result links on vote.nyc:`);
    csvUrls.forEach(u => console.log(' ->', u));

    if (csvUrls.length === 0) {
      console.log('No 2026 CSV links found on vote.nyc yet.');
      return;
    }

    // Process each CSV dataset dynamically
    for (const csvUrl of csvUrls) {
      console.log(`\nFetching official CSV dataset: ${csvUrl}`);
      const encodedUrl = encodeURI(csvUrl);
      const { statusCode, body: csvData } = await fetchUrl(encodedUrl);

      if (statusCode !== 200) {
        console.error(`Failed to fetch ${csvUrl} (Status ${statusCode})`);
        continue;
      }

      const lines = csvData.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) continue;

      // Extract header row
      const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
      console.log('Header columns:', headers);

      // Parse candidate names, vote counts, EDs, and total votes dynamically
      const candidateVotes = {};
      const edResults = {};
      const boroughResults = {};

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length < 3) continue;

        const adEd = cols[0] || '';
        const candidateName = cols[1] || '';
        const votes = parseInt(cols[2] || '0', 10);

        if (!candidateName || isNaN(votes)) continue;

        if (!candidateVotes[candidateName]) candidateVotes[candidateName] = 0;
        candidateVotes[candidateName] += votes;

        if (adEd) {
          if (!edResults[adEd]) edResults[adEd] = { votes: {}, total: 0 };
          if (!edResults[adEd].votes[candidateName]) edResults[adEd].votes[candidateName] = 0;
          edResults[adEd].votes[candidateName] += votes;
          edResults[adEd].total += votes;
        }
      }

      const totalVotes = Object.values(candidateVotes).reduce((a, b) => a + b, 0);
      console.log('Dynamic Candidates Parsed:', Object.keys(candidateVotes));
      console.log('Total Votes Cast:', totalVotes);
    }
  } catch (err) {
    console.error('Error fetching vote.nyc data:', err.message);
  }
}

run();
