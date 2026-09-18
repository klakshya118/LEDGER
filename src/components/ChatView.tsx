import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  ArrowRight,
  Database,
  Lock,
  Layers,
  FileText,
  User as UserIcon,
  RefreshCw,
  Trash2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Info,
  Terminal,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Fact, Message, User, QueryResponse, IngestMessageResponse } from '../types/ledger';
import { ledgerApi } from '../api/client';

export interface ChatInteraction {
  id: string;
  type: 'query' | 'ingest';
  author: User;
  timestamp: string;
  input: string;
  asOf?: string;
  response?: QueryResponse;
  ingestResponse?: IngestMessageResponse;
  error?: string;
  endpointCalled?: string;
  isSimulatedFailure?: boolean;
}

interface ChatViewProps {
  activeUser: User;
  onUserChange?: (user: User) => void;
  onOpenEvidence: (factId: string) => void;
  onRefreshMemories: () => void;
  factsMap: Record<string, Fact>;
}

const AVAILABLE_USERS: User[] = [
  {
    id: 'u-alice',
    workspace_id: 'ws-ledger-main',
    name: 'Alice Chen',
    email: 'alice@ledger.internal',
    avatar_color: '#3B82F6',
  },
  {
    id: 'u-bob',
    workspace_id: 'ws-ledger-main',
    name: 'Bob Martinez',
    email: 'bob@ledger.internal',
    avatar_color: '#10B981',
  },
  {
    id: 'u-carol',
    workspace_id: 'ws-ledger-main',
    name: 'Carol Danvers',
    email: 'carol@ledger.internal',
    avatar_color: '#8B5CF6',
  },
];

