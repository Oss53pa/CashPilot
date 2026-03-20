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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import type { ExitScenario } from '../types';

interface ExitScenariosProps {
  scenarios: ExitScenario[];
  disputeId: string;
  isLoading?: boolean;
  onAdd?: (data: Omit<ExitScenario, 'id'>) => void;
  onRemove?: (id: string) => void;
}

export function ExitScenariosPanel({ scenarios, disputeId, isLoading, onAdd, onRemove }: ExitScenariosProps) {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [probability, setProbability] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  // Expected value = sum(probability * amount)
  const expectedValue = scenarios.reduce(
    (sum, s) => sum + (s.probability_pct / 100) * s.expected_amount,
    0,
  );

  const totalProbability = scenarios.reduce((sum, s) => sum + s.probability_pct, 0);

  const handleAdd = () => {
    if (!label || !probability || !amount || !date || !onAdd) return;
    onAdd({
      dispute_id: disputeId,
      label,
      probability_pct: Number(probability),
      expected_amount: Number(amount),
      expected_date: date,
      description,
    });
    setLabel('');
    setProbability('');
    setAmount('');
    setDate('');
    setDescription('');
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Scenarios de Sortie</CardTitle></CardHeader>
        <CardContent><div className="h-32 animate-pulse rounded bg-muted" /></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Expected Value highlight */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Valeur Attendue (ponderee)</p>
              <div className="text-3xl font-bold">
                <CurrencyDisplay amount={expectedValue} currency="XOF" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Probabilite Totale</p>
              <p className={`text-2xl font-bold ${totalProbability === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                {totalProbability}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenarios Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Scenarios de Sortie</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : 'Ajouter un Scenario'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <div className="rounded-md border p-4 space-y-3 bg-muted/30">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Label</label>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Gain total" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Probabilite (%)</label>
                  <Input type="number" min={0} max={100} value={probability} onChange={(e) => setProbability(e.target.value)} placeholder="0-100" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Montant Attendu (FCFA)</label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montant..." className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Date Attendue</label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description du scenario..." className="mt-1" />
                </div>
              </div>
              <Button onClick={handleAdd} disabled={!label || !probability || !amount || !date}>
                Enregistrer
              </Button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead className="text-right">Probabilite</TableHead>
                <TableHead className="text-right">Montant Attendu</TableHead>
                <TableHead className="text-right">Valeur Ponderee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenarios.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.label}</TableCell>
                  <TableCell className="text-right">{s.probability_pct}%</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={s.expected_amount} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <CurrencyDisplay amount={(s.probability_pct / 100) * s.expected_amount} currency="XOF" />
                  </TableCell>
                  <TableCell>{new Date(s.expected_date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {s.description}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => onRemove?.(s.id)}
                    >
                      Supprimer
                    </Button>
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
