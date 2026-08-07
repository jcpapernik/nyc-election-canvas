import React from 'react';
import maplibregl from 'maplibre-gl';
import { BoundaryLayerType } from '@/store/useElectionStore';
import { initMapSourcesAndLayers } from './mapLayerDefinitions';
import { attachMapEventHandlers } from './mapEventHandlers';

export function setupMapLayers(
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
  initMapSourcesAndLayers(map);
  attachMapEventHandlers(
    map,
    popupRef,
    setDrillDownParent,
    setActiveBoundaryLayer,
    setPinnedDistrict,
    setSelectedElectionId,
    boundaryDatasetsRef,
    electionIndexRef,
    lastFittedRaceIdRef
  );
}
