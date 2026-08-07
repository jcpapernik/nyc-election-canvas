import * as turf from '@turf/turf';
import { ElectionData } from '@/store/useElectionStore';

interface AggregatedResult {
  votes: Record<string, number>;
  total: number;
  winnerId: string;
  margin: number;
  candidates: any[];
}

// Global cache: boundaryLayerKey -> { edCode -> targetDistrictKey }
const spatialEdToTargetCache: Record<string, Record<string, string>> = {};

// Pre-indexed property & spatial centroid mapping for EDs to target districts
export function aggregateEdResultsFast(
  boundaryGeoJson: GeoJSON.FeatureCollection,
  edGeoJson: GeoJSON.FeatureCollection | undefined,
  electionData: ElectionData,
  districtIdPropNames: string[],
  boundaryLayerKey: string = 'default'
): Record<string, AggregatedResult> {
  const edResults = electionData.edResults || {};
  const candidates = electionData.candidates || [];
  if (Object.keys(edResults).length === 0 || !edGeoJson || !boundaryGeoJson) return {};

  let edToTargetDistrictMap = spatialEdToTargetCache[boundaryLayerKey];

  if (!edToTargetDistrictMap) {
    edToTargetDistrictMap = {};

    // 1. Fast direct property check if ED features happen to contain target property
    let hasDirectProperty = false;
    const sampleProps = edGeoJson.features?.[0]?.properties || {};
    for (const pName of districtIdPropNames) {
      if (sampleProps[pName] !== undefined && sampleProps[pName] !== null) {
        hasDirectProperty = true;
        break;
      }
    }

    if (hasDirectProperty) {
      (edGeoJson.features || []).forEach((f: any) => {
        const props = f.properties || {};
        const rawEd = String(props.elect_dist || '');
        if (!rawEd) return;

        let targetKey = '';
        for (const pName of districtIdPropNames) {
          if (props[pName] !== undefined && props[pName] !== null) {
            targetKey = String(props[pName]);
            break;
          }
        }

        if (targetKey) {
          const formattedEd = rawEd.length === 5 ? `${rawEd.slice(0, 2)}/${rawEd.slice(2)}` : rawEd;
          edToTargetDistrictMap[rawEd] = targetKey;
          edToTargetDistrictMap[formattedEd] = targetKey;
        }
      });
    } else {
      // 2. Fast spatial point-in-polygon centroid mapping!
      const targetFeatures = boundaryGeoJson.features || [];

      (edGeoJson.features || []).forEach((f: any) => {
        const props = f.properties || {};
        const rawEd = String(props.elect_dist || '');
        if (!rawEd) return;

        let matchedTargetKey = '';

        try {
          const pt = turf.pointOnFeature(f as any);
          for (const targetFeat of targetFeatures) {
            if (turf.booleanPointInPolygon(pt, targetFeat as any)) {
              for (const pName of districtIdPropNames) {
                if (targetFeat.properties?.[pName] !== undefined && targetFeat.properties?.[pName] !== null) {
                  matchedTargetKey = String(targetFeat.properties[pName]);
                  break;
                }
              }
              if (matchedTargetKey) break;
            }
          }
        } catch (err) {}

        if (matchedTargetKey) {
          const formattedEd = rawEd.length === 5 ? `${rawEd.slice(0, 2)}/${rawEd.slice(2)}` : rawEd;
          edToTargetDistrictMap[rawEd] = matchedTargetKey;
          edToTargetDistrictMap[formattedEd] = matchedTargetKey;
        }
      });
    }

    spatialEdToTargetCache[boundaryLayerKey] = edToTargetDistrictMap;
  }

  // 3. Perform O(N) aggregation loop (< 1ms execution)
  const aggregatedByBoundaryKey: Record<string, Record<string, number>> = {};
  const totalByBoundaryKey: Record<string, number> = {};

  Object.entries(edResults).forEach(([edKey, edRes]) => {
    const targetKey = edToTargetDistrictMap[edKey];
    if (!targetKey) return;

    if (!aggregatedByBoundaryKey[targetKey]) {
      aggregatedByBoundaryKey[targetKey] = {};
      totalByBoundaryKey[targetKey] = 0;
      candidates.forEach(c => { aggregatedByBoundaryKey[targetKey][c.id] = 0; });
    }

    Object.entries(edRes.votes || {}).forEach(([candId, v]) => {
      if (aggregatedByBoundaryKey[targetKey][candId] === undefined) {
        aggregatedByBoundaryKey[targetKey][candId] = 0;
      }
      aggregatedByBoundaryKey[targetKey][candId] += v;
    });

    totalByBoundaryKey[targetKey] += edRes.total || 0;
  });

  const finalResults: Record<string, AggregatedResult> = {};

  Object.keys(aggregatedByBoundaryKey).forEach(bKey => {
    const voteMap = aggregatedByBoundaryKey[bKey];
    const total = totalByBoundaryKey[bKey];

    const sorted = candidates.slice().sort((a, b) => (voteMap[b.id] || 0) - (voteMap[a.id] || 0));
    const winner = sorted[0];
    const v1 = voteMap[sorted[0]?.id] || 0;
    const v2 = voteMap[sorted[1]?.id] || 0;
    const margin = total > 0 ? Math.round(((v1 - v2) / total) * 1000) / 10 : 0;

    finalResults[bKey] = {
      votes: voteMap,
      total,
      winnerId: winner ? winner.id : '',
      margin,
      candidates
    };
  });

  return finalResults;
}
