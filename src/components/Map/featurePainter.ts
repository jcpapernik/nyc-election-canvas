import * as turf from '@turf/turf';
import { BoundaryLayerType, ElectionData } from '@/store/useElectionStore';
import { BOUNDARY_PROP_NAMES, normalizeDistrictKey } from './mapHelpers';

export function paintRenderFeatures(
  renderRawFeatures: GeoJSON.Feature[],
  boundaryLayer: BoundaryLayerType,
  electionData: ElectionData | null,
  resultsMap: Record<string, any>,
  parentPropNames: string[],
  targetMacroFeature: GeoJSON.Feature | null,
  activeEdKeysSet: Set<string>,
  insideEdsSet: Set<GeoJSON.Feature>
): {
  finalRenderFeatures: GeoJSON.Feature[];
  activeDistrictFeatures: GeoJSON.Feature[];
  districtLabelMap: Map<string, { feature: GeoJSON.Feature; labelKey: string }>;
} {
  const propNames = BOUNDARY_PROP_NAMES[boundaryLayer];
  const activeDistrictFeatures: GeoJSON.Feature[] = [];
  const districtLabelMap = new Map<string, { feature: GeoJSON.Feature; labelKey: string }>();
  const finalRenderFeatures: GeoJSON.Feature[] = [];

  renderRawFeatures.forEach((f: any, idx: number) => {
    let renderFeature = { ...f, id: idx + 1 };
    const props = renderFeature.properties || {};
    let labelText = '';
    let districtKey = '';

    if (props.subDistrictKey) {
      districtKey = String(props.subDistrictKey);
      labelText = districtKey;
    } else {
      for (const pName of propNames) {
        if (props[pName] !== undefined && props[pName] !== null) {
          districtKey = String(props[pName]);
          labelText = districtKey;
          break;
        }
      }
    }

    if (!districtKey && parentPropNames) {
      for (const pName of parentPropNames) {
        if (props[pName] !== undefined && props[pName] !== null) {
          districtKey = String(props[pName]);
          labelText = districtKey;
          break;
        }
      }
    }

    if (props.elect_dist) {
      const rawEd = String(props.elect_dist || '');
      labelText = rawEd.length === 5 ? `${rawEd.slice(0, 2)}/${rawEd.slice(2)}` : rawEd;
      districtKey = props.elect_dist || labelText;
    }

    const normKey = normalizeDistrictKey(districtKey);
    const paddedKey = districtKey.length === 1 ? `0${districtKey}` : districtKey;
    const strippedKey = districtKey.startsWith('0') ? districtKey.slice(1) : districtKey;
    const rawEdAlt = String(props.elect_dist || '');
    const formattedEdAlt = rawEdAlt.length === 5 ? `${rawEdAlt.slice(0, 2)}/${rawEdAlt.slice(2)}` : rawEdAlt;

    let matchedResult =
      resultsMap[districtKey] ||
      resultsMap[normKey] ||
      resultsMap[paddedKey] ||
      resultsMap[strippedKey] ||
      resultsMap[rawEdAlt] ||
      resultsMap[formattedEdAlt];

    const isCrossLayerSubBoundary =
      boundaryLayer !== 'eds' &&
      boundaryLayer !== 'citywide' &&
      electionData?.districtType &&
      boundaryLayer !== electionData.districtType &&
      electionData.districtType !== 'boroughs' &&
      Boolean(targetMacroFeature);

    const isUncontestedActiveRace = Boolean(electionData?.isUncontested);
    const isInsideActiveEds = boundaryLayer === 'eds' && (
      activeEdKeysSet.has(rawEdAlt) ||
      activeEdKeysSet.has(formattedEdAlt) ||
      insideEdsSet.has(f)
    );

    if (!matchedResult && isUncontestedActiveRace && isInsideActiveEds) {
      const topCand = electionData?.candidates?.[0];
      if (topCand) {
        matchedResult = {
          votes: { [topCand.id]: 0 },
          total: 0,
          winnerId: topCand.id,
          margin: 100,
          isUncontested: true,
          candidates: electionData.candidates
        };
      }
    }

    const hasVotesInRace = Boolean(
      matchedResult && (matchedResult.total > 0 || matchedResult.winnerId || (matchedResult.votes && Object.values(matchedResult.votes).some((v: any) => v > 0)))
    ) || isInsideActiveEds;

    const totalVotes = matchedResult?.total || 0;
    const votesMap = matchedResult?.votes || {};
    const voteValues = Object.values(votesMap) as number[];
    const sortedVoteVals = voteValues.slice().sort((a, b) => b - a);
    const top1 = sortedVoteVals[0] || 0;
    const top2 = sortedVoteVals[1] || 0;
    const isTie = totalVotes > 0 && top1 > 0 && top1 === top2;
    const isZeroVotes = boundaryLayer === 'eds' && hasVotesInRace && totalVotes === 0 && !isUncontestedActiveRace && !props.isUncontested;

    const isOutsideParentDistrict = Boolean(props.isOutsideParentDistrict);
    const isTargetParentCanvas = Boolean(props.isTargetParentCanvas);

    if (isOutsideParentDistrict) {
      renderFeature.properties.fillColor = '#475569';
      renderFeature.properties.fillOpacity = 0.45;
      renderFeature.properties.strokeWidth = 0.8;
      renderFeature.properties.strokeColor = '#475569';
      renderFeature.properties.strokeOpacity = 0.60;
      renderFeature.properties.isDimmed = true;
      renderFeature.properties.isZeroVotes = false;
      delete renderFeature.properties.districtResultJson;
      delete renderFeature.properties.totalVotes;
      delete renderFeature.properties.voteDiff;
    } else if (isTargetParentCanvas) {
      renderFeature.properties.fillColor = '#ffffff';
      renderFeature.properties.fillOpacity = 0.05;
      renderFeature.properties.strokeWidth = 2.2;
      renderFeature.properties.strokeColor = '#2563eb';
      renderFeature.properties.strokeOpacity = 0.90;
      renderFeature.properties.isDimmed = false;
      renderFeature.properties.isZeroVotes = false;
      delete renderFeature.properties.districtResultJson;
      delete renderFeature.properties.totalVotes;
      delete renderFeature.properties.voteDiff;
    } else if (hasVotesInRace && !isZeroVotes) {
      activeDistrictFeatures.push(renderFeature);
    }

    if (hasVotesInRace && matchedResult) {
      const candidatesList = (matchedResult && matchedResult.candidates && matchedResult.candidates.length > 0)
        ? matchedResult.candidates
        : (electionData?.candidates || []);

      let winnerId = matchedResult?.winnerId;
      if (isTie) {
        winnerId = 'tie';
      } else if (!winnerId && candidatesList.length > 0) {
        winnerId = candidatesList[0].id;
      }

      const winnerCand = candidatesList.find((c: any) => c.id === winnerId);
      const margin = isTie ? 0 : (matchedResult?.margin || 0);

      let fillColor = '#3b82f6';
      if (isTie) {
        fillColor = '#64748b';
      } else if (winnerCand) {
        fillColor = winnerCand.color;
      }

      let fillOpacity = isCrossLayerSubBoundary ? 0.40 : 0.60;
      if (isZeroVotes) {
        fillOpacity = 0;
      } else if (isUncontestedActiveRace || matchedResult?.isUncontested) {
        fillOpacity = 0.72;
      } else if (!isCrossLayerSubBoundary) {
        const clampedMargin = Math.min(Math.max(margin, 0), 50);
        const curveRatio = Math.sqrt(clampedMargin / 50.0);
        const minOpacity = 0.22;
        const maxOpacity = 0.72;
        fillOpacity = minOpacity + curveRatio * (maxOpacity - minOpacity);
      }

      const isEdLayer = boundaryLayer === 'eds';
      renderFeature.properties.strokeWidth = isEdLayer ? 0.55 : 1.3;
      renderFeature.properties.strokeColor = isEdLayer ? '#475569' : '#1e293b';
      renderFeature.properties.strokeOpacity = isEdLayer ? 0.50 : 0.80;

      const voteDiff = Math.max(0, top1 - top2);

      renderFeature.properties.fillColor = isZeroVotes ? '#00000000' : fillColor;
      renderFeature.properties.fillOpacity = fillOpacity;
      renderFeature.properties.totalVotes = totalVotes;
      renderFeature.properties.voteDiff = voteDiff;
      renderFeature.properties.isDimmed = false;
      renderFeature.properties.isTie = isTie;
      renderFeature.properties.isZeroVotes = isZeroVotes;
      renderFeature.properties.districtResultJson = JSON.stringify({
        votes: votesMap,
        total: totalVotes,
        winnerId: winnerId,
        margin: margin,
        isTie: isTie,
        isZeroVotes: isZeroVotes,
        candidates: candidatesList
      });
    } else if (isCrossLayerSubBoundary) {
      renderFeature.properties.fillColor = '#3b82f6';
      renderFeature.properties.fillOpacity = 0.25;
      renderFeature.properties.strokeWidth = 1.3;
      renderFeature.properties.strokeColor = '#1e293b';
      renderFeature.properties.strokeOpacity = 0.80;
      renderFeature.properties.isDimmed = false;
      renderFeature.properties.isZeroVotes = false;
    } else if (!isOutsideParentDistrict && !isTargetParentCanvas) {
      renderFeature.properties.fillColor = '#475569';
      renderFeature.properties.fillOpacity = 0.45;
      renderFeature.properties.strokeWidth = 0.8;
      renderFeature.properties.strokeColor = '#475569';
      renderFeature.properties.strokeOpacity = 0.60;
      renderFeature.properties.isDimmed = true;
      renderFeature.properties.isZeroVotes = false;
    }

    finalRenderFeatures.push(renderFeature);

    if (labelText && hasVotesInRace && !isOutsideParentDistrict && !isTargetParentCanvas) {
      const labelKey = `${boundaryLayer}_${districtKey}`;
      if (!districtLabelMap.has(labelText)) {
        districtLabelMap.set(labelText, { feature: renderFeature, labelKey });
      }
    }
  });

  return {
    finalRenderFeatures,
    activeDistrictFeatures,
    districtLabelMap
  };
}
