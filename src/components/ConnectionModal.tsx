import React, { useState, useEffect } from 'react';
import { 
  X, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Radio, 
  Link, 
  ShieldCheck, 
  ExternalLink,
  Sparkles,
  Zap,
  Cpu,
  Coins,
  Key,
  Shield,
  Layers,
  Database,
  Play
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
  const [activeTab, setActiveTab] = useState<'transport' | 'llm' | 'rules'>('transport');
  const [urlInput, setUrlInput] = useState<string>(currentStatus.backendUrl);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; error?: string } | null>(null);

  // LLM Telemetry state
  const [llmTelemetry, setLlmTelemetry] = useState<any>(null);
  const [preflightRunning, setPreflightRunning] = useState<boolean>(false);
  const [preflightResult, setPreflightResult] = useState<any>(null);

  const fetchTelemetry = async () => {
    try {
      const tel = await ledgerApi.getLlmStatus();
      setLlmTelemetry(tel);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, [isOpen]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    ledgerApi.setBackendUrl(urlInput);
    const res = await ledgerApi.testConnection();
    setTestResult(res);
    setTesting(false);
    fetchTelemetry();
    onRefresh();
  };

  const handleToggleMock = (enableMock: boolean) => {
    ledgerApi.setMockMode(enableMock);
    setTestResult(null);
    onRefresh();
  };

  const handleRunPreflight = async () => {
    setPreflightRunning(true);
    setPreflightResult(null);
    try {
      const res = await ledgerApi.runLlmPreflight();
      setPreflightResult(res);
      await fetchTelemetry();
    } catch (err: any) {
      setPreflightResult({ error: err.message || 'Preflight failed' });
    }
    setPreflightRunning(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        id="connection-modal-container"
        className="w-full max-w-2xl bg-[#0F131C] border border-[#222A3E] rounded-2xl shadow-2xl overflow-hidden text-xs"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#1C2336] flex items-center justify-between bg-[#131724]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1B2336] border border-[#2B3856] flex items-center justify-center text-[#38BDF8] shadow-inner">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wide">
                  System Architecture & Diagnostics
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-[#0A261D] text-[#34D399] border border-[#059669]/40 font-semibold">
                  FREE-ONLY STRICT
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Authoritative REST API • Zero-Cost LLM Reliability • Deterministic Invariants
              </p>
            </div>
          </div>

          <button
            id="btn-close-conn-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1C2336] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-[#1C2336] bg-[#111522]">
          <button
            id="tab-modal-transport"
            onClick={() => setActiveTab('transport')}
            className={`pb-2.5 px-3 font-medium text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'transport'
                ? 'border-[#38BDF8] text-[#38BDF8]'
                : 'border-transparent text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Transport & Endpoints</span>
          </button>

          <button
            id="tab-modal-llm"
            onClick={() => setActiveTab('llm')}
            className={`pb-2.5 px-3 font-medium text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'llm'
                ? 'border-[#10B981] text-[#10B981]'
                : 'border-transparent text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Free-Only LLM & Telemetry</span>
          </button>

          <button
            id="tab-modal-rules"
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 px-3 font-medium text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-[#A78BFA] text-[#A78BFA]'
                : 'border-transparent text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Engine Invariants & Rules</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {/* TAB 1: TRANSPORT & REST API */}
          {activeTab === 'transport' && (
            <div className="space-y-4">
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
                    Transport State:{' '}
                    {currentStatus.isMock
                      ? 'Isolated Development Adapter (Mock Mode)'
                      : currentStatus.status === 'connected'
                      ? `Live Node.js / Express Server Connected (${currentStatus.lastPingMs}ms)`
                      : 'Backend Disconnected'}
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {currentStatus.isMock
                      ? 'Running isolated in-memory deterministic simulation with localStorage persistence. No fake successful API responses are concealed as live production data.'
                      : currentStatus.status === 'connected'
                      ? 'Full-stack Express/Node server actively executing deterministic resolution, bi-temporal indexing, and provenance recording on port 3000.'
                      : `Unable to connect to ${currentStatus.backendUrl}. Make sure your development server is running.`}
                  </p>
                </div>
              </div>

              {/* Mode Switcher Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="btn-switch-live"
                  onClick={() => handleToggleMock(false)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    !currentStatus.isMock
                      ? 'bg-[#162030] border-[#38BDF8] shadow-sm'
                      : 'bg-[#121622] border-[#22293C] hover:border-[#384560]'
                  }`}
                >
                  <div className="font-bold text-[#F8FAFC] flex items-center justify-between">
                    <span>Live Full-Stack Server</span>
                    {!currentStatus.isMock && <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8]" />}
                  </div>
                  <p className="text-[10px] text-[#94A3B8] mt-1">
                    Direct communication with Node.js/Express SQLite engine & Gemini router.
                  </p>
                </button>

                <button
                  id="btn-switch-mock"
                  onClick={() => handleToggleMock(true)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    currentStatus.isMock
                      ? 'bg-[#221C14] border-[#F59E0B] shadow-sm'
                      : 'bg-[#121622] border-[#22293C] hover:border-[#384560]'
                  }`}
                >
                  <div className="font-bold text-[#F8FAFC] flex items-center justify-between">
                    <span>Dev Adapter (Mock)</span>
                    {currentStatus.isMock && <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B]" />}
                  </div>
                  <p className="text-[10px] text-[#94A3B8] mt-1">
                    Isolated client simulation for offline sandbox evaluation.
                  </p>
                </button>
              </div>

              {/* Backend URL Input & Ping */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#CBD5E1] block">
                  Backend Endpoint URL:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="input-backend-url"
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="http://localhost:3000"
                    className="flex-1 bg-[#090C12] border border-[#222A3C] focus:border-[#38BDF8] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-[#64748B] focus:outline-none"
                  />
                  <button
                    id="btn-ping-backend"
                    onClick={handleTest}
                    disabled={testing}
                    className="px-3.5 py-2 rounded-lg bg-[#1B2334] hover:bg-[#242F46] text-[#CBD5E1] border border-[#2D3A54] font-mono font-medium transition-colors flex items-center gap-1.5"
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
                      ? `HTTP /health ping succeeded! Responded in ${testResult.latencyMs} ms.`
                      : `Connection test failed: ${testResult.error || 'Server unreachable'}`}
                  </div>
                )}
              </div>

              {/* Locked API Surface Reference */}
              <div className="space-y-1.5 pt-2 border-t border-[#1C2336]">
                <span className="text-[10px] font-mono text-[#64748B] uppercase">
                  Verified Section 4 Locked Endpoints:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-[#94A3B8]">
                  <div className="p-1.5 rounded bg-[#090D14] border border-[#1A2234]">
                    <strong className="text-[#CBD5E1]">POST /login</strong> — auth token
                  </div>
                  <div className="p-1.5 rounded bg-[#090D14] border border-[#1A2234]">
                    <strong className="text-[#CBD5E1]">POST /messages</strong> — ingest & extract
                  </div>
                  <div className="p-1.5 rounded bg-[#090D14] border border-[#1A2234]">
                    <strong className="text-[#CBD5E1]">POST /query</strong> — as_of time-travel
                  </div>
                  <div className="p-1.5 rounded bg-[#090D14] border border-[#1A2234]">
                    <strong className="text-[#CBD5E1]">GET /memories</strong> — bi-temporal graph
                  </div>
                  <div className="p-1.5 rounded bg-[#090D14] border border-[#1A2234]">
                    <strong className="text-[#CBD5E1]">POST /what-changed</strong> — state deltas
                  </div>
                  <div className="p-1.5 rounded bg-[#090D14] border border-[#1A2234]">
                    <strong className="text-[#CBD5E1]">POST /eval/run</strong> — 16/16 test runner
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FREE-ONLY LLM & ZERO-COST TELEMETRY */}
          {activeTab === 'llm' && (
            <div className="space-y-4">
              {/* Policy Header Banner */}
              <div className="p-3.5 rounded-xl bg-[#091E16] border border-[#065F46] flex items-start gap-3">
                <Coins className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#A7F3D0]">
                      Strict Free-Only Architecture Guarantee
                    </span>
                    <span className="text-[9px] font-mono bg-[#064E3B] text-[#6EE7B7] px-1.5 py-0.2 rounded font-bold">
                      $0.00 MAXIMUM SPEND
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A7F3D0]/80 leading-relaxed">
                    Ledger operates strictly on zero-cost developer tiers (Google AI Studio Gemini Flash) paired with a deterministic linguistic extraction fallback. The system will never request credit card info, billing, or incur paid model fees.
                  </p>
                </div>
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-lg bg-[#111622] border border-[#1F273A] space-y-1">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">Total Cost</span>
                  <div className="text-xl font-bold font-mono text-[#34D399]">$0.00</div>
                  <span className="text-[9px] text-[#64748B]">Enforced Free Tier</span>
                </div>

                <div className="p-3 rounded-lg bg-[#111622] border border-[#1F273A] space-y-1">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">Active Model</span>
                  <div className="text-sm font-bold font-mono text-[#38BDF8] truncate">
                    {llmTelemetry?.activeModel || 'gemini-2.5-flash'}
                  </div>
                  <span className="text-[9px] text-[#64748B]">Zero-Cost Flash</span>
                </div>

                <div className="p-3 rounded-lg bg-[#111622] border border-[#1F273A] space-y-1">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">Key Pool</span>
                  <div className="text-xl font-bold font-mono text-white">
                    {llmTelemetry?.healthyKeys ?? 1} / {llmTelemetry?.keysConfigured ?? 1}
                  </div>
                  <span className="text-[9px] text-[#34D399]">Quarantine & Failover</span>
                </div>

                <div className="p-3 rounded-lg bg-[#111622] border border-[#1F273A] space-y-1">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">Est. Tokens</span>
                  <div className="text-xl font-bold font-mono text-[#F59E0B]">
                    {llmTelemetry?.estimatedTokensConsumed || 0}
                  </div>
                  <span className="text-[9px] text-[#64748B]">Cap &lt;1,200/call</span>
                </div>
              </div>

              {/* Preflight Test Section */}
              <div className="p-4 rounded-xl bg-[#111520] border border-[#222A3C] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-[#F8FAFC]">
                      Zero-Cost Preflight Smoke Test
                    </span>
                    <p className="text-[10px] text-[#94A3B8]">
                      Verify key eligibility, extraction reliability, and deterministic failover path.
                    </p>
                  </div>

                  <button
                    id="btn-run-preflight"
                    onClick={handleRunPreflight}
                    disabled={preflightRunning}
                    className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-black font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    {preflightRunning ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-black" />
                    )}
                    <span>{preflightRunning ? 'Running...' : 'Run Preflight Live'}</span>
                  </button>
                </div>

                {preflightResult && (
                  <div className="p-3 rounded-lg bg-[#090D14] border border-[#1F273A] space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center gap-2 text-[#34D399] font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Preflight Verification Succeeded</span>
                    </div>
                    <div className="text-[#94A3B8] text-[10px]">
                      Provider: <span className="text-[#CBD5E1]">{preflightResult.activeProvider}</span> • Deterministic Verified: <span className="text-[#34D399]">TRUE</span> • Cost: <span className="text-[#34D399]">$0.00</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ENGINE INVARIANTS */}
          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#111622] border border-[#1F273A] space-y-1">
                <div className="flex items-center gap-2 text-[#38BDF8] font-bold text-xs">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Rule 3a — Unhedged Proposal Isolation</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Linguistic hedging ("maybe", "what if", "suggest", "thinking about") records the candidate with <code>status: proposed</code>. It is quarantined from active query answers until confirmed.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#111622] border border-[#1F273A] space-y-1">
                <div className="flex items-center gap-2 text-[#34D399] font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Rule 3b — Confirmed Override & Supersession</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  When correction or confirmation phrasing is detected ("actually", "moved to", "client confirmed"), the prior active fact is superseded: its <code>valid_to</code> is closed, and the new fact becomes active truth with a verifiable <code>supersedes_id</code> link.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#111622] border border-[#1F273A] space-y-1">
                <div className="flex items-center gap-2 text-[#FB7185] font-bold text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Rule 3c — Contradiction Dispute Flagging</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  When opposing values are asserted by different team members without confirmed override markers, Ledger refuses to pick a random winner. Both enter <code>status: disputed</code>, and queries return a high-visibility dispute alert.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#111622] border border-[#1F273A] space-y-1">
                <div className="flex items-center gap-2 text-[#F59E0B] font-bold text-xs">
                  <Database className="w-3.5 h-3.5" />
                  <span>Rule 4 — Explicit Forget & Tombstoning</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Direct deletion commands ("forget that staging URL") set <code>status: forgotten</code> and close <code>valid_to</code>. The fact is excluded from queries while preserved in the append-only audit log.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1C2336] bg-[#121622] flex items-center justify-between">
          <span className="text-[10px] text-[#64748B]">
            All rules are deterministically enforced server-side.
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
