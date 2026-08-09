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
    id: 'nyc_2021_dem_mayor',
    name: '2021 NYC Dem Mayoral Primary (Live BOE)',
    datasetId: '2021_dem_mayor',
    url: 'https://data.cityofnewyork.us/resource/9v2d-62wb.json',
    districtType: 'boroughs'
  },
  {
    id: 'nyc_2024_general_presidential',
    name: '2024 NYC General Election ED Results',
    datasetId: '2024_general',
    url: 'https://data.cityofnewyork.us/resource/e92v-5k9w.json',
    districtType: 'congressional'
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
