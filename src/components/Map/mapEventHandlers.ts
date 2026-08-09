import React from 'react';
import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';
import { useElectionStore, BoundaryLayerType } from '@/store/useElectionStore';
import { BOUNDARY_PROP_NAMES, getCanonicalBorough, normalizeDistrictKey, normalizeParty } from './mapHelpers';
import { createTooltipHtml } from './mapTooltip';
import { attachBubbleEventHandlers } from './mapBubbleHandlers';
import { aggregateSingleFeatureVotes } from '@/lib/spatialAggregation';

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

    let districtName = '';
    const macroBoro = getCanonicalBorough(props.name || props.borough || '');

    if (currentLayer === 'boroughs') districtName = macroBoro;
    else if (currentLayer === 'council') districtName = String(props.coundist || props.council_district || props.districtId || '');
    else if (currentLayer === 'assembly') districtName = String(props.assembly_district || props.assem_dist || props.districtId || '');
    else if (currentLayer === 'senate') districtName = String(props.st_sen_dist || props.senate_district || props.districtId || '');
    else if (currentLayer === 'congressional') districtName = String(props.cong_dist || props.congressional_district || props.districtId || '');
    else if (currentLayer === 'eds') {
      if (props.elect_dist) {
        const rawEd = String(props.elect_dist || '');
        districtName = rawEd.length === 5 ? `${rawEd.slice(0, 2)}/${rawEd.slice(2)}` : rawEd;
      } else if (macroBoro) districtName = macroBoro;
    }

    if (districtName && currentLayer !== 'eds' && currentLayer !== 'boroughs') {
      const normKey = normalizeDistrictKey(districtName);
      const paddedKey = normKey.padStart(2, '0');
      const normParty = normalizeParty(currentElection?.party);
      const categorySlugMap: Record<string, string> = {
        'congressional': 'representative_in_congress',
        'senate': 'state_senator',
        'assembly': 'member_of_the_assembly',
        'council': 'member_of_the_city_council'
      };
      const slug = categorySlugMap[currentLayer] || currentLayer;
      const candidateId1 = `${normParty}_${slug}_${paddedKey}`;
      const candidateId2 = `${normParty}_${slug}_${normKey}`;

      const indexList = electionIndexRef.current || [];
      const match = indexList.find(r => r.id === candidateId1 || r.id === candidateId2);

      if (match) {
        lastFittedRaceIdRef.current = null;
        setSelectedElectionId(match.id);
      }
    }

    try {
      const bbox = turf.bbox(feature as any);
      map.fitBounds(bbox as [number, number, number, number], { padding: { top: 100, bottom: 40, left: 320, right: 440 }, duration: 1500 });
    } catch (err) {}

    let districtResult = null;
    if (props.districtResultJson) {
      try { districtResult = JSON.parse(props.districtResultJson); } catch (err) {}
    }

    if (!districtResult && currentElection) {
      districtResult = aggregateSingleFeatureVotes(
        feature,
        currentElection,
        boundaryDatasetsRef.current['eds']
      );
    }

    setPinnedDistrict({
      districtId: districtName,
      districtName: currentLayer === 'eds' && props.elect_dist ? `ED ${districtName}` : `${currentLayer.toUpperCase()} ${districtName}`,
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
