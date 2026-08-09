'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, Check, Vote, ChevronRight } from 'lucide-react';
import { IndexRaceItem } from './ControlHeader';

interface RaceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  racesIndex: IndexRaceItem[];
  selectedRaceId: string;
  onSelectRace: (raceId: string) => void;
  isDark: boolean;
}

const CATEGORIES = [
  { id: 'All', label: 'All Offices' },
  { id: 'US House (Congressional)', label: 'US House (Congressional)' },
  { id: 'NY State Senate', label: 'NY State Senate' },
  { id: 'NY State Assembly', label: 'NY State Assembly' },
  { id: 'NYC City Council', label: 'NYC City Council' },
  { id: 'Citywide / Statewide', label: 'Citywide / Statewide' },
  { id: 'Judicial & Party Offices', label: 'Judicial & Party Offices' }
];

export const RaceSelectorModal: React.FC<RaceSelectorModalProps> = ({
  isOpen,
  onClose,
  racesIndex,
  selectedRaceId,
  onSelectRace,
  isDark
}) => {
  const [selectedParty, setSelectedParty] = useState<'Democratic' | 'Republican'>('Democratic');
  const [activeCategory, setActiveCategory] = useState<string>('US House (Congressional)');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredRaces = useMemo(() => {
    return racesIndex.filter(r => {
      const partyMatch = r.party.toLowerCase() === selectedParty.toLowerCase();
      const catMatch = activeCategory === 'All' || r.officeCategory === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const searchMatch = !q ||
        r.name.toLowerCase().includes(q) ||
        (r.candidatesSummary || '').toLowerCase().includes(q) ||
        r.districtKey.toLowerCase().includes(q);

      return partyMatch && catMatch && searchMatch;
    });
  }, [racesIndex, selectedParty, activeCategory, searchQuery]);

  if (!isOpen) return null;

  const isRepSelected = selectedParty === 'Republican';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-4xl max-h-[88vh] rounded-3xl shadow-2xl border flex flex-col overflow-hidden transition-all duration-300 ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl text-white shadow-md transition-colors ${
              isRepSelected ? 'bg-red-600 shadow-red-500/20' : 'bg-blue-600 shadow-blue-500/20'
            }`}>
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                Contest Explorer
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Official 2026 NYC Primary & General Election Contests
              </p>
            </div>
          </div>

          {/* Party Segmented Toggle Button */}
          <div className="flex items-center space-x-3">
            <div className={`flex rounded-xl p-1 border ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setSelectedParty('Democratic')}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                  selectedParty === 'Democratic'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Democratic Primary
              </button>
              <button
                onClick={() => setSelectedParty('Republican')}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                  selectedParty === 'Republican'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Republican Primary
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Search Bar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <div className={`flex items-center rounded-xl border px-3.5 py-2 transition-all w-full ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-white focus-within:border-blue-500'
              : 'bg-white border-slate-300 text-slate-900 focus-within:border-blue-500 shadow-sm'
          }`}>
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by district number, office, or candidate name..."
              className="w-full bg-transparent text-xs font-semibold focus:outline-none placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-2"
              >
                Clear
              </button>
            )}
          </div>
          <span className="text-xs font-extrabold text-slate-500 shrink-0 px-2 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800">
            {filteredRaces.length} Contests
          </span>
        </div>

        {/* Modal Body: Sidebar Categories + Race Cards Grid */}
        <div className="flex flex-1 overflow-hidden min-h-[400px]">
          {/* Category Tabs Sidebar */}
          <div className="w-56 border-r border-slate-200 dark:border-slate-800 p-3 space-y-1 overflow-y-auto shrink-0 bg-slate-50/80 dark:bg-slate-900/40">
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Office Categories
            </div>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all ${
                  activeCategory === cat.id
                    ? (isRepSelected
                        ? 'bg-red-600/15 text-red-700 dark:text-red-300 border border-red-500/30'
                        : 'bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-500/30')
                    : (isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100')
                }`}
              >
                <span className="truncate">{cat.label}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
              </button>
            ))}
          </div>

          {/* Race Cards Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            {filteredRaces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredRaces.map((race) => {
                  const isSelected = race.id === selectedRaceId;
                  const candidateCleanStr = (race.candidatesSummary || '').replace(/^\s*\(/, '').replace(/\)\s*$/, '');

                  return (
                    <button
                      key={race.id}
                      onClick={() => {
                        onSelectRace(race.id);
                        onClose();
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all duration-200 relative group flex flex-col justify-between ${
                        isSelected
                          ? (isRepSelected
                              ? 'bg-red-50/90 border-red-500 ring-2 ring-red-500/20'
                              : 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20')
                          : (isDark ? 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md')
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <div className="flex items-center space-x-1.5">
                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                              isRepSelected
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                            }`}>
                              {race.districtKey !== 'NYC' ? `District ${race.districtKey}` : 'Citywide'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              race.isUncontested
                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            }`}>
                              {race.isUncontested ? 'Uncontested' : 'Contested'}
                            </span>
                          </div>
                          {isSelected && (
                            <span className={`flex items-center space-x-1 text-[11px] font-extrabold ${
                              isRepSelected ? 'text-red-600' : 'text-blue-600'
                            }`}>
                              <Check className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 mb-1">
                          {race.name.replace('2026 Primary - ', '')}
                        </h3>

                        {candidateCleanStr && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                            Candidates: <span className="text-slate-700 dark:text-slate-300 font-bold">{candidateCleanStr}</span>
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                <Vote className="w-8 h-8 text-slate-400 mb-2" />
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">No Contests Found</h3>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  No {selectedParty} primary races match your current search criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
