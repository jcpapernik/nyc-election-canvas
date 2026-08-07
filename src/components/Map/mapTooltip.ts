import * as turf from '@turf/turf';
import { useElectionStore, BoundaryLayerType } from '@/store/useElectionStore';
import { BOUNDARY_PROP_NAMES } from './mapHelpers';

export function createTooltipHtml(
  props: any,
  currentLayer: BoundaryLayerType,
  clickPt: GeoJSON.Feature<GeoJSON.Point>,
  boundaryDatasets: Record<string, GeoJSON.FeatureCollection>
): string {
  const currentElection = useElectionStore.getState().electionData;
  const popupBg = '#ffffff';
  const popupBorder = '#cbd5e1';
  const headerTitleColor = '#0f172a';
  const subtextColor = '#475569';
  const leaderNameColor = '#0f172a';
  const regularNameColor = '#334155';
  const leaderPctColor = '#1d4ed8';

  // HOVERING OUTSIDE ACTIVE RACE: Show Macro Parent District Title (e.g. "Congressional District 6")
  if (props.isDimmed) {
    const raceType = currentElection?.districtType || 'congressional';
    const raceDataset = boundaryDatasets[raceType];
    const racePropNames = BOUNDARY_PROP_NAMES[raceType];

    let parentDistrictName = '';
    if (props.cong_dist || props.assembly_district || props.st_sen_dist || props.coundist) {
      parentDistrictName = String(props.cong_dist || props.assembly_district || props.st_sen_dist || props.coundist || '');
    }

    if (!parentDistrictName && raceDataset) {
      for (const f of raceDataset.features || []) {
        try {
          if (turf.booleanPointInPolygon(clickPt, f as any)) {
            for (const pName of racePropNames) {
              if (f.properties?.[pName] !== undefined) {
                parentDistrictName = String(f.properties[pName]);
                break;
              }
            }
            if (parentDistrictName) break;
          }
        } catch (err) {}
      }
    }

    const raceCategoryTitle = raceType === 'assembly' ? 'Assembly District' :
      raceType === 'senate' ? 'State Senate District' :
      raceType === 'council' ? 'City Council District' :
      raceType === 'congressional' ? 'Congressional District' : 'District';

    const outsideTitle = parentDistrictName ? `${raceCategoryTitle} ${parentDistrictName}` : 'Outside Active Race Area';

    return `
      <div style="padding: 12px; background-color: ${popupBg}; border: 1px solid ${popupBorder}; color: ${headerTitleColor}; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: -0.015em; min-width: 240px; max-width: 285px;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${popupBorder}; padding-bottom: 6px; margin-bottom: 6px;">
          <span style="font-size: 12px; font-weight: 900; color: ${headerTitleColor};">${outsideTitle}</span>
        </div>
        <div style="font-size: 11px; color: ${subtextColor}; font-weight: 600;">Click map to switch race view to ${outsideTitle}</div>
      </div>
    `;
  }

  // HOVERING INSIDE ACTIVE RACE: Show Granular Candidate Precinct Vote Breakdown
  let districtTitle = '';
  if (currentLayer === 'citywide') districtTitle = `NYC Citywide Total`;
  else if (currentLayer === 'boroughs') districtTitle = `Borough of ${props.name || props.borough || 'NYC'}`;
  else if (currentLayer === 'council') districtTitle = `City Council District ${props.coundist || props.council_district || ''}`;
  else if (currentLayer === 'assembly') districtTitle = `Assembly District ${props.assembly_district || props.assem_dist || ''}`;
  else if (currentLayer === 'senate') districtTitle = `State Senate District ${props.st_sen_dist || props.senate_district || ''}`;
  else if (currentLayer === 'congressional') districtTitle = `Congressional District ${props.cong_dist || props.congressional_district || ''}`;
  else if (currentLayer === 'eds') {
    const rawEd = String(props.elect_dist || '');
    districtTitle = `Election District ${rawEd.length === 5 ? `${rawEd.slice(0, 2)}/${rawEd.slice(2)}` : rawEd}`;
  }

  let candidateRowsHtml = '';
  let totalVotesHtml = '';

  if (props.districtResultJson) {
    try {
      const res = JSON.parse(props.districtResultJson);
      const candidates = res.candidates || [];
      const votesMap = res.votes || {};
      const total = res.total || 0;
      const isTie = res.isTie || props.isTie;
      const isUncontested = res.isUncontested || currentElection?.isUncontested;

      if (isUncontested || total > 0) {
        const tieBadge = isTie ? `<span style="background: #64748b; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; margin-left: 6px;">TIED RACE</span>` : '';
        const uncontestedBadge = isUncontested ? `<span style="background: #e2e8f0; color: #334155; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-left: 6px; border: 1px solid #cbd5e1;">Uncontested</span>` : '';
        const voteText = isUncontested ? 'Uncontested Race' : `${total.toLocaleString()} votes`;
        totalVotesHtml = `<div style="display: flex; align-items: center; justify-content: space-between;"><span style="font-size: 11px; font-family: monospace; color: ${subtextColor}; font-weight: 700;">${voteText}</span><div>${tieBadge}${uncontestedBadge}</div></div>`;
      }

      const sorted = candidates.slice().sort((a: any, b: any) => (votesMap[b.id] || 0) - (votesMap[a.id] || 0));

      candidateRowsHtml = sorted.map((cand: any, idx: number) => {
        const votes = votesMap[cand.id] || 0;
        const pct = total > 0 ? ((votes / total) * 100).toFixed(1) : '100.0';
        const isLeader = !isTie && (idx === 0 || isUncontested);
        const star = cand.isIncumbent ? '<span style="color: #2563eb; font-weight: 900; margin-left: 2px;">*</span>' : '';

        const nameStyle = isLeader
          ? `font-weight: 900; color: ${leaderNameColor};`
          : `font-weight: 600; color: ${regularNameColor};`;

        const pctStyle = isLeader
          ? `font-weight: 900; color: ${leaderPctColor};`
          : `font-weight: 600; color: ${regularNameColor};`;

        const votesDisplay = isUncontested ? 'Unopposed' : votes.toLocaleString();
        const pctDisplay = isUncontested ? '' : `<span style="${pctStyle} width: 40px; text-align: right;">${pct}%</span>`;

        return `
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; padding: 2px 0;">
            <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; margin-right: 8px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; background-color: ${cand.color}; border: 1px solid rgba(0,0,0,0.1);"></span>
              <span style="${nameStyle} overflow: hidden; text-overflow: ellipsis;">
                ${cand.name}${star}
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0; font-family: monospace;">
              <span style="font-size: 11px; font-weight: 700; color: ${subtextColor};">${votesDisplay}</span>
              ${pctDisplay}
            </div>
          </div>
        `;
      }).slice(0, 5).join('');
    } catch (e) {}
  }

  return `
    <div style="padding: 12px; background-color: ${popupBg}; border: 1px solid ${popupBorder}; color: ${headerTitleColor}; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: -0.015em; min-width: 240px; max-width: 285px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${popupBorder}; padding-bottom: 6px; margin-bottom: 6px;">
        <span style="font-size: 12px; font-weight: 900; color: ${headerTitleColor};">${districtTitle}</span>
      </div>
      ${totalVotesHtml ? `<div style="margin-bottom: 6px;">${totalVotesHtml}</div>` : ''}
      ${candidateRowsHtml ? `<div style="display: flex; flex-direction: column; gap: 2px;">${candidateRowsHtml}</div>` : `<div style="font-size: 11px; color: ${subtextColor};">Click to inspect district</div>`}
    </div>
  `;
}
