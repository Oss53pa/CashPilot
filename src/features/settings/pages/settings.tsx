import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { GeneralSettings } from '../components/general-settings';
import { CompanySettings } from '../components/company-settings';
import { UserSettings } from '../components/user-settings';
import { SecuritySettings } from '../components/security-settings';
import { NotificationSettings } from '../components/notification-settings';

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings.title', 'Settings')}
        description={t('settings.description', 'Manage your application preferences and configuration')}
      />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">
            {t('settings.general', 'General')}
          </TabsTrigger>
          <TabsTrigger value="companies">
            {t('settings.companies', 'Companies')}
          </TabsTrigger>
          <TabsTrigger value="users">
            {t('settings.users', 'Users')}
          </TabsTrigger>
          <TabsTrigger value="security">
            {t('settings.security', 'Security')}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            {t('settings.notifications', 'Notifications')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="companies" className="mt-6">
          <CompanySettings />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserSettings />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
