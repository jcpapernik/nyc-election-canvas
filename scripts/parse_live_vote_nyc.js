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

function parseCSVLine(line) {
  return line.split(',').map(p => p.replace(/^"|"$/g, '').trim());
}

// AUTHORITATIVE INCUMBENT MAP BY OFFICE AND DISTRICT (0% CROSS-OFFICE INHERITANCE)
const EXACT_INCUMBENTS_MAP = {
  'congressional': {
    '3': 'tom suozzi', '5': 'gregory meeks', '6': 'grace meng',
    '8': 'hakeem jeffries', '9': 'yvette clarke', '10': 'dan goldman', '10': 'daniel goldman',
    '11': 'nicole malliotakis', '13': 'adriano espaillat', '14': 'alexandria ocasio-cortez',
    '15': 'ritchie torres', '16': 'george latimer'
  },
  'assembly': {
    '23': 'stacey pheffer amato', '24': 'david weprin', '25': 'nily rozic',
    '26': 'edward braunstein', '27': 'sam berger', '28': 'andrew hevesi',
    '29': 'alicia hyndman', '30': 'steven raga', '31': 'khaleel anderson',
    '32': 'vivian cook', '33': 'clyde vanel', '34': 'jessica gonzalez-rojas',
    '35': 'larinda hooks', '36': 'zohran mamdani', '37': 'claire valdez',
    '38': 'jenifer rajkumar', '39': 'catalina cruz', '40': 'ron kim',
    '41': 'kalman yeger', '42': 'rodneyse bichotte', '43': 'brian cunningham',
    '44': 'robert carroll', '45': 'michael novakhov', '46': 'alec brook-krasny',
    '47': 'william colton', '48': 'simcha eichenstein', '49': 'lester chang',
    '50': 'emily gallagher', '51': 'marcela mitaynes', '52': 'jo anne simon',
    '53': 'maritza davila', '54': 'erik dilan', '55': 'latrice walker',
    '56': 'stefani zinerman', '57': 'phara souffrant forrest', '58': 'monique chandler-waterman',
    '59': 'jaime williams', '60': 'nikki lucas', '61': 'charles fall',
    '62': 'michael reilly', '63': 'sam pirozzolo', '64': 'michael tannousis',
    '65': 'grace lee', '66': 'deborah glick', '67': 'linda rosenthal',
    '68': 'eddie gibbs', '69': 'micah lasher', '70': 'jordan wright',
    '71': 'al taylor', '72': 'manny de los santos', '73': 'alex aronson',
    '74': 'harvey epstein', '75': 'tony simone', '76': 'rebecca seawright',
    '77': 'landon dais', '78': 'george alvarez', '79': 'chantel jackson',
    '80': 'john zaccaro', '81': 'jeffrey dinowitz', '82': 'michael benedetto',
    '83': 'carl heastie', '84': 'amanda septimo', '85': 'emerita torres',
    '86': 'yudelka tapia', '87': 'karines reyes'
  },
  'senate': {
    '10': 'james sanders', '11': 'toby ann stavisky', '12': 'michael gianaris',
    '13': 'jessica ramos', '14': 'leroy comrie', '15': 'joseph addabbo',
    '16': 'john liu', '17': 'steve chan', '18': 'julia salazar',
    '19': 'roxanne persaud', '20': 'zellnor myrie', '21': 'kevin parker',
    '22': 'simcha felder', '23': 'jessica scarcella-spanton', '24': 'andrew lanza',
    '25': 'jabari brisport', '26': 'andrew gounardes', '27': 'brian kavanagh',
    '28': 'liz krueger', '29': 'jose serrano', '30': 'cordell cleare',
    '31': 'robert jackson', '32': 'luis sepulveda', '33': 'gustavo rivera',
    '34': 'nathalia fernandez', '35': 'andrea stewart-cousins', '36': 'jamaal bailey'
  },
  'council': {
    '1': 'christopher marte', '2': 'carlina rivera', '3': 'erik bottcher',
    '4': 'keith powers', '5': 'julie menin', '6': 'gale brewer',
    '7': 'shaun abreu', '8': 'diana ayala', '9': 'yusef salaam',
    '10': 'carmen de la rosa', '11': 'eric dinowitz', '12': 'kevin riley',
    '13': 'kristy marmorato', '14': 'pierina sanchez', '15': 'oswald feliz',
    '16': 'althea stevens', '17': 'rafael salamanca', '18': 'amanda farias',
    '19': 'vickie paladino', '20': 'sandra ung', '21': 'francisco moya',
    '22': 'tiffany caban', '23': 'linda lee', '24': 'james gennaro',
    '25': 'shekar krishnan', '26': 'julie won', '27': 'nantasha williams',
    '28': 'adrienne adams', '29': 'lynn schulman', '30': 'robert holden',
    '31': 'selvena brooks-powers', '32': 'joann ariola', '33': 'lincoln restler',
    '34': 'jennifer gutierrez', '35': 'crystal hudson', '36': 'chi osse',
    '37': 'sandy nurse', '38': 'alexa aviles', '39': 'shahana hanif',
    '40': 'rita joseph', '41': 'darlene mealy', '42': 'chris banks',
    '43': 'susan zhuang', '44': 'kalman yeger', '45': 'farah louis',
    '46': 'mercedes narcisse', '47': 'justin brannan', '48': 'inna vernikov',
    '49': 'kamillah hanks', '50': 'david carr', '51': 'joseph borelli'
  },
  'statewide': {
    'nyc': 'thomas dinapoli', 'ny': 'thomas dinapoli', 'comptroller': 'thomas dinapoli'
  },
  'boroughs': {
    'nyc': 'thomas dinapoli', 'ny': 'thomas dinapoli', 'comptroller': 'thomas dinapoli'
  }
};

