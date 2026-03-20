import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function NotificationSettings() {
  const { t } = useTranslation();

  const notificationOptions = [
    {
      key: 'lowBalance',
      titleKey: 'settings.lowBalance',
      titleDefault: 'Low Balance Alerts',
      descKey: 'settings.lowBalanceDesc',
      descDefault: 'Notify when account balance falls below threshold.',
      defaultChecked: true,
    },
    {
      key: 'upcomingPayments',
      titleKey: 'settings.upcomingPayments',
      titleDefault: 'Upcoming Payments',
      descKey: 'settings.upcomingPaymentsDesc',
      descDefault: 'Remind about upcoming debt repayments and obligations.',
      defaultChecked: true,
    },
    {
      key: 'maturityAlerts',
      titleKey: 'settings.maturityAlerts',
      titleDefault: 'Investment Maturity Alerts',
      descKey: 'settings.maturityAlertsDesc',
      descDefault: 'Notify when investments are approaching maturity.',
      defaultChecked: true,
    },
    {
      key: 'budgetExceeded',
      titleKey: 'settings.budgetExceeded',
      titleDefault: 'Budget Exceeded',
      descKey: 'settings.budgetExceededDesc',
      descDefault: 'Alert when spending exceeds budget thresholds.',
      defaultChecked: false,
    },
    {
      key: 'dailyDigest',
      titleKey: 'settings.dailyDigest',
      titleDefault: 'Daily Digest',
      descKey: 'settings.dailyDigestDesc',
      descDefault: 'Receive a daily summary of treasury activity.',
      defaultChecked: false,
    },
    {
      key: 'creditLineExpiry',
      titleKey: 'settings.creditLineExpiry',
      titleDefault: 'Credit Line Expiry',
      descKey: 'settings.creditLineExpiryDesc',
      descDefault: 'Alert when credit lines are approaching expiry.',
      defaultChecked: true,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.notifications', 'Notification Preferences')}</CardTitle>
        <CardDescription>
          {t('settings.notificationsDesc', 'Choose which notifications you want to receive.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notificationOptions.map((option) => (
          <div
            key={option.key}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="space-y-0.5">
              <Label>{t(option.titleKey, option.titleDefault)}</Label>
              <p className="text-sm text-muted-foreground">
                {t(option.descKey, option.descDefault)}
              </p>
            </div>
            <Switch defaultChecked={option.defaultChecked} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
