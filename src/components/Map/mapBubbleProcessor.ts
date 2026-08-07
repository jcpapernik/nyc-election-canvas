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

  // 1. Pass 1: Find maximum net vote difference across active districts
  districtLabelMap.forEach(({ feature }) => {
    const props = feature.properties || {};
    const voteDiff = props.voteDiff !== undefined ? Number(props.voteDiff) : 0;
    if (voteDiff > maxVoteDiffInRace) {
      maxVoteDiffInRace = voteDiff;
    }
  });

  if (maxVoteDiffInRace <= 0) maxVoteDiffInRace = 1;

  const bubbleFeatures: GeoJSON.Feature[] = [];

  // 2. Pass 2: Build circle features with square-root proportional radius values
  districtLabelMap.forEach(({ feature, labelKey }, labelText) => {
    const props = feature.properties || {};
    const voteDiff = props.voteDiff !== undefined ? Number(props.voteDiff) : 0;

    const centerPt = getPoleOfInaccessibilityFast(feature, labelKey);
    if (!centerPt) return;

    const bubbleRadius = computeProportionalBubbleRadius(voteDiff, maxVoteDiffInRace, boundaryLayer);
    const fillColor = props.fillColor || '#3b82f6';
    const isTie = Boolean(props.isTie);

    bubbleFeatures.push({
      id: bubbleFeatures.length + 1,
      type: 'Feature',
      properties: {
        labelText,
        districtId: props.districtId || labelText,
        voteDiff,
        bubbleRadius: isTie ? 6.0 : bubbleRadius,
        fillColor,
        isTie,
        ...props
      },
      geometry: {
        type: 'Point',
        coordinates: centerPt
      }
    });
  });

  return bubbleFeatures;
}
