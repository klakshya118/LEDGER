/**
 * Ledger — Authoritative API Client & Transport Layer
 *
 * Dispatches requests to either:
 *  1. An external Python/FastAPI backend (Section 4 API surface) if configured & reachable.
 *  2. The isolated Development Adapter (`devAdapter.ts`), clearly tagged as MOCK MODE.
 *
 * Never fakes backend responses or conceals mock data as authoritative truth.
 */

import {
  Fact,
  IngestMessageResponse,
  LoginResponse,
  MemoriesResponse,
  QueryResponse,
  WhatChangedResponse,
  EvalRunResponse,
  User,
  Workspace,
} from '../types/ledger';
import { devAdapter } from './devAdapter';

export interface TransportMeta {
  source: 'live_fastapi' | 'development_adapter_mock';
  latencyMs: number;
  timestamp: string;
  endpointCalled: string;
}

export interface ApiResult<T> {
  data: T;
  meta: TransportMeta;
  error?: string;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'mock_mode' | 'testing';

const BACKEND_URL_KEY = 'ledger_backend_url_v1';
const FORCE_MOCK_KEY = 'ledger_force_mock_mode_v1';

class LedgerApiClient {
  private backendUrl: string;
  private forceMock: boolean;
  private activeToken: string = 'tok-alice-demo';
  private activeWorkspaceId: string = 'ws-ledger-main';
  private activeUser: User = {
    id: 'u-alice',
    workspace_id: 'ws-ledger-main',
    name: 'Alice Chen',
    email: 'alice@ledger.internal',
    avatar_color: '#3B82F6',
  };

  private connectionStatus: ConnectionStatus = 'mock_mode';
  private lastPingMs: number = 0;
  private lastError: string | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    this.backendUrl = localStorage.getItem(BACKEND_URL_KEY) || origin;
    this.forceMock = localStorage.getItem(FORCE_MOCK_KEY) === 'true'; // default to LIVE backend if not forced to mock

