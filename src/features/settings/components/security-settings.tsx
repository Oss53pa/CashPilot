import { useTranslation } from 'react-i18next';
import { Shield, Key } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function SecuritySettings() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>{t('settings.changePassword', 'Change Password')}</CardTitle>
          </div>
          <CardDescription>
            {t('settings.changePasswordDesc', 'Update your account password.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">
              {t('settings.currentPassword', 'Current Password')}
            </Label>
            <Input id="current-password" type="password" placeholder="Enter current password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">
              {t('settings.newPassword', 'New Password')}
            </Label>
            <Input id="new-password" type="password" placeholder="Enter new password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              {t('settings.confirmPassword', 'Confirm New Password')}
            </Label>
            <Input id="confirm-password" type="password" placeholder="Confirm new password" />
          </div>
          <Button>{t('settings.updatePassword', 'Update Password')}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>{t('settings.twoFactor', 'Two-Factor Authentication')}</CardTitle>
          </div>
          <CardDescription>
            {t('settings.twoFactorDesc', 'Add an extra layer of security to your account.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>{t('settings.enable2FA', 'Enable 2FA')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.enable2FADesc', 'Require a second factor when signing in.')}
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
