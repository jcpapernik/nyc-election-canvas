import { BoundaryLayerType, MapViewMode, useElectionStore } from '@/store/useElectionStore';

const VALID_LAYERS: BoundaryLayerType[] = ['citywide', 'boroughs', 'council', 'eds', 'assembly', 'senate', 'congressional'];
const VALID_MODES: MapViewMode[] = ['choropleth', 'bubbles'];

export function syncStateToUrl() {
  if (typeof window === 'undefined') return;

  const state = useElectionStore.getState();
  const searchParams = new URLSearchParams(window.location.search);

  const currentRace = searchParams.get('race');
  const currentLayer = searchParams.get('layer');
  const currentMode = searchParams.get('mode');
  const currentDistrict = searchParams.get('district');

  const newRace = state.selectedElectionId || 'democratic_representative_in_congress_13';
  const newLayer = state.activeBoundaryLayer || 'congressional';
  const newMode = state.mapViewMode || 'choropleth';
  const newDistrict = state.drillDownParentDistrict || '';

  if (
    currentRace === newRace &&
    currentLayer === newLayer &&
    currentMode === newMode &&
    (currentDistrict || '') === newDistrict
  ) {
    return;
  }

  const params = new URLSearchParams();
  if (newRace) params.set('race', newRace);
  if (newLayer) params.set('layer', newLayer);
  if (newMode) params.set('mode', newMode);
  if (newDistrict) params.set('district', newDistrict);

  const newSearch = `?${params.toString()}`;
  if (window.location.search !== newSearch) {
    window.history.pushState(null, '', `${window.location.pathname}${newSearch}`);
  }
}

export function restoreStateFromUrl() {
  if (typeof window === 'undefined') return;

  const searchParams = new URLSearchParams(window.location.search);
  const race = searchParams.get('race');
  const layer = searchParams.get('layer') as BoundaryLayerType | null;
  const mode = searchParams.get('mode') as MapViewMode | null;
  const district = searchParams.get('district');

  const store = useElectionStore.getState();
  const updates: Record<string, any> = {};

  if (race && race !== store.selectedElectionId) {
    updates.selectedElectionId = race;
  }

  if (layer && VALID_LAYERS.includes(layer) && layer !== store.activeBoundaryLayer) {
    updates.activeBoundaryLayer = layer;
  }

  if (mode && VALID_MODES.includes(mode) && mode !== store.mapViewMode) {
    updates.mapViewMode = mode;
  }

  if (district !== null && district !== store.drillDownParentDistrict) {
    updates.drillDownParentDistrict = district || null;
  }

  if (Object.keys(updates).length > 0) {
    useElectionStore.setState(updates);
  }
}

export function setupUrlStateSync() {
  if (typeof window === 'undefined') return () => {};

  restoreStateFromUrl();

  const handlePopState = () => {
    restoreStateFromUrl();
  };

  window.addEventListener('popstate', handlePopState);

  const unsubscribe = useElectionStore.subscribe(() => {
    syncStateToUrl();
  });

  return () => {
    window.removeEventListener('popstate', handlePopState);
    unsubscribe();
  };
}
