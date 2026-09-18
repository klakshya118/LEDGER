import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Clock, 
  GitBranch, 
  AlertTriangle, 
  MessageSquare, 
  User as UserIcon, 
  Calendar, 
  CheckCircle, 
  ArrowRight,
  Database,
  Lock,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCheck,
  HelpCircle,
  Hash,
  AlertCircle
} from 'lucide-react';
import { Fact, Message, User } from '../types/ledger';

interface WhyEvidenceDrawerProps {
  fact: Fact | null;
  messages: Record<string, Message>;
  users: Record<string, User>;
  allFacts: Record<string, Fact>;
  onClose: () => void;
  onSelectFact: (fact: Fact) => void;
}

export const WhyEvidenceDrawer: React.FC<WhyEvidenceDrawerProps> = ({
  fact,
  messages,
  users,
  allFacts,
  onClose,
  onSelectFact,
}) => {
  const [expandLongQuote, setExpandLongQuote] = useState(false);

  if (!fact) return null;

  const sourceMessage = messages[fact.source_message_id];
  const sourceUser = users[fact.source_user_id];
  const supersedesFact = fact.supersedes_id ? allFacts[fact.supersedes_id] : null;
  const conflictsFact = fact.conflicts_with_id ? allFacts[fact.conflicts_with_id] : null;

  // Find facts that supersede THIS fact
  const supersededByFact = Object.values(allFacts).find((f) => f.supersedes_id === fact.id);

  const rawQuote = sourceMessage?.text || `Ingested statement: "${fact.subject} ${fact.attribute} is ${fact.value}"`;
  const isLongQuote = rawQuote.length > 140;

  const getStatusBadge = (status: Fact['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#063826] text-[#34D399] border border-[#059669]/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            ACTIVE (CANONICAL TRUTH)
          </span>
        );
      case 'proposed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#2E2010] text-[#FBBF24] border border-[#D97706]/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            PROPOSED (RULE 3A)
          </span>
        );
      case 'superseded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#181D29] text-[#94A3B8] border border-[#334155]/60 line-through">
            <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
            SUPERSEDED (RULE 3B)
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#38111A] text-[#FB7185] border border-[#E11D48]/50 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-[#F43F5E]" />
            DISPUTED (RULE 3C)
          </span>
        );
      case 'stale':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#26201D] text-[#D6D3D1] border border-[#78716C]/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A8A29E]" />
            STALE (DECAYED TTL)
          </span>
        );
      case 'forgotten':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#141518] text-[#71717A] border border-[#3F3F46]/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#52525B]" />
            FORGOTTEN (RETRACTED)
          </span>
        );
    }
  };

  const getJudgeWalkthroughText = () => {
    switch (fact.status) {
      case 'active':
        if (fact.supersedes_id && supersedesFact) {
          return `This memory is currently the CANONICAL TRUTH for "${fact.subject}::${fact.attribute}". It was established when an explicit correction signal (Rule 3b) replaced prior fact ${fact.supersedes_id} ("${supersedesFact.value}"). Any query asked as of today resolves to this record.`;
        }
        return `This memory is currently the CANONICAL TRUTH for "${fact.subject}::${fact.attribute}". It was recorded directly into SQLite as an active assertion with no unresolved disputes.`;
      case 'proposed':
        return `This memory is marked PROPOSED under Section 3 Rule 3a. The author used unhedged or suggestive phrasing ("Maybe we should..."). The deterministic resolver does not allow unconfirmed suggestions to overwrite established team truth.`;
      case 'superseded':
        return `This memory is HISTORICAL. It was previously active from ${new Date(fact.valid_from).toLocaleDateString()} until ${fact.valid_to ? new Date(fact.valid_to).toLocaleDateString() : 'its replacement'}. A confirmed override (Rule 3b) closed this validity window. It is preserved for time-travel queries.`;
      case 'disputed':
        return `This memory is in an ACTIVE DISPUTE (Rule 3c). Contradictory claims were asserted without an explicit override signal. Because Ledger strictly refuses to guess which person is correct without evidence, queries for this topic will warn that single truth cannot be resolved.`;
      case 'stale':
        return `This memory has decayed into STALE status. It represents a task or temporal assertion whose validity window passed without reconfirmation.`;
      case 'forgotten':
        return `This memory was explicitly RETRACTED or FORGOTTEN upon team command (Rule 4). It has been excluded from the query index.`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm flex justify-end transition-opacity">
      <div 
        id="evidence-inspector-drawer"
        className="w-full max-w-2xl bg-[#0E121A] border-l border-[#202738] shadow-2xl h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#1A2234] flex items-center justify-between bg-[#111622]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#162030] border border-[#273650] flex items-center justify-center text-[#38BDF8]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide text-[#F1F5F9] uppercase font-mono">
                  Why this answer?
                </h2>
                <span className="text-[10px] font-mono text-[#64748B] bg-[#161D2B] px-1.5 py-0.2 rounded border border-[#242E44]">
                  EVIDENCE RECEIPT
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Canonical SQLite Fact Record & Provenance Lineage
              </p>
            </div>
          </div>

          <button
            id="btn-close-evidence"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#1A2334] text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
            title="Close inspector (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          {/* Top Fact Identification Hero */}
          <div className="p-4 rounded-xl bg-[#121724] border border-[#20293D] space-y-3 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs text-[#38BDF8] font-bold">
                FACT ID: {fact.id}
              </span>
              <div className="flex items-center gap-2">
                {fact.visibility === 'private' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#2F1538] text-[#D8B4FE] border border-[#9333EA]/40">
                    <Lock className="w-2.5 h-2.5" /> PRIVATE
                  </span>
                )}
                {getStatusBadge(fact.status)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-[#64748B] font-mono uppercase tracking-wider">
                Fact Key: <span className="text-[#CBD5E1]">{fact.fact_key}</span>
              </div>
              <div className="text-xl font-bold text-[#F8FAFC]">
                {fact.subject} <span className="text-[#38BDF8]">•</span> {fact.attribute} ={' '}
                <span className="text-[#34D399] font-mono bg-[#0B2118] px-2 py-0.5 rounded border border-[#059669]/50">
                  {fact.value}
                </span>
              </div>
            </div>
          </div>

          {/* JUDGE & AUDITOR PLAIN-ENGLISH WALKTHROUGH */}
          <div className="p-4 rounded-xl bg-[#141B2A] border border-[#25334E] space-y-2">
            <div className="flex items-center gap-2 text-[#38BDF8] font-bold text-xs font-mono uppercase">
              <HelpCircle className="w-4 h-4" />
              <span>Judge & Auditor Explanation</span>
            </div>
            <p className="text-xs text-[#E2E8F0] leading-relaxed">
              {getJudgeWalkthroughText()}
            </p>
          </div>

          {/* BI-TEMPORAL WINDOWS */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Bi-Temporal State Representation</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#111622] border border-[#1E273A]">
              {/* Valid Time Window */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-[#64748B] uppercase font-mono block">
                  Validity Window (When it is/was true in the world)
                </span>
                <div className="text-xs font-mono text-[#F1F5F9]">
                  From: {fact.valid_from ? new Date(fact.valid_from).toLocaleString() : 'N/A'}
                </div>
                <div className="text-xs font-mono">
                  To:{' '}
                  {fact.valid_to ? (
                    <span className="text-[#FB7185]">{new Date(fact.valid_to).toLocaleString()}</span>
                  ) : (
                    <span className="text-[#34D399]">Present (Indefinite / Still Valid)</span>
                  )}
                </div>
              </div>

              {/* Ingestion Time */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-[#64748B] uppercase font-mono block">
                  Recorded Time (When Ledger ingested it)
                </span>
                <div className="text-xs font-mono text-[#CBD5E1]">
                  {fact.recorded_at ? new Date(fact.recorded_at).toLocaleString() : 'N/A'}
                </div>
                <span className="text-[10px] text-[#64748B] block">
                  Server-side wall-clock timestamp (immutable)
                </span>
              </div>
            </div>
          </div>

          {/* RAW SOURCE PROVENANCE WALK */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <MessageSquare className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>Raw Message Provenance</span>
            </h3>

            <div className="p-3.5 rounded-xl bg-[#111622] border border-[#1E273A] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: sourceUser?.avatar_color || '#3B82F6' }}
                  >
                    {sourceUser?.name[0] || 'U'}
                  </div>
                  <span className="text-[#F1F5F9] font-medium">
                    {sourceUser?.name || fact.source_user_id}
                  </span>
                  <span className="text-[#64748B] font-mono text-[10px]">
                    ({fact.source_user_id})
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#64748B]">
                  msg: {fact.source_message_id}
                </span>
              </div>

              {/* Raw Quote Box with Long Text Expander */}
              <div className="p-3 rounded-lg bg-[#0A0D14] border border-[#161D2B] font-mono text-xs text-[#E2E8F0] space-y-1.5">
                <div className={`italic leading-relaxed ${isLongQuote && !expandLongQuote ? 'line-clamp-3' : ''}`}>
                  "{rawQuote}"
                </div>
                {isLongQuote && (
                  <button
                    type="button"
                    onClick={() => setExpandLongQuote(!expandLongQuote)}
                    className="text-[#38BDF8] hover:text-[#7DD3FC] flex items-center gap-1 text-[11px] font-sans"
                  >
                    <span>{expandLongQuote ? 'Collapse text' : 'Show full original quote'}</span>
                    {expandLongQuote ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              <div className="text-[10px] text-[#64748B] flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#182030]">
                <span>Ingested: {sourceMessage?.created_at ? new Date(sourceMessage.created_at).toLocaleString() : new Date(fact.recorded_at).toLocaleString()}</span>
                <span>Workspace: <code className="text-[#CBD5E1]">{fact.workspace_id}</code></span>
              </div>
            </div>
          </div>

          {/* EPISTEMIC STATUS & OVERRIDE SIGNALS */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Layers className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Epistemic & Linguistic Classification</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#111622] border border-[#1E273A]">
              <div>
                <span className="text-[10px] text-[#64748B] uppercase font-mono block">
                  Epistemic Status
                </span>
                <span className="font-mono text-xs text-[#F1F5F9] font-medium uppercase">
                  {fact.epistemic_status}
                </span>
                <p className="text-[10px] text-[#64748B] mt-0.5">
                  {fact.epistemic_status === 'correction'
                    ? 'Explicit correction phrasing detected (Rule 3b)'
                    : fact.epistemic_status === 'proposal'
                    ? 'Suggested proposal (Rule 3a); never overrides truth'
                    : 'Asserted factual claim'}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-[#64748B] uppercase font-mono block">
                  Override Signal
                </span>
                <span
                  className={`font-mono text-xs font-medium ${
                    fact.override_signal ? 'text-[#34D399]' : 'text-[#94A3B8]'
                  }`}
                >
                  {fact.override_signal ? 'TRUE (Confirmed / Override)' : 'FALSE (Standard Assertion)'}
                </span>
                <p className="text-[10px] text-[#64748B] mt-0.5">
                  Linguistic confidence: {Math.round(fact.asserted_strength * 100)}% phrasing strength
                </p>
              </div>
            </div>
          </div>

          {/* LINEAGE: SUPERSEDES PRIOR FACT */}
          {supersedesFact && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <GitBranch className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Version Lineage: Supersedes Prior Memory</span>
              </h3>

              <div className="p-3.5 rounded-xl bg-[#111622] border border-[#1E273A] space-y-2">
                <div className="text-[11px] text-[#94A3B8]">
                  This memory replaced a previous fact via Section 3 Rule 3b:
                </div>

                <div 
                  onClick={() => onSelectFact(supersedesFact)}
                  className="p-3 rounded-lg bg-[#0A0D14] border border-[#232D42] hover:border-[#38BDF8] cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#64748B]">
                        {supersedesFact.id}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1C2332] text-[#94A3B8] line-through">
                        SUPERSEDED
                      </span>
                    </div>
                    <div className="text-xs font-medium text-[#E2E8F0] mt-0.5">
                      {supersedesFact.subject} • {supersedesFact.attribute} ={' '}
                      <span className="text-[#94A3B8] font-mono">{supersedesFact.value}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#38BDF8] transition-colors" />
                </div>
              </div>
            </div>
          )}

          {/* LINEAGE: REPLACED BY LATER SUCCESSOR */}
          {supersededByFact && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-[#FB7185] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <GitBranch className="w-3.5 h-3.5 text-[#FB7185]" />
                <span>Superseded By Successor Memory</span>
              </h3>

              <div 
                onClick={() => onSelectFact(supersededByFact)}
                className="p-3.5 rounded-xl bg-[#1D1216] border border-[#3E1A22] hover:border-[#FB7185] cursor-pointer transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#38BDF8]">
                      {supersededByFact.id}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#063826] text-[#34D399]">
                      ACTIVE SUCCESSOR
                    </span>
                  </div>
                  <div className="text-xs font-medium text-[#F1F5F9] mt-0.5">
                    Replaced with: <span className="text-[#34D399] font-mono font-bold">{supersededByFact.value}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#FB7185] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          )}

          {/* CONFLICT INFORMATION (IF DISPUTED) */}
          {fact.status === 'disputed' && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-[#FB7185] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-[#F43F5E]" />
                <span>Active Dispute Information (Rule 3c)</span>
              </h3>

              <div className="p-3.5 rounded-xl bg-[#251016] border border-[#4E1C24] space-y-2 text-[#FECDD3]">
                <p className="font-bold text-xs text-[#FFE4E6]">
                  Contradictory assertions without confirmed resolution
                </p>
                <p className="text-[11px] text-[#FDA4AF] leading-relaxed">
                  Another author asserted a conflicting value for property <code>{fact.fact_key}</code> without an explicit correction signal. Ledger preserves both assertions and marks them as disputed.
                </p>

                {conflictsFact && (
                  <div
                    onClick={() => onSelectFact(conflictsFact)}
                    className="p-2.5 rounded-lg bg-[#160B0E] border border-[#3E141C] hover:border-[#F43F5E] cursor-pointer transition-colors flex items-center justify-between mt-2"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-[#64748B]">Competing fact ID: {conflictsFact.id}</span>
                      <div className="font-mono text-xs text-[#F1F5F9] font-bold">
                        "{conflictsFact.value}"
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#FDA4AF]" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STORAGE & INDEX SUMMARY (OPTIONAL FIELDS INCLUDED) */}
          <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#1A2030] text-[11px] text-[#64748B] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#94A3B8]">
                <Database className="w-3 h-3 text-[#38BDF8]" />
                <span>SQLite Table: <code className="text-[#CBD5E1] font-mono">facts</code></span>
              </div>
              <span className="font-mono text-[10px]">
                TTL Expire: {fact.expires_at ? new Date(fact.expires_at).toLocaleString() : 'None (Persistent)'}
              </span>
            </div>
            <div>
              Deterministic resolver rules applied strictly. Zero generative model hallucination.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
