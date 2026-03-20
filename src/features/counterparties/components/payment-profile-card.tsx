import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  AlertTriangle,
  Eye,
  ShieldCheck,
  Clock,
  FileText,
} from 'lucide-react';
import type { Counterparty } from '@/types/database';
import type { PaymentProfile, LeaseContract, ColdStartProfile } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface PaymentProfileCardProps {
  counterparty: Counterparty;
  profile: PaymentProfile | undefined;
  lease: LeaseContract | undefined;
  coldStart: ColdStartProfile | undefined;
  isLoading?: boolean;
  onUpdateOverrides?: (overrides: { forced_delay?: number | null; probability_override?: number | null; risk_note?: string | null }) => void;
}

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(amount) + ' FCFA';
}

function TrendIndicator({ trend }: { trend: string }) {
  switch (trend) {
    case 'improving':
      return (
        <span className="inline-flex items-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">Improving</span>
        </span>
      );
    case 'degrading':
      return (
        <span className="inline-flex items-center gap-1 text-red-600">
          <TrendingDown className="h-4 w-4" />
          <span className="text-sm font-medium">Degrading</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-gray-500">
          <Minus className="h-4 w-4" />
          <span className="text-sm font-medium">Stable</span>
        </span>
      );
  }
}

function RiskScoreStars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
      <span className="ml-1 text-sm text-muted-foreground">{score}/5</span>
    </div>
  );
}

function VigilanceBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'success' | 'warning' | 'destructive'; icon: typeof ShieldCheck; label: string }> = {
    normal: { variant: 'success', icon: ShieldCheck, label: 'Normal' },
    surveillance: { variant: 'warning', icon: Eye, label: 'Surveillance' },
    alert: { variant: 'destructive', icon: AlertTriangle, label: 'Alert' },
  };
  const c = config[status] ?? config.normal;
  const Icon = c.icon;
  return (
    <Badge variant={c.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {c.label}
    </Badge>
  );
}

const INDEXATION_LABELS: Record<string, string> = {
  fixed_rate: 'Fixed Rate',
  external_index: 'External Index',
  contractual_step: 'Contractual Step',
  manual: 'Manual',
};

export function PaymentProfileCard({
  counterparty,
  profile,
  lease,
  coldStart,
  isLoading,
  onUpdateOverrides,
}: PaymentProfileCardProps) {
  const { t } = useTranslation('counterparties');
  const [forcedDelayEnabled, setForcedDelayEnabled] = useState(!!profile?.forced_delay);
  const [forcedDelay, setForcedDelay] = useState<number>(profile?.forced_delay ?? 0);
  const [probabilityOverride, setProbabilityOverride] = useState<string>('');
  const [riskNote, setRiskNote] = useState<string>('');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{t('profile.loading', 'Loading payment profile...')}</p>
        </CardContent>
      </Card>
    );
  }

  function handleSaveOverrides() {
    onUpdateOverrides?.({
      forced_delay: forcedDelayEnabled ? forcedDelay : null,
      probability_override: probabilityOverride ? parseFloat(probabilityOverride) : null,
      risk_note: riskNote || null,
    });
  }

  return (
    <div className="space-y-4">
      {/* Cold-start warning */}
      {coldStart?.is_cold_start && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">
                {t('profile.cold_start_title', 'Cold-Start Profile Active')}
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                {t('profile.cold_start_desc', 'Only {{months}} month(s) of data available. Using sector average delay of {{delay}} days. Profile will converge after {{convergence}} months.', {
                  months: coldStart.months_of_data,
                  delay: coldStart.sector_avg_delay,
                  convergence: coldStart.convergence_months,
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contractual Data */}
      {lease && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('profile.contractual_data', 'Contractual Data')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.lease_ref', 'Lease Reference')}</p>
                <p className="font-medium">{lease.lease_reference}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.monthly_rent', 'Monthly Rent HT')}</p>
                <p className="font-medium">{formatFCFA(lease.monthly_rent_ht)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.monthly_charges', 'Monthly Charges HT')}</p>
                <p className="font-medium">{formatFCFA(lease.monthly_charges_ht)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.due_day', 'Due Day')}</p>
                <p className="font-medium">{lease.payment_due_day} of each month</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.deposit', 'Security Deposit')}</p>
                <p className="font-medium">{formatFCFA(lease.security_deposit)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.indexation', 'Indexation')}</p>
                <p className="font-medium">
                  {INDEXATION_LABELS[lease.indexation_type] ?? lease.indexation_type} ({lease.indexation_rate}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observed Behavior */}
      {profile && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('profile.observed_behavior', 'Observed Payment Behavior')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.avg_delay', 'Avg Delay')}</p>
                <p className="font-medium">
                  {profile.avg_delay_days} days <span className="text-muted-foreground text-xs">+/- {profile.delay_std_dev}</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.full_payment', 'Full Payment Rate')}</p>
                <p className="font-medium">{(profile.full_payment_rate * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.partial_payment', 'Partial Payment Rate')}</p>
                <p className="font-medium">
                  {(profile.partial_payment_rate * 100).toFixed(0)}%
                  <span className="text-muted-foreground text-xs ml-1">
                    (avg {(profile.avg_partial_amount_pct * 100).toFixed(0)}% of amount)
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.history', 'History')}</p>
                <p className="font-medium">{profile.history_months} months</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.trend', 'Trend')}</p>
                <TrendIndicator trend={profile.trend} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.vigilance', 'Vigilance')}</p>
                <VigilanceBadge status={profile.vigilance_status} />
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.risk_score', 'Risk Score')}</p>
                <RiskScoreStars score={profile.risk_score} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Overrides */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t('profile.manual_overrides', 'Manual Overrides')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium text-sm">{t('profile.forced_delay_label', 'Forced Delay Override')}</p>
              <p className="text-xs text-muted-foreground">
                {t('profile.forced_delay_desc', 'Override the observed average delay with a fixed value')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={forcedDelayEnabled}
                onCheckedChange={setForcedDelayEnabled}
              />
              {forcedDelayEnabled && (
                <Input
                  type="number"
                  min={0}
                  className="w-20"
                  value={forcedDelay}
                  onChange={(e) => setForcedDelay(Number(e.target.value))}
                  placeholder="days"
                />
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">{t('profile.probability_override', 'Probability Override (%)')}</label>
              <Input
                type="number"
                min={0}
                max={100}
                className="mt-1"
                value={probabilityOverride}
                onChange={(e) => setProbabilityOverride(e.target.value)}
                placeholder="Leave empty for auto"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('profile.risk_note', 'Risk Note')}</label>
              <Input
                className="mt-1"
                value={riskNote}
                onChange={(e) => setRiskNote(e.target.value)}
                placeholder={t('profile.risk_note_placeholder', 'Internal observation...')}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveOverrides}>
              {t('profile.save_overrides', 'Save Overrides')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
