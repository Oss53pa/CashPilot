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
import type { CashCount } from '../types';

interface CashCountProps {
  counts: CashCount[];
  isLoading?: boolean;
  onSubmitCount?: (data: { register_id: string; theoretical_balance: number; physical_balance: number; counted_by: string; notes: string | null }) => void;
}

const statusVariant: Record<string, string> = {
  validated: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  discrepancy: 'bg-red-100 text-red-800',
};

function getVarianceMessage(variance: number): string {
  const abs = Math.abs(variance);
  if (abs < 1_000) return 'OK - Ecart negligeable';
  if (abs <= 10_000) return 'Justification requise sous 24h';
  return 'BLOQUE - Alerte declenchee (> 10 000 FCFA)';
}

export function CashCountPanel({ counts, isLoading, onSubmitCount }: CashCountProps) {
  const [physicalBalance, setPhysicalBalance] = useState('');
  const [registerId, setRegisterId] = useState('reg-1');
  const [notes, setNotes] = useState('');
  const theoreticalBalance = 2_450_000; // auto from register

  const handleSubmit = () => {
    const physical = Number(physicalBalance);
    if (!physical || !onSubmitCount) return;
    onSubmitCount({
      register_id: registerId,
      theoretical_balance: theoreticalBalance,
      physical_balance: physical,
      counted_by: 'Utilisateur courant',
      notes: notes || null,
    });
    setPhysicalBalance('');
    setNotes('');
  };

  const variance = physicalBalance ? Number(physicalBalance) - theoreticalBalance : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Comptage de Caisse</CardTitle></CardHeader>
        <CardContent><div className="h-32 animate-pulse rounded bg-muted" /></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* New Count Form */}
      <Card>
        <CardHeader>
          <CardTitle>Nouveau Comptage</CardTitle>
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
              <label className="text-sm font-medium">Solde Theorique (auto)</label>
              <div className="mt-1 rounded-md border border-input bg-muted px-3 py-2 text-sm">
                <CurrencyDisplay amount={theoreticalBalance} currency="XOF" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Solde Physique</label>
              <Input
                type="number"
                placeholder="Montant physique..."
                value={physicalBalance}
                onChange={(e) => setPhysicalBalance(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Ecart</label>
              <div className={`mt-1 rounded-md border px-3 py-2 text-sm font-semibold ${
                Math.abs(variance) > 10_000 ? 'border-red-300 bg-red-50 text-red-700' :
                Math.abs(variance) > 1_000 ? 'border-yellow-300 bg-yellow-50 text-yellow-700' :
                'border-green-300 bg-green-50 text-green-700'
              }`}>
                {physicalBalance ? (
                  <>
                    <CurrencyDisplay amount={variance} currency="XOF" />
                    <span className="block text-xs mt-1">{getVarianceMessage(variance)}</span>
                  </>
                ) : '-'}
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <Input
              placeholder="Notes optionnelles..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button onClick={handleSubmit} disabled={!physicalBalance}>
            Valider le Comptage
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Comptages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Solde Theorique</TableHead>
                <TableHead className="text-right">Solde Physique</TableHead>
                <TableHead className="text-right">Ecart</TableHead>
                <TableHead>Compte par</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {counts.map((count) => (
                <TableRow key={count.id}>
                  <TableCell>{new Date(count.count_date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={count.theoretical_balance} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={count.physical_balance} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={count.variance < 0 ? 'text-red-600' : count.variance > 0 ? 'text-green-600' : ''}>
                      <CurrencyDisplay amount={count.variance} currency="XOF" />
                    </span>
                  </TableCell>
                  <TableCell>{count.counted_by}</TableCell>
                  <TableCell>
                    <Badge className={statusVariant[count.status] ?? ''} variant="outline">
                      {count.status === 'discrepancy' ? 'Ecart' : count.status === 'validated' ? 'Valide' : 'En attente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {count.notes ?? '-'}
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
