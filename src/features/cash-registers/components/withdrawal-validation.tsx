import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import type { CashWithdrawalRequest } from '../types';

interface WithdrawalValidationProps {
  requests: CashWithdrawalRequest[];
  isLoading?: boolean;
  onSubmitRequest?: (data: { register_id: string; amount: number; reason: string; requested_by: string; justification_due: string }) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const statusVariant: Record<string, string> = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
};

function getApprovalLevel(amount: number): string {
  if (amount < 50_000) return 'Responsable Caisse';
  if (amount <= 200_000) return 'Responsable Centre';
  return 'DAF / DGA';
}

function getJustificationDeadline(): string {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 48);
  return deadline.toISOString().split('T')[0];
}

export function WithdrawalValidationPanel({
  requests,
  isLoading,
  onSubmitRequest,
  onApprove,
  onReject,
}: WithdrawalValidationProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [registerId, setRegisterId] = useState('reg-1');

  const pendingRequests = requests.filter((r) => r.approval_status === 'pending');
  const processedRequests = requests.filter((r) => r.approval_status !== 'pending');

  const handleSubmit = () => {
    const numAmount = Number(amount);
    if (!numAmount || !reason || !onSubmitRequest) return;
    onSubmitRequest({
      register_id: registerId,
      amount: numAmount,
      reason,
      requested_by: 'Utilisateur courant',
      justification_due: getJustificationDeadline(),
    });
    setAmount('');
    setReason('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Retraits de Caisse</CardTitle></CardHeader>
        <CardContent><div className="h-32 animate-pulse rounded bg-muted" /></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* New Withdrawal Request */}
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle Demande de Retrait</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Caisse</label>
              <select
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={registerId}
                onChange={(e) => setRegisterId(e.target.value)}
              >
                <option value="reg-1">Caisse Principale</option>
                <option value="reg-2">Caisse Secondaire</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Montant (FCFA)</label>
              <Input
                type="number"
                placeholder="Montant..."
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Motif</label>
              <Input
                placeholder="Raison du retrait..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          {amount && Number(amount) > 0 && (
            <div className="rounded-md border bg-muted/50 p-3 text-sm">
              <p><strong>Niveau d'approbation requis:</strong> {getApprovalLevel(Number(amount))}</p>
              <p><strong>Justificatif attendu avant:</strong> {getJustificationDeadline()}</p>
            </div>
          )}
          <Button onClick={handleSubmit} disabled={!amount || !reason}>
            Soumettre la Demande
          </Button>
        </CardContent>
      </Card>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Demandes en Attente ({pendingRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Montant</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Demande par</TableHead>
                  <TableHead>Niveau Requis</TableHead>
                  <TableHead>Justificatif</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-semibold">
                      <CurrencyDisplay amount={req.amount} currency="XOF" />
                    </TableCell>
                    <TableCell>{req.reason}</TableCell>
                    <TableCell>{req.requested_by}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getApprovalLevel(req.amount)}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={req.justification_received ? 'text-green-600' : 'text-orange-600'}>
                        {req.justification_received ? 'Recu' : `Du le ${new Date(req.justification_due).toLocaleDateString('fr-FR')}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600"
                          onClick={() => onApprove?.(req.id)}
                        >
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => onReject?.(req.id)}
                        >
                          Rejeter
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Processed Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Retraits</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Montant</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Demande par</TableHead>
                <TableHead>Approuve par</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Justificatif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-semibold">
                    <CurrencyDisplay amount={req.amount} currency="XOF" />
                  </TableCell>
                  <TableCell>{req.reason}</TableCell>
                  <TableCell>{req.requested_by}</TableCell>
                  <TableCell>{req.approved_by ?? '-'}</TableCell>
                  <TableCell>
                    <Badge className={statusVariant[req.approval_status] ?? ''} variant="outline">
                      {req.approval_status === 'approved' ? 'Approuve' : req.approval_status === 'rejected' ? 'Rejete' : 'En attente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {req.justification_received ? (
                      <Badge className="bg-green-100 text-green-800" variant="outline">Recu</Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800" variant="outline">En attente</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
