import React, { useState } from 'react';
import { 
  X, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Radio, 
  Link, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { ledgerApi, ConnectionStatus } from '../api/client';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const currentStatus = ledgerApi.getConnectionStatus();
  const [urlInput, setUrlInput] = useState<string>(currentStatus.backendUrl);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; error?: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    ledgerApi.setBackendUrl(urlInput);
    const res = await ledgerApi.testConnection();
    setTestResult(res);
    setTesting(false);
    onRefresh();
  };

  const handleToggleMock = (enableMock: boolean) => {
    ledgerApi.setMockMode(enableMock);
    setTestResult(null);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        id="connection-modal-container"
        className="w-full max-w-xl bg-[#121622] border border-[#262F44] rounded-2xl shadow-2xl overflow-hidden text-xs"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#1E2538] flex items-center justify-between bg-[#151A28]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1D2536] border border-[#2E3A54] flex items-center justify-center text-[#38BDF8]">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase font-mono">
                Backend Transport & Architecture
              </h2>
              <p className="text-[11px] text-[#94A3B8]">
                FastAPI External Service Configuration (Section 4 API Contract)
              </p>
            </div>
          </div>

          <button
            id="btn-close-conn-modal"
            onClick={onClose}
            className="p-1 rounded-md text-[#94A3B8] hover:text-white hover:bg-[#1E2536] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {/* Active Status Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              currentStatus.isMock
                ? 'bg-[#261B0E] border-[#78350F] text-[#FDE68A]'
                : currentStatus.status === 'connected'
                ? 'bg-[#0B1E15] border-[#065F46] text-[#A7F3D0]'
                : 'bg-[#2B1015] border-[#7F1D1D] text-[#FECDD3]'
            }`}
          >
            <Radio
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                currentStatus.isMock
                  ? 'text-[#F59E0B]'
                  : currentStatus.status === 'connected'
                  ? 'text-[#10B981]'
                  : 'text-[#EF4444]'
              }`}
            />
            <div className="space-y-1 flex-1">
              <div className="font-bold text-xs uppercase tracking-wide">
                Active Mode:{' '}
                {currentStatus.isMock
                  ? 'Isolated Development Adapter (Mock Mode)'
                  : currentStatus.status === 'connected'
                  ? `Live Authoritative FastAPI (${currentStatus.lastPingMs}ms)`
                  : 'FastAPI Backend Disconnected'}
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">
                {currentStatus.isMock
                  ? 'Running isolated in-memory deterministic simulation with localStorage persistence. No fake successful API responses are concealed as live production data.'
                  : currentStatus.status === 'connected'
                  ? 'All reads, writes, queries, and evaluations are dispatched to the external Python/FastAPI service.'
                  : `Unable to connect to ${currentStatus.backendUrl}. Check that your FastAPI server is running.`}
              </p>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              id="btn-switch-mock"
              onClick={() => handleToggleMock(true)}
              className={`p-3 rounded-xl border text-left transition-all ${
                currentStatus.isMock
                  ? 'bg-[#1C2130] border-[#F59E0B] shadow-sm'
                  : 'bg-[#141824] border-[#22293C] hover:border-[#384560]'
              }`}
            >
              <div className="font-bold text-[#F8FAFC] flex items-center justify-between">
                <span>Dev Adapter (Mock)</span>
                {currentStatus.isMock && <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B]" />}
              </div>
              <p className="text-[10px] text-[#94A3B8] mt-1">
                Zero-setup local testing. Runs Section 2/3 rules in browser.
              </p>
            </button>

            <button
              id="btn-switch-live"
              onClick={() => handleToggleMock(false)}
              className={`p-3 rounded-xl border text-left transition-all ${
                !currentStatus.isMock
                  ? 'bg-[#1C2130] border-[#10B981] shadow-sm'
                  : 'bg-[#141824] border-[#22293C] hover:border-[#384560]'
              }`}
            >
              <div className="font-bold text-[#F8FAFC] flex items-center justify-between">
                <span>Live FastAPI Backend</span>
                {!currentStatus.isMock && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
              </div>
              <p className="text-[10px] text-[#94A3B8] mt-1">
                Authoritative external Python server (Section 4 API).
              </p>
            </button>
          </div>

          {/* Backend URL Input & Ping */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#CBD5E1] block">
              FastAPI External Service Endpoint URL:
            </label>
            <div className="flex items-center gap-2">
              <input
                id="input-backend-url"
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 bg-[#0E121B] border border-[#262F44] focus:border-[#38BDF8] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-[#64748B] focus:outline-none"
              />
              <button
                id="btn-ping-backend"
                onClick={handleTest}
                disabled={testing}
                className="px-3.5 py-2 rounded-lg bg-[#1E2638] hover:bg-[#28334C] text-[#CBD5E1] border border-[#334155] font-mono font-medium transition-colors flex items-center gap-1.5"
              >
                {testing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#38BDF8]" />
                ) : (
                  <Link className="w-3.5 h-3.5 text-[#38BDF8]" />
                )}
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded-lg border text-[11px] font-mono ${
                  testResult.success
                    ? 'bg-[#0B1E15] border-[#065F46] text-[#34D399]'
                    : 'bg-[#2B1015] border-[#7F1D1D] text-[#FB7185]'
                }`}
              >
                {testResult.success
                  ? `Connection succeeded! Server responded in ${testResult.latencyMs} ms.`
                  : `Connection test failed: ${testResult.error || 'Server unreachable'}`}
              </div>
            )}
          </div>

          {/* Section 4 Locked API Endpoints Reference */}
          <div className="space-y-1.5 pt-2 border-t border-[#1E2538]">
            <span className="text-[10px] font-mono text-[#64748B] uppercase">
              Section 4 Locked API Surface:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-[#94A3B8]">
              <div className="p-1.5 rounded bg-[#0E121A] border border-[#1A202E]">
                <strong className="text-[#CBD5E1]">POST /login</strong> — {'{name}'}
              </div>
              <div className="p-1.5 rounded bg-[#0E121A] border border-[#1A202E]">
                <strong className="text-[#CBD5E1]">POST /messages</strong> — ingest
              </div>
              <div className="p-1.5 rounded bg-[#0E121A] border border-[#1A202E]">
                <strong className="text-[#CBD5E1]">POST /query</strong> — as_of time-travel
              </div>
              <div className="p-1.5 rounded bg-[#0E121A] border border-[#1A202E]">
                <strong className="text-[#CBD5E1]">GET /memories</strong> — timeline graph
              </div>
              <div className="p-1.5 rounded bg-[#0E121A] border border-[#1A202E]">
                <strong className="text-[#CBD5E1]">POST /what-changed</strong> — mutations
              </div>
              <div className="p-1.5 rounded bg-[#0E121A] border border-[#1A202E]">
                <strong className="text-[#CBD5E1]">POST /eval/run</strong> — 16/16 scoreboard
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1E2538] bg-[#141824] flex items-center justify-between">
          <span className="text-[10px] text-[#64748B]">
            Identity is strictly validated server-side from session token
          </span>
          <button
            id="btn-done-conn-modal"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#38BDF8] hover:bg-[#0284C7] text-black font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
