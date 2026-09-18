import React, { useState, useEffect } from 'react';
import { 
  GitCommit, 
  Clock, 
  PlusCircle, 
  RefreshCw, 
  ArrowRight, 
  AlertTriangle, 
  Archive, 
  Trash2, 
  CheckCircle2, 
  Calendar 
} from 'lucide-react';
import { Fact, WhatChangedResponse, Message, User } from '../types/ledger';
import { ledgerApi } from '../api/client';

interface WhatChangedViewProps {
  onSelectFact: (fact: Fact) => void;
  activeUser: User;
}

export const WhatChangedView: React.FC<WhatChangedViewProps> = ({
  onSelectFact,
  activeUser,
}) => {
  const [timePreset, setTimePreset] = useState<'1h' | '24h' | '7d' | 'all'>('24h');
  const [customTimestamp, setCustomTimestamp] = useState<string>('');
  const [data, setData] = useState<WhatChangedResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const calculateSinceTimestamp = (preset: '1h' | '24h' | '7d' | 'all') => {
    const now = Date.now();
    switch (preset) {
      case '1h':
        return new Date(now - 3600 * 1000).toISOString();
      case '24h':
        return new Date(now - 24 * 3600 * 1000).toISOString();
      case '7d':
        return new Date(now - 7 * 24 * 3600 * 1000).toISOString();
      case 'all':
        return '2026-09-01T00:00:00Z';
    }
  };

  const fetchChanges = async (ts?: string) => {
    setLoading(true);
    const effectiveTs = ts || (customTimestamp ? new Date(customTimestamp).toISOString() : calculateSinceTimestamp(timePreset));
    try {
      const res = await ledgerApi.getWhatChanged(effectiveTs);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch changes:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChanges();
  }, [timePreset]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Time Window Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#11151F] border border-[#202738]">
        <div>
          <h2 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-[#A78BFA]" />
            What Changed (Temporal Diff Engine)
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Query all state mutations, version supersessions, newly arisen disputes, and decaying tasks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Presets */}
          <div className="flex items-center gap-1 bg-[#161B26] p-1 rounded-lg border border-[#262E40] text-xs">
            <button
              id="preset-1h"
              onClick={() => {
                setTimePreset('1h');
                setCustomTimestamp('');
              }}
              className={`px-2.5 py-1 rounded transition-colors ${
                timePreset === '1h' && !customTimestamp
                  ? 'bg-[#22293A] text-[#F8FAFC] font-medium'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              Past 1h
            </button>
            <button
              id="preset-24h"
              onClick={() => {
                setTimePreset('24h');
                setCustomTimestamp('');
              }}
              className={`px-2.5 py-1 rounded transition-colors ${
                timePreset === '24h' && !customTimestamp
                  ? 'bg-[#22293A] text-[#F8FAFC] font-medium'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              Past 24h
            </button>
            <button
              id="preset-7d"
              onClick={() => {
                setTimePreset('7d');
                setCustomTimestamp('');
              }}
              className={`px-2.5 py-1 rounded transition-colors ${
                timePreset === '7d' && !customTimestamp
                  ? 'bg-[#22293A] text-[#F8FAFC] font-medium'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              Past 7d
            </button>
            <button
              id="preset-all"
              onClick={() => {
                setTimePreset('all');
                setCustomTimestamp('');
              }}
              className={`px-2.5 py-1 rounded transition-colors ${
                timePreset === 'all' && !customTimestamp
                  ? 'bg-[#22293A] text-[#F8FAFC] font-medium'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              All Genesis
            </button>
          </div>

          <button
            id="btn-refresh-changes"
            onClick={() => fetchChanges()}
            className="p-1.5 rounded-lg bg-[#161B26] hover:bg-[#202738] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#262E40] transition-colors"
            title="Refresh changes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#38BDF8]' : ''}`} />
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-lg bg-[#0D1914] border border-[#0A3D2C] space-y-1">
              <span className="text-[10px] font-mono text-[#34D399] uppercase">
                Added Facts
              </span>
              <div className="text-xl font-bold font-mono text-white">
                {data.added.length}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0F1C2B] border border-[#14476B] space-y-1">
              <span className="text-[10px] font-mono text-[#38BDF8] uppercase">
                Updated / Superseded By
              </span>
              <div className="text-xl font-bold font-mono text-white">
                {data.updated.length}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#181B26] border border-[#2A3347] space-y-1">
              <span className="text-[10px] font-mono text-[#94A3B8] uppercase">
                Superseded Old
              </span>
              <div className="text-xl font-bold font-mono text-white">
                {data.superseded.length}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#270E15] border border-[#541D27] space-y-1">
              <span className="text-[10px] font-mono text-[#FB7185] uppercase">
                Disputed
              </span>
              <div className="text-xl font-bold font-mono text-white">
                {data.disputed.length}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#1C1816] border border-[#443833] space-y-1">
              <span className="text-[10px] font-mono text-[#D6D3D1] uppercase">
                Stale Tasks
              </span>
              <div className="text-xl font-bold font-mono text-white">
                {data.stale.length}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#141519] border border-[#2E313A] space-y-1">
              <span className="text-[10px] font-mono text-[#A1A1AA] uppercase">
                Forgotten / Purged
              </span>
              <div className="text-xl font-bold font-mono text-white">
                {data.forgotten.length}
              </div>
            </div>
          </div>

          {/* Detailed Categorized Sections */}
          <div className="space-y-6">
            {/* Superseded & Updated Lineage Changes */}
            {data.superseded.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#CBD5E1] uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8]" />
                  Supersessions & Lineage Updates
                </h3>
                <div className="space-y-2">
                  {data.superseded.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => onSelectFact(f)}
                      className="p-3.5 rounded-lg bg-[#121622] border border-[#222A3C] hover:border-[#38BDF8] cursor-pointer transition-colors flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#94A3B8] line-through">
                            {f.id}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#1C2230] text-[#94A3B8] line-through">
                            SUPERSEDED
                          </span>
                          <span className="text-[10px] text-[#64748B]">
                            Fact Key: {f.fact_key}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-[#E2E8F0] mt-1">
                          Previous value: <span className="text-[#94A3B8] font-mono line-through">{f.value}</span>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-[#64748B] font-mono">
                        <div>Superseded at: {f.valid_to ? new Date(f.valid_to).toLocaleTimeString() : 'Recent'}</div>
                        <div className="text-[#38BDF8] text-[10px] mt-0.5">Click to inspect replacement →</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disputed Changes */}
            {data.disputed.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#FB7185] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#F43F5E]" />
                  Active Disputes Arisen
                </h3>
                <div className="space-y-2">
                  {data.disputed.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => onSelectFact(f)}
                      className="p-3.5 rounded-lg bg-[#1E0F14] border border-[#441823] hover:border-[#FB7185] cursor-pointer transition-colors flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#FB7185] font-bold">
                            {f.id}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#38111A] text-[#FB7185]">
                            DISPUTED
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-[#FFE4E6] mt-1">
                          Contradicting claim: <span className="text-[#FB7185] font-mono font-bold">{f.value}</span>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-[#FDA4AF] font-mono">
                        <div>Recorded: {new Date(f.recorded_at).toLocaleTimeString()}</div>
                        <div className="text-[10px] text-[#F43F5E]">Requires confirmed resolution</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Newly Added Active Facts */}
            {data.added.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#34D399] uppercase tracking-wider flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-[#10B981]" />
                  Newly Added Facts
                </h3>
                <div className="space-y-2">
                  {data.added.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => onSelectFact(f)}
                      className="p-3.5 rounded-lg bg-[#0F1814] border border-[#163D2E] hover:border-[#10B981] cursor-pointer transition-colors flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#34D399] font-bold">
                            {f.id}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#063826] text-[#34D399]">
                            ACTIVE
                          </span>
                          <span className="text-[10px] text-[#64748B]">
                            {f.subject}::{f.attribute}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-[#F1F5F9] mt-1">
                          Value: <span className="text-[#34D399] font-mono">{f.value}</span>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-[#64748B] font-mono">
                        <div>Valid from: {new Date(f.valid_from).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Forgotten Purged Facts */}
            {data.forgotten.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-[#71717A]" />
                  Forgotten Facts (Explicit Forget Command)
                </h3>
                <div className="space-y-2">
                  {data.forgotten.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => onSelectFact(f)}
                      className="p-3.5 rounded-lg bg-[#111216] border border-[#242630] text-xs flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-mono text-[#71717A] line-through">{f.id}</span>
                        <div className="text-[#A1A1AA] line-through mt-0.5">
                          {f.subject} • {f.attribute} = {f.value}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#71717A]">
                        Purged from SQLite and Chroma
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