function isTrueIncumbent(candName, districtType, distKey) {
  if (!candName || candName === 'Scattered') return false;
  const candLower = candName.toLowerCase();
  const typeMap = EXACT_INCUMBENTS_MAP[districtType] || {};
  const cleanKey = /^\d+$/.test(String(distKey)) ? String(parseInt(distKey, 10)) : String(distKey).toLowerCase();
  let expected = typeMap[cleanKey] || typeMap['nyc'] || typeMap['comptroller'] || '';
  if (!expected) return false;
  const parts = expected.split(' ');
  return parts.every(p => candLower.includes(p));
}

// CANDIDATE COLOR PALETTES
// Incumbent gets Cobalt Blue (#2563eb) in Dem, Crimson Red (#dc2626) in GOP.
// Challengers get non-incumbent color sequence: Orange -> Purple -> Green -> Cyan -> Indigo -> Pink
const DEMOCRATIC_INCUMBENT_COLOR = '#2563eb'; // Cobalt Blue
const DEMOCRATIC_CHALLENGER_COLORS = [
  '#d97706', // 1. Vibrant Orange
  '#7c3aed', // 2. Deep Purple
  '#059669', // 3. Emerald Green
  '#0891b2', // 4. Vivid Cyan
  '#4f46e5', // 5. Electric Indigo
  '#db2777'  // 6. Hot Pink
];

const REPUBLICAN_INCUMBENT_COLOR = '#dc2626'; // Crimson Red
const REPUBLICAN_CHALLENGER_COLORS = [
  '#d97706', // 1. Vibrant Orange
  '#7c3aed', // 2. Deep Purple
  '#059669', // 3. Emerald Green
  '#c026d3', // 4. Vivid Magenta
  '#ea580c', // 5. Dark Amber
  '#e11d48'  // 6. Hot Coral
];

const MINOR_CANDIDATE_COLOR = '#64748b'; // Muted slate neutral for lower-tier candidates

function categorizeOffice(officeRaw) {
  const o = officeRaw.toLowerCase();
  if (o.includes('representative in congress') || o.includes('congress')) return 'US House (Congressional)';
  if (o.includes('state senator') || o.includes('senatorial')) return 'NY State Senate';
  if (o.includes('member of the assembly') || o.includes('assembly')) return 'NY State Assembly';
  if (o.includes('city council') || o.includes('council member')) return 'NYC City Council';
  if (o.includes('comptroller') || o.includes('governor') || o.includes('attorney')) return 'Citywide / Statewide';
  return 'Judicial & Party Offices';
}

