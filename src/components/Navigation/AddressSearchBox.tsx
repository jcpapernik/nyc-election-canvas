'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface AddressSearchBoxProps {
  onSearchSelect?: (loc: { label: string; lng: number; lat: number }) => void;
}

export const AddressSearchBox: React.FC<AddressSearchBoxProps> = ({ onSearchSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ label: string; lng: number; lat: number }[]>([]);
  const [isLoadingGeocode, setIsLoadingGeocode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const lowerQ = q.toLowerCase();
    const localMatches: { label: string; lng: number; lat: number }[] = [];

    if ('times square'.includes(lowerQ)) localMatches.push({ label: 'Times Square, Manhattan, NY', lng: -73.9855, lat: 40.7580 });
    if ('grand central'.includes(lowerQ)) localMatches.push({ label: 'Grand Central Terminal, Manhattan, NY', lng: -73.9772, lat: 40.7527 });
    if ('barclays center'.includes(lowerQ)) localMatches.push({ label: 'Barclays Center, Brooklyn, NY', lng: -73.9754, lat: 40.6826 });
    if ('yankee stadium'.includes(lowerQ)) localMatches.push({ label: 'Yankee Stadium, Bronx, NY', lng: -73.9262, lat: 40.8296 });
    if ('flushing meadows'.includes(lowerQ)) localMatches.push({ label: 'Flushing Meadows Corona Park, Queens, NY', lng: -73.8448, lat: 40.7498 });

    if (localMatches.length > 0) {
      setSuggestions(localMatches);
      setShowSuggestions(true);
    }

    if (q.length < 2) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      setIsLoadingGeocode(true);
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&bbox=-74.26,40.49,-73.69,40.91&limit=6`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          setIsLoadingGeocode(false);
          if (data && data.features && data.features.length > 0) {
            const apiSuggestions: { label: string; lng: number; lat: number }[] = [];
            data.features.forEach((f: any) => {
              const p = f.properties || {};
              const house = p.housenumber ? p.housenumber + ' ' : '';
              const street = p.street || p.name || '';
              const rawStreet = (house + street).trim();
              if (!rawStreet) return;
              const city = p.district || p.city || p.county || 'New York';
              const zip = p.postcode ? ' ' + p.postcode : '';
              const formattedLabel = `${rawStreet}, ${city}, NY${zip}`;
              const [lng, lat] = f.geometry.coordinates;
              apiSuggestions.push({ label: formattedLabel, lng, lat });
            });

            const combined = [...localMatches, ...apiSuggestions];
            const uniqueMap = new Map<string, { label: string; lng: number; lat: number }>();
            combined.forEach(item => uniqueMap.set(item.label, item));

            const finalSuggestions = Array.from(uniqueMap.values()).slice(0, 6);
            if (finalSuggestions.length > 0) {
              setSuggestions(finalSuggestions);
            }
          }
        })
        .catch(() => { setIsLoadingGeocode(false); });
    }, 50);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery]);

  const handleSelectLocation = (loc: { label: string; lng: number; lat: number }) => {
    setSearchQuery(loc.label);
    setShowSuggestions(false);
    if (onSearchSelect) {
      onSearchSelect(loc);
    }
  };

  return (
    <div ref={searchContainerRef} className="relative w-full max-w-sm">
      <div className="flex items-center rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 shadow-sm text-slate-900 focus-within:border-blue-500 focus-within:bg-white transition-all">
        {isLoadingGeocode ? (
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin mr-2 shrink-0" />
        ) : (
          <Search className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
        )}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (searchQuery.trim()) setShowSuggestions(true);
          }}
          placeholder="Start typing any NYC address..."
          className="w-full bg-transparent text-xs font-semibold focus:outline-none text-slate-900 placeholder-slate-500"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            className="text-xs text-slate-600 hover:text-slate-900 ml-1 font-bold"
          >
            Clear
          </button>
        )}
      </div>

      {showSuggestions && searchQuery.trim().length > 0 && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-2xl border border-slate-200 bg-white text-slate-900 py-1.5 z-40 max-h-64 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 mb-1">
            Standard NYC Address Suggestions
          </div>
          {suggestions.map((loc, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectLocation(loc)}
              className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center space-x-2 hover:bg-slate-100 text-slate-900 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{loc.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
