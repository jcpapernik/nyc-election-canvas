import { ElectionData, DistrictElectionResult } from '@/store/useElectionStore';

export interface NycOpenDataEndpoint {
  id: string;
  name: string;
  datasetId: string;
  url: string;
  districtType: 'congressional' | 'council' | 'assembly' | 'senate' | 'boroughs';
}

export const NYC_OPEN_DATA_ENDPOINTS: NycOpenDataEndpoint[] = [
  {
    id: 'nyc_2026_cd13_primary',
    name: '2026 NY-13 Congressional Primary (Live BOE)',
    datasetId: '2026_cd13_primary',
    url: 'https://data.cityofnewyork.us/resource/2026-cd13-primary.json',
    districtType: 'congressional'
  },
  {
    id: 'nyc_2026_council_primary',
    name: '2026 City Council Primaries (Live Feed)',
    datasetId: '2026_council_primary',
    url: 'https://data.cityofnewyork.us/resource/2026-council-primary.json',
    districtType: 'council'
  }
];

export async function fetchLiveNycOpenData(
  endpointUrl: string,
  appToken?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (appToken) {
      headers['X-App-Token'] = appToken;
    }

    const response = await fetch(`${endpointUrl}?$limit=1000`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText || 'Failed to fetch live API dataset'}`
      };
    }

    const json = await response.json();
    return {
      success: true,
      data: json
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network connection failed while reaching NYC Open Data API'
    };
  }
}