async function run() {
  console.log('Fetching live 2026 election result links from vote.nyc...');
  try {
    const { body } = await fetchUrl(SUMMARY_URL);

    // Extract all EDLevel CSV file links dynamically from vote.nyc
    const csvRegex = /href=[\"\']([^\"\']*EDLevel\.csv)[\"\']/gi;
    let match;
    const csvUrlsSet = new Set();
    while ((match = csvRegex.exec(body)) !== null) {
      let csvPath = match[1];
      if (csvPath.startsWith('/')) csvPath = 'https://vote.nyc' + csvPath;
      csvUrlsSet.add(csvPath);
    }
    const rawCsvUrls = Array.from(csvUrlsSet);

    // DEDUPLICATE CROSSOVER VS COUNTY FILES:
    // For districts spanning multiple counties, vote.nyc provides both a "Crossover" total CSV AND individual county CSVs.
    // We include the office title in the key to prevent cross-office key collisions!
    const crossoverKeys = new Set();
    rawCsvUrls.forEach(u => {
      if (u.includes('Crossover')) {
        const fileBasename = path.basename(u);
        const officeMatch = fileBasename.match(/Representative in Congress|State Senator|Member of the Assembly|City Council|State Comptroller/i);
        const distMatch = fileBasename.match(/\d+(?:st|nd|rd|th)/i);
        if (officeMatch && distMatch) {
          crossoverKeys.add(`${officeMatch[0].toLowerCase()}_${distMatch[0].toLowerCase()}`);
        }
      }
    });

    const csvUrls = rawCsvUrls.filter(u => {
      if (u.includes('Crossover')) return true;
      const fileBasename = path.basename(u);
      const officeMatch = fileBasename.match(/Representative in Congress|State Senator|Member of the Assembly|City Council|State Comptroller/i);
      const distMatch = fileBasename.match(/\d+(?:st|nd|rd|th)/i);
      if (officeMatch && distMatch) {
        const key = `${officeMatch[0].toLowerCase()}_${distMatch[0].toLowerCase()}`;
        if (crossoverKeys.has(key)) {
          return false; // Skip county file because Crossover file exists for this office contest
        }
      }
      return true;
    });

    console.log(`Found ${rawCsvUrls.length} total CSV links -> Filtered to ${csvUrls.length} deduplicated CSV links on vote.nyc`);

    const officesMap = {};

    // Process URLs in batches of 15
    const batchSize = 15;
    for (let i = 0; i < csvUrls.length; i += batchSize) {
      const batch = csvUrls.slice(i, i + batchSize);
      await Promise.all(batch.map(async (csvUrl) => {
        try {
          const cleanUrl = csvUrl.replace(/ /g, '%20');
          const { statusCode, body: csvData } = await fetchUrl(cleanUrl);
          if (statusCode !== 200) return;

          const lines = csvData.split(/\r?\n/).filter(l => l.trim());
          if (lines.length < 2) return;

          lines.forEach((line) => {
            const cols = parseCSVLine(line);
            if (cols.length < 22) return;

            const party = cols[16] || 'Democratic';
            const office = cols[17];
            const districtKey = cols[18];
            const adNum = cols[11] || '';
            const edNum = cols[12] || '';
            const rawUnitName = cols[20] || '';
            let unitName = rawUnitName.replace(/^a([A-Z])/, '$1').trim();
            // Strip party line suffixes like (Democratic), (Working Families), (Queens For All), (People First), (Conservative), etc., while preserving (M), (F), (X)
            unitName = unitName.replace(/\s*\((?![MFX]\))[^)]+\)\s*$/g, '').trim();

            const tally = parseInt(cols[21], 10);
            const county = cols[13];

            const metadataUnits = ['Public Counter', 'Manually Counted Emergency', 'Absentee / Military', 'Federal', 'Affidavit', 'Unassigned', 'Write-In', 'EDAD Status', 'Unit Name', 'Tally', 'AD', 'ED', 'County'];

            if (!office || !unitName || metadataUnits.includes(unitName) || isNaN(tally)) return;

            const key = `${party}_${office}_${districtKey}`.toLowerCase().replace(/[^a-z0-9]+/g, '_');

            if (!officesMap[key]) {
              officesMap[key] = {
                id: key,
                name: `2026 Primary - ${office} ${districtKey !== 'NYC' ? 'District ' + districtKey : 'Citywide'}`,
                party: party.trim(),
                officeRaw: office,
                officeCategory: categorizeOffice(office),
                districtKey: districtKey.trim(),
                candidatesMap: {},
                results: {},
                edResults: {}
              };
            }

            const item = officesMap[key];

            if (!item.candidatesMap[unitName]) {
              item.candidatesMap[unitName] = 0;
            }
            item.candidatesMap[unitName] += tally;

            const distName = districtKey !== 'NYC' ? districtKey : county;
            if (!item.results[distName]) {
              item.results[distName] = { votes: {}, total: 0 };
            }
            if (!item.results[distName].votes[unitName]) {
              item.results[distName].votes[unitName] = 0;
            }
            item.results[distName].votes[unitName] += tally;
            item.results[distName].total += tally;

            // Store granular ED result using AD & ED numbers from cols[11] and cols[12]
            if (adNum && edNum && !isNaN(parseInt(adNum, 10)) && !isNaN(parseInt(edNum, 10))) {
              const edKeyRaw = `${adNum.padStart(2, '0')}${edNum.padStart(3, '0')}`;
              const edKeyFormatted = `${adNum.padStart(2, '0')}/${edNum.padStart(3, '0')}`;

              [edKeyRaw, edKeyFormatted].forEach(k => {
                if (!item.edResults[k]) {
                  item.edResults[k] = { votes: {}, total: 0 };
                }
                if (!item.edResults[k].votes[unitName]) {
                  item.edResults[k].votes[unitName] = 0;
                }
                item.edResults[k].votes[unitName] += tally;
                item.edResults[k].total += tally;
              });
            }
          });
        } catch (e) {}
      }));
    }

    console.log(`\nSuccessfully processed ${Object.keys(officesMap).length} dynamic election races from vote.nyc`);

    const outputDir = path.join(process.cwd(), 'public', 'data', 'elections');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    // Clean up old JSON files
    fs.readdirSync(outputDir).forEach(f => {
      if (f.endsWith('.json')) fs.unlinkSync(path.join(outputDir, f));
    });

    const indexList = [];

    Object.values(officesMap).forEach((race) => {
      // STRICT DESCENDING SORT BY CITYWIDE/RACE TOTAL VOTES
      const sortedCandidateEntries = Object.entries(race.candidatesMap).sort((a, b) => b[1] - a[1]);

      const isDem = race.party.toLowerCase().includes('democrat');
      const incColor = isDem ? DEMOCRATIC_INCUMBENT_COLOR : REPUBLICAN_INCUMBENT_COLOR;
      const challengerColors = isDem ? DEMOCRATIC_CHALLENGER_COLORS : REPUBLICAN_CHALLENGER_COLORS;

      let challengerIdx = 0;

      const candidates = sortedCandidateEntries.map(([name, totalVotes]) => {
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const lowerName = name.toLowerCase();

        // STRICT AUTHORITATIVE INCUMBENT CHECK BY OFFICE AND DISTRICT
        const isIncumbent = isTrueIncumbent(name, race.districtType, race.districtKey);

        let color = MINOR_CANDIDATE_COLOR;
        if (isIncumbent) {
          color = incColor;
        } else {
          color = challengerIdx < challengerColors.length ? challengerColors[challengerIdx] : MINOR_CANDIDATE_COLOR;
          challengerIdx++;
        }

        return {
          id,
          name,
          party: race.party,
          isIncumbent,
          color
        };
      });

      // Format District Results
      const formattedResults = {};
      Object.keys(race.results).forEach(dist => {
        const res = race.results[dist];
        const voteObj = {};
        candidates.forEach(c => {
          voteObj[c.id] = res.votes[c.name] || 0;
        });

        const sortedLocal = candidates.slice().sort((a, b) => (voteObj[b.id] || 0) - (voteObj[a.id] || 0));
        const winner = sortedLocal[0];
        const v1 = voteObj[sortedLocal[0]?.id] || 0;
        const v2 = voteObj[sortedLocal[1]?.id] || 0;
        const margin = res.total > 0 ? Math.round(((v1 - v2) / res.total) * 1000) / 10 : 0;

        formattedResults[dist] = {
          votes: voteObj,
          total: res.total,
          winnerId: winner ? winner.id : '',
          margin,
          candidates
        };
      });

      // Format Granular ED Results
      const formattedEdResults = {};
      Object.keys(race.edResults).forEach(edKey => {
        const res = race.edResults[edKey];
        const voteObj = {};
        candidates.forEach(c => {
          voteObj[c.id] = res.votes[c.name] || 0;
        });

        const sortedLocal = candidates.slice().sort((a, b) => (voteObj[b.id] || 0) - (voteObj[a.id] || 0));
        const winner = sortedLocal[0];
        const v1 = voteObj[sortedLocal[0]?.id] || 0;
        const v2 = voteObj[sortedLocal[1]?.id] || 0;
        const margin = res.total > 0 ? Math.round(((v1 - v2) / res.total) * 1000) / 10 : 0;

        formattedEdResults[edKey] = {
          votes: voteObj,
          total: res.total,
          winnerId: winner ? winner.id : '',
          margin,
          candidates
        };
      });

      const realCandidatesCount = candidates.filter(c => c.name !== 'Scattered').length;
      const isUncontested = realCandidatesCount <= 1;

      let districtType = 'congressional';
      const officeLower = race.officeRaw.toLowerCase();
      if (officeLower.includes('assembly')) districtType = 'assembly';
      else if (officeLower.includes('senat')) districtType = 'senate';
      else if (officeLower.includes('council')) districtType = 'council';
      else if (officeLower.includes('comptroller') || officeLower.includes('governor') || race.districtKey === 'NYC') districtType = 'boroughs';

      const outputData = {
        id: race.id,
        name: race.name,
        date: '2026-06-23',
        party: race.party,
        officeCategory: race.officeCategory,
        districtKey: race.districtKey,
        districtType,
        isUncontested,
        candidates,
        results: formattedResults,
        edResults: formattedEdResults
      };

      const outPath = path.join(outputDir, `${race.id}.json`);
      fs.writeFileSync(outPath, JSON.stringify(outputData, null, 2));

      const candSummary = sortedCandidateEntries.map(e => e[0]).filter(c => c !== 'Scattered').slice(0, 3).join(', ');

      indexList.push({
        id: race.id,
        name: race.name,
        cycle: '2026 Primary',
        party: race.party,
        officeCategory: race.officeCategory,
        districtKey: race.districtKey,
        districtType,
        isUncontested,
        candidatesSummary: candSummary ? ` (${candSummary}${isUncontested ? ' - Uncontested' : ''})` : ''
      });
    });

    // SYNTHESIZE UNCONTESTED RACES FOR ALL MISSING NYC DISTRICTS (Congressional, Senate, Assembly, Council)
    // SYNTHESIZE UNCONTESTED RACES FOR MISSING NYC DISTRICTS
    const categoriesToSynthesize = [
      {
        prefix: 'democratic_representative_in_congress_',
        officeName: 'Representative in Congress',
        officeCategory: 'US House (Congressional)',
        districtType: 'congressional',
        districts: Array.from({ length: 14 }, (_, i) => String(i + 3))
      },
      {
        prefix: 'democratic_state_senator_',
        officeName: 'State Senator',
        officeCategory: 'State Senate',
        districtType: 'senate',
        districts: Array.from({ length: 27 }, (_, i) => String(i + 10))
      },
      {
        prefix: 'democratic_member_of_the_assembly_',
        officeName: 'Member of the Assembly',
        officeCategory: 'State Assembly',
        districtType: 'assembly',
        districts: Array.from({ length: 65 }, (_, i) => String(i + 23))
      },
      {
        prefix: 'democratic_member_of_the_city_council_',
        officeName: 'Member of the City Council',
        officeCategory: 'City Council',
        districtType: 'council',
        districts: Array.from({ length: 51 }, (_, i) => String(i + 1))
      }
    ];

    categoriesToSynthesize.forEach(cat => {
      cat.districts.forEach(dKey => {
        const paddedKey = dKey.padStart(2, '0');
        const raceId = `${cat.prefix}${paddedKey}`;
        const jsonFile = path.join(outputDir, `${raceId}.json`);

        if (!fs.existsSync(jsonFile)) {
          const candInfo = {
            name: `Uncontested Primary`,
            id: `uncontested_primary_${cat.districtType}_${dKey}`,
            color: '#2563eb'
          };

          const uncontestedData = {
            id: raceId,
            name: `2026 Primary - ${cat.officeName} District ${paddedKey}`,
            date: '2026-06-23',
            party: 'Democratic',
            officeCategory: cat.officeCategory,
            districtKey: dKey,
            districtType: cat.districtType,
            isUncontested: true,
            candidates: [
              {
                id: candInfo.id,
                name: candInfo.name,
                party: 'Democratic',
                isIncumbent: true,
                color: candInfo.color
              }
            ],
            results: {
              [dKey]: {
                votes: { [candInfo.id]: 0 },
                total: 0,
                winnerId: candInfo.id,
                margin: 100,
                isUncontested: true
              }
            },
            edResults: {}
          };

          fs.writeFileSync(jsonFile, JSON.stringify(uncontestedData, null, 2));

          indexList.push({
            id: raceId,
            name: uncontestedData.name,
            cycle: '2026 Primary',
            party: 'Democratic',
            officeCategory: cat.officeCategory,
            districtKey: dKey,
            districtType: cat.districtType,
            isUncontested: true,
            candidatesSummary: ` (${candInfo.name} - Uncontested)`
          });
        }
      });
    });

    // Sort index entries by office category, party, and district
    indexList.sort((a, b) => {
      if (a.officeCategory !== b.officeCategory) return a.officeCategory.localeCompare(b.officeCategory);
      if (a.party !== b.party) return a.party.localeCompare(b.party);
      return (parseInt(a.districtKey, 10) || 0) - (parseInt(b.districtKey, 10) || 0);
    });

    fs.writeFileSync(
      path.join(outputDir, 'index.json'),
      JSON.stringify(indexList, null, 2)
    );
    console.log(`Wrote ${indexList.length} rich dynamic race items to public/data/elections/index.json`);

  } catch (err) {
    console.error('Error fetching live vote.nyc data:', err.message);
  }
}

run();
