import { BoundaryLayerType, MapViewMode, useElectionStore } from '@/store/useElectionStore';

const VALID_LAYERS: BoundaryLayerType[] = ['citywide', 'boroughs', 'council', 'eds', 'assembly', 'senate', 'congressional'];
const VALID_MODES: MapViewMode[] = ['choropleth', 'bubbles'];

export function parseRaceIdToUrlParams(raceId: string): { party: string; office: string; district: string } {
  if (!raceId) return { party: 'democratic', office: 'congressional', district: '13' };

  let party = 'democratic';
  let rest = raceId;

  if (raceId.startsWith('republican_')) {
    party = 'republican';
    rest = raceId.replace('republican_', '');
  } else if (raceId.startsWith('democratic_')) {
    party = 'democratic';
    rest = raceId.replace('democratic_', '');
  }

  let office = 'congressional';
  let district = '';

  if (rest.includes('representative_in_congress_')) {
    office = 'congressional';
    district = rest.replace('representative_in_congress_', '');
  } else if (rest.includes('member_of_the_assembly_')) {
    office = 'assembly';
    district = rest.replace('member_of_the_assembly_', '');
  } else if (rest.includes('state_senator_')) {
    office = 'senate';
    district = rest.replace('state_senator_', '');
  } else if (rest.includes('member_of_the_city_council_')) {
    office = 'council';
    district = rest.replace('member_of_the_city_council_', '');
  } else if (rest.includes('state_comptroller')) {
    office = 'comptroller';
    district = 'nyc';
  } else {
    office = rest;
  }

  return { party, office, district };
}

export function constructRaceIdFromParams(party: string, office: string, district: string): string {
  const normParty = party.toLowerCase().startsWith('rep') ? 'republican' : 'democratic';
  const normDist = district ? (district.length === 1 ? `0${district}` : district) : '1';

  let officeSlug = 'representative_in_congress';
  if (office === 'assembly') officeSlug = 'member_of_the_assembly';
  else if (office === 'senate') officeSlug = 'state_senator';
  else if (office === 'council') officeSlug = 'member_of_the_city_council';
  else if (office === 'congressional') officeSlug = 'representative_in_congress';

  return `${normParty}_${officeSlug}_${normDist}`;
}

export function syncStateToUrl() {
  if (typeof window === 'undefined') return;

  const state = useElectionStore.getState();
  const raceId = state.selectedElectionId || 'democratic_representative_in_congress_13';
  const { party, office, district } = parseRaceIdToUrlParams(raceId);

  const layer = state.activeBoundaryLayer || 'congressional';
  const mode = state.mapViewMode || 'choropleth';
  const drillDistrict = state.pinnedDistrict?.districtName || state.drillDownParentDistrict || district;

  const params = new URLSearchParams();
  params.set('party', party);
  params.set('office', office);
  if (drillDistrict) params.set('district', drillDistrict);
  if (layer) params.set('layer', layer);
  if (mode) params.set('mode', mode);

  const newSearch = `?${params.toString()}`;
  if (window.location.search !== newSearch) {
    window.history.pushState(null, '', `${window.location.pathname}${newSearch}`);
  }
}

export function restoreStateFromUrl() {
  if (typeof window === 'undefined') return;

  const searchParams = new URLSearchParams(window.location.search);
  const partyParam = searchParams.get('party');
  const officeParam = searchParams.get('office');
  const districtParam = searchParams.get('district');
  const legacyRace = searchParams.get('race');
  const layer = searchParams.get('layer') as BoundaryLayerType | null;
  const mode = searchParams.get('mode') as MapViewMode | null;

  const store = useElectionStore.getState();
  const updates: Record<string, any> = {};

  let targetRaceId = store.selectedElectionId;

  if (partyParam && officeParam) {
    targetRaceId = constructRaceIdFromParams(partyParam, officeParam, districtParam || '1');
  } else if (legacyRace) {
    targetRaceId = legacyRace;
  }

  if (targetRaceId && targetRaceId !== store.selectedElectionId) {
    updates.selectedElectionId = targetRaceId;
  }

  if (layer && VALID_LAYERS.includes(layer) && layer !== store.activeBoundaryLayer) {
    updates.activeBoundaryLayer = layer;
  }

  if (mode && VALID_MODES.includes(mode) && mode !== store.mapViewMode) {
    updates.mapViewMode = mode;
  }

  if (districtParam !== null && districtParam !== store.drillDownParentDistrict) {
    updates.drillDownParentDistrict = districtParam || null;
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
