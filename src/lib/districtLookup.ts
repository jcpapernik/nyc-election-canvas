import * as turf from '@turf/turf';

export interface MultiDistrictSummary {
  borough: string;
  council: string;
  assembly: string;
  senate: string;
  congressional: string;
  electionDistrict: string;
}

export function lookupAllDistrictsAtPoint(
  lng: number,
  lat: number,
  boundaryDatasets: Record<string, GeoJSON.FeatureCollection>
): MultiDistrictSummary {
  const pt = turf.point([lng, lat]);

  const summary: MultiDistrictSummary = {
    borough: 'N/A',
    council: 'N/A',
    assembly: 'N/A',
    senate: 'N/A',
    congressional: 'N/A',
    electionDistrict: 'N/A'
  };

  // 1. Check Boroughs
  if (boundaryDatasets.boroughs?.features) {
    for (const f of boundaryDatasets.boroughs.features) {
      try {
        if (turf.booleanPointInPolygon(pt, f as any)) {
          summary.borough = f.properties?.name || f.properties?.borough || 'N/A';
          break;
        }
      } catch (e) {}
    }
  }

  // 2. Check City Council
  if (boundaryDatasets.council?.features) {
    for (const f of boundaryDatasets.council.features) {
      try {
        if (turf.booleanPointInPolygon(pt, f as any)) {
          summary.council = f.properties?.coundist || f.properties?.council_district || f.properties?.districtId || 'N/A';
          break;
        }
      } catch (e) {}
    }
  }

  // 3. Check State Assembly
  if (boundaryDatasets.assembly?.features) {
    for (const f of boundaryDatasets.assembly.features) {
      try {
        if (turf.booleanPointInPolygon(pt, f as any)) {
          summary.assembly = f.properties?.assembly_district || f.properties?.assem_dist || 'N/A';
          break;
        }
      } catch (e) {}
    }
  }

  // 4. Check State Senate
  if (boundaryDatasets.senate?.features) {
    for (const f of boundaryDatasets.senate.features) {
      try {
        if (turf.booleanPointInPolygon(pt, f as any)) {
          summary.senate = f.properties?.st_sen_dist || f.properties?.senate_district || 'N/A';
          break;
        }
      } catch (e) {}
    }
  }

  // 5. Check Congressional
  if (boundaryDatasets.congressional?.features) {
    for (const f of boundaryDatasets.congressional.features) {
      try {
        if (turf.booleanPointInPolygon(pt, f as any)) {
          summary.congressional = f.properties?.cong_dist || f.properties?.congressional_district || 'N/A';
          break;
        }
      } catch (e) {}
    }
  }

  // 6. Check Election Districts
  if (boundaryDatasets.eds?.features) {
    for (const f of boundaryDatasets.eds.features) {
      try {
        if (turf.booleanPointInPolygon(pt, f as any)) {
          const rawEd = String(f.properties?.elect_dist || f.properties?.edName || '');
          if (rawEd.length === 5) {
            summary.electionDistrict = `${rawEd.slice(0, 2)}/${rawEd.slice(2)}`;
          } else {
            summary.electionDistrict = rawEd || 'N/A';
          }
          break;
        }
      } catch (e) {}
    }
  }

  return summary;
}
