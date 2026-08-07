'use client';

import React from 'react';
import { useElectionStore } from '@/store/useElectionStore';
import { CircleDot } from 'lucide-react';

export const BubbleLegendCard: React.FC = () => {
  const mapViewMode = useElectionStore(s => s.mapViewMode);
  const electionData = useElectionStore(s => s.electionData);
  const activeBoundaryLayer = useElectionStore(s => s.activeBoundaryLayer);

  if (mapViewMode === 'choropleth' || !electionData) return null;

  const isEd = activeBoundaryLayer === 'eds';
  const legendItems = isEd ? [
    { label: '+50 votes', size: 10 },
    { label: '+200 votes', size: 18 },
    { label: '+500+ votes', size: 28 },
  ] : [
    { label: '+500 votes', size: 12 },
    { label: '+2,500 votes', size: 22 },
    { label: '+10,000+ votes', size: 36 },
  ];

  return (
    <div className="absolute bottom-6 right-6 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3.5 shadow-xl text-slate-900 flex flex-col gap-2.5 max-w-[240px]">
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-1.5">
        <CircleDot className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="text-xs font-black tracking-tight text-slate-900">
          Proportional Lead Bubbles
        </span>
      </div>

      <div className="text-[11px] font-semibold text-slate-600 leading-tight">
        Circle area is strictly proportional to the winner&apos;s net vote margin lead (<span className="font-mono text-slate-900 font-bold">Winner − Runner Up</span>).
      </div>

      <div className="flex items-end justify-between px-1 pt-1">
        {legendItems.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <div
              style={{ width: `${item.size}px`, height: `${item.size}px` }}
              className="rounded-full bg-blue-500/60 border-2 border-blue-700 flex items-center justify-center shadow-sm"
            />
            <span className="text-[10px] font-extrabold font-mono text-slate-700">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
