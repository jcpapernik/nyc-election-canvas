import React from 'react';
import maplibregl from 'maplibre-gl';
import { BoundaryLayerType, ElectionData } from '@/store/useElectionStore';
import { BOUNDARY_FILE_MAP } from './mapHelpers';
import { fetchJsonCached } from '@/lib/fetchCache';
import { processAndRenderBoundaryData } from './mapDataProcessor';

export function updateBoundaryDataOnMap(
  map: maplibregl.Map,
  boundaryLayer: BoundaryLayerType,
  electionData: ElectionData | null,
  drillDownParentDistrict: string | null,
  lastFittedRaceIdRef: React.MutableRefObject<string | null>,
  boundaryDatasetsRef: React.MutableRefObject<Record<string, GeoJSON.FeatureCollection>>,
  currentBoundaryGeoJsonRef: React.MutableRefObject<GeoJSON.FeatureCollection>,
  currentLabelGeoJsonRef: React.MutableRefObject<GeoJSON.FeatureCollection>
) {
  if (electionData && !boundaryDatasetsRef.current['eds'] && boundaryLayer !== 'eds' && BOUNDARY_FILE_MAP['eds']) {
    fetchJsonCached(BOUNDARY_FILE_MAP['eds'])
      .then(edsData => {
        boundaryDatasetsRef.current['eds'] = edsData;
        if (boundaryDatasetsRef.current[boundaryLayer]) {
          processAndRenderBoundaryData(
            map,
            boundaryLayer,
            electionData,
            drillDownParentDistrict,
            lastFittedRaceIdRef,
            boundaryDatasetsRef,
            boundaryDatasetsRef.current[boundaryLayer],
            currentBoundaryGeoJsonRef,
            currentLabelGeoJsonRef
          );
        }
      })
      .catch(() => {});
  }

  if (boundaryDatasetsRef.current[boundaryLayer]) {
    processAndRenderBoundaryData(
      map,
      boundaryLayer,
      electionData,
      drillDownParentDistrict,
      lastFittedRaceIdRef,
      boundaryDatasetsRef,
      boundaryDatasetsRef.current[boundaryLayer],
      currentBoundaryGeoJsonRef,
      currentLabelGeoJsonRef
    );
    return;
  }

  const fileUrl = BOUNDARY_FILE_MAP[boundaryLayer];

  fetchJsonCached(fileUrl)
    .then(data => {
      boundaryDatasetsRef.current[boundaryLayer] = data;
      processAndRenderBoundaryData(
        map,
        boundaryLayer,
        electionData,
        drillDownParentDistrict,
        lastFittedRaceIdRef,
        boundaryDatasetsRef,
        data,
        currentBoundaryGeoJsonRef,
        currentLabelGeoJsonRef
      );
    })
    .catch(() => {});
}
