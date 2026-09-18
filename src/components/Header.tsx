import React from 'react';
import { 
  ShieldCheck, 
  Clock, 
  GitCommit, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  Server, 
  RotateCcw,
  UserCheck,
  ChevronDown,
  Play,
  Sparkles
} from 'lucide-react';
import { User } from '../types/ledger';

interface HeaderProps {
  activeTab: 'chat' | 'timeline' | 'conflicts' | 'changes' | 'eval';
  onTabChange: (tab: 'chat' | 'timeline' | 'conflicts' | 'changes' | 'eval') => void;
  activeUser: User;
  onUserChange: (user: User) => void;
  isMockMode: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'mock_mode' | 'testing';
  backendUrl: string;
  onOpenConnectionModal: () => void;
  onResetDatabase: () => void;
  isDemoGuideOpen?: boolean;
  onToggleDemoGuide?: () => void;
  factsCount?: number;
  disputeCount?: number;
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

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  activeUser,
  onUserChange,
  isMockMode,
  connectionStatus,
  backendUrl,
  onOpenConnectionModal,
  onResetDatabase,
  isDemoGuideOpen = false,
  onToggleDemoGuide,
  factsCount = 0,
  disputeCount = 0,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  return (
    <header className="border-b border-[#222736] bg-[#0E1117]/95 backdrop-blur sticky top-0 z-40">
      {/* Top utility bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-[#1A1F2C]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#94A3B8]">
            <span className="font-mono text-[#CBD5E1]">WORKSPACE:</span>
            <span className="bg-[#181C26] px-2 py-0.5 rounded text-[#E2E8F0] font-mono border border-[#262C3D]">
              ws-ledger-main
            </span>
          </span>
          <span className="text-[#475569]">•</span>
          <span className="text-[#94A3B8]">
            Isolation Boundary: <strong className="text-[#CBD5E1] font-medium">Server-Enforced</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Interactive Live Demo Guide Launcher */}
          {onToggleDemoGuide && (
            <button
              id="btn-toggle-demo-guide"
              onClick={onToggleDemoGuide}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold font-mono transition-all border ${
                isDemoGuideOpen
                  ? 'bg-[#0284C7] text-white border-[#38BDF8] shadow-md shadow-[#0284C7]/20'
                  : 'bg-[#0B1728] text-[#38BDF8] border-[#0284C7]/40 hover:bg-[#0E223D] hover:border-[#38BDF8]'
              }`}
              title="Toggle the 6-step interactive live presentation guide"
            >
              <Play className={`w-3.5 h-3.5 ${isDemoGuideOpen ? 'fill-current' : 'text-[#38BDF8]'}`} />
              <span>{isDemoGuideOpen ? 'Hide Demo Guide' : '▶ Guided Live Demo'}</span>
            </button>
          )}

          {/* Active Backend status button */}
          <button
            id="btn-backend-status"
            onClick={onOpenConnectionModal}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all font-mono text-[11px] border ${
              isMockMode
                ? 'bg-[#2E2010] text-[#FBBF24] border-[#B45309]/50 hover:border-[#F59E0B]'
                : connectionStatus === 'connected'
                ? 'bg-[#0E281E] text-[#34D399] border-[#059669]/50 hover:border-[#10B981]'
                : 'bg-[#2A1218] text-[#F87171] border-[#DC2626]/50 hover:border-[#EF4444]'
            }`}
            title="Click to configure backend connection or switch to live mode"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isMockMode
                  ? 'bg-[#F59E0B] animate-pulse'
                  : connectionStatus === 'connected'
                  ? 'bg-[#10B981]'
                  : 'bg-[#EF4444]'
              }`}
            />
            <span>
              {isMockMode
                ? 'DEVELOPMENT ADAPTER (MOCK MODE)'
                : `LIVE BACKEND (${backendUrl.replace('http://', '').replace('https://', '')})`}
            </span>
            <Server className="w-3 h-3 ml-1 opacity-70" />
          </button>

          {/* Reset button */}
          <button
            id="btn-reset-store"
            onClick={onResetDatabase}
            className="flex items-center gap-1 text-[#94A3B8] hover:text-[#E2E8F0] bg-[#161A24] hover:bg-[#1E2330] px-2 py-1 rounded border border-[#222736] transition-colors"
            title="Reset to 6-beat demo baseline"
          >
            <RotateCcw className="w-3 h-3 text-[#64748B]" />
            <span>Reset Demo State</span>
          </button>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Product Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-[#334155] flex items-center justify-center text-[#F8FAFC] font-mono font-bold text-sm tracking-wider shadow-inner">
            L
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-base text-[#F8FAFC]">LEDGER</span>
              <span className="text-[10px] font-mono uppercase bg-[#1E2433] text-[#93C5FD] px-1.5 py-0.5 rounded border border-[#2B354D]">
                LOCKED v1
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] hidden sm:block">
              State & Provenance Memory Engine • Deterministic Conflict Resolution
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#131720] p-1 rounded-lg border border-[#222736]">
          <button
            id="nav-tab-chat"
            onClick={() => onTabChange('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-[#1E2433] text-[#F8FAFC] shadow-sm border border-[#334155]'
                : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#181C26]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Chat & Evidence</span>
          </button>

          <button
            id="nav-tab-timeline"
            onClick={() => onTabChange('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'timeline'
                ? 'bg-[#1E2433] text-[#F8FAFC] shadow-sm border border-[#334155]'
                : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#181C26]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Timeline</span>
            {factsCount > 0 && (
              <span className="text-[10px] font-mono bg-[#1E2D24] text-[#34D399] px-1.5 py-0.2 rounded border border-[#059669]/30">
                {factsCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-conflicts"
            onClick={() => onTabChange('conflicts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'conflicts'
                ? 'bg-[#1E2433] text-[#F8FAFC] shadow-sm border border-[#334155]'
                : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#181C26]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#FB7185]" />
            <span>Disputes</span>
            {disputeCount > 0 ? (
              <span className="text-[10px] font-mono bg-[#3D141B] text-[#FB7185] px-1.5 py-0.2 rounded border border-[#E11D48]/40 animate-pulse font-bold">
                {disputeCount} active
              </span>
            ) : (
              <span className="text-[10px] font-mono text-[#64748B]">0</span>
            )}
          </button>

          <button
            id="nav-tab-changes"
            onClick={() => onTabChange('changes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'changes'
                ? 'bg-[#1E2433] text-[#F8FAFC] shadow-sm border border-[#334155]'
                : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#181C26]'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>What Changed</span>
          </button>

          <button
            id="nav-tab-eval"
            onClick={() => onTabChange('eval')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'eval'
                ? 'bg-[#1E2433] text-[#F8FAFC] shadow-sm border border-[#334155]'
                : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#181C26]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Eval Suite</span>
            <span className="text-[10px] font-mono bg-[#2C210C] text-[#FBBF24] px-1.5 py-0.2 rounded border border-[#D97706]/30">
              9/9
            </span>
          </button>
        </nav>

        {/* User Identity Switcher (Server-Side Session Token Emulation) */}
        <div className="relative">
          <button
            id="btn-user-switcher"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#161B26] hover:bg-[#1D2332] border border-[#252C3D] text-xs transition-colors"
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
              style={{ backgroundColor: activeUser.avatar_color || '#3B82F6' }}
            >
              {activeUser.name[0]}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-[#F1F5F9] font-medium leading-none">{activeUser.name}</div>
              <div className="text-[10px] text-[#64748B] font-mono">session_token</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg bg-[#141822] border border-[#282F42] shadow-xl py-1.5 z-50">
              <div className="px-3 py-1.5 border-b border-[#1F2535] text-[11px] text-[#64748B]">
                Switch Active Session (Simulates Multi-User Auth)
              </div>
              {AVAILABLE_USERS.map((u) => {
                const isCurrent = u.id === activeUser.id;
                return (
                  <button
                    key={u.id}
                    id={`user-select-${u.id}`}
                    onClick={() => {
                      onUserChange(u);
                      setUserDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors ${
                      isCurrent ? 'bg-[#1D2433] text-[#F8FAFC]' : 'text-[#94A3B8] hover:bg-[#181C27]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: u.avatar_color || '#3B82F6' }}
                      >
                        {u.name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-[#F1F5F9]">{u.name}</div>
                        <div className="text-[10px] text-[#64748B] font-mono">{u.email}</div>
                      </div>
                    </div>
                    {isCurrent && <span className="text-[#38BDF8] text-[11px] font-mono">Active</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
