'use client';

import React, { useState, useEffect } from 'react';
import { useElectionStore, BoundaryLayerType } from '@/store/useElectionStore';
import { Map as MapIcon, ShieldCheck, ChevronDown, Vote, Layers } from 'lucide-react';
import { RaceSelectorModal } from './RaceSelectorModal';
import { AddressSearchBox } from './AddressSearchBox';
import { fetchJsonCached } from '@/lib/fetchCache';

export interface IndexRaceItem {
  id: string;
  name: string;
  party: string;
  officeCategory: string;
  districtKey: string;
  voteCount: number;
  candidatesSummary?: string;
}

interface ControlHeaderProps {
  onSearchSelect?: (loc: { label: string; lng: number; lat: number }) => void;
}

export const ControlHeader: React.FC<ControlHeaderProps> = ({ onSearchSelect }) => {
  const activeBoundaryLayer = useElectionStore(s => s.activeBoundaryLayer);
  const selectedElectionId = useElectionStore(s => s.selectedElectionId);
  const setActiveBoundaryLayer = useElectionStore(s => s.setActiveBoundaryLayer);
  const setSelectedElectionId = useElectionStore(s => s.setSelectedElectionId);
  const setElectionData = useElectionStore(s => s.setElectionData);

  const [racesIndex, setRacesIndex] = useState<IndexRaceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

  useEffect(() => {
    fetchJsonCached<IndexRaceItem[]>(`${BASE_PATH}/data/elections/index.json`)
      .then((data) => {
        if (data && data.length > 0) {
          setRacesIndex(data);
          if (!selectedElectionId || !data.some(d => d.id === selectedElectionId)) {
            const defaultRace = data.find(d => d.officeCategory === 'US House (Congressional)') || data[0];
            setSelectedElectionId(defaultRace.id);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedElectionId) return;

    fetchJsonCached(`${BASE_PATH}/data/elections/${selectedElectionId}.json`)
      .then(data => {
        setElectionData(data);
        if (data && data.districtType) {
          setActiveBoundaryLayer(data.districtType);
        }
      })
      .catch(() => {});
  }, [selectedElectionId]);

  const activeRaceItem = racesIndex.find(r => r.id === selectedElectionId);
  const electionData = useElectionStore(s => s.electionData);
  const isRepublican = selectedElectionId?.startsWith('republican') || activeRaceItem?.party === 'Republican' || electionData?.party === 'Republican' || electionData?.party === 'REP';

  const raceButtonLabel = activeRaceItem
    ? `${activeRaceItem.name.replace('2026 Primary - ', '')}`
    : 'Select Election Race';

  const layerOptions: { value: BoundaryLayerType; label: string }[] = [
    { value: 'citywide', label: 'NYC Citywide Total' },
    { value: 'boroughs', label: 'Boroughs' },
    { value: 'council', label: 'NYC City Council Districts' },
    { value: 'eds', label: 'Election Districts' },
    { value: 'assembly', label: 'NY State Assembly Districts' },
    { value: 'senate', label: 'NY State Senate Districts' },
    { value: 'congressional', label: 'US Congressional Districts' },
  ];

  const mapViewMode = useElectionStore(s => s.mapViewMode);
  const setMapViewMode = useElectionStore(s => s.setMapViewMode);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-30 border-b px-5 py-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md backdrop-blur-md transition-colors duration-300 ${
        isRepublican ? 'border-red-200 bg-red-50/90 text-red-950' : 'border-blue-200 bg-blue-50/90 text-blue-950'
      }`}>
        <div className="flex items-center space-x-3 shrink-0">
          <div className={`p-2 rounded-xl text-white shadow-md flex items-center justify-center transition-colors ${
            isRepublican ? 'bg-red-600 shadow-red-500/30' : 'bg-blue-600 shadow-blue-500/30'
          }`}>
            <MapIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-base tracking-tight text-slate-900">
                NYC ELECTION CANVAS
              </h1>
              <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5 transition-colors ${
                isRepublican ? 'bg-red-600 border border-red-700 shadow-red-500/20' : 'bg-blue-600 border border-blue-700 shadow-blue-500/20'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {isRepublican ? 'REPUBLICAN PRIMARY' : 'DEMOCRATIC PRIMARY'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600">
              2D Spatial Election Map & Precinct Inspector
            </p>
          </div>
        </div>

        <AddressSearchBox onSearchSelect={onSearchSelect} />

        <div className="flex items-center space-x-2 shrink-0">
          {/* Map View Mode Segmented Control */}
          <div className="flex items-center p-0.5 rounded-xl border border-slate-200 bg-white/80 text-slate-700 text-xs font-bold shadow-sm">
            <button
              onClick={() => setMapViewMode('choropleth')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                mapViewMode === 'choropleth'
                  ? (isRepublican ? 'bg-red-600 text-white shadow-sm font-extrabold' : 'bg-blue-600 text-white shadow-sm font-extrabold')
                  : 'hover:text-slate-900'
              }`}
              title="Standard Shaded Map"
            >
              Choropleth
            </button>
            <button
              onClick={() => setMapViewMode('bubbles')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                mapViewMode === 'bubbles'
                  ? (isRepublican ? 'bg-red-600 text-white shadow-sm font-extrabold' : 'bg-blue-600 text-white shadow-sm font-extrabold')
                  : 'hover:text-slate-900'
              }`}
              title="NYT-Style Proportional Circles (Vote Margin Size)"
            >
              Bubbles
            </button>
          </div>

          {/* Race Selector Modal Trigger Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center space-x-2 rounded-xl px-3 py-1.5 border text-xs font-extrabold shadow-sm transition-all ${
              isRepublican
                ? 'border-red-300 bg-white text-red-950 hover:bg-red-100/80'
                : 'border-blue-300 bg-white text-blue-950 hover:bg-blue-100/80'
            }`}
          >
            <Vote className={`w-4 h-4 shrink-0 ${isRepublican ? 'text-red-600' : 'text-blue-600'}`} />
            <span className="max-w-[160px] truncate">{raceButtonLabel}</span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 ${isRepublican ? 'text-red-600' : 'text-blue-600'}`} />
          </button>

          {/* Boundary Layer Dropdown */}
          <div className="flex items-center space-x-1.5 rounded-xl p-1 border border-slate-200 bg-slate-100">
            <div className="pl-2 text-slate-600 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-bold text-slate-900">Boundary:</span>
            </div>
            <div className="relative">
              <select
                value={activeBoundaryLayer}
                onChange={(e) => setActiveBoundaryLayer(e.target.value as BoundaryLayerType)}
                className="appearance-none rounded-lg border border-slate-300 bg-white px-2.5 py-1 pr-7 text-xs font-bold text-slate-900 shadow-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all"
              >
                {layerOptions.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    className="bg-white text-slate-900"
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </header>

      <RaceSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        racesIndex={racesIndex}
        selectedRaceId={selectedElectionId}
        onSelectRace={(raceId) => setSelectedElectionId(raceId)}
        isDark={false}
      />
    </>
  );
};
