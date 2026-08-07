import { BoundaryLayerType, DistrictElectionResult } from '@/store/useElectionStore';

export interface StandardizedDistrictProps {
  districtId: string;
  labelText: string;
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  totalVotes?: number;
  isDimmed?: boolean;
  isTie?: boolean;
  isZeroVotes?: boolean;
  isUncontested?: boolean;
  [key: string]: any;
}

export interface StandardizedBubbleProps {
  districtId: string;
  labelText: string;
  voteDiff: number;
  bubbleRadius: number;
  fillColor: string;
  isTie: boolean;
}

export type CustomGeoJsonFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, StandardizedDistrictProps>;

export interface MapControllerRefs {
  mapRef: React.MutableRefObject<maplibregl.Map | null>;
  popupRef: React.MutableRefObject<maplibregl.Popup | null>;
  boundaryDatasetsRef: React.MutableRefObject<Record<string, CustomGeoJsonFeatureCollection>>;
  electionIndexRef: React.MutableRefObject<any[]>;
  lastFittedRaceIdRef: React.MutableRefObject<string | null>;
}
