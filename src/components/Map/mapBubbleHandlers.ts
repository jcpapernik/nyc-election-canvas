import React from 'react';
import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';
import { useElectionStore } from '@/store/useElectionStore';
import { createTooltipHtml } from './mapTooltip';

export function attachBubbleEventHandlers(
  map: maplibregl.Map,
  popupRef: React.MutableRefObject<maplibregl.Popup | null>,
  setPinnedDistrict: (pinned: any) => void,
  boundaryDatasetsRef: React.MutableRefObject<Record<string, GeoJSON.FeatureCollection>>
) {
  let hoveredBubbleId: string | number | null = null;

  map.on('mousemove', 'proportional-bubbles', (e) => {
    const mapViewMode = useElectionStore.getState().mapViewMode;
    if (mapViewMode === 'choropleth') return;
    if (!e.features || e.features.length === 0) return;

    const feature = e.features[0];
    const props = feature.properties || {};
    map.getCanvas().style.cursor = 'pointer';

    if (hoveredBubbleId !== null) {
      map.setFeatureState({ source: 'centroid-label-source', id: hoveredBubbleId }, { hover: false });
    }
    if (feature.id !== undefined) {
      hoveredBubbleId = feature.id;
      map.setFeatureState({ source: 'centroid-label-source', id: hoveredBubbleId }, { hover: true });
    }

    const currentLayer = useElectionStore.getState().activeBoundaryLayer;
    const clickPt = turf.point([e.lngLat.lng, e.lngLat.lat]);
    const popupHtml = createTooltipHtml(props, currentLayer, clickPt, boundaryDatasetsRef.current);
    popupRef.current?.setLngLat(e.lngLat).setHTML(popupHtml).addTo(map);
  });

  map.on('mouseleave', 'proportional-bubbles', () => {
    const mapViewMode = useElectionStore.getState().mapViewMode;
    if (mapViewMode === 'choropleth') return;
    map.getCanvas().style.cursor = '';
    if (hoveredBubbleId !== null) {
      map.setFeatureState({ source: 'centroid-label-source', id: hoveredBubbleId }, { hover: false });
      hoveredBubbleId = null;
    }
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
