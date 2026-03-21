import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Percent,
  Shield,
  BarChart3,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { cn } from '@/lib/utils';
import type { TFTStatement } from '../types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TFTHeaderProps {
  tft: TFTStatement | undefined;
  method: 'direct' | 'indirect';
  onMethodChange: (method: 'direct' | 'indirect') => void;
  statementType: 'realized' | 'forecast' | 'hybrid';
  onStatementTypeChange: (type: 'realized' | 'forecast' | 'hybrid') => void;
  scope: 'company' | 'group';
  onScopeChange: (scope: 'company' | 'group') => void;
  periodType: 'monthly' | 'quarterly' | 'annual';
  onPeriodTypeChange: (type: 'monthly' | 'quarterly' | 'annual') => void;
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function KPICard({
  label,
  value,
  icon: Icon,
  isCurrency,
  isPercent,
  status,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  isCurrency?: boolean;
  isPercent?: boolean;
  status?: 'positive' | 'negative' | 'neutral';
}) {
  const statusColor =
    status === 'positive'
      ? 'text-green-600'
      : status === 'negative'
        ? 'text-red-600'
        : 'text-muted-foreground';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground truncate">{label}</span>
          <Icon className="h-4 w-4 text-muted-foreground/60 shrink-0" />
        </div>
        <div className={cn('text-lg font-bold', statusColor)}>
          {isCurrency ? (
            <CurrencyDisplay amount={value} currency="XOF" className={statusColor} />
          ) : isPercent ? (
            `${value}%`
          ) : (
            value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TFTHeader({
  tft,
  method,
  onMethodChange,
  statementType,
  onStatementTypeChange,
  scope,
  onScopeChange,
  periodType,
  onPeriodTypeChange,
}: TFTHeaderProps) {
  const ratios = tft?.complementary.ratios;
  const netExploitation = tft?.reconciliation.net_exploitation ?? 0;
  const netFinancing = tft?.reconciliation.net_financing ?? 0;
  const fcf = ratios?.free_cash_flow ?? 0;

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Period type */}
        <Tabs value={periodType} onValueChange={(v) => onPeriodTypeChange(v as 'monthly' | 'quarterly' | 'annual')}>
          <TabsList className="h-8">
            <TabsTrigger value="monthly" className="text-xs px-3 py-1">Mensuel</TabsTrigger>
            <TabsTrigger value="quarterly" className="text-xs px-3 py-1">Trimestriel</TabsTrigger>
            <TabsTrigger value="annual" className="text-xs px-3 py-1">Annuel</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Method */}
        <Tabs value={method} onValueChange={(v) => onMethodChange(v as 'direct' | 'indirect')}>
          <TabsList className="h-8">
            <TabsTrigger value="direct" className="text-xs px-3 py-1">Directe</TabsTrigger>
            <TabsTrigger value="indirect" className="text-xs px-3 py-1">Indirecte</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Statement type */}
        <Tabs value={statementType} onValueChange={(v) => onStatementTypeChange(v as 'realized' | 'forecast' | 'hybrid')}>
          <TabsList className="h-8">
            <TabsTrigger value="realized" className="text-xs px-3 py-1">Realise</TabsTrigger>
            <TabsTrigger value="forecast" className="text-xs px-3 py-1">Previsionnel</TabsTrigger>
            <TabsTrigger value="hybrid" className="text-xs px-3 py-1">Cote a cote</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Scope */}
        <Tabs value={scope} onValueChange={(v) => onScopeChange(v as 'company' | 'group')}>
          <TabsList className="h-8">
            <TabsTrigger value="company" className="text-xs px-3 py-1">Societe</TabsTrigger>
            <TabsTrigger value="group" className="text-xs px-3 py-1">Groupe</TabsTrigger>
          </TabsList>
        </Tabs>

        {tft?.is_certified && (
          <Badge variant="success" className="ml-auto">Certifie</Badge>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          label="CF Exploitation"
          value={netExploitation}
          icon={TrendingUp}
          isCurrency
          status={netExploitation >= 0 ? 'positive' : 'negative'}
        />
        <KPICard
          label="Free Cash Flow"
          value={fcf}
          icon={Activity}
          isCurrency
          status={fcf >= 0 ? 'positive' : 'negative'}
        />
        <KPICard
          label="CF Financement"
          value={netFinancing}
          icon={TrendingDown}
          isCurrency
          status={netFinancing >= 0 ? 'positive' : 'negative'}
        />
        <KPICard
          label="FCF / CA"
          value={ratios?.operating_cf_to_revenue ?? 0}
          icon={Percent}
          isPercent
          status={(ratios?.operating_cf_to_revenue ?? 0) >= 10 ? 'positive' : 'negative'}
        />
        <KPICard
          label="DSCR"
          value={ratios?.dscr ?? 0}
          icon={Shield}
          status={(ratios?.dscr ?? 0) >= 1.2 ? 'positive' : 'negative'}
        />
        <KPICard
          label="Cash Conversion"
          value={ratios?.cash_conversion ?? 0}
          icon={BarChart3}
          isPercent
          status={(ratios?.cash_conversion ?? 0) >= 10 ? 'positive' : 'negative'}
        />
      </div>
    </div>
  );
}
