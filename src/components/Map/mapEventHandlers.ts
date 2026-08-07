import React from 'react';
import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';
import { useElectionStore, BoundaryLayerType } from '@/store/useElectionStore';
import { BOUNDARY_PROP_NAMES, getCanonicalBorough, normalizeDistrictKey, normalizeParty } from './mapHelpers';
import { createTooltipHtml } from './mapTooltip';
import { attachBubbleEventHandlers } from './mapBubbleHandlers';

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
    const mapViewMode = useElectionStore.getState().mapViewMode;
    if (mapViewMode === 'bubbles') return;
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
            r.officeCategory === currentCategory &&
            normalizeParty(r.party) === normParty &&
            (normalizeDistrictKey(r.districtKey) === normClickedKey || r.districtKey === paddedClickedKey)
          );
          if (targetRace) targetRaceId = targetRace.id;
        }

        if (!targetRaceId) {
          const partyPrefix = normParty.toLowerCase();
          const categorySlugMap: Record<string, string> = {
            'US House (Congressional)': 'representative_in_congress',
            'NY State Senate': 'state_senator',
            'NY State Assembly': 'member_of_the_assembly',
            'NYC City Council': 'member_of_the_city_council',
            'NY State Committee': 'state_committee'
          };
          const slug = categorySlugMap[currentCategory] || raceType;
          targetRaceId = `${partyPrefix}_${slug}_${paddedClickedKey}`;
        }

        if (targetRaceId) {
          lastFittedRaceIdRef.current = null;
          setSelectedElectionId(targetRaceId);
          return;
        }
      }
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
    const mapViewMode = useElectionStore.getState().mapViewMode;
    if (mapViewMode === 'bubbles') return;
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
    const mapViewMode = useElectionStore.getState().mapViewMode;
    if (mapViewMode === 'bubbles') return;

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

  // Attach bubble event handlers
  attachBubbleEventHandlers(map, popupRef, setPinnedDistrict, boundaryDatasetsRef);
}
