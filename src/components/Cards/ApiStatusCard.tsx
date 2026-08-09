'use client';

import React, { useState } from 'react';
import { useElectionStore } from '@/store/useElectionStore';
import { fetchLiveNycOpenData, NYC_OPEN_DATA_ENDPOINTS } from '@/lib/nycOpenDataClient';
import { Radio, AlertCircle, RefreshCw, Key } from 'lucide-react';

export const ApiStatusCard: React.FC = () => {
  const isLiveApiLoading = useElectionStore(s => s.isLiveApiLoading);
  const liveApiError = useElectionStore(s => s.liveApiError);
  const liveApiEndpoint = useElectionStore(s => s.liveApiEndpoint);
  const setLiveApiStatus = useElectionStore(s => s.setLiveApiStatus);

  const [appToken, setAppToken] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);

  const activeEndpoint = NYC_OPEN_DATA_ENDPOINTS.find(e => e.url === liveApiEndpoint) || NYC_OPEN_DATA_ENDPOINTS[0];

  const handleTestFetch = async () => {
    setLiveApiStatus(true, null, activeEndpoint.url);
    const result = await fetchLiveNycOpenData(activeEndpoint.url, appToken || undefined);
    if (!result.success) {
      setLiveApiStatus(false, result.error || 'Connection failed', activeEndpoint.url);
    } else {
      setLiveApiStatus(false, null, activeEndpoint.url);
    }
  };

  return (
    <div className="fixed top-16 right-6 z-30 flex flex-col items-end gap-2 pointer-events-auto">
      <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl px-3 py-1.5 shadow-md text-xs font-bold text-slate-800">
        <Radio className={`w-3.5 h-3.5 ${liveApiError ? 'text-rose-500 animate-pulse' : isLiveApiLoading ? 'text-amber-500 animate-spin' : 'text-emerald-500'}`} />
        <span>Live BOE API:</span>
        <span className="font-extrabold text-blue-700">{activeEndpoint.name}</span>
        <button
          onClick={handleTestFetch}
          disabled={isLiveApiLoading}
          className="p-1 hover:bg-slate-100 rounded-md transition-all text-slate-600 hover:text-slate-900 disabled:opacity-50"
          title="Refresh Live API Endpoint"
        >
          <RefreshCw className={`w-3 h-3 ${isLiveApiLoading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => setShowKeyModal(true)}
          className="p-1 hover:bg-slate-100 rounded-md transition-all text-slate-600 hover:text-slate-900"
          title="Configure Socrata API Key Token"
        >
          <Key className="w-3 h-3" />
        </button>
      </div>

      {liveApiError && (
        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 shadow-lg max-w-[320px] text-xs text-rose-900">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-extrabold text-rose-950">Live API Error (Strict Mode)</span>
            <span className="text-[11px] leading-tight text-rose-800">{liveApiError}</span>
            <button
              onClick={handleTestFetch}
              className="mt-1 self-start px-2 py-0.5 bg-rose-600 text-white rounded font-bold text-[10px] hover:bg-rose-700 transition-all"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 max-w-sm w-full flex flex-col gap-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600" />
              Socrata API Token Settings
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter an optional Socrata App Token for high-rate live BOE queries from NYC Open Data.
            </p>
            <input
              type="text"
              placeholder="e.g. X-App-Token-XXXXXXXX"
              value={appToken}
              onChange={(e) => setAppToken(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
