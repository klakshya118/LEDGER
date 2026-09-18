/**
 * Ledger — Locked Data Model Types & API Contract
 * Derived directly from LEDGER Master Workplan Section 2 & Section 4.
 */

export type FactVisibility = 'private' | 'team';

export type FactType = 'fact' | 'decision' | 'task';

export type EpistemicStatus = 
  | 'asserted' 
  | 'correction' 
  | 'proposal' 
  | 'opinion' 
  | 'uncertain';

export type FactStatus = 
  | 'active' 
  | 'proposed' 
  | 'superseded' 
  | 'disputed' 
  | 'stale' 
  | 'forgotten';

export interface Workspace {
  id: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  workspace_id: string;
  name: string;
  email?: string;
  avatar_color?: string;
}

export interface Session {
  token: string;
  user_id: string;
  workspace_id: string;
  created_at: string;
}

export interface Message {
  message_id: string;
  workspace_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export interface Fact {
  id: string;
  workspace_id: string;
  source_user_id: string;
  visibility: FactVisibility;

  subject: string;
  attribute: string;
  fact_key: string; // normalize(subject) || '::' || normalize(attribute)
  value: string;

  type: FactType;
  epistemic_status: EpistemicStatus;
  status: FactStatus;

  valid_from: string; // ISO8601
  valid_to: string | null; // ISO8601 or null if still active
  recorded_at: string; // ISO8601 wall-clock ingestion time

  supersedes_id: string | null;
  conflicts_with_id: string | null;

  asserted_strength: number; // 0-1, linguistic phrasing confidence
  override_signal: number; // 0 or 1

  source_message_id: string;
  expires_at: string | null;
}

export interface CandidateFact {
  subject: string;
  attribute: string;
  value: string;
  type: FactType;
  epistemic_status: EpistemicStatus;
  override_signal: boolean;
  valid_from: string | null;
  asserted_strength: number;
}

export interface ResolutionOutcome {
  candidate: CandidateFact;
  outcome: 'active_inserted' | 'proposed_inserted' | 'superseded' | 'disputed' | 'deduped' | 'forgotten' | 'fallback_resolved';
  fact_id: string;
  rule_applied: 'rule_a' | 'rule_b' | 'rule_c' | 'rule_d' | 'rule_e_fallback' | 'rule_4_forget' | 'initial_insert';
  detail: string;
}

// API Payloads
export interface LoginRequest {
  name: string;
}

export interface LoginResponse {
  session_token: string;
  user_id: string;
  workspace_id: string;
  name: string;
}

export interface IngestMessageRequest {
  text: string;
}

export interface IngestMessageResponse {
  message_id: string;
  workspace_id: string;
  source_user_id: string;
  created_at: string;
  candidates: CandidateFact[];
  outcomes: ResolutionOutcome[];
  facts_created_or_modified: Fact[];
}

export interface QueryRequest {
  question: string;
  as_of?: string; // ISO8601 for bi-temporal query
}

export interface QueryResponse {
  answer: string;
  memory_ids_used: string[];
  supersede_chain?: {
    id: string;
    supersedes_id: string | null;
    value: string;
    valid_from: string;
    valid_to: string | null;
    status: FactStatus;
  }[];
  disputed_flags?: {
    fact_id: string;
    conflicts_with_id: string;
    reason: string;
  }[];
  as_of_applied?: string | null;
}

export interface MemoriesResponse {
  workspace_id: string;
  facts: Fact[];
  messages: Record<string, Message>;
  users: Record<string, User>;
}

export interface WhatChangedRequest {
  since_timestamp: string;
}

export interface WhatChangedResponse {
  since_timestamp: string;
  added: Fact[];
  updated: Fact[];
  superseded: Fact[];
  resolved: Fact[];
  disputed: Fact[];
  stale: Fact[];
  forgotten: Fact[];
}

export interface EvalCaseResult {
  case_id: number;
  name: string;
  category: 'core' | 'adversarial';
  passed: boolean;
  description: string;
  assertion_detail: string;
  latency_ms: number;
}

export interface EvalRunResponse {
  total: number;
  passed: number;
  failed: number;
  runtime_ms: number;
  timestamp: string;
  results: EvalCaseResult[];
}

export interface BackendConnectionConfig {
  backendUrl: string;
  isMockMode: boolean;
  activeToken: string;
  activeUser: User;
  activeWorkspaceId: string;
}
