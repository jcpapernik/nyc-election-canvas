import { ElectionData, Candidate, EDResult } from '@/types/election';
import { computeRcvRounds } from './rcvSimulator';

export function createElectionsData(edFeatures: GeoJSON.Feature[]): Record<string, ElectionData> {
  const demCandidates2026: Candidate[] = [
    { id: 'wiley', name: 'Maya Wiley', shortName: 'M. Wiley', party: 'DEM', color: '#3b82f6', bio: 'Progressive Attorney & Educator' },
    { id: 'garcia', name: 'Kathryn Garcia', shortName: 'K. Garcia', party: 'DEM', color: '#06b6d4', bio: 'Former Sanitation Commissioner' },
    { id: 'lander', name: 'Brad Lander', shortName: 'B. Lander', party: 'DEM', color: '#8b5cf6', bio: 'NYC Comptroller' },
    { id: 'adams', name: 'Eric Adams', shortName: 'E. Adams', party: 'DEM', color: '#f59e0b', bio: 'Incumbent Mayor' },
    { id: 'myrie', name: 'Zellnor Myrie', shortName: 'Z. Myrie', party: 'DEM', color: '#ec4899', bio: 'NY State Senator' }
  ];

  const demResults2026: { [edId: string]: EDResult } = {};
  edFeatures.forEach(f => {
    const edId = f.properties?.edId as string;
    demResults2026[edId] = {
      edId,
      edName: f.properties?.edName || edId,
      borough: f.properties?.borough || 'Manhattan',
      councilDistrict: f.properties?.councilDistrict || 1,
      assemblyDistrict: f.properties?.assemblyDistrict || 65,
      senateDistrict: f.properties?.senateDistrict || 27,
      congressionalDistrict: f.properties?.congressionalDistrict || 10,
      neighborhood: f.properties?.neighborhood || 'NYC',
      registeredVoters: f.properties?.registeredVoters || 1000,
      totalBallots: f.properties?.totalBallots || 480,
      rounds: computeRcvRounds(f, demCandidates2026, 4)
    };
  });

  const gopCandidates2026: Candidate[] = [
    { id: 'sliwa', name: 'Curtis Sliwa', shortName: 'C. Sliwa', party: 'REP', color: '#ef4444', bio: 'Guardian Angels Founder' },
    { id: 'mateo', name: 'Fernando Mateo', shortName: 'F. Mateo', party: 'REP', color: '#f97316', bio: 'Small Business Advocate' },
    { id: 'zeldin', name: 'Lee Zeldin', shortName: 'L. Zeldin', party: 'REP', color: '#b91c1c', bio: 'Former US Congressman' }
  ];

  const gopResults2026: { [edId: string]: EDResult } = {};
  edFeatures.forEach(f => {
    const edId = f.properties?.edId as string;
    gopResults2026[edId] = {
      edId,
      edName: f.properties?.edName || edId,
      borough: f.properties?.borough || 'Staten Island',
      councilDistrict: f.properties?.councilDistrict || 50,
      assemblyDistrict: f.properties?.assemblyDistrict || 61,
      senateDistrict: f.properties?.senateDistrict || 24,
      congressionalDistrict: f.properties?.congressionalDistrict || 11,
      neighborhood: f.properties?.neighborhood || 'NYC',
      registeredVoters: f.properties?.registeredVoters || 900,
      totalBallots: f.properties?.totalBallots || 320,
      rounds: computeRcvRounds(f, gopCandidates2026, 2)
    };
  });

  const congCandidates2026: Candidate[] = [
    { id: 'nadler', name: 'Jerry Nadler', shortName: 'J. Nadler', party: 'DEM', color: '#3b82f6', bio: 'US Representative NY-12' },
    { id: 'maloney', name: 'Carolyn Maloney', shortName: 'C. Maloney', party: 'DEM', color: '#06b6d4', bio: 'Former US Representative' },
    { id: 'patel', name: 'Suraj Patel', shortName: 'S. Patel', party: 'DEM', color: '#8b5cf6', bio: 'Attorney & Reformer' }
  ];

  const congResults2026: { [edId: string]: EDResult } = {};
  edFeatures.forEach(f => {
    const edId = f.properties?.edId as string;
    congResults2026[edId] = {
      edId,
      edName: f.properties?.edName || edId,
      borough: 'Manhattan',
      councilDistrict: f.properties?.councilDistrict || 4,
      assemblyDistrict: f.properties?.assemblyDistrict || 73,
      senateDistrict: f.properties?.senateDistrict || 28,
      congressionalDistrict: 12,
      neighborhood: f.properties?.neighborhood || 'Manhattan',
      registeredVoters: f.properties?.registeredVoters || 1150,
      totalBallots: f.properties?.totalBallots || 510,
      rounds: computeRcvRounds(f, congCandidates2026, 1)
    };
  });

  const ccCandidates2026: Candidate[] = [
    { id: 'brewer', name: 'Gale Brewer', shortName: 'G. Brewer', party: 'DEM', color: '#10b981', bio: 'Council Member' },
    { id: 'danzilo', name: 'Maria Danzilo', shortName: 'M. Danzilo', party: 'DEM', color: '#f59e0b', bio: 'Community Leader' },
    { id: 'lind', name: 'Sara Lind', shortName: 'S. Lind', party: 'DEM', color: '#3b82f6', bio: 'Urbanist Advocate' },
    { id: 'weiner', name: 'Zack Weiner', shortName: 'Z. Weiner', party: 'DEM', color: '#8b5cf6', bio: 'Housing Reformer' }
  ];

  const ccResults2026: { [edId: string]: EDResult } = {};
  edFeatures.forEach(f => {
    const edId = f.properties?.edId as string;
    ccResults2026[edId] = {
      edId,
      edName: f.properties?.edName || edId,
      borough: f.properties?.borough || 'Manhattan',
      councilDistrict: 6,
      assemblyDistrict: f.properties?.assemblyDistrict || 67,
      senateDistrict: f.properties?.senateDistrict || 27,
      congressionalDistrict: f.properties?.congressionalDistrict || 10,
      neighborhood: f.properties?.neighborhood || 'Upper West Side',
      registeredVoters: f.properties?.registeredVoters || 1100,
      totalBallots: f.properties?.totalBallots || 520,
      rounds: computeRcvRounds(f, ccCandidates2026, 3)
    };
  });

  const mayoralCandidates2026: Candidate[] = [
    { id: 'adams26', name: 'Eric Adams', shortName: 'E. Adams', party: 'DEM', color: '#f59e0b', bio: 'Incumbent Mayor' },
    { id: 'garcia26', name: 'Kathryn Garcia', shortName: 'K. Garcia', party: 'DEM', color: '#06b6d4', bio: 'Sanitation Commissioner' },
    { id: 'wiley26', name: 'Maya Wiley', shortName: 'M. Wiley', party: 'DEM', color: '#3b82f6', bio: 'Civil Rights Counsel' },
    { id: 'yang26', name: 'Andrew Yang', shortName: 'A. Yang', party: 'DEM', color: '#eab308', bio: 'Tech Entrepreneur' },
    { id: 'stringer26', name: 'Scott Stringer', shortName: 'S. Stringer', party: 'DEM', color: '#8b5cf6', bio: 'NYC Comptroller' }
  ];

  const mayoralResults2026: { [edId: string]: EDResult } = {};
  edFeatures.forEach(f => {
    const edId = f.properties?.edId as string;
    mayoralResults2026[edId] = {
      edId,
      edName: f.properties?.edName || edId,
      borough: f.properties?.borough || 'Brooklyn',
      councilDistrict: f.properties?.councilDistrict || 33,
      assemblyDistrict: f.properties?.assemblyDistrict || 50,
      senateDistrict: f.properties?.senateDistrict || 26,
      congressionalDistrict: f.properties?.congressionalDistrict || 10,
      neighborhood: f.properties?.neighborhood || 'NYC',
      registeredVoters: f.properties?.registeredVoters || 1200,
      totalBallots: f.properties?.totalBallots || 580,
      rounds: computeRcvRounds(f, mayoralCandidates2026, 4)
    };
  });

  return {
    '2026-dem-primary': {
      id: '2026-dem-primary',
      title: '2026 Democratic Primary (Governor & Citywide)',
      year: 2026,
      party: 'DEM',
      isRcv: true,
      maxRounds: 4,
      description: 'New York Democratic Primary election featuring Ranked-Choice Voting across all 5 boroughs.',
      candidates: demCandidates2026,
      rcvRoundsInfo: [
        { roundNumber: 1, description: 'First Preference Votes' },
        { roundNumber: 2, eliminatedCandidateId: 'myrie', eliminatedCandidateName: 'Zellnor Myrie', description: 'Eliminated Z. Myrie — votes transferred' },
        { roundNumber: 3, eliminatedCandidateId: 'lander', eliminatedCandidateName: 'Brad Lander', description: 'Eliminated B. Lander — votes transferred' },
        { roundNumber: 4, eliminatedCandidateId: 'adams', eliminatedCandidateName: 'Eric Adams', description: 'Final Round — Maya Wiley vs Kathryn Garcia' }
      ],
      results: demResults2026
    },
    '2026-gop-primary': {
      id: '2026-gop-primary',
      title: '2026 Republican Primary (Gubernatorial)',
      year: 2026,
      party: 'REP',
      isRcv: true,
      maxRounds: 2,
      description: 'NYC Republican Primary election with RCV round eliminations.',
      candidates: gopCandidates2026,
      rcvRoundsInfo: [
        { roundNumber: 1, description: 'First Choice Ballots' },
        { roundNumber: 2, eliminatedCandidateId: 'mateo', eliminatedCandidateName: 'Fernando Mateo', description: 'Final Round — Curtis Sliwa vs Lee Zeldin' }
      ],
      results: gopResults2026
    },
    '2026-cong-plurality': {
      id: '2026-cong-plurality',
      title: '2026 NY-12 Congressional Primary',
      year: 2026,
      party: 'DEM',
      isRcv: false,
      maxRounds: 1,
      description: 'Official 2026 Congressional Primary Election.',
      candidates: congCandidates2026,
      results: congResults2026
    },
    '2026-council-d6': {
      id: '2026-council-d6',
      title: '2026 City Council District 6 Primary',
      year: 2026,
      party: 'DEM',
      isRcv: true,
      maxRounds: 3,
      description: 'Upper West Side City Council District 6 Democratic Primary with RCV.',
      candidates: ccCandidates2026,
      rcvRoundsInfo: [
        { roundNumber: 1, description: 'Round 1 Initial Preference' },
        { roundNumber: 2, eliminatedCandidateId: 'weiner', eliminatedCandidateName: 'Zack Weiner', description: 'Eliminated Z. Weiner — votes transferred' },
        { roundNumber: 3, eliminatedCandidateId: 'danzilo', eliminatedCandidateName: 'Maria Danzilo', description: 'Final Round — Gale Brewer vs Sara Lind' }
      ],
      results: ccResults2026
    },
    '2026-mayoral-primary': {
      id: '2026-mayoral-primary',
      title: '2026 NYC Mayoral Democratic Primary',
      year: 2026,
      party: 'DEM',
      isRcv: true,
      maxRounds: 4,
      description: 'The 2026 NYC Democratic Mayoral Primary showing RCV transfers.',
      candidates: mayoralCandidates2026,
      rcvRoundsInfo: [
        { roundNumber: 1, description: 'Round 1 Initial Count' },
        { roundNumber: 2, eliminatedCandidateId: 'stringer26', eliminatedCandidateName: 'Scott Stringer', description: 'Eliminated S. Stringer' },
        { roundNumber: 3, eliminatedCandidateId: 'yang26', eliminatedCandidateName: 'Andrew Yang', description: 'Eliminated A. Yang — major vote redistribution' },
        { roundNumber: 4, eliminatedCandidateId: 'wiley26', eliminatedCandidateName: 'Maya Wiley', description: 'Final Round — Eric Adams vs Kathryn Garcia' }
      ],
      results: mayoralResults2026
    }
  };
}
