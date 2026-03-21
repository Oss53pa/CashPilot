import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { useCompanyStore } from '@/stores/company.store';
import {
  useReconciliationSessions,
  useReconciliationSession,
  useSessionItems,
  useChatMessages,
  useCompleteSession,
  useLeaveSession,
  useLockItem,
  useUnlockItem,
  useProposeMatch,
  useValidateProposal,
  useRejectProposal,
  useResolveItem,
  useSkipItem,
  useAddComment,
  useSendChatMessage,
  useCreateSession,
} from '../hooks/use-reconciliation';
import { SessionList } from '../components/session-list';
import { SessionHeader } from '../components/session-header';
import { ReconciliationGrid } from '../components/reconciliation-grid';
import { SessionChat } from '../components/session-chat';
import { SessionMetricsCard } from '../components/session-metrics';

const CURRENT_USER_ID = 'user-001';

export default function ReconciliationPage() {
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id;

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const { data: sessions = [], isLoading: loadingSessions } = useReconciliationSessions(companyId);
  const { data: activeSession } = useReconciliationSession(activeSessionId ?? undefined);
  const { data: items = [] } = useSessionItems(activeSessionId ?? undefined);
  const { data: chatMessages = [] } = useChatMessages(activeSessionId ?? undefined);

  const completeSession = useCompleteSession();
  const leaveSession = useLeaveSession();
  const lockItem = useLockItem();
  const unlockItem = useUnlockItem();
  const proposeMatch = useProposeMatch();
  const validateProposal = useValidateProposal();
  const rejectProposal = useRejectProposal();
  const resolveItem = useResolveItem();
  const skipItem = useSkipItem();
  const addComment = useAddComment();
  const sendChat = useSendChatMessage();
  const createSession = useCreateSession();

  const activeSessions = sessions.filter((s) => s.status === 'active' || s.status === 'paused');

  const handleBack = () => {
    setActiveSessionId(null);
  };

  if (loadingSessions) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-80" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  // Inside a session
  if (activeSessionId && activeSession) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Réconciliation collaborative</h1>
        </div>

        <SessionHeader
          session={activeSession}
          onComplete={() => completeSession.mutate(activeSessionId)}
          onLeave={() => {
            leaveSession.mutate(activeSessionId);
            setActiveSessionId(null);
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main grid */}
          <div className="lg:col-span-3">
            <ReconciliationGrid
              items={items}
              currentUserId={CURRENT_USER_ID}
              onLock={(itemId) => lockItem.mutate(itemId)}
              onUnlock={(itemId) => unlockItem.mutate(itemId)}
              onProposeMatch={(itemId, data) => proposeMatch.mutate({ itemId, data })}
              onValidateProposal={(itemId) => validateProposal.mutate(itemId)}
              onRejectProposal={(itemId, reason) => rejectProposal.mutate({ itemId, reason })}
              onResolve={(itemId, action, notes) => resolveItem.mutate({ itemId, action, notes })}
              onSkip={(itemId, reason) => skipItem.mutate({ itemId, reason })}
              onAddComment={(itemId, content) => addComment.mutate({ itemId, content })}
            />
          </div>

          {/* Right sidebar: metrics + chat */}
          <div className="space-y-4">
            <SessionMetricsCard
              metrics={activeSession.metrics}
              participants={activeSession.participants}
            />
            <div className="h-[400px]">
              <SessionChat
                messages={chatMessages}
                currentUserId={CURRENT_USER_ID}
                onSend={(content) => sendChat.mutate({ sessionId: activeSessionId, content })}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Session list view
  return (
    <div className="space-y-6">
      <PageHeader
        title="Réconciliation collaborative"
        description="Réconciliez les transactions bancaires en équipe"
      />

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Sessions actives
            {activeSessions.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {activeSessions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <SessionList
            sessions={sessions.filter((s) => s.status === 'active' || s.status === 'paused')}
            onSelectSession={setActiveSessionId}
            onCreateSession={() => createSession.mutate('acc-new')}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <SessionList
            sessions={sessions.filter((s) => s.status === 'completed' || s.status === 'cancelled')}
            onSelectSession={setActiveSessionId}
            onCreateSession={() => createSession.mutate('acc-new')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
