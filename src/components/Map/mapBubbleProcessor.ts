import { BoundaryLayerType } from '@/store/useElectionStore';

export function computeProportionalBubbleRadius(
  voteDiff: number,
  maxVoteDiffInRace: number,
  boundaryLayer: BoundaryLayerType
): number {
  if (voteDiff <= 0 || maxVoteDiffInRace <= 0) return 0;

  const isEdLayer = boundaryLayer === 'eds';
  const minRadius = isEdLayer ? 2.5 : 5.0;
  const maxRadius = isEdLayer ? 14.0 : 30.0;

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

  // 1. Pass 1: Find maximum net vote difference across active non-tied districts
  districtLabelMap.forEach(({ feature }) => {
    const props = feature.properties || {};
    const isTie = Boolean(props.isTie);
    const voteDiff = (!isTie && props.voteDiff !== undefined) ? Number(props.voteDiff) : 0;
    if (voteDiff > maxVoteDiffInRace) {
      maxVoteDiffInRace = voteDiff;
    }
  });

  if (maxVoteDiffInRace <= 0) maxVoteDiffInRace = 1;

  const bubbleFeatures: GeoJSON.Feature[] = [];

  // 2. Pass 2: Build circle features with square-root proportional radius values
  districtLabelMap.forEach(({ feature, labelKey }, labelText) => {
    const props = feature.properties || {};
    const isTie = Boolean(props.isTie);

    // NYT Standard: When tied, neither candidate has a vote lead, so no lead bubble is rendered.
    if (isTie) return;

    const voteDiff = props.voteDiff !== undefined ? Number(props.voteDiff) : 0;
    if (voteDiff <= 0) return;

    const centerPt = getPoleOfInaccessibilityFast(feature, labelKey);
    if (!centerPt) return;

    const bubbleRadius = computeProportionalBubbleRadius(voteDiff, maxVoteDiffInRace, boundaryLayer);
    if (bubbleRadius <= 0) return;

    const fillColor = props.fillColor || '#3b82f6';

    bubbleFeatures.push({
      id: bubbleFeatures.length + 1,
      type: 'Feature',
      properties: {
        labelText,
        districtId: props.districtId || labelText,
        voteDiff,
        bubbleRadius,
        fillColor,
        isTie: false,
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
