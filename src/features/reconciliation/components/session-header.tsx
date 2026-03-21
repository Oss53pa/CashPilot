import { useState, useEffect } from 'react';
import { LogOut, UserPlus, Clock, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

import type { ReconciliationSession } from '../types';

interface SessionHeaderProps {
  session: ReconciliationSession;
  onComplete: () => void;
  onLeave: () => void;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

export function SessionHeader({ session, onComplete, onLeave }: SessionHeaderProps) {
  const [elapsed, setElapsed] = useState(session.metrics.session_duration_minutes);

  useEffect(() => {
    if (session.status !== 'active') return;
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 60_000);
    return () => clearInterval(interval);
  }, [session.status]);

  const progressPct = session.total_transactions > 0
    ? Math.round((session.resolved_count / session.total_transactions) * 100)
    : 0;

  const hours = Math.floor(elapsed / 60);
  const mins = elapsed % 60;
  const timerDisplay = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Session info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold truncate">{session.account_name}</h2>
            <Badge variant="default">En cours</Badge>
          </div>
          {session.statement_id && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Relevé : {session.statement_id}
            </p>
          )}
        </div>

        {/* Participants */}
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <div className="flex -space-x-2">
              {session.participants.map((p) => (
                <Tooltip key={p.user_id} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Avatar className="h-8 w-8 border-2 border-background">
                        <AvatarFallback
                          className="text-xs font-bold text-white"
                          style={{ backgroundColor: p.color }}
                        >
                          {p.avatar_initial}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                          p.is_online ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p className="font-medium">{p.user_name}</p>
                      <p className="text-muted-foreground">
                        {p.role === 'owner' ? 'Propriétaire' : 'Participant'}
                        {' — '}
                        {p.is_online ? 'En ligne' : 'Hors ligne'}
                      </p>
                      {p.current_item_id && (
                        <p className="text-muted-foreground">
                          Travaille sur : {p.current_item_id}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
          <Button variant="outline" size="sm">
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Inviter
          </Button>
        </div>

        <Separator orientation="vertical" className="h-10 hidden md:block" />

        {/* Progress */}
        <div className="flex items-center gap-4">
          <div className="space-y-1 min-w-[140px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Résolu</span>
              <span className="font-medium">{session.resolved_count}/{session.total_transactions}</span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="text-center">
              <p className="font-semibold text-sm">{session.metrics.auto_matched}</p>
              <p className="text-muted-foreground">Auto</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">{session.metrics.manual_matched}</p>
              <p className="text-muted-foreground">Manuel</p>
            </div>
          </div>
        </div>

        <Separator orientation="vertical" className="h-10 hidden md:block" />

        {/* Timer + reconciled amount */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono font-medium">{timerDisplay}</span>
          </div>
          <div className="text-right text-xs">
            <p className="font-medium text-green-600">
              {formatAmount(session.metrics.total_amount_reconciled)}
            </p>
            <p className="text-muted-foreground">réconcilié</p>
          </div>
        </div>

        <Separator orientation="vertical" className="h-10 hidden md:block" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onLeave}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Quitter
          </Button>
          <Button size="sm" onClick={onComplete}>
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Terminer la session
          </Button>
        </div>
      </div>
    </div>
  );
}
