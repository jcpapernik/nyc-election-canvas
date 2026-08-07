export type Party = 'DEM' | 'REP' | 'WFP' | 'IND' | 'ALL';
export type BoundaryLevel = 'citywide' | 'congressional' | 'senate' | 'assembly' | 'city_council';
export type MapMode = 'choropleth' | 'bubbles';

export interface Candidate {
  id: string;
  name: string;
  shortName: string;
  party: 'DEM' | 'REP' | 'WFP' | 'IND';
  color: string;
  avatarUrl?: string;
  bio?: string;
}

export interface CandidateVote {
  candidateId: string;
  votes: number;
  percentage: number;
  isEliminated?: boolean;
}

export interface RcvRoundInfo {
  roundNumber: number;
  eliminatedCandidateId?: string;
  eliminatedCandidateName?: string;
  description: string;
}

export interface EDResult {
  edId: string; // e.g. "NY-MAN-ED-001"
  edName: string;
  borough: string;
  councilDistrict: number;
  assemblyDistrict: number;
  senateDistrict: number;
  congressionalDistrict: number;
  neighborhood: string;
  registeredVoters: number;
  totalBallots: number;
  // Map of round number -> candidate vote tallies
  rounds: {
    [roundNumber: number]: {
      votes: { [candidateId: string]: number };
      winnerId: string;
      marginVotes: number;
      marginPct: number;
      runnerUpId: string;
    };
  };
}

export interface ElectionData {
  id: string;
  title: string;
  year: number;
  party: Party;
  isRcv: boolean;
  maxRounds: number;
  description: string;
  candidates: Candidate[];
  rcvRoundsInfo?: RcvRoundInfo[];
  results: { [edId: string]: EDResult };
}
