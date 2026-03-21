import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldCheck } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { GeneralSettings } from '../components/general-settings';
import { CompanySettings } from '../components/company-settings';
import { UserSettings } from '../components/user-settings';
import { SecuritySettings } from '../components/security-settings';
import { NotificationSettings } from '../components/notification-settings';
import { UserProfileFull } from '../components/user-profile-full';

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  if (showProfile) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Mon profil"
          description="Gerez vos informations personnelles, securite, preferences et integrations"
        >
          <Button variant="outline" onClick={() => setShowProfile(false)}>
            Retour aux parametres
          </Button>
        </PageHeader>
        <UserProfileFull onSave={() => setShowProfile(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings.title', 'Parametres')}
        description={t('settings.description', 'Configuration de l\'application, utilisateurs, securite et parametrage metier')}
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
            {t('settings.companies', 'Societes')}
          </TabsTrigger>
          <TabsTrigger value="users">
            {t('settings.users', 'Utilisateurs')}
          </TabsTrigger>
          <TabsTrigger value="security">
            {t('settings.security', 'Securite')}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            {t('settings.notifications', 'Notifications')}
          </TabsTrigger>
          <TabsTrigger value="parametrage">
            Parametrage
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

        <TabsContent value="parametrage" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card
              className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
              onClick={() => navigate('/settings/payment-delays')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Clock className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Delais de paiement</CardTitle>
                    <CardDescription>Delais par defaut, par categorie, calendrier fiscal</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>Hierarchie 4 niveaux : Defaut → Categorie → Contrepartie → Proph3t</li>
                  <li>Escalade relances : J+5 / J+15 / J+30 / J+60 / J+90</li>
                  <li>Dates fixes : salaires, TVA, IS, patente</li>
                  <li>Vue consolidee de toutes les contreparties</li>
                  <li>Calendrier des paiements</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="opacity-80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                    <ShieldCheck className="h-5 w-5 text-orange-700" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Delegation d'autorite (DOA)</CardTitle>
                    <CardDescription>Seuils de validation par type de transaction</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>Paiements fournisseurs : 4 niveaux de seuils</li>
                  <li>Sorties de caisse : 3 niveaux</li>
                  <li>Transferts internes et inter-companies</li>
                  <li>CAPEX et placements</li>
                  <li>Delegations temporaires avec expiration</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="opacity-80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <Clock className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Calendrier fiscal</CardTitle>
                    <CardDescription>Echeances TVA, IS, patente, CNPS</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Configure dans Delais de paiement → onglet Defauts → section Dates fixes
                </p>
              </CardContent>
            </Card>

            <Card className="opacity-80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <Clock className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Relances automatiques</CardTitle>
                    <CardDescription>Templates, canaux, escalade par etape</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Configure dans Delais de paiement → onglet Defauts → section Encaissements
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