    // Automatically check live backend connectivity
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.testConnection().catch(() => {});
      }, 100);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- Configuration ---

  public getBackendUrl(): string {
    return this.backendUrl;
  }

  public setBackendUrl(url: string) {
    this.backendUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem(BACKEND_URL_KEY, this.backendUrl);
    this.notify();
  }

  public isMockMode(): boolean {
    return this.forceMock || this.connectionStatus === 'mock_mode' || this.connectionStatus === 'disconnected';
  }

  public setMockMode(enabled: boolean) {
    this.forceMock = enabled;
    localStorage.setItem(FORCE_MOCK_KEY, String(enabled));
    if (enabled) {
      this.connectionStatus = 'mock_mode';
    }
    this.notify();
  }

  public getConnectionStatus(): {
    status: ConnectionStatus;
    backendUrl: string;
    isMock: boolean;
    lastPingMs: number;
    lastError: string | null;
  } {
    return {
      status: this.connectionStatus,
      backendUrl: this.backendUrl,
      isMock: this.isMockMode(),
      lastPingMs: this.lastPingMs,
      lastError: this.lastError,
    };
  }

  public getActiveUser(): User {
    return this.activeUser;
  }

  public getActiveWorkspaceId(): string {
    return this.activeWorkspaceId;
  }

  public getActiveToken(): string {
    return this.activeToken;
  }

  public setActiveSession(user: User, token: string, workspaceId: string = 'ws-ledger-main') {
    this.activeUser = user;
    this.activeToken = token;
    this.activeWorkspaceId = workspaceId;
    this.notify();
  }

  // --- Health Check / Ping ---

  public async testConnection(): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    this.connectionStatus = 'testing';
    this.notify();
    const start = performance.now();

    try {
      // Test either /health, /docs, or /
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const resp = await fetch(`${this.backendUrl}/docs`, {
        method: 'HEAD',
        signal: controller.signal,
      }).catch(async () => {
        return await fetch(`${this.backendUrl}/`, {
          method: 'GET',
          signal: controller.signal,
        });
      });

      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - start);
      this.lastPingMs = latency;

      if (resp.ok || resp.status === 404 || resp.status === 200 || resp.status === 307) {
        this.connectionStatus = 'connected';
        this.lastError = null;
        this.forceMock = false;
        localStorage.setItem(FORCE_MOCK_KEY, 'false');
        this.notify();
        return { success: true, latencyMs: latency };
      } else {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }
    } catch (err: any) {
      const latency = Math.round(performance.now() - start);
      this.lastPingMs = latency;
      this.lastError = err.message || 'Connection refused';
      this.connectionStatus = 'disconnected';
      this.notify();
      return { success: false, latencyMs: latency, error: this.lastError ?? undefined };
    }
  }

  // --- API Endpoints ---

  public async login(name: string): Promise<ApiResult<LoginResponse>> {
    const start = performance.now();
    const endpoint = '/login';

    if (!this.forceMock && this.connectionStatus === 'connected') {
      try {
        const resp = await fetch(`${this.backendUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        if (!resp.ok) throw new Error(`Login failed with status ${resp.status}`);
        const data = await resp.json();
        const latency = Math.round(performance.now() - start);
        return {
          data,
          meta: {
            source: 'live_fastapi',
            latencyMs: latency,
            timestamp: new Date().toISOString(),
            endpointCalled: endpoint,
          },
        };
      } catch (err: any) {
        console.warn('FastAPI login failed, falling back to Dev Adapter:', err);
      }
    }

    // Development Adapter Fallback
    const res = await devAdapter.login(name);
    const latency = Math.round(performance.now() - start);
    return {
      data: res,
      meta: {
        source: 'development_adapter_mock',
        latencyMs: latency,
        timestamp: new Date().toISOString(),
        endpointCalled: endpoint,
      },
    };
  }

  public async sendMessage(text: string): Promise<ApiResult<IngestMessageResponse>> {
    const start = performance.now();
    const endpoint = `/workspaces/${this.activeWorkspaceId}/messages`;

    if (!this.forceMock && this.connectionStatus === 'connected') {
      try {
        const resp = await fetch(`${this.backendUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.activeToken}`,
          },
          body: JSON.stringify({ text }),
        });
        if (!resp.ok) throw new Error(`Ingest failed with status ${resp.status}`);
        const data = await resp.json();
        const latency = Math.round(performance.now() - start);
        return {
          data,
          meta: {
            source: 'live_fastapi',
            latencyMs: latency,
            timestamp: new Date().toISOString(),
            endpointCalled: endpoint,
          },
        };
      } catch (err: any) {
        console.warn('FastAPI sendMessage failed, falling back to Dev Adapter:', err);
      }
    }

    const res = await devAdapter.ingestMessage(this.activeWorkspaceId, this.activeToken, text);
    const latency = Math.round(performance.now() - start);
    return {
      data: res,
      meta: {
        source: 'development_adapter_mock',
        latencyMs: latency,
        timestamp: new Date().toISOString(),
        endpointCalled: endpoint,
      },
    };
  }

  public async query(question: string, asOf?: string): Promise<ApiResult<QueryResponse>> {
    const start = performance.now();
    const endpoint = `/workspaces/${this.activeWorkspaceId}/query`;

    if (!this.forceMock && this.connectionStatus === 'connected') {
      try {
        const resp = await fetch(`${this.backendUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.activeToken}`,
          },
          body: JSON.stringify({ question, as_of: asOf || undefined }),
        });
        if (!resp.ok) throw new Error(`Query failed with status ${resp.status}`);
        const data = await resp.json();
        const latency = Math.round(performance.now() - start);
        return {
          data,
          meta: {
            source: 'live_fastapi',
            latencyMs: latency,
            timestamp: new Date().toISOString(),
            endpointCalled: endpoint,
          },
        };
      } catch (err: any) {
        console.warn('FastAPI query failed, falling back to Dev Adapter:', err);
      }
    }

    const res = await devAdapter.query(this.activeWorkspaceId, this.activeToken, question, asOf);
    const latency = Math.round(performance.now() - start);
    return {
      data: res,
      meta: {
        source: 'development_adapter_mock',
        latencyMs: latency,
        timestamp: new Date().toISOString(),
        endpointCalled: endpoint,
      },
    };
  }

  public async getMemories(): Promise<ApiResult<MemoriesResponse>> {
    const start = performance.now();
    const endpoint = `/workspaces/${this.activeWorkspaceId}/memories`;

    if (!this.forceMock && this.connectionStatus === 'connected') {
      try {
        const resp = await fetch(`${this.backendUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.activeToken}`,
          },
        });
        if (!resp.ok) throw new Error(`GetMemories failed with status ${resp.status}`);
        const data = await resp.json();
        const latency = Math.round(performance.now() - start);
        return {
          data,
          meta: {
            source: 'live_fastapi',
            latencyMs: latency,
            timestamp: new Date().toISOString(),
            endpointCalled: endpoint,
          },
        };
      } catch (err: any) {
        console.warn('FastAPI getMemories failed, falling back to Dev Adapter:', err);
      }
    }

    const res = await devAdapter.getMemories(this.activeWorkspaceId, this.activeToken);
    const latency = Math.round(performance.now() - start);
    return {
      data: res,
      meta: {
        source: 'development_adapter_mock',
        latencyMs: latency,
        timestamp: new Date().toISOString(),
        endpointCalled: endpoint,
      },
    };
  }

  public async getWhatChanged(sinceTimestamp: string): Promise<ApiResult<WhatChangedResponse>> {
    const start = performance.now();
    const endpoint = `/workspaces/${this.activeWorkspaceId}/what-changed`;

    if (!this.forceMock && this.connectionStatus === 'connected') {
      try {
        const resp = await fetch(`${this.backendUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.activeToken}`,
          },
          body: JSON.stringify({ since_timestamp: sinceTimestamp }),
        });
        if (!resp.ok) throw new Error(`WhatChanged failed with status ${resp.status}`);
        const data = await resp.json();
        const latency = Math.round(performance.now() - start);
        return {
          data,
          meta: {
            source: 'live_fastapi',
            latencyMs: latency,
            timestamp: new Date().toISOString(),
            endpointCalled: endpoint,
          },
        };
      } catch (err: any) {
        console.warn('FastAPI getWhatChanged failed, falling back to Dev Adapter:', err);
      }
    }

    const res = await devAdapter.getWhatChanged(this.activeWorkspaceId, this.activeToken, sinceTimestamp);
    const latency = Math.round(performance.now() - start);
    return {
      data: res,
      meta: {
        source: 'development_adapter_mock',
        latencyMs: latency,
        timestamp: new Date().toISOString(),
        endpointCalled: endpoint,
      },
    };
  }

  public async runEval(): Promise<ApiResult<EvalRunResponse>> {
    const start = performance.now();
    const endpoint = '/eval/run';

    if (!this.forceMock && this.connectionStatus === 'connected') {
      try {
        const resp = await fetch(`${this.backendUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.activeToken}`,
          },
        });
        if (!resp.ok) throw new Error(`Eval run failed with status ${resp.status}`);
        const data = await resp.json();
        const latency = Math.round(performance.now() - start);
        return {
          data,
          meta: {
            source: 'live_fastapi',
            latencyMs: latency,
            timestamp: new Date().toISOString(),
            endpointCalled: endpoint,
          },
        };
      } catch (err: any) {
        console.warn('FastAPI runEval failed, falling back to Dev Adapter:', err);
      }
    }

    const res = await devAdapter.runEval();
    const latency = Math.round(performance.now() - start);
    return {
      data: res,
      meta: {
        source: 'development_adapter_mock',
        latencyMs: latency,
        timestamp: new Date().toISOString(),
        endpointCalled: endpoint,
      },
    };
  }

  public resetStore() {
    devAdapter.resetToSeed();
    this.notify();
  }
}

export const ledgerApi = new LedgerApiClient();
