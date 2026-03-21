import { Plus, Play, CheckCircle2, Clock, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { ReconciliationSession } from '../types';

interface SessionListProps {
  sessions: ReconciliationSession[];
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  return `${h}h${m > 0 ? `${m.toString().padStart(2, '0')}` : ''}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_CONFIG: Record<ReconciliationSession['status'], { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' }> = {
  active: { label: 'En cours', variant: 'default' },
  paused: { label: 'En pause', variant: 'secondary' },
  completed: { label: 'Terminée', variant: 'success' },
  cancelled: { label: 'Annulée', variant: 'destructive' },
};

export function SessionList({ sessions, onSelectSession, onCreateSession }: SessionListProps) {
  const activeSessions = sessions.filter((s) => s.status === 'active' || s.status === 'paused');
  const completedSessions = sessions.filter((s) => s.status === 'completed' || s.status === 'cancelled');

  return (
    <div className="space-y-6">
      {/* Active sessions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Sessions actives</h3>
          <Button onClick={onCreateSession}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle session
          </Button>
        </div>

        {activeSessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Aucune session de réconciliation en cours.
              </p>
              <Button className="mt-4" onClick={onCreateSession}>
                <Plus className="mr-2 h-4 w-4" />
                Démarrer une session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeSessions.map((session) => {
              const progressPct = session.total_transactions > 0
                ? Math.round((session.resolved_count / session.total_transactions) * 100)
                : 0;

              return (
                <Card
                  key={session.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => onSelectSession(session.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{session.account_name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Créée le {formatDate(session.created_at)}
                        </p>
                      </div>
                      <Badge variant={STATUS_CONFIG[session.status].variant}>
                        {STATUS_CONFIG[session.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Participants */}
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <div className="flex -space-x-2">
                          {session.participants.map((p) => (
                            <Tooltip key={p.user_id} delayDuration={0}>
                              <TooltipTrigger asChild>
                                <div className="relative">
                                  <Avatar className="h-7 w-7 border-2 border-background">
                                    <AvatarFallback
                                      className="text-[10px] font-bold text-white"
                                      style={{ backgroundColor: p.color }}
                                    >
                                      {p.avatar_initial}
                                    </AvatarFallback>
                                  </Avatar>
                                  {p.is_online && (
                                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {p.user_name} {p.is_online ? '(en ligne)' : '(hors ligne)'}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </TooltipProvider>
                      <span className="text-xs text-muted-foreground">
                        {session.participants.length} participant{session.participants.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-medium">
                          {session.resolved_count}/{session.total_transactions} ({progressPct}%)
                        </span>
                      </div>
                      <Progress value={progressPct} className="h-2" />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(session.metrics.session_duration_minutes)}
                      </div>
                      <div>
                        {session.unresolved_count} non résolu{session.unresolved_count > 1 ? 's' : ''}
                      </div>
                    </div>

                    <Button className="w-full" size="sm">
                      <Play className="mr-2 h-3 w-3" />
                      Rejoindre la session
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed sessions */}
      {completedSessions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Historique</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedSessions.map((session) => (
              <Card
                key={session.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => onSelectSession(session.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm">{session.account_name}</CardTitle>
                    <Badge variant={STATUS_CONFIG[session.status].variant}>
                      {STATUS_CONFIG[session.status].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Transactions</span>
                      <p className="font-medium">{session.total_transactions}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Auto-rapprochées</span>
                      <p className="font-medium">{session.metrics.auto_matched}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Manuelles</span>
                      <p className="font-medium">{session.metrics.manual_matched}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Durée</span>
                      <p className="font-medium">{formatDuration(session.metrics.session_duration_minutes)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">
                      {session.completed_at ? `Terminée le ${formatDate(session.completed_at)}` : 'Terminée'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
