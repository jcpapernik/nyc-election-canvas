import { create } from 'zustand';
import { MultiDistrictSummary } from '@/lib/districtLookup';

export type BoundaryLayerType = 'citywide' | 'boroughs' | 'council' | 'eds' | 'assembly' | 'senate' | 'congressional';
export type ThemeMode = 'light';

export interface SelectedLocation {
  lng: number;
  lat: number;
  label: string;
}

export interface ElectionCandidate {
  id: string;
  name: string;
  party: string;
  color: string;
  isIncumbent?: boolean;
}

export interface DistrictElectionResult {
  votes: Record<string, number>;
  total: number;
  winnerId: string;
  margin: number;
  isUncontested?: boolean;
  candidates?: ElectionCandidate[];
}

export interface ElectionData {
  id: string;
  name: string;
  date: string;
  party?: string;
  officeCategory?: string;
  districtKey?: string;
  districtType: BoundaryLayerType;
  isUncontested?: boolean;
  isRcv?: boolean;
  maxRounds?: number;
  rcvRoundsInfo?: Array<{ roundNumber: number; eliminatedCandidateName?: string; description: string }>;
  candidates: ElectionCandidate[];
  results: Record<string, DistrictElectionResult>;
  edResults?: Record<string, DistrictElectionResult>;
}

export type MapViewMode = 'choropleth' | 'bubbles';

export interface PinnedDistrict {
  districtId: string;
  districtName: string;
  layerType: BoundaryLayerType;
  result: DistrictElectionResult | null;
}

interface ElectionStoreState {
  activeBoundaryLayer: BoundaryLayerType;
  mapViewMode: MapViewMode;
  themeMode: ThemeMode;
  selectedLocation: SelectedLocation | null;
  multiDistrictSummary: MultiDistrictSummary | null;
  selectedElectionId: string;
  electionData: ElectionData | null;
  
  // Kornacki Drill-Down & Pinning State
  drillDownParentDistrict: string | null;
  drillDownPath: string[];
  pinnedDistrict: PinnedDistrict | null;

  setActiveBoundaryLayer: (layer: BoundaryLayerType) => void;
  setMapViewMode: (mode: MapViewMode) => void;
  setThemeMode: (theme: ThemeMode) => void;
  toggleThemeMode: () => void;
  setSelectedLocation: (loc: SelectedLocation | null, summary?: MultiDistrictSummary | null) => void;
  clearSelectedLocation: () => void;
  setSelectedElectionId: (id: string) => void;
  setElectionData: (data: ElectionData | null) => void;
  setDrillDownParent: (parent: string | null, path?: string[]) => void;
  resetDrillDown: () => void;
  setPinnedDistrict: (pinned: PinnedDistrict | null) => void;
  // RCV State
  selectedRcvRound: number;
  setSelectedRcvRound: (round: number) => void;
}

export const useElectionStore = create<ElectionStoreState>((set) => ({
  activeBoundaryLayer: 'congressional',
  mapViewMode: 'choropleth',
  themeMode: 'light',
  selectedLocation: null,
  multiDistrictSummary: null,
  selectedElectionId: 'democratic_representative_in_congress_13',
  electionData: null,
  selectedRcvRound: 1,

  drillDownParentDistrict: null,
  drillDownPath: ['Full Map'],
  pinnedDistrict: null,

  setActiveBoundaryLayer: (layer) => set({ activeBoundaryLayer: layer }),
  setMapViewMode: (mode) => set({ mapViewMode: mode }),
  setThemeMode: () => set({ themeMode: 'light' }),
  toggleThemeMode: () => set({ themeMode: 'light' }),
  setSelectedLocation: (loc, summary = null) => set({ selectedLocation: loc, multiDistrictSummary: summary }),
  clearSelectedLocation: () => set({ selectedLocation: null, multiDistrictSummary: null }),
  setSelectedElectionId: (id) => set({ 
    selectedElectionId: id, 
    drillDownParentDistrict: null, 
    pinnedDistrict: null,
    electionData: null,
    selectedRcvRound: 1
  }),
  setElectionData: (data) => set((state) => ({ 
    electionData: data,
    activeBoundaryLayer: state.activeBoundaryLayer || (data ? data.districtType : 'congressional'),
    selectedRcvRound: 1
  })),

  setDrillDownParent: (parent, path = ['Full Map']) => set({ drillDownParentDistrict: parent, drillDownPath: path }),
  resetDrillDown: () => set({ drillDownParentDistrict: null, drillDownPath: ['Full Map'], pinnedDistrict: null }),
  setPinnedDistrict: (pinned) => set({ pinnedDistrict: pinned }),
  setSelectedRcvRound: (round) => set({ selectedRcvRound: round })
}));

if (typeof window !== 'undefined') {
  (window as any)._useElectionStore = useElectionStore;
}

