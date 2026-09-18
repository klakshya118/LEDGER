# Contributing to Ledger

Thank you for your interest in contributing to the **Ledger State & Provenance Memory Engine**!

Ledger is built to provide zero-hallucination, deterministic, bi-temporal memory for collaborative teams and AI agents. We welcome pull requests, bug reports, and architectural discussions.

---

## 1. Development Philosophy

1. **Deterministic Core**: Logic governing epistemic state transitions (Rules 3a, 3b, 3c, 3d, Rule 4) must remain strictly deterministic.
2. **Free-Only LLM Guarantee**: All AI extractions must be compatible with free-tier developer APIs (e.g. Google AI Studio Gemini Flash). No contributions may require paid API subscriptions or credit cards.
3. **Bi-Temporal Invariance**: Never discard or rewrite historical intervals. Past states must remain queryable via `as_of`.
4. **Authoritative Evidence**: Every assertion must link immutably to its raw message ID, author session token, and verbatim quotation.

---

## 2. Local Setup

```bash
# Clone the repository
git clone https://github.com/your-org/ledger-memory-engine.git
cd ledger-memory-engine

# Install dependencies
npm install

# Run the full-stack development server
npm run dev
```

The application will be served at `http://localhost:3000`.

---

## 3. Code Standards & Verification

Before submitting a Pull Request, you **must** ensure that all linters and test suites pass:

```bash
# 1. Run TypeScript compiler type checking
npm run lint

# 2. Run the deterministic 16-case evaluation harness
curl -X POST http://localhost:3000/eval/run
```

All 16 test cases must return `passed: true` with a `hallucination_rate: 0.0`.

---

## 4. Pull Request Guidelines

1. **Branch Naming**: Use concise prefixes like `feat/`, `fix/`, `docs/`, or `eval/`.
2. **Atomic Commits**: Keep changes organized and descriptive.
3. **API Integrity**: Do not alter the locked Section 4 API schema without prior RFC consensus.
4. **Documentation**: If adding a new feature or rule, update `README.md` and `docs/SPECIFICATION.md`.

---

## 5. Reporting Issues

Please file issues on GitHub with:
- Exact reproduction steps.
- The message sequence triggering unexpected state resolution.
- Evaluation suite logs or HTTP response payloads.
