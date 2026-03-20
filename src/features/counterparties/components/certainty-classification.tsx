import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Pencil, Check, X } from 'lucide-react';
import type { FlowCertainty, CounterpartyCertainty, CertaintyClass } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CertaintyClassificationProps {
  classes: FlowCertainty[];
  counterpartyCertainties: CounterpartyCertainty[];
  isLoading?: boolean;
  onUpdateCertainty?: (counterpartyId: string, certaintyClass: string, forecastPct: number) => void;
}

const CLASS_LABELS: Record<CertaintyClass, string> = {
  certain: 'Certain',
  quasi_certain: 'Quasi-Certain',
  probable: 'Probable',
  uncertain: 'Uncertain',
  exceptional: 'Exceptional',
};

const CLASS_BADGE_VARIANTS: Record<CertaintyClass, 'success' | 'default' | 'secondary' | 'warning' | 'destructive'> = {
  certain: 'success',
  quasi_certain: 'default',
  probable: 'secondary',
  uncertain: 'warning',
  exceptional: 'destructive',
};

export function CertaintyClassification({
  classes,
  counterpartyCertainties,
  isLoading,
  onUpdateCertainty,
}: CertaintyClassificationProps) {
  const { t } = useTranslation('counterparties');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editClass, setEditClass] = useState<CertaintyClass>('probable');
  const [editPct, setEditPct] = useState<string>('');

  function startEdit(cp: CounterpartyCertainty) {
    setEditingId(cp.counterparty_id);
    setEditClass(cp.assigned_class);
    setEditPct(cp.forecast_treatment_pct.toString());
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit(counterpartyId: string) {
    onUpdateCertainty?.(counterpartyId, editClass, parseFloat(editPct) || 0);
    setEditingId(null);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{t('certainty.loading', 'Loading classifications...')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Reference Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            {t('certainty.classes_title', 'Flow Certainty Classes')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('certainty.class', 'Class')}</TableHead>
                <TableHead>{t('certainty.description', 'Description')}</TableHead>
                <TableHead className="text-right">{t('certainty.forecast_pct', 'Forecast Treatment')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((fc) => (
                <TableRow key={fc.class}>
                  <TableCell>
                    <Badge variant={CLASS_BADGE_VARIANTS[fc.class]}>
                      {CLASS_LABELS[fc.class]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{fc.description}</TableCell>
                  <TableCell className="text-right font-medium">{fc.forecast_treatment_pct}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Per-Counterparty Classification */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t('certainty.counterparty_title', 'Counterparty Classifications')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {counterpartyCertainties.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t('certainty.no_data', 'No counterparty classifications available.')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('certainty.counterparty', 'Counterparty')}</TableHead>
                  <TableHead>{t('certainty.assigned_class', 'Assigned Class')}</TableHead>
                  <TableHead className="text-right">{t('certainty.treatment', 'Treatment %')}</TableHead>
                  <TableHead>{t('certainty.override', 'Override')}</TableHead>
                  <TableHead className="text-right">{t('certainty.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {counterpartyCertainties.map((cp) => (
                  <TableRow key={cp.counterparty_id}>
                    <TableCell className="font-medium">{cp.counterparty_name}</TableCell>
                    <TableCell>
                      {editingId === cp.counterparty_id ? (
                        <Select
                          value={editClass}
                          onValueChange={(val) => setEditClass(val as CertaintyClass)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(CLASS_LABELS) as [CertaintyClass, string][]).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={CLASS_BADGE_VARIANTS[cp.assigned_class]}>
                          {CLASS_LABELS[cp.assigned_class]}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === cp.counterparty_id ? (
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          className="w-20 ml-auto"
                          value={editPct}
                          onChange={(e) => setEditPct(e.target.value)}
                        />
                      ) : (
                        <span className="font-medium">{cp.forecast_treatment_pct}%</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {cp.override ? (
                        <Badge variant="warning">Manual</Badge>
                      ) : (
                        <Badge variant="outline">Auto</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === cp.counterparty_id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => saveEdit(cp.counterparty_id)}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={cancelEdit}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => startEdit(cp)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
