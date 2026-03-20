import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

import { GeneralSettings } from '../components/general-settings';
import { CompanySettings } from '../components/company-settings';
import { UserSettings } from '../components/user-settings';
import { SecuritySettings } from '../components/security-settings';
import { NotificationSettings } from '../components/notification-settings';
import { UserProfileFull } from '../components/user-profile-full';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [showProfile, setShowProfile] = useState(false);

  if (showProfile) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Mon profil"
          description="Gérez vos informations personnelles, sécurité, préférences et intégrations"
        >
          <Button variant="outline" onClick={() => setShowProfile(false)}>
            Retour aux paramètres
          </Button>
        </PageHeader>
        <UserProfileFull onSave={() => setShowProfile(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings.title', 'Settings')}
        description={t('settings.description', 'Manage your application preferences and configuration')}
      >
        <Button onClick={() => setShowProfile(true)}>
          Mon profil complet
        </Button>
      </PageHeader>

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
