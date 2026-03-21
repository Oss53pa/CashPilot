import { useState } from 'react';
import { X, RotateCcw, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SimulationParams } from '../types';

interface SimulationPanelProps {
  open: boolean;
  onClose: () => void;
  onApply: (params: SimulationParams) => void;
  isSimulating: boolean;
}

const DEFAULT_PARAMS: SimulationParams = {
  recovery_rate: 92,
  payment_delay_days: 10,
  unplanned_charges_pct: 5,
  capex_delay_days: 0,
  credit_line_activated: false,
  credit_line_amount: 0,
  excluded_tenants: [],
};

export function SimulationPanel({ open, onClose, onApply, isSimulating }: SimulationPanelProps) {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);

  function handleReset() {
    setParams(DEFAULT_PARAMS);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-[360px] bg-card border-l shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Simulation</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-5 p-4">
          {/* Recovery rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Taux de recouvrement</Label>
              <span className="text-xs font-medium tabular-nums">{params.recovery_rate}%</span>
            </div>
            <Slider
              value={[params.recovery_rate]}
              min={50}
              max={100}
              step={1}
              onValueChange={([v]) => setParams((p) => ({ ...p, recovery_rate: v }))}
            />
            <p className="text-[10px] text-muted-foreground">
              50% (pessimiste) &rarr; 100% (tout encaissé)
            </p>
          </div>

          {/* Payment delay */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Retard de paiement moyen</Label>
              <span className="text-xs font-medium tabular-nums">{params.payment_delay_days}j</span>
            </div>
            <Slider
              value={[params.payment_delay_days]}
              min={0}
              max={60}
              step={5}
              onValueChange={([v]) => setParams((p) => ({ ...p, payment_delay_days: v }))}
            />
          </div>

          {/* Unplanned charges */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Charges imprévues</Label>
              <span className="text-xs font-medium tabular-nums">{params.unplanned_charges_pct}%</span>
            </div>
            <Slider
              value={[params.unplanned_charges_pct]}
              min={0}
              max={30}
              step={1}
              onValueChange={([v]) => setParams((p) => ({ ...p, unplanned_charges_pct: v }))}
            />
          </div>

          {/* CAPEX delay */}
          <div className="space-y-2">
            <Label className="text-xs">Décalage CAPEX</Label>
            <Select
              value={String(params.capex_delay_days)}
              onValueChange={(v) => setParams((p) => ({ ...p, capex_delay_days: Number(v) }))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Aucun</SelectItem>
                <SelectItem value="15">+15 jours</SelectItem>
                <SelectItem value="30">+30 jours</SelectItem>
                <SelectItem value="60">+60 jours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Credit line */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Ligne de crédit activée</Label>
              <Switch
                checked={params.credit_line_activated}
                onCheckedChange={(v) => setParams((p) => ({ ...p, credit_line_activated: v }))}
              />
            </div>
            {params.credit_line_activated && (
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Montant (FCFA)</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={params.credit_line_amount ?? 0}
                  onChange={(e) =>
                    setParams((p) => ({ ...p, credit_line_amount: Number(e.target.value) }))
                  }
                />
              </div>
            )}
          </div>

          {/* Excluded tenants */}
          <div className="space-y-2">
            <Label className="text-xs">Locataires exclus</Label>
            <Input
              type="text"
              className="h-8 text-xs"
              placeholder="Séparer par des virgules..."
              value={params.excluded_tenants.join(', ')}
              onChange={(e) =>
                setParams((p) => ({
                  ...p,
                  excluded_tenants: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                }))
              }
            />
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 border-t bg-card p-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleReset}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Réinitialiser
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onApply(params)}
            disabled={isSimulating}
          >
            <Play className="mr-1 h-3.5 w-3.5" />
            {isSimulating ? 'Calcul...' : 'Appliquer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
