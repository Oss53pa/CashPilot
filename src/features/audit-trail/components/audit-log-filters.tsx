import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { AuditLogFilters } from '../services/audit-trail.service';

interface AuditLogFiltersBarProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
  users?: { id: string; full_name: string }[];
}

const MODULES = [
  'cash_flows',
  'budgets',
  'forecasts',
  'counterparties',
  'bank_accounts',
  'payments',
  'investments',
  'debt',
  'settings',
];

const ACTIONS = [
  'create',
  'update',
  'delete',
  'approve',
  'reject',
  'login',
  'export',
];

export function AuditLogFiltersBar({
  filters,
  onFiltersChange,
  users = [],
}: AuditLogFiltersBarProps) {
  const { t } = useTranslation('audit-trail');

  function updateFilter(key: keyof AuditLogFilters, value: string | undefined) {
    onFiltersChange({ ...filters, [key]: value === '__all__' ? undefined : value || undefined });
  }

  function clearFilters() {
    onFiltersChange({});
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="date-from">{t('filters.date_from', 'From')}</Label>
        <Input
          id="date-from"
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => updateFilter('dateFrom', e.target.value)}
          className="w-[160px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date-to">{t('filters.date_to', 'To')}</Label>
        <Input
          id="date-to"
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => updateFilter('dateTo', e.target.value)}
          className="w-[160px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t('filters.user', 'User')}</Label>
        <Select
          value={filters.userId ?? '__all__'}
          onValueChange={(v) => updateFilter('userId', v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filters.all_users', 'All users')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('filters.all_users', 'All users')}</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>{t('filters.module', 'Module')}</Label>
        <Select
          value={filters.module ?? '__all__'}
          onValueChange={(v) => updateFilter('module', v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('filters.all_modules', 'All modules')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('filters.all_modules', 'All modules')}</SelectItem>
            {MODULES.map((mod) => (
              <SelectItem key={mod} value={mod}>
                {mod.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>{t('filters.action', 'Action')}</Label>
        <Select
          value={filters.action ?? '__all__'}
          onValueChange={(v) => updateFilter('action', v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('filters.all_actions', 'All actions')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('filters.all_actions', 'All actions')}</SelectItem>
            {ACTIONS.map((action) => (
              <SelectItem key={action} value={action}>
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          {t('filters.clear', 'Clear')}
        </Button>
      )}
    </div>
  );
}
