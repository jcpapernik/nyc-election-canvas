'use client';

import React from 'react';
import { useElectionStore } from '@/store/useElectionStore';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';

export const RcvRoundSlider: React.FC = () => {
  const electionData = useElectionStore((s) => s.electionData);
  const selectedRcvRound = useElectionStore((s) => s.selectedRcvRound);
  const setSelectedRcvRound = useElectionStore((s) => s.setSelectedRcvRound);

  if (!electionData || !electionData.isRcv) {
    return null;
  }

  const maxRounds = electionData.maxRounds || 3;
  const roundsInfo = electionData.rcvRoundsInfo || [];
  const currentRoundInfo = roundsInfo.find(r => r.roundNumber === selectedRcvRound) || roundsInfo[0];

  const handlePrev = () => {
    if (selectedRcvRound > 1) {
      setSelectedRcvRound(selectedRcvRound - 1);
    }
  };

  const handleNext = () => {
    if (selectedRcvRound < maxRounds) {
      setSelectedRcvRound(selectedRcvRound + 1);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl flex flex-col items-center gap-2 max-w-lg w-full transition-all animate-fadeIn">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-black uppercase tracking-wider text-blue-400">
            Ranked-Choice Voting Round Explorer
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-600 text-white">
          Round {selectedRcvRound} of {maxRounds}
        </span>
      </div>

      {/* Round Stepper Buttons */}
      <div className="flex items-center justify-between w-full space-x-3 my-1">
        <button
          onClick={handlePrev}
          disabled={selectedRcvRound <= 1}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center justify-center space-x-2">
          {Array.from({ length: maxRounds }, (_, i) => i + 1).map((rNum) => (
            <button
              key={rNum}
              onClick={() => setSelectedRcvRound(rNum)}
              className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                selectedRcvRound === rNum
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400/40 scale-105 shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              R{rNum}
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={selectedRcvRound >= maxRounds}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Round Description & Elimination Detail */}
      {currentRoundInfo && (
        <div className="w-full text-center text-[11px] text-slate-300 font-medium bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
          {currentRoundInfo.description}
        </div>
      )}
    </div>
  );
};
