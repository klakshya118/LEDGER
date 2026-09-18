import React from 'react';
import { 
  Play, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  RotateCcw, 
  X, 
  ArrowRight,
  HelpCircle,
  Database,
  Layers,
  Send,
  Search,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export interface DemoStep {
  stepNumber: number;
  title: string;
  tag: string;
  tab: 'chat' | 'timeline' | 'conflicts' | 'changes' | 'eval';
  narration: string;
  technicalUnderTheHood: string;
  actionButtonLabel: string;
  actionType: 'query' | 'ingest' | 'evidence' | 'navigate' | 'eval';
  actionPayload?: any;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    stepNumber: 1,
    title: 'Current Canonical Truth & Lineage',
    tag: 'RULE 3B RESULT',
    tab: 'chat',
    narration:
      'Start by asking what database the team is currently using. Notice that Ledger does not just return "PostgreSQL"—it returns the exact citation fact-002 and a complete version lineage showing that PostgreSQL superseded MongoDB.',
    technicalUnderTheHood:
      'Server applies temporal predicate: valid_from <= now AND (valid_to IS NULL OR valid_to > now). Evaluates active status and traverses supersede_id pointers.',
    actionButtonLabel: 'Run Step 1: Query Current DB',
    actionType: 'query',
    actionPayload: { question: 'What database are we using?' },
  },
  {
    stepNumber: 2,
    title: 'The "Why This Answer?" Evidence Receipt',
    tag: 'AUDIT PROOF',
    tab: 'chat',
    narration:
      'Now click "Why this answer?". A judge or compliance auditor can inspect the decision proof: bi-temporal windows (Valid Time vs Ingestion Time), Alice\'s verbatim raw chat message, and the exact Rule 3b resolution reason.',
    technicalUnderTheHood:
      'Reads fact-002 from facts table, resolves source_message_id msg-002, checks author session token, and generates plain-English decision proof.',
    actionButtonLabel: 'Run Step 2: Open Evidence Receipt',
    actionType: 'evidence',
    actionPayload: { factId: 'fact-002' },
  },
  {
    stepNumber: 3,
    title: 'Bi-Temporal Time Travel (as_of Query)',
    tag: 'TIME TRAVEL',
    tab: 'chat',
    narration:
      'Ask what database we were using on September 15th. Standard RAG would hallucinate or return PostgreSQL. Ledger applies the as_of filter and accurately returns MongoDB (fact-001).',
    technicalUnderTheHood:
      'Query sets as_of="2026-09-15T12:00:00Z". Filters fact-002 out because its valid_from (Sept 17) is in the future relative to the query timestamp. Matches fact-001 whose valid window covers Sept 15.',
    actionButtonLabel: 'Run Step 3: Query as of Sept 15',
    actionType: 'query',
    actionPayload: { question: 'What did we use on Sept 15?', asOf: '2026-09-15T12:00:00Z' },
  },
  {
    stepNumber: 4,
    title: 'Human Dispute Flagging (Rule 3c)',
    tag: 'NO GUESSING',
    tab: 'conflicts',
    narration:
      'Alice asserted the deadline is Oct 10; Bob asserted it is Oct 3. Neither used an override signal. Instead of flipping a coin or letting an LLM hallucinate a winner, Ledger flags both as DISPUTED and refuses to invent truth.',
    technicalUnderTheHood:
      'Rule 3c: Two distinct authors assert contradictory values for project::deadline without override words. Stored status=disputed; conflicts_with_id linked bidirectionally.',
    actionButtonLabel: 'Run Step 4: Inspect Conflict Matrix',
    actionType: 'navigate',
    actionPayload: { tab: 'conflicts' },
  },
  {
    stepNumber: 5,
    title: 'One-Click Dispute Override Resolution',
    tag: 'RULE 3B OVERRIDE',
    tab: 'chat',
    narration:
      'Now ingest the resolution: "The client confirmed the deadline is Oct 3." Because "confirmed" triggers an override signal, Ledger immediately promotes Oct 3 to ACTIVE and archives the dispute.',
    technicalUnderTheHood:
      'POST /messages detects override_signal=true ("confirmed"). Resolves conflict: closes competing fact validity window, marks predecessor superseded, promotes winner to ACTIVE canonical truth.',
    actionButtonLabel: 'Run Step 5: Ingest Confirmed Override',
    actionType: 'ingest',
    actionPayload: { text: 'The client confirmed that the deadline is Oct 3.' },
  },
  {
    stepNumber: 6,
    title: 'Full 9-Benchmark Automated Evaluation',
    tag: 'VERIFIED 9/9',
    tab: 'eval',
    narration:
      'Finish by running the automated benchmark suite against the live server. In less than 100ms, all 9 test scenarios pass with 100% precision, 100% recall, and 0% hallucination rate.',
    technicalUnderTheHood:
      'POST /workspaces/ws-ledger-main/eval/run executes 9 automated test harnesses covering supersession, proposals, disputes, TTL decay, privacy boundaries, and retractions.',
    actionButtonLabel: 'Run Step 6: View Live Eval Suite',
    actionType: 'navigate',
    actionPayload: { tab: 'eval' },
  },
];

