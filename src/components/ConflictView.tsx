import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  User as UserIcon, 
  MessageSquare, 
  Clock, 
  HelpCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Fact, Message, User } from '../types/ledger';
import { ledgerApi } from '../api/client';

interface ConflictViewProps {
  facts: Fact[];
  messages: Record<string, Message>;
  users: Record<string, User>;
  onSelectFact: (fact: Fact) => void;
  onRefresh: () => void;
  activeUser: User;
}

export const ConflictView: React.FC<ConflictViewProps> = ({
  facts,
  messages,
  users,
  onSelectFact,
  onRefresh,
  activeUser,
}) => {
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Group disputed facts by fact_key
  const disputedFacts = facts.filter((f) => f.status === 'disputed');

  const conflictGroups = disputedFacts.reduce((acc, f) => {
    if (!acc[f.fact_key]) {
      acc[f.fact_key] = [];
    }
    acc[f.fact_key].push(f);
    return acc;
  }, {} as Record<string, Fact[]>);

  const handleResolve = async (factKey: string, winnerValue: string) => {
    setResolvingId(factKey);
    try {
      // Ingest confirmed correction message per Rule 3b
      await ledgerApi.sendMessage(`The client confirmed the ${factKey.split('::')[1]} is ${winnerValue}.`);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
    setResolvingId(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Banner */}
      <div className="p-4 rounded-xl bg-[#210D12] border border-[#521C26] space-y-2">
        <div className="flex items-center gap-2.5 text-[#F43F5E]">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h2 className="text-base font-bold text-[#FFE4E6]">
            Conflict & Dispute Inspector (Rule 3c Engine)
          </h2>
        </div>
        <p className="text-xs text-[#FDA4AF] leading-relaxed">
          When contradicting statements are asserted by different team members without confirmed override language, Ledger refuses to arbitrarily pick a winner. Both records enter the <span className="font-mono font-bold text-white bg-[#3E141C] px-1.5 py-0.5 rounded">DISPUTED</span> state.
        </p>
      </div>

      {Object.keys(conflictGroups).length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#11151F] border border-[#202738] space-y-3">
          <CheckCircle2 className="w-8 h-8 text-[#34D399] mx-auto opacity-80" />
          <div className="text-sm font-semibold text-[#F1F5F9]">
            Zero Active Disputes in Workspace
          </div>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
            All team facts have established singular consensus or versioned supersessions without outstanding uncorroborated contradictions.
          </p>
        </div>
      ) : (
        Object.entries(conflictGroups).map(([factKey, groupFacts]) => {
          const first = groupFacts[0];
          const second = groupFacts[1] || (first.conflicts_with_id ? facts.find((f) => f.id === first.conflicts_with_id) : null);

          const author1 = users[first.source_user_id];
          const author2 = second ? users[second.source_user_id] : null;

          const msg1 = messages[first.source_message_id];
          const msg2 = second ? messages[second.source_message_id] : null;

          return (
            <div
              key={factKey}
              id={`dispute-card-${factKey.replace('::', '-')}`}
              className="p-5 rounded-xl bg-[#131722] border border-[#2B354C] space-y-5 shadow-lg"
            >
              {/* Fact Key & Critical Directive Warning */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1E2538]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#38BDF8]">
                    FACT KEY: {factKey}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-[#38111A] text-[#FB7185] px-2 py-0.5 rounded border border-[#E11D48]/40">
                    STATUS: DISPUTED
                  </span>
                </div>

                <span className="text-xs text-[#94A3B8]">
                  Section 3 Rule 3c Match
                </span>
              </div>

              {/* Crucial Spec Callout */}
              <div className="p-3.5 rounded-lg bg-[#270E15] border border-[#4C1924] text-xs text-[#FECDD3] space-y-1">
                <div className="font-bold text-[#FFE4E6] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#F43F5E]" />
                  <span>Authoritative System Declaration:</span>
                </div>
                <div className="text-sm font-semibold text-white italic">
                  “Ledger cannot establish a single current truth from the available evidence.”
                </div>
                <div className="text-[11px] text-[#FDA4AF] mt-1">
                  Neither claim carries an explicit override signal (<code className="text-[#FFE4E6]">override_signal=0</code>). The query engine will report uncertainty and cite both competing sources.
                </div>
              </div>

              {/* Dual Claims Side-by-Side Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Claim 1 */}
                <div
                  onClick={() => onSelectFact(first)}
                  className="p-4 rounded-lg bg-[#0F131C] border border-[#252E44] hover:border-[#38BDF8] cursor-pointer transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[#38BDF8] font-bold">
                      Claim A: {first.id}
                    </span>
                    <span className="text-[10px] font-mono text-[#64748B]">
                      Recorded: {new Date(first.recorded_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-[#F1F5F9]">
                    Value: <span className="text-[#38BDF8] font-mono text-base">{first.value}</span>
                  </div>

                  <div className="p-2.5 rounded bg-[#090C12] border border-[#1A2132] space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                      <div
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                        style={{ backgroundColor: author1?.avatar_color || '#3B82F6' }}
                      >
                        {author1?.name[0] || 'U'}
                      </div>
                      <span className="font-medium text-[#CBD5E1]">{author1?.name || first.source_user_id}</span>
                    </div>
                    <div className="text-xs text-[#CBD5E1] font-mono italic">
                      "{msg1?.text || 'Claim statement'}"
                    </div>
                  </div>

                  <div className="text-[10px] text-[#64748B] flex items-center justify-between">
                    <span>Epistemic: {first.epistemic_status}</span>
                    <span>Override Signal: 0 (False)</span>
                  </div>
                </div>

                {/* Claim 2 */}
                {second && (
                  <div
                    onClick={() => onSelectFact(second)}
                    className="p-4 rounded-lg bg-[#0F131C] border border-[#252E44] hover:border-[#FB7185] cursor-pointer transition-colors space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[#FB7185] font-bold">
                        Claim B: {second.id}
                      </span>
                      <span className="text-[10px] font-mono text-[#64748B]">
                        Recorded: {new Date(second.recorded_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-[#F1F5F9]">
                      Value: <span className="text-[#FB7185] font-mono text-base">{second.value}</span>
                    </div>

                    <div className="p-2.5 rounded bg-[#090C12] border border-[#1A2132] space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                        <div
                          className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                          style={{ backgroundColor: author2?.avatar_color || '#10B981' }}
                        >
                          {author2?.name[0] || 'U'}
                        </div>
                        <span className="font-medium text-[#CBD5E1]">{author2?.name || second.source_user_id}</span>
                      </div>
                      <div className="text-xs text-[#CBD5E1] font-mono italic">
                        "{msg2?.text || 'Claim statement'}"
                      </div>
                    </div>

                    <div className="text-[10px] text-[#64748B] flex items-center justify-between">
                      <span>Epistemic: {second.epistemic_status}</span>
                      <span>Override Signal: 0 (False)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Resolution Action Surface (Rule 3b Transition) */}
              <div className="pt-3 border-t border-[#1E2538] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-[#94A3B8]">
                  Resolution pathway: Ingest explicit correction or client confirmation (<code className="text-[#CBD5E1]">Rule 3b</code>).
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id={`btn-resolve-claim-a-${first.value}`}
                    disabled={resolvingId === factKey}
                    onClick={() => handleResolve(factKey, first.value)}
                    className="px-3 py-1.5 rounded-md bg-[#162238] hover:bg-[#1F3050] text-[#38BDF8] border border-[#0284C7]/40 font-mono transition-colors"
                  >
                    Confirm "{first.value}"
                  </button>

                  {second && (
                    <button
                      id={`btn-resolve-claim-b-${second.value}`}
                      disabled={resolvingId === factKey}
                      onClick={() => handleResolve(factKey, second.value)}
                      className="px-3 py-1.5 rounded-md bg-[#2B1720] hover:bg-[#3D1F2D] text-[#FB7185] border border-[#E11D48]/40 font-mono transition-colors"
                    >
                      Confirm "{second.value}"
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
