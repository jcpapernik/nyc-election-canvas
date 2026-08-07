import { Candidate, EDResult } from '@/types/election';

export const getBoroughWeight = (edFeature: GeoJSON.Feature, candidateId: string): number => {
  const borough = edFeature.properties?.borough || '';
  const neighborhood = edFeature.properties?.neighborhood || '';

  if (candidateId.includes('wiley') || candidateId.includes('lander')) {
    if (borough === 'Brooklyn' || neighborhood.includes('West') || neighborhood.includes('Park')) return 1.6;
    if (borough === 'Manhattan') return 1.3;
    return 0.7;
  }
  if (candidateId.includes('garcia')) {
    if (borough === 'Manhattan' || neighborhood.includes('Heights') || neighborhood.includes('Upper')) return 1.8;
    if (borough === 'Brooklyn') return 1.2;
    return 0.8;
  }
  if (candidateId.includes('adams')) {
    if (borough === 'Bronx' || borough === 'Queens' || borough === 'Brooklyn') return 1.5;
    if (borough === 'Staten Island') return 1.4;
    return 0.6;
  }
  if (candidateId.includes('yang')) {
    if (borough === 'Queens' || neighborhood.includes('Flushing')) return 1.7;
    if (borough === 'Manhattan') return 1.1;
    return 0.8;
  }
  if (candidateId.includes('sliwa') || candidateId.includes('zeldin')) {
    if (borough === 'Staten Island' || borough === 'Queens') return 2.1;
    if (borough === 'Bronx') return 1.3;
    return 0.5;
  }
  if (candidateId.includes('nadler') || candidateId.includes('maloney')) {
    if (borough === 'Manhattan') return 1.9;
    return 0.6;
  }

  const idStr = String(edFeature.id || 'ED-1');
  return 1.0 + (Math.abs(idStr.charCodeAt(0) % 5) * 0.1);
};

export const simulateRcvRounds = (
  edFeature: GeoJSON.Feature,
  candidates: Candidate[],
  roundsCount: number
) => {
  const totalBallots = edFeature.properties?.totalBallots || 450;
  const rounds: EDResult['rounds'] = {};
  const currentVotes: { [cid: string]: number } = {};
  let sumWeights = 0;

  const weights = candidates.map(c => {
    const w = getBoroughWeight(edFeature, c.id) * (0.8 + Math.random() * 0.5);
    sumWeights += w;
    return { id: c.id, weight: w };
  });

  weights.forEach(item => {
    currentVotes[item.id] = Math.round((item.weight / sumWeights) * totalBallots);
  });

  const activeCandidates = new Set(candidates.map(c => c.id));

  for (let r = 1; r <= roundsCount; r++) {
    if (r > 1 && activeCandidates.size > 2) {
      let lowestCid = '';
      let minVotes = Infinity;
      activeCandidates.forEach(cid => {
        if ((currentVotes[cid] || 0) < minVotes) {
          minVotes = currentVotes[cid] || 0;
          lowestCid = cid;
        }
      });

      if (lowestCid) {
        activeCandidates.delete(lowestCid);
        const pool = currentVotes[lowestCid] || 0;
        currentVotes[lowestCid] = 0;

        const remainingArr = Array.from(activeCandidates);
        if (remainingArr.length > 0) {
          const share = Math.floor(pool / remainingArr.length);
          const rem = pool % remainingArr.length;
          remainingArr.forEach((rcid, idx) => {
            currentVotes[rcid] = (currentVotes[rcid] || 0) + share + (idx === 0 ? rem : 0);
          });
        }
      }
    }

    let winnerId = '';
    let runnerUpId = '';
    let maxVotes = -1;
    let secondVotes = -1;

    Object.entries(currentVotes).forEach(([cid, v]) => {
      if (v > maxVotes) {
        secondVotes = maxVotes;
        runnerUpId = winnerId;
        maxVotes = v;
        winnerId = cid;
      } else if (v > secondVotes) {
        secondVotes = v;
        runnerUpId = cid;
      }
    });

    const totalActiveVotes = Object.values(currentVotes).reduce((a, b) => a + b, 0);
    const marginVotes = Math.max(0, maxVotes - secondVotes);
    const marginPct = totalActiveVotes > 0 ? (marginVotes / totalActiveVotes) * 100 : 0;

    rounds[r] = {
      votes: { ...currentVotes },
      winnerId: winnerId || candidates[0].id,
      runnerUpId: runnerUpId || candidates[1]?.id || candidates[0].id,
      marginVotes,
      marginPct: Number(marginPct.toFixed(1))
    };
  }

  return rounds;
};
