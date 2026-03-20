import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Circle,
  Clock,
  Lock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCompanyStore } from '@/stores/company.store';
import {
  usePeriodClosingStatus,
  useInitiatePeriodClosing,
  useUpdateClosingStep,
  useCompletePeriodClosing,
} from '../hooks/use-audit-trail';
import type { ClosingStepStatus } from '../services/audit-trail.service';

const statusConfig: Record<
  ClosingStepStatus,
  { icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'success'; label: string }
> = {
  pending: {
    icon: <Circle className="h-5 w-5 text-muted-foreground" />,
    variant: 'secondary',
    label: 'Pending',
  },
  in_progress: {
    icon: <Clock className="h-5 w-5 text-amber-500" />,
    variant: 'default',
    label: 'In Progress',
  },
  completed: {
    icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    variant: 'success',
    label: 'Completed',
  },
  blocked: {
    icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    variant: 'destructive',
    label: 'Blocked',
  },
};

export function PeriodClosing() {
  const { t } = useTranslation('audit-trail');
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id ?? '';

  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [period, setPeriod] = useState(defaultPeriod);

  const { data: closing, isLoading } = usePeriodClosingStatus(companyId, period);
  const initiateMutation = useInitiatePeriodClosing();
  const updateStepMutation = useUpdateClosingStep();
  const completeMutation = useCompletePeriodClosing();

  const completedSteps = closing?.steps.filter((s) => s.status === 'completed').length ?? 0;
  const totalSteps = closing?.steps.length ?? 6;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);
  const allStepsCompleted = completedSteps === totalSteps;
  const isClosed = closing?.status === 'closed';

  function handleInitiate() {
    initiateMutation.mutate({ companyId, period });
  }

  function handleStepAction(step: number, currentStatus: ClosingStepStatus) {
    if (!closing) return;
    const newStatus: ClosingStepStatus =
      currentStatus === 'pending'
        ? 'in_progress'
        : currentStatus === 'in_progress'
          ? 'completed'
          : currentStatus;
    updateStepMutation.mutate({ closingId: closing.id, step, status: newStatus });
  }

  function handleComplete() {
    if (!closing) return;
    completeMutation.mutate(closing.id);
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-end gap-4">
        <div className="space-y-1.5">
          <Label>{t('period', 'Period')}</Label>
          <Input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-48"
          />
        </div>
        {closing?.status === 'open' && (
          <Button onClick={handleInitiate} disabled={initiateMutation.isPending}>
            {initiateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('initiate_closing', 'Initiate Period Closing')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading...
          </CardContent>
        </Card>
      ) : closing ? (
        <>
          {/* Progress bar */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {t('closing_progress', 'Closing Progress')} — {period}
                </CardTitle>
                <Badge
                  variant={
                    isClosed
                      ? 'success'
                      : closing.status === 'in_progress'
                        ? 'default'
                        : 'secondary'
                  }
                >
                  {isClosed
                    ? t('closed', 'Closed')
                    : closing.status === 'in_progress'
                      ? t('in_progress', 'In Progress')
                      : t('open', 'Open')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Progress value={progressPercent} className="flex-1" />
                <span className="text-sm font-medium text-muted-foreground">
                  {completedSteps}/{totalSteps}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Steps checklist */}
          <Card>
            <CardHeader>
              <CardTitle>{t('closing_checklist', 'Closing Checklist')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {closing.steps.map((step) => {
                  const config = statusConfig[step.status];
                  const canAct =
                    !isClosed &&
                    (step.status === 'pending' || step.status === 'in_progress');

                  return (
                    <div
                      key={step.step}
                      className="flex items-center gap-4 rounded-lg border p-4"
                    >
                      <div className="flex-shrink-0">{config.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            Step {step.step}: {step.label}
                          </span>
                          <Badge variant={config.variant} className="text-xs">
                            {config.label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {step.description}
                        </p>
                        {step.completed_at && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Completed: {new Date(step.completed_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {canAct && (
                        <Button
                          size="sm"
                          variant={step.status === 'pending' ? 'outline' : 'default'}
                          disabled={updateStepMutation.isPending}
                          onClick={() => handleStepAction(step.step, step.status)}
                        >
                          {step.status === 'pending'
                            ? t('start', 'Start')
                            : t('complete', 'Complete')}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Step 7: Irreversible period closing */}
          {!isClosed && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Lock className="h-5 w-5" />
                  {t('final_closing', 'Step 7: Irreversible Period Closing')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t(
                    'final_closing_description',
                    'Once the period is closed, no further modifications will be allowed. All 6 steps must be completed before closing.',
                  )}
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={!allStepsCompleted || completeMutation.isPending}
                    >
                      {completeMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Lock className="mr-2 h-4 w-4" />
                      {t('close_period', 'Close Period Permanently')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t('confirm_closing_title', 'Confirm Period Closing')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t(
                          'confirm_closing_desc',
                          'This action is irreversible. The period will be permanently closed and no modifications will be allowed. Are you sure you want to proceed?',
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t('cancel', 'Cancel')}
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={handleComplete}>
                        {t('confirm_close', 'Yes, Close Period')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}

          {isClosed && (
            <Card className="border-green-500 bg-green-50">
              <CardContent className="flex items-center gap-3 py-6">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-700">
                    {t('period_closed', 'Period Closed')}
                  </p>
                  <p className="text-sm text-green-600">
                    {t('closed_on', 'Closed on')}{' '}
                    {closing.closed_at
                      ? new Date(closing.closed_at).toLocaleString()
                      : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