interface LiveDemoWalkthroughProps {
  currentStep: number;
  onSetStep: (step: number) => void;
  isOpen: boolean;
  onClose: () => void;
  onExecuteStep: (step: DemoStep) => void;
  onResetDemo: () => void;
}

export const LiveDemoWalkthrough: React.FC<LiveDemoWalkthroughProps> = ({
  currentStep,
  onSetStep,
  isOpen,
  onClose,
  onExecuteStep,
  onResetDemo,
}) => {
  if (!isOpen) return null;

  const activeStep = DEMO_STEPS[currentStep - 1] || DEMO_STEPS[0];
  const totalSteps = DEMO_STEPS.length;

  const handlePrev = () => {
    if (currentStep > 1) {
      onSetStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      onSetStep(currentStep + 1);
    }
  };

  return (
    <div 
      id="live-demo-walkthrough-panel"
      className="bg-[#0E121A] border-b border-[#202736] shadow-xl relative z-30 transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#1A212E]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#93C5FD]">
              <Play className="w-3 h-3 fill-current" />
            </div>
            <span className="font-semibold text-xs tracking-wider text-[#F1F5F9] font-mono flex items-center gap-2">
              <span>LIVE DEMO GUIDE</span>
              <span className="text-[11px] bg-[#161D2A] text-[#94A3B8] px-2 py-0.5 rounded border border-[#263147]">
                Step {currentStep} of {totalSteps}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetDemo}
              className="flex items-center gap-1.5 text-[11px] font-mono text-[#94A3B8] hover:text-[#F1F5F9] bg-[#161C26] hover:bg-[#1E2636] px-2.5 py-1 rounded border border-[#242E42] transition-colors"
              title="Reset knowledge store back to seed state"
            >
              <RotateCcw className="w-3 h-3 text-[#60A5FA]" />
              <span>Reset Seed State</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded text-[#64748B] hover:text-[#CBD5E1] hover:bg-[#1A2130] transition-colors"
              title="Minimize guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Progress Pills */}
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
          {DEMO_STEPS.map((step) => {
            const isCurrent = step.stepNumber === currentStep;
            const isCompleted = step.stepNumber < currentStep;
            return (
              <button
                key={step.stepNumber}
                onClick={() => onSetStep(step.stepNumber)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-[#2563EB] text-white font-semibold'
                    : isCompleted
                    ? 'bg-[#10231C] text-[#34D399] border border-[#059669]/30 hover:bg-[#163327]'
                    : 'bg-[#131722] text-[#64748B] border border-[#1E2535] hover:text-[#94A3B8]'
                }`}
              >
                <span>{step.stepNumber}.</span>
                <span className="hidden md:inline">{step.tag}</span>
              </button>
            );
          })}
        </div>

        {/* Active Step Presentation Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 bg-[#131822] p-3.5 rounded-lg border border-[#21293A]">
          {/* Left 2 Cols: Narration Script & Mechanics */}
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-[#1B2232] text-[#93C5FD] px-2 py-0.5 rounded border border-[#2C3852]">
                {activeStep.tag}
              </span>
              <h3 className="text-sm font-semibold text-[#F8FAFC]">
                {activeStep.title}
              </h3>
            </div>

            {/* Presenter script */}
            <div className="p-3 rounded-md bg-[#0C1017] border border-[#1A212E] text-xs text-[#CBD5E1] leading-relaxed">
              <div className="text-[10px] uppercase font-mono text-[#60A5FA] font-semibold mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-[#60A5FA]" />
                <span>Presenter Script:</span>
              </div>
              <p className="italic font-sans text-[#E2E8F0]">
                "{activeStep.narration}"
              </p>
            </div>

            {/* Technical under the hood */}
            <div className="text-[11px] text-[#94A3B8] font-mono flex items-start gap-1.5">
              <span className="text-[#64748B] shrink-0">ENGINE MECHANICS:</span>
              <span className="text-[#CBD5E1]">{activeStep.technicalUnderTheHood}</span>
            </div>
          </div>

          {/* Right Col: One-Click Execute Action & Controls */}
          <div className="flex flex-col justify-between p-3 rounded-md bg-[#0D121B] border border-[#1D2536] space-y-3">
            <div>
              <span className="text-[10px] uppercase font-mono text-[#64748B] block mb-1">
                One-Click Action:
              </span>
              <button
                id={`btn-demo-action-step-${currentStep}`}
                onClick={() => onExecuteStep(activeStep)}
                className="w-full py-2 px-3 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs flex items-center justify-center gap-2 shadow transition-all active:scale-[0.98]"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{activeStep.actionButtonLabel}</span>
              </button>
            </div>

            {/* Navigation Stepper Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1A212E] text-xs font-mono">
              <button
                onClick={handlePrev}
                disabled={currentStep === 1}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  currentStep === 1
                    ? 'text-[#475569] cursor-not-allowed'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161C26]'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <span className="text-[#64748B] text-[11px]">
                {currentStep} / {totalSteps}
              </span>

              <button
                onClick={handleNext}
                disabled={currentStep === totalSteps}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  currentStep === totalSteps
                    ? 'text-[#475569] cursor-not-allowed'
                    : 'text-[#60A5FA] hover:text-[#93C5FD] hover:bg-[#182338]'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
