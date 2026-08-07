'use client';

import React from 'react';
import { useElectionStore } from '@/store/useElectionStore';
import { MapPin, X, Landmark, Vote, Building2, Layers } from 'lucide-react';

export const MultiDistrictCard: React.FC = () => {
  const selectedLocation = useElectionStore(s => s.selectedLocation);
  const summary = useElectionStore(s => s.multiDistrictSummary);
  const themeMode = useElectionStore(s => s.themeMode);
  const clearSelectedLocation = useElectionStore(s => s.clearSelectedLocation);

  if (!selectedLocation || !summary) return null;

  const isDark = false;

  return (
    <div className={`fixed bottom-8 left-6 z-20 w-80 md:w-96 rounded-2xl p-4 shadow-2xl border transition-all duration-300 ${
      isDark
        ? 'bg-slate-900/90 text-slate-100 border-slate-700/80 backdrop-blur-xl'
        : 'bg-white/95 text-slate-900 border-slate-200/90 backdrop-blur-xl'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight leading-tight">
              {selectedLocation.label}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {selectedLocation.lat.toFixed(4)}°N, {Math.abs(selectedLocation.lng).toFixed(4)}°W
            </p>
          </div>
        </div>

        <button
          onClick={clearSelectedLocation}
          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all shrink-0 ml-2"
          title="Close Card"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Overlapping Political Districts Grid */}
      <div className="mt-3 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" />
          <span>Overlapping Boundaries</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Borough */}
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Borough</div>
            <div className="font-bold text-slate-900 dark:text-white truncate mt-0.5">
              {summary.borough}
            </div>
          </div>

          {/* City Council */}
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">City Council</div>
            <div className="font-bold text-blue-600 dark:text-blue-400 truncate mt-0.5">
              District {summary.council}
            </div>
          </div>

          {/* State Assembly */}
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">State Assembly</div>
            <div className="font-bold text-slate-900 dark:text-white truncate mt-0.5">
              District {summary.assembly}
            </div>
          </div>

          {/* State Senate */}
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">State Senate</div>
            <div className="font-bold text-slate-900 dark:text-white truncate mt-0.5">
              District {summary.senate}
            </div>
          </div>

          {/* Congressional */}
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">US House</div>
            <div className="font-bold text-slate-900 dark:text-white truncate mt-0.5">
              District {summary.congressional}
            </div>
          </div>

          {/* Election District / Precinct */}
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Election District</div>
            <div className="font-bold text-purple-600 dark:text-purple-400 truncate mt-0.5">
              ED {summary.electionDistrict}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
