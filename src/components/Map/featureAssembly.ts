import * as turf from '@turf/turf';
import { BoundaryLayerType, ElectionData } from '@/store/useElectionStore';
import { BOUNDARY_PROP_NAMES, isEdInBorough, normalizeDistrictKey } from './mapHelpers';

export function assembleRenderFeatures(
  boundaryLayer: BoundaryLayerType,
  electionData: ElectionData | null,
  drillDownParentDistrict: string | null,
  boundaryDatasetsRef: React.MutableRefObject<Record<string, GeoJSON.FeatureCollection>>,
  data: GeoJSON.FeatureCollection,
  resultsMap: Record<string, any>
): {
  renderRawFeatures: GeoJSON.Feature[];
  targetMacroFeature: GeoJSON.Feature | null;
  parentPropNames: string[];
  activeEdKeysSet: Set<string>;
  insideEdsSet: Set<GeoJSON.Feature>;
  targetDistrictKey: string;
} {
  let renderRawFeatures: GeoJSON.Feature[] = data.features || [];
  const parentType = electionData?.districtType || 'congressional';
  const parentDataset = boundaryDatasetsRef.current[parentType];
  const parentPropNames = BOUNDARY_PROP_NAMES[parentType];
  const targetDistrictKey = drillDownParentDistrict || (electionData as any)?.districtKey || '';

  const targetMacroFeature = parentDataset ? (parentDataset.features || []).find((f: any) => {
    const props = f.properties || {};
    for (const pName of parentPropNames) {
      if (props[pName] !== undefined && normalizeDistrictKey(String(props[pName])) === normalizeDistrictKey(targetDistrictKey)) {
        return true;
      }
    }
    return false;
  }) : null;

  let activeEdKeysSet = new Set<string>();
  const insideEdsSet = new Set<GeoJSON.Feature>();

  const isCrossLayerSubBoundaryMode =
    boundaryLayer !== 'eds' &&
    boundaryLayer !== 'citywide' &&
    boundaryLayer !== parentType &&
    parentType !== 'boroughs' &&
    Boolean(targetMacroFeature);

  if (boundaryLayer === 'eds' && electionData && parentDataset) {
    if (electionData.edResults) {
      activeEdKeysSet = new Set(Object.keys(electionData.edResults));
    }

    const isCitywideRace = parentType === 'boroughs' || (electionData as any)?.officeCategory === 'Citywide / Statewide';
    const insideEds: GeoJSON.Feature[] = [];
    const outsideMacroDistricts: GeoJSON.Feature[] = [];
    const targetBbox = targetMacroFeature ? turf.bbox(targetMacroFeature as any) : null;
    const hasSpecificBoroughFilter = Boolean(drillDownParentDistrict);

    (data.features || []).forEach(edFeature => {
      const props = edFeature.properties || {};
      const rawEd = String(props.elect_dist || '');
      const formattedEd = rawEd.length === 5 ? `${rawEd.slice(0, 2)}/${rawEd.slice(2)}` : rawEd;

      let isBelongingToActiveRace = false;

      if (hasSpecificBoroughFilter) {
        isBelongingToActiveRace = isEdInBorough(rawEd, drillDownParentDistrict!);
      } else if (isCitywideRace) {
        isBelongingToActiveRace = true;
      } else {
        isBelongingToActiveRace = activeEdKeysSet.has(rawEd) || activeEdKeysSet.has(formattedEd);
      }

      const rawEdAd = rawEd.length === 5 ? rawEd.slice(0, 2) : '';
      if (!hasSpecificBoroughFilter && parentType === 'assembly' && rawEdAd && (rawEdAd === targetDistrictKey || rawEdAd === targetDistrictKey.padStart(2, '0'))) {
        isBelongingToActiveRace = true;
      }

      if (!isBelongingToActiveRace && targetBbox && targetMacroFeature) {
        try {
          const pt = turf.pointOnFeature(edFeature as any);
          const [lng, lat] = pt.geometry.coordinates;
          if (lng >= targetBbox[0] && lng <= targetBbox[2] && lat >= targetBbox[1] && lat <= targetBbox[3]) {
            if (turf.booleanPointInPolygon(pt, targetMacroFeature as any)) {
              isBelongingToActiveRace = true;
            }
          }
        } catch (e) {}
      }

      if (isBelongingToActiveRace) {
        insideEds.push(edFeature);
      }
    });

    if (!isCitywideRace || hasSpecificBoroughFilter) {
      (parentDataset.features || []).forEach(macroFeature => {
        const props = macroFeature.properties || {};
        let isTargetParent = false;

        for (const pName of parentPropNames) {
          if (props[pName] !== undefined && normalizeDistrictKey(String(props[pName])) === normalizeDistrictKey(targetDistrictKey)) {
            isTargetParent = true;
            break;
          }
        }

        if (!isTargetParent) {
          outsideMacroDistricts.push({
            ...macroFeature,
            properties: {
              ...props,
              isOutsideParentDistrict: true
            }
          });
        }
      });
    }

    insideEds.forEach(f => insideEdsSet.add(f));
    renderRawFeatures = [...insideEds, ...outsideMacroDistricts];
  } else if (isCrossLayerSubBoundaryMode && parentDataset && targetMacroFeature) {
    const propNames = BOUNDARY_PROP_NAMES[boundaryLayer];
    const insideSubDistricts: GeoJSON.Feature[] = [];
    const outsideMacroDistricts: GeoJSON.Feature[] = [];

    (data.features || []).forEach((subFeat: any) => {
      const props = subFeat.properties || {};
      let subKey = '';
      for (const pName of propNames) {
        if (props[pName] !== undefined && props[pName] !== null) {
          subKey = String(props[pName]);
          break;
        }
      }
      const normSubKey = normalizeDistrictKey(subKey);

      try {
        const clipped = turf.intersect(turf.featureCollection([subFeat, targetMacroFeature as any]));
        if (clipped && clipped.geometry) {
          insideSubDistricts.push({
            ...subFeat,
            geometry: clipped.geometry,
            properties: {
              ...props,
              subDistrictKey: subKey,
              normSubDistrictKey: normSubKey
            }
          });
        }
      } catch (e) {}
    });

    (parentDataset.features || []).forEach(macroFeature => {
      const props = macroFeature.properties || {};
      let isTargetParent = false;

      for (const pName of parentPropNames) {
        if (props[pName] !== undefined && normalizeDistrictKey(String(props[pName])) === normalizeDistrictKey(targetDistrictKey)) {
          isTargetParent = true;
          break;
        }
      }

      if (isTargetParent) {
        outsideMacroDistricts.push({
          ...macroFeature,
          properties: {
            ...props,
            isOutsideParentDistrict: false,
            isTargetParentCanvas: true
          }
        });
      } else {
        outsideMacroDistricts.push({
          ...macroFeature,
          properties: {
            ...props,
            isOutsideParentDistrict: true,
            isTargetParentCanvas: false
          }
        });
      }
    });

    renderRawFeatures = [...outsideMacroDistricts, ...insideSubDistricts];
  }

  return {
    renderRawFeatures,
    targetMacroFeature: targetMacroFeature || null,
    parentPropNames,
    activeEdKeysSet,
    insideEdsSet,
    targetDistrictKey
  };
}
