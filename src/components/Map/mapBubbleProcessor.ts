import { BoundaryLayerType } from '@/store/useElectionStore';

export function computeProportionalBubbleRadius(
  voteDiff: number,
  maxVoteDiffInRace: number,
  boundaryLayer: BoundaryLayerType
): number {
  if (voteDiff <= 0 || maxVoteDiffInRace <= 0) return 0;

  const isEdLayer = boundaryLayer === 'eds';
  const minRadius = isEdLayer ? 4.0 : 8.0;
  const maxRadius = isEdLayer ? 24.0 : 54.0;

  // New York Times Square-root area proportionality formula: r = r_min + (r_max - r_min) * sqrt(diff / max_diff)
  const ratio = Math.sqrt(Math.min(Math.max(voteDiff / maxVoteDiffInRace, 0), 1.0));
  return Number((minRadius + ratio * (maxRadius - minRadius)).toFixed(2));
}

export function generateBubbleFeatures(
  districtLabelMap: Map<string, { feature: GeoJSON.Feature; labelKey: string }>,
  boundaryLayer: BoundaryLayerType,
  getPoleOfInaccessibilityFast: (feature: GeoJSON.Feature, labelKey: string) => [number, number] | null
): GeoJSON.Feature[] {
  let maxVoteDiffInRace = 0;

  // 1. Pass 1: Find maximum net vote difference (winner - runner_up) across active districts
  districtLabelMap.forEach(({ feature }) => {
    const json = feature.properties?.districtResultJson;
    if (json) {
      try {
        const res = JSON.parse(json);
        const votesMap = res.votes || {};
        const voteVals = Object.values(votesMap) as number[];
        const sorted = voteVals.slice().sort((a, b) => b - a);
        const top1 = sorted[0] || 0;
        const top2 = sorted[1] || 0;
        const voteDiff = Math.max(0, top1 - top2);
        if (voteDiff > maxVoteDiffInRace) {
          maxVoteDiffInRace = voteDiff;
        }
      } catch (e) {}
    }
  });

  if (maxVoteDiffInRace <= 0) maxVoteDiffInRace = 1;

  const bubbleFeatures: GeoJSON.Feature[] = [];

  // 2. Pass 2: Build circle features with square-root proportional radius values
  districtLabelMap.forEach(({ feature, labelKey }, labelText) => {
    const json = feature.properties?.districtResultJson;
    if (!json) return;

    try {
      const res = JSON.parse(json);
      const votesMap = res.votes || {};
      const voteVals = Object.values(votesMap) as number[];
      const sorted = voteVals.slice().sort((a, b) => b - a);
      const top1 = sorted[0] || 0;
      const top2 = sorted[1] || 0;
      const voteDiff = Math.max(0, top1 - top2);

      const centerPt = getPoleOfInaccessibilityFast(feature, labelKey);
      if (!centerPt) return;

      const bubbleRadius = computeProportionalBubbleRadius(voteDiff, maxVoteDiffInRace, boundaryLayer);
      const fillColor = feature.properties?.fillColor || '#3b82f6';
      const isTie = feature.properties?.isTie || false;

      bubbleFeatures.push({
        type: 'Feature',
        properties: {
          labelText,
          voteDiff,
          bubbleRadius: isTie ? 6.0 : bubbleRadius,
          fillColor,
          isTie,
          districtResultJson: json
        },
        geometry: {
          type: 'Point',
          coordinates: centerPt
        }
      });
    } catch (e) {}
  });

  return bubbleFeatures;
}
