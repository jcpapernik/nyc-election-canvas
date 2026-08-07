'use client';

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useElectionStore } from '@/store/useElectionStore';
import { lookupAllDistrictsAtPoint } from '@/lib/districtLookup';
import { BASEMAP_STYLE_LIGHT, BOUNDARY_FILE_MAP } from './mapHelpers';
import { setupMapLayers } from './mapLayersSetup';
import { updateBoundaryDataOnMap } from './mapDataProcessor';

export interface ElectionMapRefHandle {
  flyToLocation: (loc: { lng: number; lat: number; label: string }) => void;
  resetView: () => void;
}

export const ElectionMap = React.forwardRef<ElectionMapRefHandle, { innerRef?: any }>((props, ref) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const boundaryDatasetsRef = useRef<Record<string, GeoJSON.FeatureCollection>>({});
  const electionIndexRef = useRef<any[]>([]);
  const lastFittedRaceIdRef = useRef<string | null>(null);

  const currentBoundaryGeoJsonRef = useRef<GeoJSON.FeatureCollection>({ type: 'FeatureCollection', features: [] });
  const currentLabelGeoJsonRef = useRef<GeoJSON.FeatureCollection>({ type: 'FeatureCollection', features: [] });

  const activeBoundaryLayer = useElectionStore(s => s.activeBoundaryLayer);
  const selectedElectionId = useElectionStore(s => s.selectedElectionId);
  const electionData = useElectionStore(s => s.electionData);
  const selectedLocation = useElectionStore(s => s.selectedLocation);
  const drillDownParentDistrict = useElectionStore(s => s.drillDownParentDistrict);

  const setSelectedLocation = useElectionStore(s => s.setSelectedLocation);
  const setActiveBoundaryLayer = useElectionStore(s => s.setActiveBoundaryLayer);
  const setDrillDownParent = useElectionStore(s => s.setDrillDownParent);
  const setPinnedDistrict = useElectionStore(s => s.setPinnedDistrict);
  const setSelectedElectionId = useElectionStore(s => s.setSelectedElectionId);

  React.useImperativeHandle(props.innerRef || ref, () => ({
    flyToLocation: (loc: { lng: number; lat: number; label: string }) => {
      const map = mapRef.current;
      if (!map) return;

      map.flyTo({
        center: [loc.lng, loc.lat],
        zoom: 14.5,
        pitch: 0,
        bearing: 0,
        duration: 1600
      });

      if (markerRef.current) markerRef.current.remove();
      markerRef.current = new maplibregl.Marker({ color: '#2563eb' })
        .setLngLat([loc.lng, loc.lat])
        .addTo(map);

      const summary = lookupAllDistrictsAtPoint(loc.lng, loc.lat, boundaryDatasetsRef.current);
      setSelectedLocation(loc, summary);
    },
    resetView: () => {
      const map = mapRef.current;
      if (!map) return;
      map.flyTo({
        center: [-73.98, 40.75],
        zoom: 11,
        pitch: 0,
        bearing: 0,
        duration: 1500
      });
    }
  }));

  useEffect(() => {
    Object.entries(BOUNDARY_FILE_MAP).forEach(([key, url]) => {
      fetch(url)
        .then(res => res.json())
        .then(data => { boundaryDatasetsRef.current[key] = data; })
        .catch(() => {});
    });

    fetch('/data/elections/index.json')
      .then(res => res.json())
      .then(data => { electionIndexRef.current = data; })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASEMAP_STYLE_LIGHT,
      center: [-73.98, 40.75],
      zoom: 11,
      pitch: 0,
      bearing: 0,
      maxBounds: [[-74.40, 40.40], [-73.50, 41.00]],
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');

    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12
    });

    map.on('load', () => {
      mapRef.current = map;
      if (typeof window !== 'undefined') {
        (window as any)._map = map;
        (window as any)._boundaryDatasets = boundaryDatasetsRef.current;
        (window as any)._getCurrentGeoJson = () => currentBoundaryGeoJsonRef.current;
      }
      setupMapLayers(
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
      updateBoundaryDataOnMap(
        map,
        activeBoundaryLayer,
        electionData,
        drillDownParentDistrict,
        lastFittedRaceIdRef,
        boundaryDatasetsRef,
        currentBoundaryGeoJsonRef,
        currentLabelGeoJsonRef
      );
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!selectedLocation && markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [selectedLocation]);

  useEffect(() => {
    lastFittedRaceIdRef.current = null;
  }, [selectedElectionId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource('boundary-source')) return;

    updateBoundaryDataOnMap(
      map,
      activeBoundaryLayer,
      electionData,
      drillDownParentDistrict,
      lastFittedRaceIdRef,
      boundaryDatasetsRef,
      currentBoundaryGeoJsonRef,
      currentLabelGeoJsonRef
    );
  }, [activeBoundaryLayer, electionData, drillDownParentDistrict, selectedElectionId]);

  return (
    <div className="relative w-full h-full">
      <style jsx global>{`
        .maplibregl-control-container .maplibregl-ctrl-top-left {
          top: 95px !important;
          left: 20px !important;
        }
        .maplibregl-popup-content {
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
        }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
});

ElectionMap.displayName = 'ElectionMap';