export const ChatView: React.FC<ChatViewProps> = ({
  activeUser,
  onUserChange,
  onOpenEvidence,
  onRefreshMemories,
  factsMap,
}) => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<'query' | 'ingest'>('query');
  const [asOfDate, setAsOfDate] = useState<string>('');
  const [isAsOfActive, setIsAsOfActive] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<string>('Executing request...');
  const [loadingElapsed, setLoadingElapsed] = useState<number>(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Pre-seed conversation with initial demo interactions
  const [interactions, setInteractions] = useState<ChatInteraction[]>([
    {
      id: 'seed-1',
      type: 'ingest',
      author: {
        id: 'u-alice',
        workspace_id: 'ws-ledger-main',
        name: 'Alice Chen',
        email: 'alice@ledger.internal',
        avatar_color: '#3B82F6',
      },
      timestamp: '2026-09-15T10:00:00Z',
      input: "We're using MongoDB.",
      endpointCalled: '/workspaces/ws-ledger-main/messages',
      ingestResponse: {
        message_id: 'msg-001',
        workspace_id: 'ws-ledger-main',
        source_user_id: 'u-alice',
        created_at: '2026-09-15T10:00:00Z',
        candidates: [
          {
            subject: 'project',
            attribute: 'database',
            value: 'MongoDB',
            type: 'fact',
            epistemic_status: 'asserted',
            override_signal: false,
            valid_from: null,
            asserted_strength: 0.9,
          },
        ],
        outcomes: [
          {
            candidate: {
              subject: 'project',
              attribute: 'database',
              value: 'MongoDB',
              type: 'fact',
              epistemic_status: 'asserted',
              override_signal: false,
              valid_from: null,
              asserted_strength: 0.9,
            },
            outcome: 'active_inserted',
            fact_id: 'fact-001',
            rule_applied: 'initial_insert',
            detail: 'Initial fact stored as ACTIVE canonical truth.',
          },
        ],
        facts_created_or_modified: [],
      },
    },
    {
      id: 'seed-2',
      type: 'ingest',
      author: {
        id: 'u-alice',
        workspace_id: 'ws-ledger-main',
        name: 'Alice Chen',
        email: 'alice@ledger.internal',
        avatar_color: '#3B82F6',
      },
      timestamp: '2026-09-17T14:30:00Z',
      input: 'Actually we moved to PostgreSQL.',
      endpointCalled: '/workspaces/ws-ledger-main/messages',
      ingestResponse: {
        message_id: 'msg-002',
        workspace_id: 'ws-ledger-main',
        source_user_id: 'u-alice',
        created_at: '2026-09-17T14:30:00Z',
        candidates: [
          {
            subject: 'project',
            attribute: 'database',
            value: 'PostgreSQL',
            type: 'fact',
            epistemic_status: 'correction',
            override_signal: true,
            valid_from: null,
            asserted_strength: 0.95,
          },
        ],
        outcomes: [
          {
            candidate: {
              subject: 'project',
              attribute: 'database',
              value: 'PostgreSQL',
              type: 'fact',
              epistemic_status: 'correction',
              override_signal: true,
              valid_from: null,
              asserted_strength: 0.95,
            },
            outcome: 'superseded',
            fact_id: 'fact-002',
            rule_applied: 'rule_b',
            detail: 'Rule 3b: override_signal=true -> superseded fact-001 [MongoDB], inserted fact-002 [PostgreSQL] as ACTIVE.',
          },
        ],
        facts_created_or_modified: [],
      },
    },
    {
      id: 'seed-3',
      type: 'query',
      author: {
        id: 'u-bob',
        workspace_id: 'ws-ledger-main',
        name: 'Bob Martinez',
        email: 'bob@ledger.internal',
        avatar_color: '#10B981',
      },
      timestamp: '2026-09-17T15:00:00Z',
      input: 'What database are we using?',
      endpointCalled: '/workspaces/ws-ledger-main/query',
      response: {
        answer: 'We are currently using PostgreSQL for the project database.',
        memory_ids_used: ['fact-002'],
        supersede_chain: [
          {
            id: 'fact-002',
            supersedes_id: 'fact-001',
            value: 'PostgreSQL',
            valid_from: '2026-09-17T14:30:00Z',
            valid_to: null,
            status: 'active',
          },
          {
            id: 'fact-001',
            supersedes_id: null,
            value: 'MongoDB',
            valid_from: '2026-09-15T10:00:00Z',
            valid_to: '2026-09-17T14:30:00Z',
            status: 'superseded',
          },
        ],
      },
    },
  ]);

  const feedRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new interaction
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [interactions, loading]);

  // Loading timer animation
  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingElapsed(0);
      interval = setInterval(() => {
        setLoadingElapsed((prev) => prev + 50);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleExecute = async (
    overrideInput?: string, 
    overrideMode?: 'query' | 'ingest', 
    overrideAsOf?: string
  ) => {
    const textToSend = overrideInput !== undefined ? overrideInput : inputText;
    const activeMode = overrideMode !== undefined ? overrideMode : mode;
    const activeAsOf = overrideAsOf !== undefined ? overrideAsOf : (isAsOfActive && asOfDate ? asOfDate : undefined);

    if (!textToSend.trim()) return;

    setLoading(true);
    setLoadingPhase(
      activeMode === 'query' 
        ? 'Querying bi-temporal knowledge graph...' 
        : 'Extracting candidate facts and evaluating resolution rules...'
    );

    const interactionId = `act-${Date.now()}`;
    const endpoint = activeMode === 'query' 
      ? `/workspaces/${activeUser.workspace_id}/query` 
      : `/workspaces/${activeUser.workspace_id}/messages`;

    if (activeMode === 'query') {
      try {
        const result = await ledgerApi.query(textToSend, activeAsOf);
        setInteractions((prev) => [
          ...prev,
          {
            id: interactionId,
            type: 'query',
            author: activeUser,
            timestamp: new Date().toISOString(),
            input: textToSend,
            asOf: activeAsOf,
            response: result.data,
            endpointCalled: endpoint,
          },
        ]);
      } catch (err: any) {
        setInteractions((prev) => [
          ...prev,
          {
            id: interactionId,
            type: 'query',
            author: activeUser,
            timestamp: new Date().toISOString(),
            input: textToSend,
            asOf: activeAsOf,
            error: err.message || 'API query failure: Connection to Ledger service was rejected.',
            endpointCalled: endpoint,
          },
        ]);
      }
    } else {
      // Ingest message mode
      try {
        const result = await ledgerApi.sendMessage(textToSend);
        setInteractions((prev) => [
          ...prev,
          {
            id: interactionId,
            type: 'ingest',
            author: activeUser,
            timestamp: new Date().toISOString(),
            input: textToSend,
            ingestResponse: result.data,
            endpointCalled: endpoint,
          },
        ]);
        onRefreshMemories();
      } catch (err: any) {
        setInteractions((prev) => [
          ...prev,
          {
            id: interactionId,
            type: 'ingest',
            author: activeUser,
            timestamp: new Date().toISOString(),
            input: textToSend,
            error: err.message || 'API message ingestion failure: Unable to write to database.',
            endpointCalled: endpoint,
          },
        ]);
      }
    }

    setInputText('');
    setLoading(false);
  };

  // Explicit test for API failure state (as requested in test plan)
  const handleSimulateApiFailure = () => {
    const interactionId = `err-${Date.now()}`;
    setLoading(true);
    setLoadingPhase('Attempting connection to remote endpoint...');
    setTimeout(() => {
      setInteractions((prev) => [
        ...prev,
        {
          id: interactionId,
          type: mode,
          author: activeUser,
          timestamp: new Date().toISOString(),
          input: inputText.trim() || 'What is our primary infrastructure topology?',
          error: 'HTTP 503 Service Unavailable: Remote SQLite connection pool exhausted. Ingestion rejected by upstream server.',
          endpointCalled: `/workspaces/${activeUser.workspace_id}/${mode === 'query' ? 'query' : 'messages'}`,
          isSimulatedFailure: true,
        },
      ]);
      setLoading(false);
    }, 600);
  };

  const handleRetryInteraction = (item: ChatInteraction) => {
    handleExecute(item.input, item.type, item.asOf);
  };

  const handleClearChat = () => {
    setInteractions([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] max-w-5xl mx-auto px-3 sm:px-6 py-3">
      {/* Session / Login & Workspace Context Bar */}
      <div className="mb-2.5 px-3 py-2 rounded-lg bg-[#0F131C] border border-[#1E2536] flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Workspace info */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[#94A3B8] text-[11px]">
            <span className="text-[#64748B]">WORKSPACE:</span>
            <span className="text-[#38BDF8] font-bold bg-[#141A26] px-2 py-0.5 rounded border border-[#243048]">
              {activeUser.workspace_id}
            </span>
          </span>
          <span className="text-[#334155]">•</span>
          <span className="text-[11px] text-[#64748B] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#34D399]" />
            <span>Server-Enforced Token Isolation</span>
          </span>
        </div>

        {/* Active Session / User Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#64748B] hidden sm:inline">Active Session:</span>
          <div className="relative">
            <button
              id="btn-chat-session-switcher"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161C28] hover:bg-[#1E2638] border border-[#28334A] text-xs transition-colors"
            >
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                style={{ backgroundColor: activeUser.avatar_color || '#3B82F6' }}
              >
                {activeUser.name[0]}
              </div>
              <span className="font-medium text-[#F1F5F9] text-[11px]">{activeUser.name}</span>
              <ChevronDown className="w-3 h-3 text-[#64748B]" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-1.5 w-60 rounded-lg bg-[#121622] border border-[#263044] shadow-2xl py-1 z-50">
                <div className="px-3 py-1 text-[10px] uppercase font-mono text-[#64748B] border-b border-[#1A2232]">
                  Switch Ingestion / Query Actor
                </div>
                {AVAILABLE_USERS.map((u) => {
                  const isCurrent = u.id === activeUser.id;
                  return (
                    <button
                      key={u.id}
                      id={`chat-switch-${u.id}`}
                      onClick={() => {
                        if (onUserChange) onUserChange(u);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs transition-colors ${
                        isCurrent ? 'bg-[#1C2434] text-[#F8FAFC]' : 'text-[#94A3B8] hover:bg-[#161D2B]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ backgroundColor: u.avatar_color || '#3B82F6' }}
                        >
                          {u.name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-[11px] text-[#F1F5F9]">{u.name}</div>
                          <div className="text-[9px] text-[#64748B] font-mono">{u.id}</div>
                        </div>
                      </div>
                      {isCurrent && <span className="text-[#38BDF8] text-[10px] font-mono">Current</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clear chat button */}
          <button
            id="btn-clear-chat"
            onClick={handleClearChat}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-[#64748B] hover:text-[#94A3B8] hover:bg-[#161C28] transition-colors"
            title="Clear chat feed to inspect empty state"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Demo Script & Verification Quick Triggers Bar */}
      <div className="mb-3 p-2.5 rounded-lg bg-[#0E121A] border border-[#1A2232] text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-1.5 text-[#94A3B8] font-medium text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="font-mono text-[#CBD5E1]">Quick Scenarios:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            id="demo-beat-1"
            onClick={() => handleExecute('What database are we using?', 'query')}
            className="px-2 py-1 rounded bg-[#131824] hover:bg-[#1B2232] text-[#CBD5E1] border border-[#242E44] text-[11px] font-mono transition-colors"
            title="Query active database state"
          >
            1. Query Current DB
          </button>

          <button
            id="demo-beat-2"
            onClick={() => handleExecute('Actually we moved to PostgreSQL.', 'ingest')}
            className="px-2 py-1 rounded bg-[#0D241C] hover:bg-[#123327] text-[#34D399] border border-[#059669]/40 text-[11px] font-mono transition-colors"
            title="Send correction overriding MongoDB to PostgreSQL"
          >
            2. Ingest Correction
          </button>

          <button
            id="demo-beat-4"
            onClick={() => handleExecute('What did we use on Sept 15?', 'query', '2026-09-15T12:00:00Z')}
            className="px-2 py-1 rounded bg-[#0E2034] hover:bg-[#142C48] text-[#38BDF8] border border-[#0284C7]/40 text-[11px] font-mono transition-colors"
            title="Bi-temporal time-travel query as of Sept 15"
          >
            4. Time-Travel (Sept 15)
          </button>

          <button
            id="demo-beat-5"
            onClick={() => handleExecute('What is the deadline?', 'query')}
            className="px-2 py-1 rounded bg-[#2A1118] hover:bg-[#3B1721] text-[#FB7185] border border-[#E11D48]/40 text-[11px] font-mono transition-colors"
            title="Query disputed deadline"
          >
            5. Dispute Check
          </button>

          <button
            id="demo-beat-empty"
            onClick={() => handleExecute('What is the quantum encryption key rotation period?', 'query')}
            className="px-2 py-1 rounded bg-[#1C1826] hover:bg-[#272136] text-[#C084FC] border border-[#9333EA]/40 text-[11px] font-mono transition-colors"
            title="Test query returning 0 memories to inspect No-Data state"
          >
            Test Empty Result
          </button>

          <button
            id="demo-beat-fail"
            onClick={handleSimulateApiFailure}
            className="px-2 py-1 rounded bg-[#2D1418] hover:bg-[#3E1A20] text-[#F87171] border border-[#EF4444]/40 text-[11px] font-mono transition-colors flex items-center gap-1"
            title="Trigger deliberate API failure to test error state and retry"
          >
            <ShieldAlert className="w-3 h-3 text-[#F87171]" />
            <span>Test API Failure</span>
          </button>
        </div>
      </div>

      {/* Main Conversation Feed */}
      <div 
        ref={feedRef}
        id="chat-feed-container"
        className="flex-1 overflow-y-auto space-y-3.5 pr-1 scroll-smooth"
      >
        {/* EMPTY STATE */}
        {interactions.length === 0 && (
          <div 
            id="chat-empty-state"
            className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-6 rounded-xl bg-[#0D1017] border border-[#1A202E]"
          >
            <div className="w-12 h-12 rounded-xl bg-[#141A26] border border-[#232E44] flex items-center justify-center text-[#38BDF8] mb-3 shadow-inner">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#F8FAFC] tracking-wide font-sans">
              Ledger Memory Engine
            </h3>
            <p className="text-xs text-[#94A3B8] max-w-md mt-1 mb-5">
              Deterministic, bi-temporal fact repository with zero LLM hallucination on freshness. Workspace <code className="text-[#38BDF8] font-mono">{activeUser.workspace_id}</code> is ready.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full text-left text-xs mb-6">
              <div className="p-3 rounded-lg bg-[#111622] border border-[#1C2336] space-y-1">
                <div className="flex items-center gap-1.5 text-[#34D399] font-medium text-[11px]">
                  <Send className="w-3 h-3" />
                  <span>Ingestion Mode</span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Send statements like <em>"We moved to PostgreSQL."</em> Extracts candidates and evaluates Rule 3a–3d supersessions.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#111622] border border-[#1C2336] space-y-1">
                <div className="flex items-center gap-1.5 text-[#38BDF8] font-medium text-[11px]">
                  <Search className="w-3 h-3" />
                  <span>Query Mode</span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Ask questions like <em>"What database are we using?"</em> Retrieves verified truth with time-travel & audit citations.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-[#64748B] text-[11px]">Suggested starter prompts:</span>
              <button
                onClick={() => handleExecute('What database are we using?', 'query')}
                className="px-2.5 py-1 rounded bg-[#151B27] hover:bg-[#1D2536] text-[#CBD5E1] border border-[#242F46] font-mono text-[11px] transition-colors"
              >
                "What database are we using?"
              </button>
              <button
                onClick={() => handleExecute('Actually we moved to PostgreSQL.', 'ingest')}
                className="px-2.5 py-1 rounded bg-[#151B27] hover:bg-[#1D2536] text-[#34D399] border border-[#059669]/30 font-mono text-[11px] transition-colors"
              >
                "Actually we moved to PostgreSQL."
              </button>
            </div>
          </div>
        )}

        {/* FEED ITEMS */}
        {interactions.map((item) => (
          <div
            key={item.id}
            id={`interaction-${item.id}`}
            className={`p-4 rounded-xl border transition-all text-xs ${
              item.error
                ? 'bg-[#1C1014] border-[#4A1D24]'
                : item.type === 'ingest'
                ? 'bg-[#0E121A] border-[#1C2332]'
                : 'bg-[#121622] border-[#222B3E] shadow-sm'
            }`}
          >
            {/* Header / Author row */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#1A202E]">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0"
                  style={{ backgroundColor: item.author.avatar_color || '#3B82F6' }}
                >
                  {item.author.name[0]}
                </div>
                <span className="font-medium text-[#F1F5F9]">{item.author.name}</span>
                <span className="text-[10px] font-mono text-[#64748B]">
                  ({item.author.id})
                </span>
                <span className="text-[#334155]">•</span>
                <span
                  className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                    item.error
                      ? 'bg-[#38111A] text-[#FB7185] border-[#E11D48]/40'
                      : item.type === 'ingest'
                      ? 'bg-[#0E241B] text-[#34D399] border-[#059669]/40'
                      : 'bg-[#0E2034] text-[#38BDF8] border-[#0284C7]/40'
                  }`}
                >
                  {item.error ? 'API FAILURE' : item.type === 'ingest' ? 'INGESTED MESSAGE' : 'TEMPORAL QUERY'}
                </span>

                {item.asOf && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#271E38] text-[#D8B4FE] border border-[#7E22CE]/40 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> as_of: {new Date(item.asOf).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {item.endpointCalled && (
                  <span className="font-mono text-[9px] text-[#475569] hidden md:inline">
                    {item.endpointCalled}
                  </span>
                )}
                <span className="font-mono text-[10px] text-[#64748B]">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* User Input Prompt */}
            <div className="text-sm font-medium text-[#F8FAFC] mb-2.5">
              {item.input}
            </div>

            {/* ERROR / API FAILURE STATE CARD */}
            {item.error && (
              <div 
                id={`error-card-${item.id}`}
                className="mt-2.5 p-3.5 rounded-lg bg-[#271016] border border-[#521E28] space-y-2 text-[#FDA4AF]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#FFE4E6]">
                    <AlertCircle className="w-4 h-4 text-[#F43F5E]" />
                    <span>API Transport Failure</span>
                  </div>
                  {item.isSimulatedFailure && (
                    <span className="text-[9px] font-mono uppercase bg-[#3E131C] text-[#FECDD3] px-1.5 py-0.2 rounded border border-[#631B28]">
                      DIAGNOSTIC TEST CASE
                    </span>
                  )}
                </div>

                <div className="text-xs font-mono bg-[#160B0E] p-2 rounded border border-[#3B141C] text-[#FECDD3]">
                  {item.error}
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-[#94A3B8]">
                    Failed endpoint: <code className="font-mono text-[#CBD5E1]">{item.endpointCalled}</code>
                  </span>
                  <button
                    id={`btn-retry-${item.id}`}
                    onClick={() => handleRetryInteraction(item)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#3B141C] hover:bg-[#4E1A26] text-[#FFE4E6] font-medium transition-colors border border-[#68202F]"
                  >
                    <RefreshCw className="w-3 h-3 text-[#FB7185]" />
                    <span>Retry Request</span>
                  </button>
                </div>
              </div>
            )}

            {/* QUERY RESPONSE RENDERING */}
            {item.type === 'query' && item.response && (
              <div className="mt-2.5 p-3.5 rounded-lg bg-[#0B0F17] border border-[#1A2232] space-y-3">
                {/* Disputed Warning Banner */}
                {item.response.disputed_flags && item.response.disputed_flags.length > 0 && (
                  <div className="p-3 rounded-md bg-[#2B1017] border border-[#541D27] flex items-start gap-2.5 text-[#FDA4AF]">
                    <AlertTriangle className="w-4 h-4 text-[#F43F5E] shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-[#FFE4E6]">
                        DISPUTE STATE: Single Truth Unresolved (Rule 3c)
                      </div>
                      <div className="text-[11px] text-[#FECDD3]">
                        Ledger cannot establish a single current truth from the available evidence. Competing assertions exist without an explicit confirmed override.
                      </div>
                      {item.response.disputed_flags.map((df, i) => (
                        <div key={i} className="text-[10px] font-mono text-[#FDA4AF] pt-0.5">
                          • Fact {df.fact_id} conflicts with {df.conflicts_with_id}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NO-DATA STATE (When 0 memories were used) */}
                {item.response.memory_ids_used.length === 0 ? (
                  <div 
                    id={`no-data-card-${item.id}`}
                    className="p-3 rounded-lg bg-[#141722] border border-[#232A3C] space-y-2"
                  >
                    <div className="flex items-center gap-2 text-[#CBD5E1] font-semibold text-xs">
                      <Info className="w-4 h-4 text-[#38BDF8]" />
                      <span>No Corroborated Knowledge Found</span>
                    </div>
                    <div className="text-xs text-[#94A3B8] leading-relaxed">
                      {item.response.answer || 'Ledger searched the workspace memory graph and found no active or historical facts matching this inquiry.'}
                    </div>
                    <div className="text-[11px] text-[#64748B] pt-1 border-t border-[#1C2232]">
                      Deterministic Policy: Ledger strictly refuses to hallucinate facts without verified SQLite evidence.
                    </div>
                  </div>
                ) : (
                  /* Primary Verified Answer */
                  <div className="text-sm text-[#E2E8F0] leading-relaxed">
                    {item.response.answer}
                  </div>
                )}

                {/* Citations & Evidence Affordance */}
                <div className="pt-2 border-t border-[#181E2C] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-[#64748B] font-mono">
                      CITED MEMORIES:
                    </span>
                    {item.response.memory_ids_used.length > 0 ? (
                      item.response.memory_ids_used.map((id) => (
                        <button
                          key={id}
                          id={`btn-cite-${id}`}
                          onClick={() => onOpenEvidence(id)}
                          className="flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-[#131F30] text-[#38BDF8] hover:bg-[#1A2A42] border border-[#0284C7]/40 transition-colors group"
                          title="Click to inspect raw evidence and provenance"
                        >
                          <FileText className="w-3 h-3 text-[#38BDF8]" />
                          <span>{id}</span>
                          <span className="text-[9px] text-[#7DD3FC]">
                            [{factsMap[id]?.status?.toUpperCase() || 'FACT'}]
                          </span>
                        </button>
                      ))
                    ) : (
                      <span className="text-[11px] text-[#64748B] italic">
                        None (Restricted or non-existent)
                      </span>
                    )}
                  </div>

                  {item.response.memory_ids_used.length > 0 && (
                    <button
                      id="btn-inspect-why-primary"
                      onClick={() => onOpenEvidence(item.response!.memory_ids_used[0])}
                      className="flex items-center gap-1.5 text-xs text-[#38BDF8] hover:text-[#7DD3FC] font-medium bg-[#0E1B2C] hover:bg-[#14263E] px-2.5 py-1 rounded border border-[#0284C7]/40 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Why this answer? (Inspect Evidence)</span>
                    </button>
                  )}
                </div>

                {/* Supersede Chain Trace */}
                {item.response.supersede_chain && item.response.supersede_chain.length > 1 && (
                  <div className="mt-2 p-2.5 rounded bg-[#080B10] border border-[#161D2B] text-[11px] font-mono text-[#94A3B8]">
                    <div className="text-[10px] text-[#64748B] uppercase mb-1.5 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#38BDF8]" />
                      <span>Version Lineage Trace:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.response.supersede_chain.map((link, idx) => (
                        <React.Fragment key={link.id}>
                          <button
                            type="button"
                            onClick={() => onOpenEvidence(link.id)}
                            className={`px-2 py-0.5 rounded cursor-pointer transition-colors text-left ${
                              link.status === 'active'
                                ? 'bg-[#063826] text-[#34D399] border border-[#059669]/50 hover:border-[#10B981]'
                                : 'bg-[#151924] text-[#64748B] line-through border border-[#252C3E] hover:text-[#94A3B8]'
                            }`}
                            title="Click to view this memory version"
                          >
                            {link.id} ({link.value})
                          </button>
                          {idx < item.response!.supersede_chain!.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-[#475569]" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* INGESTION RESOLUTION OUTCOME */}
            {item.type === 'ingest' && item.ingestResponse && (
              <div className="mt-2.5 p-3.5 rounded-lg bg-[#0B0F17] border border-[#1A2232] space-y-3">
                <div className="flex items-center justify-between text-[11px] pb-2 border-b border-[#161D2A]">
                  <span className="font-mono text-[#64748B]">
                    INGEST MESSAGE ID: <span className="text-[#CBD5E1]">{item.ingestResponse.message_id}</span>
                  </span>
                  <span className="text-[#34D399] font-mono text-[10px] flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> DETERMINISTIC RESOLUTION COMPLETE
                  </span>
                </div>

                {/* Candidate Facts Extracted */}
                {item.ingestResponse.candidates && item.ingestResponse.candidates.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono uppercase text-[#64748B] tracking-wider">
                      Extracted Fact Candidates:
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {item.ingestResponse.candidates.map((cand, ci) => (
                        <div key={ci} className="p-2 rounded bg-[#101520] border border-[#1B2334] flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[#38BDF8]">
                              {cand.subject}::{cand.attribute}
                            </span>
                            <span className="text-[#64748B]">=</span>
                            <span className="font-mono font-bold text-[#F8FAFC] bg-[#161C2A] px-1.5 py-0.2 rounded border border-[#273248]">
                              "{cand.value}"
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[10px]">
                            <span className={`px-1.5 py-0.2 rounded border ${
                              cand.epistemic_status === 'correction'
                                ? 'bg-[#2E1920] text-[#FB7185] border-[#E11D48]/30'
                                : cand.epistemic_status === 'proposal'
                                ? 'bg-[#2E2010] text-[#FBBF24] border-[#D97706]/30'
                                : 'bg-[#0E281E] text-[#34D399] border-[#059669]/30'
                            }`}>
                              {cand.epistemic_status.toUpperCase()}
                            </span>
                            <span className="text-[#64748B]">
                              override: {cand.override_signal ? 'true' : 'false'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution Outcomes */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-[#64748B] tracking-wider">
                    Resolver Rule Outcomes:
                  </div>
                  {item.ingestResponse.outcomes.map((out, oi) => (
                    <div key={oi} className="p-2.5 rounded bg-[#111624] border border-[#1E273A] space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#CBD5E1]">
                            {out.candidate.subject}::{out.candidate.attribute}
                          </span>
                          <span className="text-[#64748B]">➔</span>
                          <span className={`font-mono text-[10px] px-2 py-0.2 rounded font-bold border ${
                            out.outcome === 'superseded'
                              ? 'bg-[#1C202C] text-[#94A3B8] border-[#334155]'
                              : out.outcome === 'disputed'
                              ? 'bg-[#38111A] text-[#FB7185] border-[#E11D48]/40'
                              : out.outcome === 'forgotten'
                              ? 'bg-[#16181D] text-[#71717A] border-[#3F3F46]/40'
                              : 'bg-[#063826] text-[#34D399] border-[#059669]/40'
                          }`}>
                            {out.outcome.toUpperCase()}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#1A2336] text-[#38BDF8] border border-[#2D3C5A]">
                          {out.rule_applied.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#94A3B8] leading-relaxed">
                        {out.detail}
                      </div>

                      {out.fact_id && (
                        <div className="pt-1 flex items-center justify-between text-[11px]">
                          <span className="font-mono text-[#64748B]">
                            Stored Fact ID: <code className="text-[#38BDF8]">{out.fact_id}</code>
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenEvidence(out.fact_id!)}
                            className="flex items-center gap-1 text-[#38BDF8] hover:text-[#7DD3FC] font-medium text-[11px] transition-colors"
                          >
                            <span>Inspect Memory</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Multi-step loading indicator */}
        {loading && (
          <div 
            id="chat-loading-indicator"
            className="p-4 rounded-xl bg-[#0E121A] border border-[#1F2636] space-y-2 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 text-[#38BDF8]">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="font-medium text-[#F1F5F9]">{loadingPhase}</span>
              </div>
              <span className="font-mono text-[10px] text-[#64748B]">
                {loadingElapsed}ms
              </span>
            </div>
            <div className="w-full bg-[#161B26] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#38BDF8] h-full animate-pulse rounded-full w-2/3" />
            </div>
          </div>
        )}
      </div>

      {/* Input & Control Surface */}
      <div className="mt-2 pt-2.5 border-t border-[#1C2334] space-y-2">
        {/* Mode Selector & As-Of Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1 bg-[#0F131C] p-1 rounded-lg border border-[#1E2536]">
            <button
              id="mode-query"
              type="button"
              onClick={() => setMode('query')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                mode === 'query'
                  ? 'bg-[#182236] text-[#F8FAFC] border border-[#2D3E60] shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Query Assistant (Truth)</span>
            </button>

            <button
              id="mode-ingest"
              type="button"
              onClick={() => setMode('ingest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                mode === 'ingest'
                  ? 'bg-[#0E281E] text-[#34D399] border border-[#059669]/50 shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Ingest Team Message</span>
            </button>
          </div>

          {/* Temporal Time-Travel Query (as_of) */}
          {mode === 'query' && (
            <div className="flex items-center gap-2 bg-[#0F131C] px-2.5 py-1 rounded-lg border border-[#1E2536]">
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#94A3B8] hover:text-[#CBD5E1]">
                <input
                  id="chk-as-of"
                  type="checkbox"
                  checked={isAsOfActive}
                  onChange={(e) => setIsAsOfActive(e.target.checked)}
                  className="rounded bg-[#161B26] border-[#2A3347] text-[#38BDF8] focus:ring-0 w-3.5 h-3.5"
                />
                <span>Time-Travel (as_of):</span>
              </label>

              {isAsOfActive && (
                <input
                  id="input-as-of-date"
                  type="date"
                  value={asOfDate ? asOfDate.split('T')[0] : '2026-09-15'}
                  onChange={(e) => setAsOfDate(`${e.target.value}T12:00:00Z`)}
                  className="bg-[#141A26] border border-[#263248] rounded px-2 py-0.5 text-xs text-[#CBD5E1] font-mono focus:outline-none focus:border-[#38BDF8]"
                />
              )}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecute();
          }}
          className="relative flex items-center"
        >
          <input
            id="chat-input-text"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === 'query'
                ? 'Ask what the team currently believes (e.g., "What database are we using?")...'
                : `Ingest message as ${activeUser.name} (e.g., "Actually we moved to PostgreSQL." or "The deadline is Oct 3.")...`
            }
            className="w-full bg-[#0E121A] border border-[#222B3E] focus:border-[#38BDF8] rounded-xl px-4 py-3 pr-32 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none transition-colors font-sans"
          />

          <button
            id="btn-submit-chat"
            type="submit"
            disabled={loading || !inputText.trim()}
            className={`absolute right-2 px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              loading || !inputText.trim()
                ? 'bg-[#161B26] text-[#475569] cursor-not-allowed'
                : mode === 'query'
                ? 'bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md'
                : 'bg-[#059669] hover:bg-[#047857] text-white shadow-md'
            }`}
          >
            <span>{mode === 'query' ? 'Query' : 'Ingest'}</span>
            {mode === 'query' ? <Search className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
};
