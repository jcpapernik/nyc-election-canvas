'use client';

import React from 'react';
import { useElectionStore } from '@/store/useElectionStore';
import { ChevronRight, RotateCcw, MapPin } from 'lucide-react';

interface BreadcrumbBarProps {
  onResetView?: () => void;
}

export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({ onResetView }) => {
  const electionData = useElectionStore(s => s.electionData);
  const activeBoundaryLayer = useElectionStore(s => s.activeBoundaryLayer);
  const themeMode = useElectionStore(s => s.themeMode);
  const drillDownParentDistrict = useElectionStore(s => s.drillDownParentDistrict);
  const drillDownPath = useElectionStore(s => s.drillDownPath);
  const resetDrillDown = useElectionStore(s => s.resetDrillDown);
  const setActiveBoundaryLayer = useElectionStore(s => s.setActiveBoundaryLayer);

  const isDark = false;

  const isDrilledDown = drillDownParentDistrict !== null;

  const handleReset = () => {
    resetDrillDown();
    if (electionData?.districtType) {
      setActiveBoundaryLayer(electionData.districtType);
    } else {
      setActiveBoundaryLayer('boroughs');
    }
    if (onResetView) onResetView();
  };

  const electionName = electionData ? electionData.name.replace('2026 Primary - ', '') : '2026 Primary';

  return (
    <div className={`fixed top-20 left-6 z-20 flex items-center space-x-3 px-4 py-2 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 ${
      isDark
        ? 'bg-slate-900/90 border-slate-800 text-slate-100'
        : 'bg-white/95 border-slate-200 text-slate-900'
    }`}>
      {/* Breadcrumb Path Items */}
      <div className="flex items-center space-x-2 text-xs font-extrabold">
        <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span>{electionName}</span>
        </div>

        {isDrilledDown ? (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-800 dark:text-slate-200">
              District {drillDownParentDistrict} (Isolating Granular EDs)
            </span>
          </>
        ) : (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              {activeBoundaryLayer} View
            </span>
          </>
        )}
      </div>

      {/* Kornacki Reset Button */}
      {isDrilledDown && (
        <button
          onClick={handleReset}
          className="ml-2 flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>← Reset to Full Race</span>
        </button>
      )}
    </div>
  );
};
