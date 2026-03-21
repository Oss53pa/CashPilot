import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Plus,
  Split,
  SkipForward,
  MessageSquare,
  Send,
  ArrowRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CurrencyDisplay } from '@/components/shared/currency-display';

import { reconciliationService } from '../services/reconciliation.service';
import type { ReconciliationItem } from '../types';

interface ItemWorkspaceProps {
  item: ReconciliationItem;
  currentUserId: string;
  onProposeMatch: (data: { flow_id: string; flow_label: string; match_type: string; confidence: number; notes?: string }) => void;
  onValidateProposal: () => void;
  onRejectProposal: (reason: string) => void;
  onResolve: (action: string, notes?: string) => void;
  onSkip: (reason?: string) => void;
  onAddComment: (content: string) => void;
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

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.abs(amount)) + ' FCFA';
}

function getParticipantColor(name?: string): string {
  switch (name) {
    case 'Aniela': return '#6366f1';
    case 'Koné': return '#f59e0b';
    case 'Fatou': return '#10b981';
    default: return '#6b7280';
  }
}

export function ItemWorkspace({
  item,
  currentUserId,
  onProposeMatch,
  onValidateProposal,
  onRejectProposal,
  onResolve,
  onSkip,
  onAddComment,
}: ItemWorkspaceProps) {
  const [commentText, setCommentText] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [showSkipInput, setShowSkipInput] = useState(false);

  const suggestedMatches = reconciliationService.getSuggestedMatches(item.id);
  const isResolved = item.status === 'validated' || item.status === 'rejected' || item.status === 'skipped';
  const hasProposal = item.status === 'proposed' && item.proposed_match;
  const canAct = !isResolved && (item.locked_by === currentUserId || !item.locked_by);

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    onAddComment(commentText.trim());
    setCommentText('');
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    onRejectProposal(rejectReason.trim());
    setRejectReason('');
    setShowRejectInput(false);
  };

  const handleSkip = () => {
    onSkip(skipReason.trim() || undefined);
    setSkipReason('');
    setShowSkipInput(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Transaction details */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Détails de la transaction</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{new Date(item.date).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant</span>
              <span className={`font-mono font-medium ${item.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {item.amount < 0 ? '-' : '+'}{formatAmount(item.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Description</span>
              <span className="text-right max-w-[200px]">{item.description}</span>
            </div>
            {item.counterparty && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contrepartie</span>
                <span>{item.counterparty}</span>
              </div>
            )}
            {item.reference && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Référence</span>
                <span className="font-mono text-xs">{item.reference}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <Badge variant="outline" className="text-[10px]">
                {item.type === 'bank_transaction' ? 'Transaction bancaire' : item.type === 'internal_flow' ? 'Flux interne' : 'Non identifié'}
              </Badge>
            </div>
          </div>

          {/* Resolution info */}
          {item.resolution && (
            <div className="mt-3 p-2.5 rounded-md bg-muted/50 text-xs space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="font-medium">
                  Résolu par {item.resolution.resolved_by_name}
                </span>
              </div>
              <p className="text-muted-foreground">
                Action : {item.resolution.action} — {formatDate(item.resolution.resolved_at)}
              </p>
              {item.resolution.notes && (
                <p className="text-muted-foreground italic">{item.resolution.notes}</p>
              )}
            </div>
          )}
        </div>

        {/* Suggested matches + actions */}
        <div className="space-y-3">
          {/* Proposed match display */}
          {hasProposal && item.proposed_match && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Proposition de rapprochement</h4>
              <Card className="border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/10">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.proposed_match.matched_flow_label}</span>
                    <Badge variant="warning" className="text-[10px]">
                      {Math.round(item.proposed_match.confidence * 100)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Proposé par {item.proposed_match.proposed_by_name} le {formatDate(item.proposed_match.proposed_at)}
                  </p>
                  {item.proposed_match.notes && (
                    <p className="text-xs italic text-muted-foreground">{item.proposed_match.notes}</p>
                  )}
                  {canAct && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="h-7 text-xs" onClick={onValidateProposal}>
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Valider
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setShowRejectInput(true)}
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Rejeter
                      </Button>
                    </div>
                  )}
                  {showRejectInput && (
                    <div className="flex gap-2 pt-1">
                      <Input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Motif du rejet..."
                        className="h-7 text-xs"
                        onKeyDown={(e) => e.key === 'Enter' && handleReject()}
                      />
                      <Button size="sm" className="h-7 text-xs" onClick={handleReject}>
                        Confirmer
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Suggested matches */}
          {!isResolved && !hasProposal && suggestedMatches.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Correspondances suggérées</h4>
              {suggestedMatches.map((match) => (
                <Card key={match.flow_id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{match.flow_label}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {match.match_type === 'exact' ? 'Exact' : 'Approx.'}
                          </Badge>
                          <ConfidenceBadge confidence={match.confidence} />
                        </div>
                      </div>
                      {canAct && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => onProposeMatch({
                            flow_id: match.flow_id,
                            flow_label: match.flow_label,
                            match_type: match.match_type,
                            confidence: match.confidence,
                          })}
                        >
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isResolved && !hasProposal && suggestedMatches.length === 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Correspondances suggérées</h4>
              <p className="text-xs text-muted-foreground italic">
                Aucune correspondance automatique trouvée.
              </p>
            </div>
          )}

          {/* Action buttons */}
          {canAct && !hasProposal && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Actions</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onResolve('matched')}
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Confirmer match
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onResolve('created_new')}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Créer nouveau flux
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onResolve('split')}
                >
                  <Split className="mr-1 h-3 w-3" />
                  Diviser
                </Button>
                {!showSkipInput ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowSkipInput(true)}
                  >
                    <SkipForward className="mr-1 h-3 w-3" />
                    Ignorer
                  </Button>
                ) : (
                  <div className="flex gap-2 w-full">
                    <Input
                      value={skipReason}
                      onChange={(e) => setSkipReason(e.target.value)}
                      placeholder="Raison (optionnel)..."
                      className="h-7 text-xs"
                      onKeyDown={(e) => e.key === 'Enter' && handleSkip()}
                    />
                    <Button size="sm" className="h-7 text-xs" onClick={handleSkip}>
                      Confirmer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Commentaires ({item.comments.length})
          </h4>

          {item.comments.length > 0 ? (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {item.comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback
                      className="text-[9px] font-bold text-white"
                      style={{ backgroundColor: getParticipantColor(comment.user_name) }}
                    >
                      {comment.user_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{comment.user_name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Aucun commentaire</p>
          )}

          <Separator />
          <div className="flex gap-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="min-h-[60px] text-xs resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 self-end"
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 90 ? 'text-green-600' : pct >= 70 ? 'text-yellow-600' : 'text-orange-600';

  return (
    <span className={`text-[10px] font-medium ${color}`}>
      {pct}% confiance
    </span>
  );
}
