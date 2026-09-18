/**
 * LEDGER — State & Provenance Memory Engine
 *
 * Master Frontend Controller strictly adhering to LEDGER Master Workplan (LOCKED v1).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { TimelineView } from './components/TimelineView';
import { ConflictView } from './components/ConflictView';
import { WhatChangedView } from './components/WhatChangedView';
import { EvalScoreboardView } from './components/EvalScoreboardView';
import { WhyEvidenceDrawer } from './components/WhyEvidenceDrawer';
import { ConnectionModal } from './components/ConnectionModal';
import { Fact, Message, User } from './types/ledger';
import { ledgerApi } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'timeline' | 'conflicts' | 'changes' | 'eval'>('chat');
  const [activeUser, setActiveUser] = useState<User>(ledgerApi.getActiveUser());
  const [facts, setFacts] = useState<Fact[]>([]);
  const [messages, setMessages] = useState<Record<string, Message>>({});
  const [users, setUsers] = useState<Record<string, User>>({});
  const [selectedFact, setSelectedFact] = useState<Fact | null>(null);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);
  const [connInfo, setConnInfo] = useState(ledgerApi.getConnectionStatus());
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' } | null>(null);

  const showNotification = (message: string, type: 'info' | 'success' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const loadMemories = useCallback(async () => {
    try {
      const res = await ledgerApi.getMemories();
      setFacts(res.data.facts);
      setMessages(res.data.messages);
      setUsers(res.data.users);
    } catch (err) {
      console.error('Failed to load memories:', err);
    }
  }, []);

  useEffect(() => {
    loadMemories();

    const unsubscribe = ledgerApi.subscribe(() => {
      setConnInfo(ledgerApi.getConnectionStatus());
      setActiveUser(ledgerApi.getActiveUser());
      loadMemories();
    });

    return unsubscribe;
  }, [loadMemories]);

  const handleUserChange = (user: User) => {
    setActiveUser(user);
    const mockToken = `tok-${user.id}-demo`;
    ledgerApi.setActiveSession(user, mockToken, 'ws-ledger-main');
    showNotification(`Switched session to ${user.name} (server-enforced identity)`);
  };

  const handleResetDatabase = () => {
    ledgerApi.resetStore();
    loadMemories();
    showNotification('Workspace memory store reset to baseline demo state.', 'success');
  };

  const handleOpenEvidenceById = (factId: string) => {
    const targetFact = facts.find((f) => f.id === factId);
    if (targetFact) {
      setSelectedFact(targetFact);
    } else {
      showNotification(`Memory ID ${factId} could not be located or was restricted.`, 'info');
    }
  };

  const factsMap = React.useMemo(() => {
    return facts.reduce((acc, f) => {
      acc[f.id] = f;
      return acc;
    }, {} as Record<string, Fact>);
  }, [facts]);

  return (
    <div className="min-h-screen bg-[#090B0E] text-[#F1F5F9] flex flex-col selection:bg-[#38BDF8]/30 selection:text-white">
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeUser={activeUser}
        onUserChange={handleUserChange}
        isMockMode={connInfo.isMock}
        connectionStatus={connInfo.status}
        backendUrl={connInfo.backendUrl}
        onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
        onResetDatabase={handleResetDatabase}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="px-4 py-2.5 rounded-lg bg-[#181F2E] border border-[#2D3850] shadow-xl text-xs text-[#E2E8F0] font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Surface */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'chat' && (
          <ChatView
            activeUser={activeUser}
            onUserChange={handleUserChange}
            onOpenEvidence={handleOpenEvidenceById}
            onRefreshMemories={loadMemories}
            factsMap={factsMap}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            facts={facts}
            messages={messages}
            users={users}
            onSelectFact={(f) => setSelectedFact(f)}
            onRefresh={loadMemories}
            activeUser={activeUser}
          />
        )}

        {activeTab === 'conflicts' && (
          <ConflictView
            facts={facts}
            messages={messages}
            users={users}
            onSelectFact={(f) => setSelectedFact(f)}
            onRefresh={loadMemories}
            activeUser={activeUser}
          />
        )}

        {activeTab === 'changes' && (
          <WhatChangedView
            onSelectFact={(f) => setSelectedFact(f)}
            activeUser={activeUser}
          />
        )}

        {activeTab === 'eval' && <EvalScoreboardView />}
      </main>

      {/* "Why this answer?" Evidence Inspector Drawer */}
      <WhyEvidenceDrawer
        fact={selectedFact}
        messages={messages}
        users={users}
        allFacts={factsMap}
        onClose={() => setSelectedFact(null)}
        onSelectFact={(f) => setSelectedFact(f)}
      />

      {/* Backend Transport & Connection Modal */}
      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        onRefresh={loadMemories}
      />
    </div>
  );
}
