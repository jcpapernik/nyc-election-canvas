import React from 'react';
import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';
import { useElectionStore, BoundaryLayerType } from '@/store/useElectionStore';
import { BOUNDARY_PROP_NAMES, getCanonicalBorough, normalizeDistrictKey, normalizeParty } from './mapHelpers';
import { createTooltipHtml } from './mapTooltip';

export function attachMapEventHandlers(
  map: maplibregl.Map,
  popupRef: React.MutableRefObject<maplibregl.Popup | null>,
  setDrillDownParent: (parent: string | null, path: string[]) => void,
  setActiveBoundaryLayer: (layer: BoundaryLayerType) => void,
  setPinnedDistrict: (pinned: any) => void,
  setSelectedElectionId: (id: string) => void,
  boundaryDatasetsRef: React.MutableRefObject<Record<string, GeoJSON.FeatureCollection>>,
  electionIndexRef: React.MutableRefObject<any[]>,
  lastFittedRaceIdRef: React.MutableRefObject<string | null>
) {
  let hoveredStateId: string | number | null = null;

  map.on('click', 'boundary-fill', (e) => {
    if (!e.features || e.features.length === 0) return;
    const feature = e.features[0];
    const props = feature.properties || {};

    const currentElection = useElectionStore.getState().electionData;
    const currentLayer = useElectionStore.getState().activeBoundaryLayer;

    if (props.isDimmed) {
      const macroBoro = getCanonicalBorough(props.name || props.borough || '');
      if (macroBoro) {
        setDrillDownParent(macroBoro, ['Full Map', macroBoro]);
        setPinnedDistrict({ districtId: macroBoro, districtName: macroBoro, layerType: currentLayer, result: null });
        try {
          const bbox = turf.bbox(feature as any);
          map.fitBounds(bbox as [number, number, number, number], { padding: { top: 100, bottom: 40, left: 320, right: 440 }, duration: 1500 });
        } catch (err) {}
        return;
      }

      let clickedDistrictKey = '';
      if (props.cong_dist || props.assembly_district || props.st_sen_dist || props.coundist) {
        clickedDistrictKey = String(props.cong_dist || props.assembly_district || props.st_sen_dist || props.coundist || '');
      }

      if (!clickedDistrictKey) {
        const clickPt = turf.point([e.lngLat.lng, e.lngLat.lat]);
        const raceType = currentElection?.districtType || 'congressional';
        const raceDataset = boundaryDatasetsRef.current[raceType];
        const racePropNames = BOUNDARY_PROP_NAMES[raceType];

        if (raceDataset) {
          for (const f of raceDataset.features || []) {
            try {
              if (turf.booleanPointInPolygon(clickPt, f as any)) {
                for (const pName of racePropNames) {
                  if (f.properties?.[pName] !== undefined) {
                    clickedDistrictKey = String(f.properties[pName]);
                    break;
                  }
                }
                if (clickedDistrictKey) break;
              }
            } catch (err) {}
          }
        }
      }

      if (clickedDistrictKey) {
        const raceType = currentElection?.districtType || 'congressional';
        const normClickedKey = normalizeDistrictKey(clickedDistrictKey);
        const paddedClickedKey = normClickedKey.padStart(2, '0');
        const normParty = normalizeParty(currentElection?.party);
        const currentCategory = currentElection?.officeCategory || 'US House (Congressional)';
        const indexList = electionIndexRef.current || [];

        let targetRaceId = '';

        if (indexList.length > 0) {
          const targetRace = indexList.find(r =>
            r.districtType === raceType &&
            normalizeParty(r.party) === normParty &&
            normalizeDistrictKey(r.districtKey) === normClickedKey &&
            r.officeCategory === currentCategory
          ) || indexList.find(r =>
            r.districtType === raceType &&
            normalizeParty(r.party) === normParty &&
            normalizeDistrictKey(r.districtKey) === normClickedKey &&
            !r.name.toLowerCase().includes('judicial') &&
            !r.name.toLowerCase().includes('judge') &&
            !r.name.toLowerCase().includes('delegate')
          ) || indexList.find(r =>
            r.districtType === raceType &&
            normalizeDistrictKey(r.districtKey) === normClickedKey
          );

          if (targetRace) targetRaceId = targetRace.id;
        }

        if (!targetRaceId) {
          if (raceType === 'congressional') {
            targetRaceId = `democratic_representative_in_congress_${paddedClickedKey}`;
          } else if (raceType === 'assembly') {
            targetRaceId = `democratic_member_of_the_assembly_${paddedClickedKey}`;
          } else if (raceType === 'senate') {
            targetRaceId = `democratic_state_senator_${paddedClickedKey}`;
          }
        }

        if (targetRaceId) {
          lastFittedRaceIdRef.current = null;
          setPinnedDistrict(null);
          setDrillDownParent(clickedDistrictKey, ['Full Map', `${raceType.toUpperCase()} ${clickedDistrictKey}`]);
          setSelectedElectionId(targetRaceId);
        }
      }
      return;
    }

    const currentElectionState = useElectionStore.getState().electionData;
    const isUncontestedRace = props.isUncontested || currentElectionState?.isUncontested;
    if (props.isZeroVotes && !isUncontestedRace) return;

    let districtName = '';
    const macroBoro = getCanonicalBorough(props.name || props.borough || '');

    if (currentLayer === 'boroughs') districtName = macroBoro;
    else if (currentLayer === 'council') districtName = String(props.coundist || props.council_district || '');
    else if (currentLayer === 'assembly') districtName = String(props.assembly_district || props.assem_dist || '');
    else if (currentLayer === 'senate') districtName = String(props.st_sen_dist || props.senate_district || '');
    else if (currentLayer === 'congressional') districtName = String(props.cong_dist || props.congressional_district || '');
    else if (currentLayer === 'eds') {
      if (props.elect_dist) {
        const rawEd = String(props.elect_dist || '');
        districtName = rawEd.length === 5 ? `${rawEd.slice(0, 2)}/${rawEd.slice(2)}` : rawEd;
      } else if (macroBoro) districtName = macroBoro;
    }

    try {
      const bbox = turf.bbox(feature as any);
      map.fitBounds(bbox as [number, number, number, number], { padding: { top: 100, bottom: 40, left: 320, right: 440 }, duration: 1500 });
    } catch (err) {}

    let districtResult = null;
    if (props.districtResultJson) {
      try { districtResult = JSON.parse(props.districtResultJson); } catch (err) {}
    }

    setPinnedDistrict({
      districtId: districtName,
      districtName: currentLayer === 'eds' && props.elect_dist ? `ED ${districtName}` : (macroBoro || `${currentLayer.toUpperCase()} ${districtName}`),
      layerType: currentLayer,
      result: districtResult
    });

    if (macroBoro) {
      setDrillDownParent(macroBoro, ['Full Map', macroBoro]);
    } else if (currentLayer !== 'eds' && districtName) {
      setDrillDownParent(districtName, ['Full Map', `${currentLayer.toUpperCase()} ${districtName}`]);
    }
  });

  map.on('dblclick', 'boundary-fill', (e) => {
    if (!e.features || e.features.length === 0) return;
    const feature = e.features[0];
    const props = feature.properties || {};
    const currentLayer = useElectionStore.getState().activeBoundaryLayer;

    let districtName = '';
    if (currentLayer === 'boroughs') districtName = props.name || props.borough || '';
    else if (currentLayer === 'council') districtName = String(props.coundist || props.council_district || '');
    else if (currentLayer === 'assembly') districtName = String(props.assembly_district || props.assem_dist || '');
    else if (currentLayer === 'senate') districtName = String(props.st_sen_dist || props.senate_district || '');
    else if (currentLayer === 'congressional') districtName = String(props.cong_dist || props.congressional_district || '');

    if (currentLayer === 'citywide') {
      e.originalEvent.stopPropagation();
      setDrillDownParent(null, ['Full Map', 'Citywide EDs']);
      setActiveBoundaryLayer('eds');
      try {
        const bounds: [number, number, number, number] = [-74.26, 40.49, -73.69, 40.91];
        map.fitBounds(bounds, { padding: { top: 90, bottom: 40, left: 320, right: 440 }, duration: 1200 });
      } catch (err) {}
    } else if (currentLayer === 'boroughs' && districtName) {
      e.originalEvent.stopPropagation();
      const canonicalBoro = getCanonicalBorough(districtName);
      setDrillDownParent(canonicalBoro, ['Full Map', canonicalBoro]);
      setActiveBoundaryLayer('eds');
      try {
        const bbox = turf.bbox(feature as any);
        map.fitBounds(bbox as [number, number, number, number], { padding: { top: 100, bottom: 40, left: 320, right: 440 }, duration: 1500 });
      } catch (err) {}
    } else if (currentLayer !== 'eds' && districtName) {
      e.originalEvent.stopPropagation();
      setDrillDownParent(districtName, ['Full Map', `${currentLayer.toUpperCase()} ${districtName}`]);
      setActiveBoundaryLayer('eds');
    }
  });

  map.on('mousemove', 'boundary-fill', (e) => {
    if (!e.features || e.features.length === 0) return;
    const feature = e.features[0];
    const props = feature.properties || {};
    const currentElectionState = useElectionStore.getState().electionData;
    const isUncontestedRace = props.isUncontested || currentElectionState?.isUncontested;

    if ((props.isZeroVotes && !isUncontestedRace) || props.fillOpacity === 0) {
      map.getCanvas().style.cursor = '';
      if (hoveredStateId !== null) {
        map.setFeatureState({ source: 'boundary-source', id: hoveredStateId }, { hover: false });
        hoveredStateId = null;
      }
      popupRef.current?.remove();
      return;
    }

    map.getCanvas().style.cursor = 'pointer';
    const currentLayer = useElectionStore.getState().activeBoundaryLayer;

    if (currentLayer === 'citywide') {
      [1, 2, 3, 4, 5].forEach(id => {
        map.setFeatureState({ source: 'boundary-source', id }, { hover: true });
      });
    } else {
      if (hoveredStateId !== null) {
        map.setFeatureState({ source: 'boundary-source', id: hoveredStateId }, { hover: false });
      }
      if (feature.id !== undefined) {
        hoveredStateId = feature.id;
        map.setFeatureState({ source: 'boundary-source', id: hoveredStateId }, { hover: true });
      }
    }

    const clickPt = turf.point([e.lngLat.lng, e.lngLat.lat]);
    const popupHtml = createTooltipHtml(props, currentLayer, clickPt, boundaryDatasetsRef.current);
    popupRef.current?.setLngLat(e.lngLat).setHTML(popupHtml).addTo(map);
  });

  map.on('mouseleave', 'boundary-fill', () => {
    map.getCanvas().style.cursor = '';
    const currentLayer = useElectionStore.getState().activeBoundaryLayer;
    if (currentLayer === 'citywide') {
      [1, 2, 3, 4, 5].forEach(id => {
        map.setFeatureState({ source: 'boundary-source', id }, { hover: false });
      });
    } else if (hoveredStateId !== null) {
      map.setFeatureState({ source: 'boundary-source', id: hoveredStateId }, { hover: false });
      hoveredStateId = null;
    }
    popupRef.current?.remove();
  });

  // Attach event handlers for NYT Proportional Lead Circles ('proportional-bubbles')
  map.on('mousemove', 'proportional-bubbles', (e) => {
    const mapViewMode = useElectionStore.getState().mapViewMode;
    if (mapViewMode === 'choropleth') return;
    if (!e.features || e.features.length === 0) return;

    const feature = e.features[0];
    const props = feature.properties || {};
    map.getCanvas().style.cursor = 'pointer';

    const currentLayer = useElectionStore.getState().activeBoundaryLayer;
    const clickPt = turf.point([e.lngLat.lng, e.lngLat.lat]);
    const popupHtml = createTooltipHtml(props, currentLayer, clickPt, boundaryDatasetsRef.current);
    popupRef.current?.setLngLat(e.lngLat).setHTML(popupHtml).addTo(map);
  });

  map.on('mouseleave', 'proportional-bubbles', () => {
    const mapViewMode = useElectionStore.getState().mapViewMode;
    if (mapViewMode === 'choropleth') return;
    map.getCanvas().style.cursor = '';
    popupRef.current?.remove();
  });

  map.on('click', 'proportional-bubbles', (e) => {
    const mapViewMode = useElectionStore.getState().mapViewMode;
    if (mapViewMode === 'choropleth') return;
    if (!e.features || e.features.length === 0) return;

    const feature = e.features[0];
    const props = feature.properties || {};
    const currentLayer = useElectionStore.getState().activeBoundaryLayer;

    let districtResult = null;
    if (props.districtResultJson) {
      try { districtResult = JSON.parse(props.districtResultJson); } catch (err) {}
    }

    const labelText = String(props.labelText || '');
    setPinnedDistrict({
      districtId: labelText,
      districtName: currentLayer === 'eds' ? `ED ${labelText}` : `${currentLayer.toUpperCase()} ${labelText}`,
      layerType: currentLayer,
      result: districtResult
    });
  });
}
