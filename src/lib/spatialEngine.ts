import * as turf from '@turf/turf';
import { ElectionData, Candidate } from '@/types/election';

export interface EnrichedEdFeature {
  edId: string;
  edName: string;
  borough: string;
  councilDistrict: number;
  assemblyDistrict: number;
  senateDistrict: number;
  congressionalDistrict: number;
  neighborhood: string;
  registeredVoters: number;
  totalBallots: number;
  winnerId: string;
  winnerName: string;
  winnerColor: string;
  runnerUpId: string;
  runnerUpName: string;
  marginVotes: number;
  marginPct: number;
  votesMap: { [cid: string]: number };
  centroid: [number, number];
}

export function enrichGeoJsonWithElectionData(
  edGeoJSON: GeoJSON.FeatureCollection,
  election: ElectionData,
  activeRound: number
): {
  enrichedGeoJSON: GeoJSON.FeatureCollection;
  bubbleGeoJSON: GeoJSON.FeatureCollection;
  featureMap: Map<string, EnrichedEdFeature>;
} {
  const enrichedFeatures: GeoJSON.Feature[] = [];
  const bubbleFeatures: GeoJSON.Feature[] = [];
  const featureMap = new Map<string, EnrichedEdFeature>();

  const candidateMap = new Map<string, Candidate>();
  election.candidates.forEach(c => candidateMap.set(c.id, c));

  edGeoJSON.features.forEach(feature => {
    const edId = feature.properties?.edId as string;
    if (!edId) return;

    const edResult = election.results[edId];
    if (!edResult) return;

    const roundData = edResult.rounds[activeRound] || edResult.rounds[1];
    const winnerId = roundData.winnerId;
    const winnerCandidate = candidateMap.get(winnerId);
    const winnerColor = winnerCandidate?.color || '#3b82f6';
    const winnerName = winnerCandidate?.name || 'Unknown';

    const runnerUpCandidate = candidateMap.get(roundData.runnerUpId);
    const runnerUpName = runnerUpCandidate?.name || '';

    // Calculate centroid for bubble overlay
    let centroidCoord: [number, number] = [-73.98, 40.75];
    try {
      const center = turf.centroid(feature as any);
      centroidCoord = center.geometry.coordinates as [number, number];
    } catch (err) {
      // fallback
    }

    const enrichedProp: EnrichedEdFeature = {
      edId,
      edName: edResult.edName,
      borough: edResult.borough,
      councilDistrict: edResult.councilDistrict,
      assemblyDistrict: edResult.assemblyDistrict,
      senateDistrict: edResult.senateDistrict,
      congressionalDistrict: edResult.congressionalDistrict,
      neighborhood: edResult.neighborhood,
      registeredVoters: edResult.registeredVoters,
      totalBallots: edResult.totalBallots,
      winnerId,
      winnerName,
      winnerColor,
      runnerUpId: roundData.runnerUpId,
      runnerUpName,
      marginVotes: roundData.marginVotes,
      marginPct: roundData.marginPct,
      votesMap: roundData.votes,
      centroid: centroidCoord
    };

    featureMap.set(edId, enrichedProp);

    // Polygon feature for Choropleth Heatmap
    enrichedFeatures.push({
      ...feature,
      properties: {
        ...feature.properties,
        ...enrichedProp
      }
    });

    // Point feature for Proportional Bubble Overlay
    bubbleFeatures.push({
      type: 'Feature',
      id: `bubble-${edId}`,
      properties: {
        edId,
        edName: edResult.edName,
        totalBallots: edResult.totalBallots,
        winnerId,
        winnerName,
        winnerColor,
        marginPct: roundData.marginPct
      },
      geometry: {
        type: 'Point',
        coordinates: centroidCoord
      }
    });
  });

  return {
    enrichedGeoJSON: { type: 'FeatureCollection', features: enrichedFeatures },
    bubbleGeoJSON: { type: 'FeatureCollection', features: bubbleFeatures },
    featureMap
  };
}

// Calculate Bounding Box of GeoJSON features for auto-zoom
export function getBoundingBox(features: GeoJSON.Feature[]): [number, number, number, number] | null {
  if (!features || features.length === 0) return null;
  try {
    const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };
    const bbox = turf.bbox(fc as any);
    return bbox as [number, number, number, number];
  } catch (e) {
    return null;
  }
}
