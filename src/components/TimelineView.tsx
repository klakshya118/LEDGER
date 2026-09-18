import React, { useState } from 'react';
import { 
  Clock, 
  Search, 
  Filter, 
  GitBranch, 
  Lock, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  Calendar,
  Layers,
  Archive,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileText,
  ShieldCheck,
  User as UserIcon,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Fact, FactStatus, Message, User } from '../types/ledger';

interface TimelineViewProps {
  facts: Fact[];
  messages: Record<string, Message>;
  users: Record<string, User>;
  onSelectFact: (fact: Fact) => void;
  onRefresh: () => void;
  activeUser: User;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  facts,
  messages,
  users,
  onSelectFact,
  onRefresh,
  activeUser,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewGrouping, setViewGrouping] = useState<'chronological' | 'current_vs_history'>('current_vs_history');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'team' | 'private'>('all');
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});

  const toggleQuoteExpand = (e: React.MouseEvent, factId: string) => {
    e.stopPropagation();
    setExpandedQuotes((prev) => ({ ...prev, [factId]: !prev[factId] }));
  };

  const getStatusBadgeConfig = (status: FactStatus) => {
    switch (status) {
      case 'active':
        return {
          label: 'ACTIVE (CANONICAL TRUTH)',
          bg: 'bg-[#063826] text-[#34D399] border-[#059669]/60',
          dot: 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.6)]',
          cardBorder: 'border-[#059669]/40 hover:border-[#10B981]',
          cardBg: 'bg-[#0A1612]',
          title: 'text-[#F8FAFC]',
          valueText: 'text-[#34D399]',
          valueBoxBg: 'bg-[#0E261E] border-[#0A4D37]',
          description: 'Current workspace truth. Serves as authoritative answer for present queries.',
        };
      case 'proposed':
        return {
          label: 'PROPOSED (RULE 3A - UNCONFIRMED)',
          bg: 'bg-[#2E2010] text-[#FBBF24] border-[#D97706]/50',
          dot: 'bg-[#F59E0B]',
          cardBorder: 'border-[#D97706]/40 hover:border-[#F59E0B]',
          cardBg: 'bg-[#14120D]',
          title: 'text-[#F8FAFC]',
          valueText: 'text-[#FBBF24]',
          valueBoxBg: 'bg-[#261C0E] border-[#4D3614]',
          description: 'Unhedged proposal. Stored for consideration; never overrides active truth without confirmation.',
        };
      case 'superseded':
        return {
          label: 'SUPERSEDED (RULE 3B - REPLACED)',
          bg: 'bg-[#181D29] text-[#94A3B8] border-[#334155]/50 line-through',
          dot: 'bg-[#64748B]',
          cardBorder: 'border-[#222A3E] hover:border-[#384666]',
          cardBg: 'bg-[#0D1017]',
          title: 'text-[#94A3B8] line-through',
          valueText: 'text-[#64748B] line-through',
          valueBoxBg: 'bg-[#121622] border-[#222A3C]',
          description: 'Historical superseded version. Replaced via confirmed override. Preserved for time-travel.',
        };
      case 'disputed':
        return {
          label: 'DISPUTED (RULE 3C - CONFLICTING CLAIMS)',
          bg: 'bg-[#38111A] text-[#FB7185] border-[#E11D48]/50 animate-pulse',
          dot: 'bg-[#F43F5E] shadow-[0_0_8px_rgba(244,63,94,0.6)]',
          cardBorder: 'border-[#E11D48]/50 hover:border-[#F43F5E]',
          cardBg: 'bg-[#170E13]',
          title: 'text-[#FFE4E6]',
          valueText: 'text-[#FB7185]',
          valueBoxBg: 'bg-[#2E1219] border-[#5A1C28]',
          description: 'Active contradiction detected between multiple authors without an explicit correction signal.',
        };
      case 'stale':
        return {
          label: 'STALE (DECAYED TTL)',
          bg: 'bg-[#26201D] text-[#D6D3D1] border-[#78716C]/50',
          dot: 'bg-[#A8A29E]',
          cardBorder: 'border-[#4B4440]/50 hover:border-[#78716C]',
          cardBg: 'bg-[#11100F]',
          title: 'text-[#D6D3D1]',
          valueText: 'text-[#A8A29E]',
          valueBoxBg: 'bg-[#1A1816] border-[#38332E]',
          description: 'Task or temporary note that passed its expiration window without reconfirmation.',
        };
      case 'forgotten':
        return {
          label: 'FORGOTTEN (RETRACTED / SCRUBBED)',
          bg: 'bg-[#141518] text-[#71717A] border-[#3F3F46]/40',
          dot: 'bg-[#52525B]',
          cardBorder: 'border-[#2D2E36]/40 hover:border-[#4B4D5A]',
          cardBg: 'bg-[#0B0C0E]',
          title: 'text-[#71717A] line-through',
          valueText: 'text-[#71717A] line-through',
          valueBoxBg: 'bg-[#111215] border-[#222328]',
          description: 'Explicit forget command executed. Excluded from query index and active truth.',
        };
    }
  };

  const statusCounts = facts.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filtered facts
  const filteredFacts = facts.filter((f) => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (visibilityFilter !== 'all' && f.visibility !== visibilityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        f.subject.toLowerCase().includes(q) ||
        f.attribute.toLowerCase().includes(q) ||
        f.value.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        f.fact_key.toLowerCase().includes(q) ||
        (messages[f.source_message_id]?.text || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Sort chronologically by recorded_at (most recent first)
  const sortedFacts = [...filteredFacts].sort((a, b) => {
    return new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime();
  });

  // Split into Current vs Historical
  const currentActiveFacts = sortedFacts.filter((f) => f.status === 'active');
  const historicalOrOtherFacts = sortedFacts.filter((f) => f.status !== 'active');

  const renderFactCard = (fact: Fact) => {
    const config = getStatusBadgeConfig(fact.status);
    const sourceUser = users[fact.source_user_id];
    const sourceMsg = messages[fact.source_message_id];
    const supersedesFact = fact.supersedes_id ? facts.find((f) => f.id === fact.supersedes_id) : null;
    const supersededByFact = facts.find((f) => f.supersedes_id === fact.id);
    const conflictsFact = fact.conflicts_with_id ? facts.find((f) => f.id === fact.conflicts_with_id) : null;

    const isQuoteExpanded = !!expandedQuotes[fact.id];
    const rawQuote = sourceMsg?.text || `Ingested statement: "${fact.subject} ${fact.attribute} is ${fact.value}"`;
    const isLongQuote = rawQuote.length > 90;

    return (
      <div
        key={fact.id}
        id={`timeline-node-${fact.id}`}
        onClick={() => onSelectFact(fact)}
        className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${config.cardBg} ${config.cardBorder} shadow-sm space-y-3`}
      >
        {/* Branch connector indicator if this fact supersedes another */}
        {fact.supersedes_id && (
          <div className="pb-2 border-b border-[#1C2436] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-[#38BDF8] font-mono text-[11px]">
              <GitBranch className="w-3.5 h-3.5" />
              <span>Version Chain: Supersedes prior fact</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (supersedesFact) onSelectFact(supersedesFact);
                }}
                className="font-mono text-[#CBD5E1] bg-[#141A26] px-2 py-0.5 rounded border border-[#27344D] hover:border-[#38BDF8] transition-colors"
              >
                {fact.supersedes_id} {supersedesFact ? `["${supersedesFact.value}"]` : ''}
              </button>
            </div>
            <span className="text-[10px] text-[#64748B] font-mono">
              Rule 3b Resolved
            </span>
          </div>
        )}

        {/* Node Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
            <span className="font-mono text-xs font-bold text-[#38BDF8]">
              {fact.id}
            </span>
            <span className="text-[#475569]">•</span>
            <span className="font-mono text-xs text-[#CBD5E1]">
              {fact.fact_key}
            </span>
            {fact.visibility === 'private' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#2F1538] text-[#D8B4FE] border border-[#9333EA]/40">
                <Lock className="w-2.5 h-2.5" /> PRIVATE
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${config.bg}`}>
              {config.label}
            </span>
            <span className="text-[10px] font-mono uppercase bg-[#141926] text-[#64748B] px-1.5 py-0.5 rounded border border-[#22293C]">
              {fact.type}
            </span>
          </div>
        </div>

        {/* Value Display Box */}
        <div className="flex flex-wrap items-baseline gap-2">
          <span className={`text-base font-bold ${config.title}`}>
            {fact.subject} <span className="text-[#38BDF8]">•</span> {fact.attribute} =
          </span>
          <span className={`font-mono text-sm px-2.5 py-0.5 rounded font-bold border ${config.valueBoxBg} ${config.valueText}`}>
            {fact.value}
          </span>
        </div>

        {/* Status Context Explanation */}
        <div className="text-[11px] text-[#64748B] leading-relaxed italic">
          {config.description}
        </div>

        {/* Conflict Alert Box if Disputed */}
        {fact.status === 'disputed' && (
          <div className="p-2.5 rounded-lg bg-[#2D0F17] border border-[#591C28] text-xs text-[#FDA4AF] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#FFE4E6]">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F43F5E]" />
              <span>Contradiction Warning (Rule 3c)</span>
            </div>
            <div className="text-[11px] text-[#FECDD3]">
              Contradicts fact <code className="font-mono text-white">{fact.conflicts_with_id || 'competing claim'}</code>
              {conflictsFact ? ` ("${conflictsFact.value}")` : ''} without an explicit override. Both remain preserved as disputed.
            </div>
          </div>
        )}

        {/* Provenance & Bi-temporal Details Bar */}
        <div className="pt-2.5 border-t border-[#1C2334] space-y-2 text-xs">
          {/* Source User & Message Quote */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                style={{ backgroundColor: sourceUser?.avatar_color || '#3B82F6' }}
              >
                {sourceUser?.name[0] || 'U'}
              </div>
              <span className="text-[#E2E8F0] font-medium">
                {sourceUser?.name || fact.source_user_id}
              </span>
              <span className="text-[#475569]">•</span>
              <span className="font-mono text-[10px] text-[#64748B]">
                msg: {fact.source_message_id}
              </span>
            </div>

            {/* Ingestion & Validity Timestamps */}
            <div className="flex items-center gap-3 font-mono text-[10px] text-[#64748B]">
              <span>
                Valid: {new Date(fact.valid_from).toLocaleDateString()} →{' '}
                {fact.valid_to ? (
                  <span className="text-[#FB7185]">{new Date(fact.valid_to).toLocaleDateString()}</span>
                ) : (
                  <span className="text-[#34D399]">Active</span>
                )}
              </span>
              <span className="text-[#475569]">•</span>
              <span>
                Ingested: {new Date(fact.recorded_at).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Raw Source Quote (with Expandable long text handling) */}
          <div className="p-2 rounded bg-[#0A0D14] border border-[#161D2B] font-mono text-xs text-[#CBD5E1] space-y-1">
            <div className="text-[10px] text-[#64748B] uppercase font-mono flex items-center justify-between">
              <span>Source Message Quote:</span>
              {isLongQuote && (
                <button
                  type="button"
                  onClick={(e) => toggleQuoteExpand(e, fact.id)}
                  className="text-[#38BDF8] hover:text-[#7DD3FC] flex items-center gap-0.5 text-[10px]"
                >
                  <span>{isQuoteExpanded ? 'Collapse' : 'Show full text'}</span>
                  {isQuoteExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
            <div className={`italic ${isLongQuote && !isQuoteExpanded ? 'line-clamp-2' : ''}`}>
              "{rawQuote}"
            </div>
          </div>
        </div>

        {/* If superseded by a later active fact, show explicit navigation affordance */}
        {supersededByFact && (
          <div className="pt-2 border-t border-[#24171E] flex items-center justify-between text-[11px] text-[#FB7185]">
            <div className="flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Replaced by active successor:</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFact(supersededByFact);
                }}
                className="font-mono text-[#F1F5F9] font-bold underline hover:text-[#38BDF8]"
              >
                {supersededByFact.id} ("{supersededByFact.value}")
              </button>
            </div>
            <span className="text-[10px] font-mono opacity-80 group-hover:opacity-100 flex items-center gap-1">
              Inspect Replacement →
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-5">
      {/* Top Banner & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#0E121A] border border-[#1E2536]">
        <div>
          <h2 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#34D399]" />
            Memory Timeline & Provenance Lineage
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Temporal graph of verified state, versioned supersessions (Rule 3b), and unhedged proposals (Rule 3a).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-[#131824] p-1 rounded-lg border border-[#242E44] text-xs">
            <button
              id="view-group-current"
              onClick={() => setViewGrouping('current_vs_history')}
              className={`px-2.5 py-1 rounded transition-colors text-xs font-medium ${
                viewGrouping === 'current_vs_history'
                  ? 'bg-[#1E2638] text-[#F8FAFC] shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              Grouped State
            </button>
            <button
              id="view-group-chrono"
              onClick={() => setViewGrouping('chronological')}
              className={`px-2.5 py-1 rounded transition-colors text-xs font-medium ${
                viewGrouping === 'chronological'
                  ? 'bg-[#1E2638] text-[#F8FAFC] shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              Pure Chronology
            </button>
          </div>

          <button
            id="btn-refresh-timeline"
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141A26] hover:bg-[#1E2638] text-[#CBD5E1] text-xs font-mono border border-[#263248] transition-colors"
            title="Reload facts from backend"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs (All 6 States) */}
          <div className="flex flex-wrap items-center gap-1 bg-[#0F131C] p-1 rounded-lg border border-[#1E2536] text-xs">
            <button
              id="filter-all"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'all'
                  ? 'bg-[#1E2638] text-[#F8FAFC] font-semibold border border-[#334155]'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              All ({facts.length})
            </button>
            <button
              id="filter-active"
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'active'
                  ? 'bg-[#063826] text-[#34D399] font-semibold border border-[#059669]/50'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              Active ({statusCounts['active'] || 0})
            </button>
            <button
              id="filter-proposed"
              onClick={() => setStatusFilter('proposed')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'proposed'
                  ? 'bg-[#2E2010] text-[#FBBF24] font-semibold border border-[#D97706]/50'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              Proposed ({statusCounts['proposed'] || 0})
            </button>
            <button
              id="filter-superseded"
              onClick={() => setStatusFilter('superseded')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'superseded'
                  ? 'bg-[#1A202E] text-[#94A3B8] font-semibold border border-[#334155]'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              Superseded ({statusCounts['superseded'] || 0})
            </button>
            <button
              id="filter-disputed"
              onClick={() => setStatusFilter('disputed')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'disputed'
                  ? 'bg-[#38111A] text-[#FB7185] font-semibold border border-[#E11D48]/50'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              Disputed ({statusCounts['disputed'] || 0})
            </button>
            <button
              id="filter-stale"
              onClick={() => setStatusFilter('stale')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'stale'
                  ? 'bg-[#26201D] text-[#D6D3D1] font-semibold border border-[#78716C]/50'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              Stale ({statusCounts['stale'] || 0})
            </button>
            <button
              id="filter-forgotten"
              onClick={() => setStatusFilter('forgotten')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'forgotten'
                  ? 'bg-[#141518] text-[#71717A] font-semibold border border-[#3F3F46]/40'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              Forgotten ({statusCounts['forgotten'] || 0})
            </button>
          </div>

          {/* Visibility scope toggle */}
          <div className="flex items-center gap-1 bg-[#0F131C] p-1 rounded-lg border border-[#1E2536] text-xs">
            <button
              id="vis-all"
              onClick={() => setVisibilityFilter('all')}
              className={`px-2 py-1 rounded transition-colors ${
                visibilityFilter === 'all'
                  ? 'bg-[#1E2638] text-[#F8FAFC]'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              All Scopes
            </button>
            <button
              id="vis-team"
              onClick={() => setVisibilityFilter('team')}
              className={`px-2 py-1 rounded transition-colors ${
                visibilityFilter === 'team'
                  ? 'bg-[#1E2638] text-[#F8FAFC]'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              Team Only
            </button>
            <button
              id="vis-private"
              onClick={() => setVisibilityFilter('private')}
              className={`px-2 py-1 rounded transition-colors ${
                visibilityFilter === 'private'
                  ? 'bg-[#2F1538] text-[#D8B4FE]'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'
              }`}
            >
              Private Only
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" />
          <input
            id="timeline-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memory subject, attribute, value, fact ID, fact key, or quote text..."
            className="w-full bg-[#0E121A] border border-[#1E2536] rounded-lg pl-9 pr-4 py-2 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8]"
          />
        </div>
      </div>

      {/* MEMORY GRAPH CONTENT */}
      {sortedFacts.length === 0 ? (
        /* Empty State */
        <div 
          id="timeline-empty-state"
          className="p-12 text-center rounded-xl bg-[#0E121A] border border-[#1E2536] space-y-3"
        >
          <div className="w-10 h-10 rounded-full bg-[#151B28] flex items-center justify-center text-[#64748B] mx-auto">
            <Archive className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#F1F5F9]">No Memories Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            No memories match the current filters ({statusFilter}, {visibilityFilter}) or search query "{searchQuery}".
          </p>
          <button
            onClick={() => {
              setStatusFilter('all');
              setVisibilityFilter('all');
              setSearchQuery('');
            }}
            className="px-3 py-1.5 rounded-lg bg-[#182030] hover:bg-[#202C44] text-[#38BDF8] text-xs font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : viewGrouping === 'current_vs_history' && statusFilter === 'all' ? (
        /* Grouped View: Current Canonical State vs Historical Audit Trail */
        <div className="space-y-6">
          {/* SECTION 1: CURRENT CANONICAL STATE */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1A2234]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#34D399] font-mono">
                Canonical Truths — Current Workspace State ({currentActiveFacts.length})
              </h3>
              <span className="text-[11px] text-[#64748B] font-mono">
                Active & Uncontested
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {currentActiveFacts.map(renderFactCard)}
            </div>
          </div>

          {/* SECTION 2: HISTORICAL LINEAGE & AUDIT LOG */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1A2234]">
              <Layers className="w-3.5 h-3.5 text-[#94A3B8]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] font-mono">
                Historical Audit Trail & Lineage ({historicalOrOtherFacts.length})
              </h3>
              <span className="text-[11px] text-[#64748B] font-mono">
                Superseded, Proposals, Disputes, Stale & Retracted
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {historicalOrOtherFacts.map(renderFactCard)}
            </div>
          </div>
        </div>
      ) : (
        /* Pure Chronological Lineage */
        <div className="grid grid-cols-1 gap-3">
          {sortedFacts.map(renderFactCard)}
        </div>
      )}
    </div>
  );
};
