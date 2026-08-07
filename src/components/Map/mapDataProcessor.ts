import React from 'react';
import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';
import { BoundaryLayerType, ElectionData } from '@/store/useElectionStore';
import { aggregateEdResultsFast } from '@/lib/spatialAggregation';
import {
  BOUNDARY_FILE_MAP,
  BOUNDARY_PROP_NAMES,
  normalizeDistrictKey,
  getPoleOfInaccessibilityFast
} from './mapHelpers';
import { assembleRenderFeatures } from './featureAssembly';
import { paintRenderFeatures } from './featurePainter';
import { generateBubbleFeatures } from './mapBubbleProcessor';
import { useElectionStore } from '@/store/useElectionStore';

export function processAndRenderBoundaryData(
  map: maplibregl.Map,
  boundaryLayer: BoundaryLayerType,
  electionData: ElectionData | null,
  drillDownParentDistrict: string | null,
  lastFittedRaceIdRef: React.MutableRefObject<string | null>,
  boundaryDatasetsRef: React.MutableRefObject<Record<string, GeoJSON.FeatureCollection>>,
  data: GeoJSON.FeatureCollection,
  currentBoundaryGeoJsonRef: React.MutableRefObject<GeoJSON.FeatureCollection>,
  currentLabelGeoJsonRef: React.MutableRefObject<GeoJSON.FeatureCollection>
) {
  const propNames = BOUNDARY_PROP_NAMES[boundaryLayer];
  let resultsMap: Record<string, any> = {};

  if (electionData) {
    if (boundaryLayer === 'citywide') {
      let totalCitywideVotes = 0;
      const candCitywideVotes: Record<string, number> = {};
      (electionData.candidates || []).forEach(c => { candCitywideVotes[c.id] = 0; });

      if (electionData.results) {
        Object.values(electionData.results).forEach(res => {
          totalCitywideVotes += res.total || 0;
          (electionData.candidates || []).forEach(c => {
            candCitywideVotes[c.id] = (candCitywideVotes[c.id] || 0) + (res.votes?.[c.id] || 0);
          });
        });
      } else if (electionData.edResults) {
        Object.values(electionData.edResults).forEach(res => {
          totalCitywideVotes += res.total || 0;
          (electionData.candidates || []).forEach(c => {
            candCitywideVotes[c.id] = (candCitywideVotes[c.id] || 0) + (res.votes?.[c.id] || 0);
          });
        });
      }

      let winnerId = '';
      let maxVotes = -1;
      let secondVotes = -1;
      Object.entries(candCitywideVotes).forEach(([cId, v]) => {
        if (v > maxVotes) {
          secondVotes = maxVotes;
          maxVotes = v;
          winnerId = cId;
        } else if (v > secondVotes) {
          secondVotes = v;
        }
      });

      const margin = totalCitywideVotes > 0 ? ((maxVotes - Math.max(secondVotes, 0)) / totalCitywideVotes) * 100 : 0;
      const citywideRes = {
        votes: candCitywideVotes,
        total: totalCitywideVotes,
        winnerId,
        margin,
        isUncontested: electionData.isUncontested,
        candidates: electionData.candidates
      };

      resultsMap = {
        'New York': citywideRes,
        'Bronx': citywideRes,
        'Kings': citywideRes,
        'Queens': citywideRes,
        'Richmond': citywideRes,
        'Staten Island': citywideRes,
        'Brooklyn': citywideRes,
        'Manhattan': citywideRes
      };
    } else if (boundaryLayer === 'eds' && electionData.edResults) {
      resultsMap = electionData.edResults;
    } else if (boundaryLayer === electionData.districtType) {
      resultsMap = electionData.results || {};

      const distKey = (electionData as any).districtKey || '';
      const normDKey = normalizeDistrictKey(distKey);
      const paddedDKey = distKey.length === 1 ? `0${distKey}` : distKey;

      if (distKey && !resultsMap[distKey] && !resultsMap[normDKey] && !resultsMap[paddedDKey]) {
        let winnerId = '';
        let maxVotes = -1;
        let secondVotes = -1;
        let totalVotes = 0;
        const candVotes: Record<string, number> = {};

        (electionData.candidates || []).forEach(c => { candVotes[c.id] = 0; });

        if (electionData.edResults) {
          Object.values(electionData.edResults).forEach(res => {
            totalVotes += res.total;
            (electionData.candidates || []).forEach(c => {
              candVotes[c.id] = (candVotes[c.id] || 0) + (res.votes[c.id] || 0);
            });
          });
        }

        Object.entries(candVotes).forEach(([cId, v]) => {
          if (v > maxVotes) {
            secondVotes = maxVotes;
            maxVotes = v;
            winnerId = cId;
          } else if (v > secondVotes) {
            secondVotes = v;
          }
        });

        const margin = totalVotes > 0 ? ((maxVotes - (secondVotes > -1 ? secondVotes : 0)) / totalVotes) * 100 : 0;
        const synthRes = { votes: candVotes, total: totalVotes, winnerId, margin };

        resultsMap[distKey] = synthRes;
        resultsMap[normDKey] = synthRes;
        resultsMap[paddedDKey] = synthRes;
      }
    } else if (electionData.edResults && boundaryDatasetsRef.current['eds']) {
      resultsMap = aggregateEdResultsFast(
        data,
        boundaryDatasetsRef.current['eds'],
        electionData,
        propNames,
        boundaryLayer
      );
    } else {
      resultsMap = electionData.results || {};
    }
  }

  const {
    renderRawFeatures,
    targetMacroFeature,
    parentPropNames,
    activeEdKeysSet,
    insideEdsSet,
    targetDistrictKey
  } = assembleRenderFeatures(
    boundaryLayer,
    electionData,
    drillDownParentDistrict,
    boundaryDatasetsRef,
    data,
    resultsMap
  );

  const {
    finalRenderFeatures,
    activeDistrictFeatures,
    districtLabelMap
  } = paintRenderFeatures(
    renderRawFeatures,
    boundaryLayer,
    electionData,
    resultsMap,
    parentPropNames,
    targetMacroFeature,
    activeEdKeysSet,
    insideEdsSet
  );

  const activeRaceKey = `${electionData?.id || 'loading'}_${boundaryLayer}_${targetDistrictKey}`;
  const featuresToFit = activeDistrictFeatures.length > 0 ? activeDistrictFeatures : finalRenderFeatures;

  if (lastFittedRaceIdRef.current !== activeRaceKey && featuresToFit.length > 0) {
    lastFittedRaceIdRef.current = activeRaceKey;
    try {
      const featureCollection = { type: 'FeatureCollection', features: featuresToFit };
      const bbox = turf.bbox(featureCollection as any);
      map.fitBounds(bbox as [number, number, number, number], {
        padding: { top: 100, bottom: 40, left: 320, right: 440 },
        duration: 1600
      });
    } catch (err) {}
  }

  const labelFeatures = generateBubbleFeatures(
    districtLabelMap,
    boundaryLayer,
    getPoleOfInaccessibilityFast
  );

  const mapViewMode = useElectionStore.getState().mapViewMode;

  // Sync layer opacities based on mapViewMode ('choropleth' | 'bubbles' | 'hybrid')
  if (map.getLayer('boundary-fill')) {
    if (mapViewMode === 'bubbles') {
      map.setPaintProperty('boundary-fill', 'fill-opacity', 0.04);
    } else if (mapViewMode === 'hybrid') {
      map.setPaintProperty('boundary-fill', 'fill-opacity', [
        'case',
        ['boolean', ['feature-state', 'hover'], false], 0.85,
        ['has', 'fillOpacity'], ['*', ['get', 'fillOpacity'], 0.45],
        0.30
      ]);
    } else {
      map.setPaintProperty('boundary-fill', 'fill-opacity', [
        'case',
        ['boolean', ['feature-state', 'hover'], false], 0.95,
        ['has', 'fillOpacity'], ['get', 'fillOpacity'],
        0.88
      ]);
    }
  }

  if (map.getLayer('proportional-bubbles')) {
    if (mapViewMode === 'choropleth') {
      map.setPaintProperty('proportional-bubbles', 'circle-opacity', 0);
      map.setPaintProperty('proportional-bubbles', 'circle-stroke-opacity', 0);
    } else {
      map.setPaintProperty('proportional-bubbles', 'circle-opacity', 0.65);
      map.setPaintProperty('proportional-bubbles', 'circle-stroke-opacity', 0.90);
    }
  }

  currentBoundaryGeoJsonRef.current = {
    type: 'FeatureCollection',
    features: finalRenderFeatures
  };

  currentLabelGeoJsonRef.current = {
    type: 'FeatureCollection',
    features: labelFeatures
  };

  const boundarySource = map.getSource('boundary-source') as maplibregl.GeoJSONSource;
  if (boundarySource) {
    boundarySource.setData(currentBoundaryGeoJsonRef.current);
  }

  const labelSource = map.getSource('centroid-label-source') as maplibregl.GeoJSONSource;
  if (labelSource) {
    labelSource.setData(currentLabelGeoJsonRef.current);
  }
}

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

  fetch(fileUrl)
    .then(res => res.json())
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
