import * as turf from '@turf/turf';
import polylabel from 'polylabel';
import { BoundaryLayerType } from '@/store/useElectionStore';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const BOUNDARY_FILE_MAP: Record<BoundaryLayerType, string> = {
  citywide: `${BASE_PATH}/boundaries/boroughs.json`,
  boroughs: `${BASE_PATH}/boundaries/boroughs.json`,
  council: `${BASE_PATH}/boundaries/city_council.json`,
  eds: `${BASE_PATH}/boundaries/election_districts.json`,
  assembly: `${BASE_PATH}/boundaries/assembly.json`,
  senate: `${BASE_PATH}/boundaries/state_senate.json`,
  congressional: `${BASE_PATH}/boundaries/congressional.json`
};

export const BOUNDARY_PROP_NAMES: Record<BoundaryLayerType, string[]> = {
  citywide: ['name', 'borough'],
  boroughs: ['name', 'borough'],
  council: ['coundist', 'council_district'],
  assembly: ['assembly_district', 'assem_dist'],
  senate: ['st_sen_dist', 'senate_district'],
  congressional: ['cong_dist', 'congressional_district'],
  eds: ['elect_dist']
};

export const BASEMAP_STYLE_LIGHT = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const BOROUGH_CANONICAL_MAP: Record<string, string> = {
  'manhattan': 'New York',
  'new york': 'New York',
  'brooklyn': 'Kings',
  'kings': 'Kings',
  'staten island': 'Richmond',
  'richmond': 'Richmond',
  'bronx': 'Bronx',
  'queens': 'Queens'
};

export function getCanonicalBorough(name: string): string {
  if (!name) return '';
  const lower = name.trim().toLowerCase();
  return BOROUGH_CANONICAL_MAP[lower] || name.trim();
}

export function isEdInBorough(rawEd: string, boroName: string): boolean {
  if (!rawEd || rawEd.length < 2) return false;
  const ad = parseInt(rawEd.slice(0, 2), 10);
  if (isNaN(ad)) return false;
  const canonical = getCanonicalBorough(boroName);

  if (canonical === 'Queens' && ad >= 23 && ad <= 40) return true;
  if (canonical === 'Brooklyn' && ad >= 41 && ad <= 60) return true;
  if (canonical === 'Staten Island' && ad >= 61 && ad <= 64) return true;
  if (canonical === 'Manhattan' && ad >= 65 && ad <= 76) return true;
  if (canonical === 'Bronx' && ad >= 77 && ad <= 87) return true;

  return false;
}

export function normalizeDistrictKey(key: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  const lower = trimmed.toLowerCase();
  if (BOROUGH_CANONICAL_MAP[lower]) {
    return BOROUGH_CANONICAL_MAP[lower];
  }
  const num = parseInt(trimmed, 10);
  if (!isNaN(num)) {
    return String(num);
  }
  return trimmed;
}

export function normalizeParty(p?: string): string {
  if (!p) return 'democratic';
  const s = p.toLowerCase();
  if (s.includes('dem')) return 'democratic';
  if (s.includes('rep')) return 'republican';
  return s;
}

const centroidCacheMap = new Map<string, [number, number]>();

export function getPoleOfInaccessibilityFast(feature: GeoJSON.Feature, labelKey: string): [number, number] | null {
  if (centroidCacheMap.has(labelKey)) {
    return centroidCacheMap.get(labelKey)!;
  }

  if (!feature || !feature.geometry) return null;

  try {
    const geom = feature.geometry;
    let pt: [number, number] | null = null;

    if (geom.type === 'Polygon' && geom.coordinates && geom.coordinates.length > 0) {
      const res = polylabel(geom.coordinates as any, 0.001);
      pt = [res[0], res[1]];
    } else if (geom.type === 'MultiPolygon' && geom.coordinates && geom.coordinates.length > 0) {
      let maxDist = -1;
      geom.coordinates.forEach(polyCoords => {
        if (polyCoords && polyCoords.length > 0) {
          const res = polylabel(polyCoords as any, 0.001);
          const dist = (res as any).distance !== undefined ? (res as any).distance : (res[2] || 0);
          if (dist > maxDist) {
            maxDist = dist;
            pt = [res[0], res[1]];
          }
        }
      });
    }

    if (!pt) {
      const center = turf.centerOfMass(feature as any);
      pt = center.geometry.coordinates as [number, number];
    }

    if (pt) {
      centroidCacheMap.set(labelKey, pt);
      return pt;
    }
  } catch (e) {}

  return null;
}
