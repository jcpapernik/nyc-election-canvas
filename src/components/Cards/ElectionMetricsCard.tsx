'use client';

import React, { useState } from 'react';
import { useElectionStore } from '@/store/useElectionStore';
import { Vote, Layers, Clock, Pin, X, ChevronDown, ChevronUp } from 'lucide-react';

export const ElectionMetricsCard: React.FC = () => {
  const electionData = useElectionStore(s => s.electionData);
  const themeMode = useElectionStore(s => s.themeMode);
  const activeBoundaryLayer = useElectionStore(s => s.activeBoundaryLayer);
  const multiDistrictSummary = useElectionStore(s => s.multiDistrictSummary);
  const pinnedDistrict = useElectionStore(s => s.pinnedDistrict);
  const setPinnedDistrict = useElectionStore(s => s.setPinnedDistrict);

  const [showAllCandidates, setShowAllCandidates] = useState(false);

  if (!electionData) return null;

  const isDark = false;

  let focusedDistrictName = '';
  let focusedResult = null;

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

  if (pinnedDistrict) {
    focusedDistrictName = pinnedDistrict.districtName;
    focusedResult = pinnedDistrict.result;
  } else if (multiDistrictSummary) {
    if (activeBoundaryLayer === 'boroughs') focusedDistrictName = multiDistrictSummary.borough;
    else if (activeBoundaryLayer === 'council') focusedDistrictName = multiDistrictSummary.council;
    else if (activeBoundaryLayer === 'assembly') focusedDistrictName = multiDistrictSummary.assembly;
    else if (activeBoundaryLayer === 'senate') focusedDistrictName = multiDistrictSummary.senate;
    else if (activeBoundaryLayer === 'congressional') focusedDistrictName = multiDistrictSummary.congressional;
    else if (activeBoundaryLayer === 'eds') focusedDistrictName = multiDistrictSummary.electionDistrict;

    if (focusedDistrictName) {
      const canonicalKey = BOROUGH_CANONICAL_MAP[focusedDistrictName.toLowerCase()] || focusedDistrictName;
      if (electionData.results[canonicalKey]) {
        focusedResult = electionData.results[canonicalKey];
      } else if (electionData.results[focusedDistrictName]) {
        focusedResult = electionData.results[focusedDistrictName];
      }
    }
  }

  let totalCitywideVotes = 0;
  const candidateCitywideVotes: Record<string, number> = {};

  if (electionData.candidates) {
    electionData.candidates.forEach(c => { candidateCitywideVotes[c.id] = 0; });
  }

  if (electionData.results) {
    Object.values(electionData.results).forEach(res => {
      totalCitywideVotes += res.total;
      if (electionData.candidates) {
        electionData.candidates.forEach(c => {
          candidateCitywideVotes[c.id] += res.votes[c.id] || 0;
        });
      }
    });
  }

  const displayTitle = focusedDistrictName
    ? (focusedDistrictName.startsWith('District') || focusedDistrictName.includes(' ') ? focusedDistrictName : `District ${focusedDistrictName}`)
    : 'Full Race Total';

  const displayTotalVotes = focusedResult ? focusedResult.total : totalCitywideVotes;
  const displayVotes = focusedResult ? focusedResult.votes : candidateCitywideVotes;
  const hasCandidates = electionData.candidates && electionData.candidates.length > 0;

  // STRICT DESCENDING SORT BY VOTES (Highest vote getter always on top)
  const sortedCandidates = (electionData.candidates || []).slice().sort((a, b) => {
    const vA = displayVotes[a.id] || 0;
    const vB = displayVotes[b.id] || 0;
    return vB - vA;
  });

  // 2.0% VOTE SHARE THRESHOLD FILTERING
  const isPrimary = electionData.name.toLowerCase().includes('primary');

  const aboveThresholdCandidates = sortedCandidates.filter(c => {
    const votes = displayVotes[c.id] || 0;
    const pct = displayTotalVotes > 0 ? (votes / displayTotalVotes) * 100 : 0;
    return pct >= 2.0;
  });

  const defaultVisible = aboveThresholdCandidates.length >= 4 
    ? aboveThresholdCandidates 
    : sortedCandidates.slice(0, Math.max(4, aboveThresholdCandidates.length));

  const visibleCandidates = showAllCandidates ? sortedCandidates : defaultVisible;
  const hiddenCount = sortedCandidates.length - visibleCandidates.length;

  const hasIncumbent = (electionData.candidates || []).some(c => (c as any).isIncumbent);

  return (
    <div className={`fixed bottom-6 right-6 z-20 w-80 md:w-[420px] rounded-2xl shadow-2xl border p-5 md:p-6 backdrop-blur-md transition-all duration-300 ${
      isDark
        ? 'bg-slate-900/95 border-slate-800 text-slate-100'
        : 'bg-white/95 border-slate-300 text-slate-900'
    }`}>
      {/* Card Header */}
      <div className="flex items-center justify-between border-b pb-3.5 mb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
            <Vote className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
              {pinnedDistrict ? 'PINNED DISTRICT LEADERBOARD' : 'ELECTION LEADERBOARD'}
            </h3>
            <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 truncate max-w-[210px]" style={{ color: isDark ? '#60a5fa' : '#1d4ed8' }}>
              {electionData.name}
            </p>
          </div>
        </div>

        {pinnedDistrict ? (
          <button
            onClick={() => setPinnedDistrict(null)}
            title="Unpin District Data"
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-200 transition-colors shrink-0"
          >
            <Pin className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Unpin</span>
            <X className="w-3 h-3 ml-0.5" />
          </button>
        ) : (
          <div className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-200 dark:border-blue-700/50 shrink-0">
            2026 CYCLE
          </div>
        )}
      </div>

      {/* Focused Region Subheader */}
      <div className="flex items-center justify-between mb-4 bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center space-x-2 truncate mr-2">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
            {displayTitle}
          </span>
          {(electionData.isUncontested || focusedResult?.isUncontested) && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shrink-0">
              UNCONTESTED
            </span>
          )}
        </div>
        <span className="text-xs font-black text-slate-900 dark:text-white shrink-0 font-mono" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
          {(electionData.isUncontested || focusedResult?.isUncontested) ? 'Uncontested Race' : `${displayTotalVotes.toLocaleString()} votes`}
        </span>
      </div>

      {hasCandidates ? (
        <>
          {/* Stacked Vote Share Progress Bar */}
          <div className="w-full h-3.5 rounded-full overflow-hidden flex mb-4 bg-slate-200 dark:bg-slate-800 shadow-inner">
            {sortedCandidates.map(c => {
              const votes = displayVotes[c.id] || 0;
              const pct = (electionData.isUncontested || focusedResult?.isUncontested) ? 100 : (displayTotalVotes > 0 ? (votes / displayTotalVotes) * 100 : 0);
              return (
                <div
                  key={c.id}
                  style={{ width: `${pct}%`, backgroundColor: c.color }}
                  title={`${c.name}: ${(electionData.isUncontested || focusedResult?.isUncontested) ? 'Uncontested' : `${pct.toFixed(1)}%`}`}
                  className="h-full transition-all duration-500"
                />
              );
            })}
          </div>

          {/* Strictly Sorted Candidate Breakdown List (Sorted strictly by votes) */}
          <div className="space-y-3">
            {visibleCandidates.map((c, rankIdx) => {
              const votes = displayVotes[c.id] || 0;
              const pctNum = displayTotalVotes > 0 ? (votes / displayTotalVotes) * 100 : 0;
              const pct = pctNum.toFixed(1);
              const isUncontested = Boolean(electionData.isUncontested || focusedResult?.isUncontested);
              const isLeader = rankIdx === 0 && (votes > 0 || isUncontested);
              const isIncumbent = (c as any).isIncumbent;

              return (
                <div key={c.id} className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center space-x-2.5 truncate mr-2">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 w-4 shrink-0">
                      #{rankIdx + 1}
                    </span>
                    <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: c.color }} />
                    <span className="text-slate-900 dark:text-slate-100 font-extrabold truncate flex items-center" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                      <span>{c.name}</span>
                      {isIncumbent && <span className="text-blue-600 dark:text-blue-400 font-black ml-1" title="Incumbent">*</span>}
                    </span>
                    {!isPrimary && (
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold shrink-0">
                        ({c.party})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {isUncontested ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
                        Uncontested Winner
                      </span>
                    ) : (
                      <>
                        <span className="text-slate-900 dark:text-slate-200 text-xs font-mono font-bold" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
                          {votes.toLocaleString()} votes
                        </span>
                        <span className={`font-black text-xs w-14 text-right font-mono rounded px-1.5 py-0.5 ${
                          isLeader
                            ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                            : 'text-slate-950 dark:text-white'
                        }`} style={{ color: isLeader ? undefined : (isDark ? '#ffffff' : '#0f172a') }}>
                          ({pct}%)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expandable Threshold Toggle for Candidates Under 2% */}
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAllCandidates(!showAllCandidates)}
              className="w-full mt-4 py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 hover:bg-blue-100"
            >
              <span>{showAllCandidates ? 'Collapse Candidates' : `+ Show ${hiddenCount} More Candidates (<2.0%)`}</span>
              {showAllCandidates ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Incumbent Legend Note */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-1">
              <span className="text-blue-600 dark:text-blue-400 font-black text-xs">*</span>
              <span>Incumbent</span>
            </div>
            <span>2026 Primary</span>
          </div>
        </>
      ) : (
        /* Empty Dataset Message State */
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-1">
          <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
            Dataset Empty (2026 Cycle)
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            No prior-year candidate names or mock metrics present. Awaiting official 2026 dataset import.
          </p>
        </div>
      )}
    </div>
  );
};
