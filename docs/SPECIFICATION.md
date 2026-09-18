# Ledger REST API Specification (Locked Section 4)

## Overview
All endpoints accept and return `application/json`.
Base URL in dev container: `http://localhost:3000`

---

## 1. Authentication
### `POST /login`
Initiates an authenticated session token for a team member.

**Request Payload:**
```json
{
  "name": "Alice Chen"
}
```

**Response Payload (200 OK):**
```json
{
  "session_token": "tok-u-alice-1726650000",
  "user_id": "u-alice",
  "workspace_id": "ws-ledger-main",
  "name": "Alice Chen"
}
```

---

## 2. Ingestion
### `POST /workspaces/:workspace_id/messages`
Ingests a natural language team message, triggers epistemic extraction, executes state transition rules, and immutably records facts.

**Headers:**
`Authorization: Bearer <session_token>`

**Request Payload:**
```json
{
  "text": "Actually, we moved the database to PostgreSQL."
}
```

**Response Payload (200 OK):**
```json
{
  "message_id": "msg-003",
  "workspace_id": "ws-ledger-main",
  "source_user_id": "u-alice",
  "candidates": [
    {
      "subject": "project",
      "attribute": "database",
      "value": "PostgreSQL",
      "type": "fact",
      "epistemic_status": "correction",
      "override_signal": true
    }
  ],
  "outcomes": [
    {
      "outcome": "superseded",
      "fact_id": "fact-003",
      "rule_applied": "rule_b",
      "detail": "Rule 3b: Explicit override signal detected. Prior active fact fact-001 superseded."
    }
  ],
  "facts_created_or_modified": []
}
```

---

## 3. Querying
### `POST /workspaces/:workspace_id/query`
Queries the active state or historical point-in-time state.

**Request Payload:**
```json
{
  "question": "What database are we using?",
  "as_of": "2026-09-15T00:00:00Z"
}
```

---

## 4. Evaluation Runner
### `POST /eval/run`
Executes all 16 test cases of the deterministic benchmark harness and returns comprehensive scoring.

**Response Payload (200 OK):**
```json
{
  "suite_id": "suite-ledger-core-v1",
  "total": 16,
  "passed": 16,
  "failed": 0,
  "precision_score": 1.0,
  "recall_score": 1.0,
  "hallucination_rate": 0.0,
  "policy": "FREE_ONLY",
  "results": []
}
```
