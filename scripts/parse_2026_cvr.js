const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Official Candidate Map from NYC BOE CandidacyID_To_Name file
const candMap = {
  '264134': { id: 'law_gisiko', name: 'Layla Law-Gisiko', party: 'Democratic', color: '#1d4ed8' },
  '264939': { id: 'murphy', name: 'Leslie Boghosian Murphy', party: 'Democratic', color: '#0284c7' },
  '265148': { id: 'wilson', name: 'Carl Wilson', party: 'Democratic', color: '#7c3aed' },
  '267919': { id: 'boylan', name: 'Lindsey Boylan', party: 'Democratic', color: '#0d9488' }
};

const candidatesList = Object.values(candMap);

const edResults = {};
const boroughResults = {
  'Manhattan': { votes: { law_gisiko: 0, murphy: 0, wilson: 0, boylan: 0 }, total: 0, winnerId: '', margin: 0, candidates: candidatesList }
};
const councilResults = {
  '3': { votes: { law_gisiko: 0, murphy: 0, wilson: 0, boylan: 0 }, total: 0, winnerId: '', margin: 0, candidates: candidatesList }
};
const assemblyResults = {};

const files = ['2026P1V1_ED.xlsx', '2026P1V1_EV.xlsx', '2026P1V1_ABS.xlsx', '2026P1V1_AFF.xlsx'];

files.forEach(f => {
  const filePath = path.join('cvr_temp', f);
  if (!fs.existsSync(filePath)) return;
  console.log('Processing official CVR file:', f);

  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach(r => {
    const precinctStr = String(r['Precinct'] || '');
    const choice1 = String(r['DEM Council Member Choice 1 of 5 3rd Council District (027477)'] || '');

    const candInfo = candMap[choice1];
    if (!candInfo) return; // Ignore undervotes / overvotes / invalid votes

    const candId = candInfo.id;

    // Parse AD & ED (e.g. 'AD: 75 ED: 048')
    const match = precinctStr.match(/AD:\s*(\d+)\s*ED:\s*(\d+)/i);
    let adKey = '';
    let edKey = '';
    if (match) {
      const adNum = String(parseInt(match[1], 10));
      const edNum = match[2].padStart(3, '0');
      adKey = adNum;
      edKey = `${match[1].padStart(2, '0')}${edNum}`;
    }

    // Accumulate Borough (Manhattan)
    boroughResults['Manhattan'].votes[candId]++;
    boroughResults['Manhattan'].total++;

    // Accumulate City Council District 3
    councilResults['3'].votes[candId]++;
    councilResults['3'].total++;

    // Accumulate Assembly District
    if (adKey) {
      if (!assemblyResults[adKey]) {
        assemblyResults[adKey] = {
          votes: { law_gisiko: 0, murphy: 0, wilson: 0, boylan: 0 },
          total: 0,
          winnerId: '',
          margin: 0,
          candidates: candidatesList
        };
      }
      assemblyResults[adKey].votes[candId]++;
      assemblyResults[adKey].total++;
    }

    // Accumulate Election District (ED)
    if (edKey) {
      if (!edResults[edKey]) {
        edResults[edKey] = {
          votes: { law_gisiko: 0, murphy: 0, wilson: 0, boylan: 0 },
          total: 0,
          winnerId: '',
          margin: 0,
          candidates: candidatesList
        };
      }
      edResults[edKey].votes[candId]++;
      edResults[edKey].total++;
    }
  });
});

// Calculate winner and margin percentage for each district
function computeWinnersAndMargins(dataset) {
  Object.keys(dataset).forEach(key => {
    const item = dataset[key];
    const votes = item.votes;
    const total = item.total;
    if (total === 0) return;

    const sorted = Object.keys(votes).sort((a, b) => votes[b] - votes[a]);
    const top1 = sorted[0];
    const top2 = sorted[1] || sorted[0];

    const v1 = votes[top1];
    const v2 = votes[top2];

    item.winnerId = top1;
    item.margin = top1 === top2 ? (v1 / total) * 100 : Math.round(((v1 - v2) / total) * 1000) / 10;
  });
}

computeWinnersAndMargins(boroughResults);
computeWinnersAndMargins(councilResults);
computeWinnersAndMargins(assemblyResults);
computeWinnersAndMargins(edResults);

console.log('\n======================================================');
console.log('OFFICIAL 2026 NYC PRIMARY ELECTION RESULTS SUMMARY');
console.log('Election: June 23, 2026 NYC Democratic Primary - 3rd Council District');
console.log('Total Official Votes Cast:', councilResults['3'].total);
console.log('Candidate Results:', councilResults['3'].votes);
console.log('Winner:', councilResults['3'].winnerId, 'Margin:', councilResults['3'].margin + '%');
console.log('======================================================\n');

// Write official dataset JSON to public/data/elections/2026_primary_council_3.json
const outputData = {
  id: '2026_primary_council_3',
  name: '2026 NYC Dem Primary - 3rd Council District',
  date: '2026-06-23',
  party: 'Democratic',
  districtType: 'council',
  candidates: candidatesList,
  results: councilResults,
  assemblyResults: assemblyResults,
  edResults: edResults,
  boroughResults: boroughResults
};

const outputDir = path.join(process.cwd(), 'public', 'data', 'elections');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outputDir, '2026_primary_council_3.json'),
  JSON.stringify(outputData, null, 2)
);

console.log('Successfully created official dataset: public/data/elections/2026_primary_council_3.json');
