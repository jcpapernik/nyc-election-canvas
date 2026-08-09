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

  const cong13Candidates2026: Candidate[] = [
    { id: 'espaillat', name: 'Adriano Espaillat', shortName: 'A. Espaillat', party: 'DEM', color: '#3b82f6', bio: 'Incumbent US Representative NY-13' },
    { id: 'spies', name: 'Francisco Spies', shortName: 'F. Spies', party: 'DEM', color: '#06b6d4', bio: 'Community Advocate' }
  ];

  const cong13Results2026: { [edId: string]: EDResult } = {};
  edFeatures.forEach(f => {
    const edId = f.properties?.edId as string;
    cong13Results2026[edId] = {
      edId,
      edName: f.properties?.edName || edId,
      borough: 'Manhattan',
      councilDistrict: f.properties?.councilDistrict || 7,
      assemblyDistrict: f.properties?.assemblyDistrict || 69,
      senateDistrict: f.properties?.senateDistrict || 27,
      congressionalDistrict: 13,
      neighborhood: f.properties?.neighborhood || 'Harlem',
      registeredVoters: f.properties?.registeredVoters || 1200,
      totalBallots: f.properties?.totalBallots || 540,
      rounds: computeRcvRounds(f, cong13Candidates2026, 1)
    };
  });

  const sen27Candidates2026: Candidate[] = [
    { id: 'kavanagh', name: 'Brian Kavanagh', shortName: 'B. Kavanagh', party: 'DEM', color: '#10b981', bio: 'Incumbent NY State Senator SD-27' },
    { id: 'fariello', name: 'Vittoria Fariello', shortName: 'V. Fariello', party: 'DEM', color: '#f59e0b', bio: 'Democratic District Leader' },
    { id: 'egorov', name: 'Danyela Souza Egorov', shortName: 'D. Egorov', party: 'DEM', color: '#8b5cf6', bio: 'Education Advocate' }
  ];

  const sen27Results2026: { [edId: string]: EDResult } = {};
  edFeatures.forEach(f => {
    const edId = f.properties?.edId as string;
    sen27Results2026[edId] = {
      edId,
      edName: f.properties?.edName || edId,
      borough: 'Manhattan',
      councilDistrict: f.properties?.councilDistrict || 2,
      assemblyDistrict: f.properties?.assemblyDistrict || 65,
      senateDistrict: 27,
      congressionalDistrict: 10,
      neighborhood: f.properties?.neighborhood || 'Lower Manhattan',
      registeredVoters: f.properties?.registeredVoters || 1100,
      totalBallots: f.properties?.totalBallots || 490,
      rounds: computeRcvRounds(f, sen27Candidates2026, 1)
    };
  });

  return {
    'democratic_representative_in_congress_13': {
      id: 'democratic_representative_in_congress_13',
      title: '2026 NY-13 Congressional Democratic Primary',
      year: 2026,
      party: 'DEM',
      isRcv: false,
      maxRounds: 1,
      description: 'Official 2026 Democratic Primary for US Representative in Congress District 13 (Upper Manhattan / West Bronx).',
      candidates: cong13Candidates2026,
      results: cong13Results2026
    },
    '2026-dem-primary': {
      id: '2026-dem-primary',
      title: '2026 New York Governor Democratic Primary',
      year: 2026,
      party: 'DEM',
      isRcv: true,
      maxRounds: 4,
      description: '2026 New York Gubernatorial Democratic Primary featuring Ranked-Choice Voting across all 5 boroughs.',
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
      title: '2026 New York Governor Republican Primary',
      year: 2026,
      party: 'REP',
      isRcv: true,
      maxRounds: 2,
      description: '2026 New York Gubernatorial Republican Primary election.',
      candidates: gopCandidates2026,
      rcvRoundsInfo: [
        { roundNumber: 1, description: 'First Choice Ballots' },
        { roundNumber: 2, eliminatedCandidateId: 'mateo', eliminatedCandidateName: 'Fernando Mateo', description: 'Final Round — Curtis Sliwa vs Lee Zeldin' }
      ],
      results: gopResults2026
    },
    '2026-cong-plurality': {
      id: '2026-cong-plurality',
      title: '2026 NY-12 Congressional Democratic Primary',
      year: 2026,
      party: 'DEM',
      isRcv: false,
      maxRounds: 1,
      description: 'Official 2026 Democratic Primary for US Representative in Congress District 12 (Midtown & Upper Manhattan).',
      candidates: congCandidates2026,
      results: congResults2026
    },
    '2026-senate-d27': {
      id: '2026-senate-d27',
      title: '2026 State Senate District 27 Democratic Primary',
      year: 2026,
      party: 'DEM',
      isRcv: false,
      maxRounds: 1,
      description: 'Official 2026 Democratic Primary for New York State Senate District 27.',
      candidates: sen27Candidates2026,
      results: sen27Results2026
    }
  };
}
