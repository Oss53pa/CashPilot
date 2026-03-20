import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useAlertRules,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
  useActiveAlerts,
} from '../hooks/use-bank-accounts';
import type { AlertRule, AlertRuleType, ActiveAlert } from '../types';

interface BankAlertsProps {
  accountId: string;
  companyId?: string;
}

const ALERT_TYPE_CONFIG: Record<
  AlertRuleType,
  { label: string; icon: React.ElementType; description: string; unit: string }
> = {
  min_balance: {
    label: 'Minimum Balance',
    icon: TrendingDown,
    description: 'Alert when account balance drops below threshold',
    unit: 'FCFA',
  },
  max_balance: {
    label: 'Maximum Balance (Excess)',
    icon: TrendingUp,
    description: 'Alert when balance exceeds threshold (excess cash to invest)',
    unit: 'FCFA',
  },
  forecast_deficit: {
    label: 'Forecast Deficit (J+N)',
    icon: AlertTriangle,
    description: 'Alert when forecast shows deficit within N days',
    unit: 'days',
  },
  no_import: {
    label: 'No Import',
    icon: Clock,
    description: 'Alert when no statement imported for N days',
    unit: 'days',
  },
};

export function BankAlerts({ accountId, companyId }: BankAlertsProps) {
  const { t } = useTranslation();
  const { data: rules = [] } = useAlertRules(accountId);
  const { data: activeAlerts = [] } = useActiveAlerts(companyId);
  const createRule = useCreateAlertRule();
  const updateRule = useUpdateAlertRule();
  const deleteRule = useDeleteAlertRule();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [formType, setFormType] = useState<AlertRuleType>('min_balance');
  const [formThreshold, setFormThreshold] = useState('');

  const accountAlerts = activeAlerts.filter(
    (a) => a.rule.account_id === accountId,
  );

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormType('min_balance');
    setFormThreshold('');
    setFormOpen(true);
  };

  const handleOpenEdit = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormType(rule.type);
    setFormThreshold(String(rule.threshold));
    setFormOpen(true);
  };

  const handleSave = () => {
    const threshold = Number(formThreshold);
    if (isNaN(threshold) || threshold <= 0) return;

    if (editingRule) {
      updateRule.mutate({
        id: editingRule.id,
        data: { type: formType, threshold, enabled: editingRule.enabled },
      });
    } else {
      createRule.mutate({
        account_id: accountId,
        type: formType,
        threshold,
        enabled: true,
      });
    }
    setFormOpen(false);
  };

  const handleToggle = (rule: AlertRule) => {
    updateRule.mutate({
      id: rule.id,
      data: { enabled: !rule.enabled },
    });
  };

  const handleDelete = (id: string) => {
    deleteRule.mutate(id);
  };

  const formatThreshold = (rule: AlertRule) => {
    if (rule.type === 'min_balance' || rule.type === 'max_balance') {
      return new Intl.NumberFormat('fr-FR').format(rule.threshold) + ' FCFA';
    }
    return `${rule.threshold} ${ALERT_TYPE_CONFIG[rule.type].unit}`;
  };

  return (
    <div className="space-y-4">
      {/* Active alerts panel */}
      {accountAlerts.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              {t('bankAccounts.activeAlerts', 'Active Alerts')}
              <Badge variant="destructive" className="ml-auto">
                {accountAlerts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {accountAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 dark:bg-red-950/20'
                    : 'bg-yellow-50 dark:bg-yellow-950/20'
                }`}
              >
                {alert.severity === 'critical' ? (
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {alert.bank_name} - {alert.account_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(alert.triggered_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                <Badge
                  variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                  className="shrink-0"
                >
                  {alert.severity}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Alert rules */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {t('bankAccounts.alertRules', 'Alert Rules')}
            </CardTitle>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-3 w-3 mr-1" />
              {t('bankAccounts.addRule', 'Add Rule')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t('bankAccounts.noRules', 'No alert rules configured for this account.')}
            </p>
          ) : (
            rules.map((rule) => {
              const config = ALERT_TYPE_CONFIG[rule.type];
              const Icon = config.icon;

              return (
                <div
                  key={rule.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <div className={`p-2 rounded-md ${rule.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-4 w-4 ${rule.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{config.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {config.description} - Threshold: {formatThreshold(rule)}
                    </p>
                  </div>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => handleToggle(rule)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleOpenEdit(rule)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(rule.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Rule Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingRule
                ? t('bankAccounts.editRule', 'Edit Alert Rule')
                : t('bankAccounts.addRule', 'Add Alert Rule')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('bankAccounts.alertType', 'Alert Type')}
              </label>
              <Select
                value={formType}
                onValueChange={(v) => setFormType(v as AlertRuleType)}
                disabled={!!editingRule}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ALERT_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {ALERT_TYPE_CONFIG[formType].description}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('bankAccounts.threshold', 'Threshold')} ({ALERT_TYPE_CONFIG[formType].unit})
              </label>
              <Input
                type="number"
                value={formThreshold}
                onChange={(e) => setFormThreshold(e.target.value)}
                placeholder={
                  formType === 'min_balance' || formType === 'max_balance'
                    ? 'e.g. 5000000'
                    : 'e.g. 30'
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formThreshold || Number(formThreshold) <= 0}
            >
              {editingRule ? t('common.save', 'Save') : t('common.create', 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
