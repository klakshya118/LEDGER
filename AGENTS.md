# AGENTS.md — Persistent Developer Instructions for Ledger

## 1. Project Overview & Architectural Boundaries

Ledger is a **State & Provenance Memory Engine** with deterministic conflict resolution and bi-temporal traceability.
- **Runtime**: Node.js + Express backend running Vite middleware on port `3000`.
- **Database Model**: Bi-temporal knowledge graph (SQLite & memory adapter).
- **Core Invariant**: Epistemic resolution must remain strictly deterministic (Rules 3a, 3b, 3c, 3d, Rule 4).

---

## 2. Mandatory Architectural Directives

### 1. Zero-Cost Free-Only LLM Guarantee
- All AI extraction capabilities must operate exclusively using **free-tier developer resources** (Google AI Studio Gemini Flash, `gemini-2.5-flash` or `gemini-3.8-flash` via `@google/genai`).
- Never introduce dependencies or workflows that demand paid API credits, credit card setup, or paid model routing.
- The `FreeOnlyLlmRouter` in `src/server/llmRouter.ts` must always retain its fallback to `extractDeterministic` to guarantee 100% uptime when keys are missing or exhausted.

### 2. Locked Section 4 API Endpoints
The backend must strictly support:
- `POST /login`
- `POST /workspaces/:workspace_id/messages`
- `POST /workspaces/:workspace_id/query`
- `GET  /workspaces/:workspace_id/memories`
- `POST /workspaces/:workspace_id/what-changed`
- `POST /eval/run` (and `/workspaces/:workspace_id/eval/run`)
- `POST /reset` (and `/workspaces/:workspace_id/reset`)
- `GET  /api/llm/status`
- `POST /api/llm/preflight`

### 3. Verification Commands
Always verify with:
- `npm run lint` (runs `tsc --noEmit`)
- `curl -X POST http://localhost:3000/eval/run` (all 16 tests must pass)
