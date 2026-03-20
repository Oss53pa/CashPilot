import { useState, useMemo } from 'react';
import {
  User, Shield, Users, Settings, Bell, Code2, Lock, Activity,
  Plus, Trash2, RefreshCw, Monitor, Smartphone,
  Eye, EyeOff,
  Key, QrCode, Download, LogOut,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserInfo {
  first_name: string;
  last_name: string;
  title: string;
  email: string;
  phone: string;
  whatsapp: string;
  language: string;
  timezone: string;
  tenant: string;
  inscription_date: string;
  last_login: string;
}

interface TrustedDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  last_used: string;
  ip: string;
  location: string;
  is_current: boolean;
}

interface ActiveSession {
  id: string;
  device: string;
  ip: string;
  location: string;
  started: string;
  last_activity: string;
  is_current: boolean;
}

interface Delegation {
  id: string;
  delegate_to: string;
  scope: string;
  max_amount: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'active' | 'expired' | 'revoked';
}

interface ReceivedDelegation {
  id: string;
  from: string;
  scope: string;
  max_amount: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired';
}

interface NotificationType {
  id: string;
  label: string;
  enabled: boolean;
  level: 'info' | 'warning' | 'critical';
  channels: string[];
}

interface ApiToken {
  id: string;
  name: string;
  prefix: string;
  created: string;
  last_used: string;
  expires: string;
  status: 'active' | 'expired' | 'revoked';
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  last_triggered: string;
}

interface CompanyAccess {
  id: string;
  company: string;
  role: string;
  granted_by: string;
  granted_date: string;
}

interface ActivityEntry {
  id: string;
  date: string;
  action: string;
  detail: string;
  ip: string;
  status: 'success' | 'failure' | 'warning';
}

interface AutoReport {
  id: string;
  name: string;
  enabled: boolean;
  schedule: 'daily' | 'weekly' | 'monthly';
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);

function getDefaultUser(): UserInfo {
  return {
    first_name: 'Koné',
    last_name: 'Ibrahim',
    title: 'Directeur Financier',
    email: 'i.kone@cashpilot.ci',
    phone: '+225 07 08 09 10 11',
    whatsapp: '+225 07 08 09 10 11',
    language: 'fr',
    timezone: 'Africa/Abidjan',
    tenant: 'CashPilot CI - Groupe Immobilier Abidjan',
    inscription_date: '2024-01-15',
    last_login: '2026-03-20 08:42',
  };
}

function getDefaultDevices(): TrustedDevice[] {
  return [
    { id: 'dev-1', name: 'MacBook Pro - Bureau', type: 'desktop', browser: 'Chrome 122', last_used: '2026-03-20 08:42', ip: '192.168.1.100', location: 'Abidjan, CI', is_current: true },
    { id: 'dev-2', name: 'iPhone 15 Pro', type: 'mobile', browser: 'Safari 17', last_used: '2026-03-19 22:15', ip: '41.207.45.12', location: 'Abidjan, CI', is_current: false },
    { id: 'dev-3', name: 'iPad Air', type: 'tablet', browser: 'Safari 17', last_used: '2026-03-15 14:30', ip: '192.168.1.105', location: 'Abidjan, CI', is_current: false },
  ];
}

function getDefaultSessions(): ActiveSession[] {
  return [
    { id: 'ses-1', device: 'Chrome - MacBook Pro', ip: '192.168.1.100', location: 'Abidjan, CI', started: '2026-03-20 08:42', last_activity: '2026-03-20 09:15', is_current: true },
    { id: 'ses-2', device: 'Safari - iPhone 15 Pro', ip: '41.207.45.12', location: 'Abidjan, CI', started: '2026-03-19 22:15', last_activity: '2026-03-19 22:45', is_current: false },
  ];
}

function getDefaultDelegations(): Delegation[] {
  return [
    { id: 'del-1', delegate_to: 'Mme Touré Aminata', scope: 'Validation paiements', max_amount: 5_000_000, start_date: '2026-03-15', end_date: '2026-03-25', reason: 'Déplacement professionnel Dakar', status: 'active' },
    { id: 'del-2', delegate_to: 'M. Diabaté Moussa', scope: 'Approbation factures', max_amount: 2_000_000, start_date: '2026-02-01', end_date: '2026-02-15', reason: 'Congés annuels', status: 'expired' },
  ];
}

function getDefaultReceivedDelegations(): ReceivedDelegation[] {
  return [
    { id: 'rdel-1', from: 'M. Ouattara Seydou (DG)', scope: 'Validation budgets investissement', max_amount: 50_000_000, start_date: '2026-01-01', end_date: '2026-12-31', status: 'active' },
  ];
}

function getDefaultNotificationTypes(): NotificationType[] {
  return [
    { id: 'nt-1', label: 'Solde bas', enabled: true, level: 'critical', channels: ['in_app', 'email', 'sms'] },
    { id: 'nt-2', label: 'Échéance de paiement', enabled: true, level: 'warning', channels: ['in_app', 'email'] },
    { id: 'nt-3', label: 'Facture reçue', enabled: true, level: 'info', channels: ['in_app'] },
    { id: 'nt-4', label: 'Validation requise', enabled: true, level: 'critical', channels: ['in_app', 'email', 'push'] },
    { id: 'nt-5', label: 'Dépassement budget', enabled: true, level: 'warning', channels: ['in_app', 'email'] },
    { id: 'nt-6', label: 'Échéance crédit', enabled: true, level: 'warning', channels: ['in_app', 'email'] },
    { id: 'nt-7', label: 'Maturité placement', enabled: true, level: 'info', channels: ['in_app'] },
    { id: 'nt-8', label: 'Alerte fraude RIB', enabled: true, level: 'critical', channels: ['in_app', 'email', 'sms', 'whatsapp'] },
    { id: 'nt-9', label: 'Rapprochement bancaire', enabled: false, level: 'info', channels: ['in_app'] },
    { id: 'nt-10', label: 'Contrat expirant', enabled: true, level: 'warning', channels: ['in_app', 'email'] },
    { id: 'nt-11', label: 'Nouveau locataire', enabled: false, level: 'info', channels: ['in_app'] },
    { id: 'nt-12', label: 'Impayé locataire', enabled: true, level: 'critical', channels: ['in_app', 'email', 'sms'] },
    { id: 'nt-13', label: 'Indexation loyer', enabled: true, level: 'info', channels: ['in_app'] },
    { id: 'nt-14', label: 'Prévision écart', enabled: true, level: 'warning', channels: ['in_app', 'email'] },
    { id: 'nt-15', label: 'Délégation reçue', enabled: true, level: 'info', channels: ['in_app', 'push'] },
    { id: 'nt-16', label: 'Connexion suspecte', enabled: true, level: 'critical', channels: ['in_app', 'email', 'sms'] },
    { id: 'nt-17', label: 'Rapport automatique', enabled: false, level: 'info', channels: ['email'] },
  ];
}

function getDefaultApiTokens(): ApiToken[] {
  return [
    { id: 'tok-1', name: 'API Comptabilité', prefix: 'cp_live_7x8k', created: '2025-06-15', last_used: '2026-03-19', expires: '2026-06-15', status: 'active' },
    { id: 'tok-2', name: 'Webhook ERP', prefix: 'cp_live_3m2n', created: '2025-01-10', last_used: '2025-12-01', expires: '2026-01-10', status: 'expired' },
  ];
}

function getDefaultWebhooks(): Webhook[] {
  return [
    { id: 'wh-1', url: 'https://erp.groupe-immo.ci/api/cashpilot/webhook', events: ['payment.created', 'invoice.received'], status: 'active', last_triggered: '2026-03-19 17:30' },
  ];
}

function getDefaultCompanyAccess(): CompanyAccess[] {
  return [
    { id: 'ca-1', company: 'GIA - Siège Abidjan', role: 'Directeur Financier', granted_by: 'DG', granted_date: '2024-01-15' },
    { id: 'ca-2', company: 'GIA - Filiale Bouaké', role: 'Lecteur', granted_by: 'Admin', granted_date: '2024-06-01' },
    { id: 'ca-3', company: 'GIA - Filiale San Pedro', role: 'Lecteur', granted_by: 'Admin', granted_date: '2025-01-10' },
  ];
}

function getDefaultActivities(): ActivityEntry[] {
  return [
    { id: 'act-1', date: '2026-03-20 08:42', action: 'Connexion', detail: 'Connexion réussie depuis Chrome/MacOS', ip: '192.168.1.100', status: 'success' },
    { id: 'act-2', date: '2026-03-19 17:30', action: 'Validation paiement', detail: 'Paiement #VIR-2026-0312 validé - 8 000 000 FCFA', ip: '192.168.1.100', status: 'success' },
    { id: 'act-3', date: '2026-03-19 15:12', action: 'Modification profil', detail: 'Numéro WhatsApp mis à jour', ip: '192.168.1.100', status: 'success' },
    { id: 'act-4', date: '2026-03-19 10:05', action: 'Export données', detail: 'Export CSV des prévisions T1 2026', ip: '192.168.1.100', status: 'success' },
    { id: 'act-5', date: '2026-03-18 14:20', action: 'Tentative connexion', detail: 'Échec authentification - mot de passe incorrect', ip: '41.207.45.99', status: 'failure' },
    { id: 'act-6', date: '2026-03-18 09:00', action: 'Délégation créée', detail: 'Délégation à Mme Touré - Validation paiements', ip: '192.168.1.100', status: 'success' },
    { id: 'act-7', date: '2026-03-17 16:45', action: 'API Token généré', detail: 'Nouveau token API Comptabilité créé', ip: '192.168.1.100', status: 'warning' },
    { id: 'act-8', date: '2026-03-15 11:30', action: 'Connexion', detail: 'Connexion depuis iPad - Safari/iPadOS', ip: '192.168.1.105', status: 'success' },
    { id: 'act-9', date: '2026-03-14 08:55', action: 'Modification budget', detail: 'Budget Q2 2026 ajusté - Maintenance +15%', ip: '192.168.1.100', status: 'success' },
    { id: 'act-10', date: '2026-03-12 13:00', action: 'Rapport généré', detail: 'Rapport mensuel trésorerie Février 2026', ip: '192.168.1.100', status: 'success' },
  ];
}

function getDefaultAutoReports(): AutoReport[] {
  return [
    { id: 'ar-1', name: 'Position de trésorerie quotidienne', enabled: true, schedule: 'daily' },
    { id: 'ar-2', name: 'Prévisions hebdomadaires', enabled: true, schedule: 'weekly' },
    { id: 'ar-3', name: 'Rapport mensuel de trésorerie', enabled: true, schedule: 'monthly' },
    { id: 'ar-4', name: 'Suivi des impayés', enabled: false, schedule: 'weekly' },
    { id: 'ar-5', name: 'Tableau de bord KPI', enabled: false, schedule: 'monthly' },
  ];
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface UserProfileFullProps {
  onSave?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function UserProfileFull({ onSave }: UserProfileFullProps) {
  const [activeTab, setActiveTab] = useState('info');
  const [saving, setSaving] = useState(false);

  // State
  const [user, setUser] = useState<UserInfo>(getDefaultUser);
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devices, setDevices] = useState(getDefaultDevices);
  const [sessions, setSessions] = useState(getDefaultSessions);
  const [delegations, setDelegations] = useState(getDefaultDelegations);
  const [receivedDelegations] = useState(getDefaultReceivedDelegations);
  const [notificationTypes, setNotificationTypes] = useState(getDefaultNotificationTypes);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [whatsappNotif, setWhatsappNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [notifStartHour, setNotifStartHour] = useState('07');
  const [notifEndHour, setNotifEndHour] = useState('21');
  const [weekendDnd, setWeekendDnd] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [apiTokens, setApiTokens] = useState(getDefaultApiTokens);
  const [webhooks, setWebhooks] = useState(getDefaultWebhooks);
  const [ipRestrictions, setIpRestrictions] = useState('192.168.1.0/24');
  const [companyAccess] = useState(getDefaultCompanyAccess);
  const [activities] = useState(getDefaultActivities);
  const [autoReports, setAutoReports] = useState(getDefaultAutoReports);
  const [activityFilter, setActivityFilter] = useState('all');

  // Preferences
  const [currencyDisplay, setCurrencyDisplay] = useState('symbol');
  const [numberFormat, setNumberFormat] = useState('fr-FR');
  const [dateFormat, setDateFormat] = useState('dd/MM/yyyy');
  const [defaultHomepage, setDefaultHomepage] = useState('dashboard');
  const [theme, setTheme] = useState('system');
  const [density, setDensity] = useState('comfortable');
  const [chartType, setChartType] = useState('bar');
  const [forecastHorizon, setForecastHorizon] = useState('3');
  const [scenario, setScenario] = useState('realistic');
  const [rowsPerTable, setRowsPerTable] = useState('25');

  // New delegation form
  const [newDel, setNewDel] = useState({
    delegate_to: '',
    scope: '',
    max_amount: 0,
    start_date: '',
    end_date: '',
    reason: '',
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSave?.();
    }, 600);
  };

  // Password strength
  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 20;
    if (newPassword.length >= 12) score += 10;
    if (/[a-z]/.test(newPassword)) score += 15;
    if (/[A-Z]/.test(newPassword)) score += 15;
    if (/[0-9]/.test(newPassword)) score += 20;
    if (/[^a-zA-Z0-9]/.test(newPassword)) score += 20;
    return Math.min(100, score);
  }, [newPassword]);

  const passwordStrengthLabel = passwordStrength < 40 ? 'Faible' : passwordStrength < 70 ? 'Moyen' : 'Fort';
  const passwordStrengthColor = passwordStrength < 40 ? 'bg-red-500' : passwordStrength < 70 ? 'bg-yellow-500' : 'bg-green-500';

  const backupCodes = ['A7K2-M9X1', 'B3P5-N8Y4', 'C6R1-Q2Z7', 'D4S8-T5W3', 'E9U6-V1X8', 'F2W3-Y7Z9'];

  // ─── Tab 1: Personal Info ─────────────────────────────────────────────────

  const renderInfo = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl">
                {user.first_name[0]}{user.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm">Changer la photo</Button>
              <p className="text-xs text-muted-foreground">JPG, PNG. Max 2 Mo.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Prénom *</Label>
              <Input
                value={user.first_name}
                onChange={(e) => setUser({ ...user, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={user.last_name}
                onChange={(e) => setUser({ ...user, last_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fonction</Label>
              <Input
                value={user.title}
                onChange={(e) => setUser({ ...user, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} readOnly className="bg-muted" />
              <p className="text-xs text-muted-foreground">Contactez l'administrateur pour modifier</p>
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={user.phone}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input
                value={user.whatsapp}
                onChange={(e) => setUser({ ...user, whatsapp: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Langue</Label>
              <Select value={user.language} onValueChange={(v) => setUser({ ...user, language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Francais</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fuseau horaire</Label>
              <Select value={user.timezone} onValueChange={(v) => setUser({ ...user, timezone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Abidjan">Africa/Abidjan (GMT+0)</SelectItem>
                  <SelectItem value="Africa/Lagos">Africa/Lagos (GMT+1)</SelectItem>
                  <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Organisation</Label>
              <Input value={user.tenant} readOnly className="bg-muted" />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Date d'inscription</p>
              <p className="text-sm font-medium">{user.inscription_date}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Dernière connexion</p>
              <p className="text-sm font-medium">{user.last_login}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Tab 2: Security ──────────────────────────────────────────────────────

  const renderSecurity = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle className="text-base">Changer le mot de passe</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Mot de passe actuel</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mot de passe actuel"
              />
            </div>
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmer</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le mot de passe"
              />
            </div>
          </div>
          {newPassword && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Force du mot de passe</p>
                <span className={`text-sm font-medium ${passwordStrength < 40 ? 'text-red-500' : passwordStrength < 70 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {passwordStrengthLabel}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div className={`h-2 rounded-full transition-all ${passwordStrengthColor}`} style={{ width: `${passwordStrength}%` }} />
              </div>
            </div>
          )}
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-sm text-red-500">Les mots de passe ne correspondent pas</p>
          )}
          <Button
            disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
            onClick={() => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }}
          >
            Mettre à jour le mot de passe
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle className="text-base">Authentification multi-facteurs (MFA)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>MFA activé</Label>
              <p className="text-sm text-muted-foreground">
                {mfaEnabled ? 'Votre compte est protégé par MFA' : 'Activez MFA pour plus de sécurité'}
              </p>
            </div>
            <Switch checked={mfaEnabled} onCheckedChange={setMfaEnabled} />
          </div>

          {mfaEnabled && (
            <>
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <div className="h-32 w-32 rounded-lg bg-muted flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Scannez ce QR code avec votre application d'authentification</p>
                  <p className="text-xs text-muted-foreground">Google Authenticator, Authy, ou Microsoft Authenticator</p>
                  <div className="flex gap-2">
                    <Input placeholder="Code de vérification" className="w-40" />
                    <Button variant="outline" size="sm">Vérifier</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Codes de secours</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                  >
                    {showBackupCodes ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                    {showBackupCodes ? 'Masquer' : 'Afficher'}
                  </Button>
                </div>
                {showBackupCodes && (
                  <div className="grid grid-cols-3 gap-2 rounded-lg border p-3 bg-muted">
                    {backupCodes.map((code) => (
                      <code key={code} className="text-sm font-mono text-center">{code}</code>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Télécharger les codes
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Régénérer
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appareils de confiance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Appareil</TableHead>
                <TableHead>Navigateur</TableHead>
                <TableHead>Dernière utilisation</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {device.type === 'desktop' ? <Monitor className="h-4 w-4" /> :
                       device.type === 'mobile' ? <Smartphone className="h-4 w-4" /> :
                       <Monitor className="h-4 w-4" />}
                      {device.name}
                      {device.is_current && <Badge variant="default" className="text-xs">Actuel</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{device.browser}</TableCell>
                  <TableCell className="text-sm">{device.last_used}</TableCell>
                  <TableCell className="font-mono text-sm">{device.ip}</TableCell>
                  <TableCell>{device.location}</TableCell>
                  <TableCell>
                    {!device.is_current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDevices(devices.filter((d) => d.id !== device.id))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sessions actives</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Appareil</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Dernière activité</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">
                    {session.device}
                    {session.is_current && <Badge variant="default" className="ml-2 text-xs">Actuelle</Badge>}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{session.ip}</TableCell>
                  <TableCell>{session.location}</TableCell>
                  <TableCell className="text-sm">{session.started}</TableCell>
                  <TableCell className="text-sm">{session.last_activity}</TableCell>
                  <TableCell>
                    {!session.is_current && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setSessions(sessions.filter((s) => s.id !== session.id))}
                      >
                        <LogOut className="h-3 w-3 mr-1" />
                        Révoquer
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Tab 3: Delegations ───────────────────────────────────────────────────

  const renderDelegations = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Délégations données</CardTitle>
          <CardDescription>Délégations de pouvoir que vous avez accordées</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Délégataire</TableHead>
                <TableHead>Périmètre</TableHead>
                <TableHead>Montant max</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {delegations.map((del) => (
                <TableRow key={del.id}>
                  <TableCell className="font-medium">{del.delegate_to}</TableCell>
                  <TableCell>{del.scope}</TableCell>
                  <TableCell>{fmt(del.max_amount)}</TableCell>
                  <TableCell className="text-sm">{del.start_date} au {del.end_date}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{del.reason}</TableCell>
                  <TableCell>
                    <Badge variant={del.status === 'active' ? 'default' : del.status === 'expired' ? 'secondary' : 'destructive'}>
                      {del.status === 'active' ? 'Active' : del.status === 'expired' ? 'Expirée' : 'Révoquée'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {del.status === 'active' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setDelegations(delegations.map((d) =>
                            d.id === del.id ? { ...d, status: 'revoked' } : d
                          ))
                        }
                      >
                        Révoquer
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-3">Nouvelle délégation</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Délégataire</Label>
                <Input
                  value={newDel.delegate_to}
                  onChange={(e) => setNewDel({ ...newDel, delegate_to: e.target.value })}
                  placeholder="Nom du délégataire"
                />
              </div>
              <div className="space-y-2">
                <Label>Périmètre</Label>
                <Select value={newDel.scope} onValueChange={(v) => setNewDel({ ...newDel, scope: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Validation paiements">Validation paiements</SelectItem>
                    <SelectItem value="Approbation factures">Approbation factures</SelectItem>
                    <SelectItem value="Gestion locataires">Gestion locataires</SelectItem>
                    <SelectItem value="Accès complet">Accès complet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Montant maximum (FCFA)</Label>
                <Input
                  type="number"
                  value={newDel.max_amount || ''}
                  onChange={(e) => setNewDel({ ...newDel, max_amount: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date début</Label>
                <Input
                  type="date"
                  value={newDel.start_date}
                  onChange={(e) => setNewDel({ ...newDel, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date fin</Label>
                <Input
                  type="date"
                  value={newDel.end_date}
                  onChange={(e) => setNewDel({ ...newDel, end_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Motif</Label>
                <Input
                  value={newDel.reason}
                  onChange={(e) => setNewDel({ ...newDel, reason: e.target.value })}
                  placeholder="Raison de la délégation"
                />
              </div>
            </div>
            <Button
              className="mt-4"
              disabled={!newDel.delegate_to || !newDel.scope || !newDel.start_date || !newDel.end_date}
              onClick={() => {
                setDelegations([
                  ...delegations,
                  { id: `del-${Date.now()}`, ...newDel, status: 'active' },
                ]);
                setNewDel({ delegate_to: '', scope: '', max_amount: 0, start_date: '', end_date: '', reason: '' });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer la délégation
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Délégations reçues</CardTitle>
          <CardDescription>Délégations de pouvoir dont vous bénéficiez</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Délégant</TableHead>
                <TableHead>Périmètre</TableHead>
                <TableHead>Montant max</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receivedDelegations.map((del) => (
                <TableRow key={del.id}>
                  <TableCell className="font-medium">{del.from}</TableCell>
                  <TableCell>{del.scope}</TableCell>
                  <TableCell>{fmt(del.max_amount)}</TableCell>
                  <TableCell className="text-sm">{del.start_date} au {del.end_date}</TableCell>
                  <TableCell>
                    <Badge variant={del.status === 'active' ? 'default' : 'secondary'}>
                      {del.status === 'active' ? 'Active' : 'Expirée'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Tab 4: Preferences ───────────────────────────────────────────────────

  const renderPreferences = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Affichage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Affichage devise</Label>
              <Select value={currencyDisplay} onValueChange={setCurrencyDisplay}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="symbol">Symbole (FCFA)</SelectItem>
                  <SelectItem value="code">Code (XOF)</SelectItem>
                  <SelectItem value="full">Complet (Franc CFA BCEAO)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format des nombres</Label>
              <Select value={numberFormat} onValueChange={setNumberFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr-FR">1 234 567 (FR)</SelectItem>
                  <SelectItem value="en-US">1,234,567 (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format des dates</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                  <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Page d'accueil par défaut</Label>
              <Select value={defaultHomepage} onValueChange={setDefaultHomepage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Tableau de bord</SelectItem>
                  <SelectItem value="cashflow">Trésorerie</SelectItem>
                  <SelectItem value="forecast">Prévisions</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Thème</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Clair</SelectItem>
                  <SelectItem value="dark">Sombre</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Densité d'affichage</Label>
              <Select value={density} onValueChange={setDensity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Confortable</SelectItem>
                  <SelectItem value="spacious">Aéré</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prévisions & Graphiques</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Type de graphique par défaut</Label>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Barres</SelectItem>
                  <SelectItem value="line">Lignes</SelectItem>
                  <SelectItem value="area">Aires</SelectItem>
                  <SelectItem value="stacked">Barres empilées</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Horizon de prévision (mois)</Label>
              <Select value={forecastHorizon} onValueChange={setForecastHorizon}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 mois</SelectItem>
                  <SelectItem value="3">3 mois</SelectItem>
                  <SelectItem value="6">6 mois</SelectItem>
                  <SelectItem value="12">12 mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Scénario par défaut</Label>
              <Select value={scenario} onValueChange={setScenario}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="optimistic">Optimiste</SelectItem>
                  <SelectItem value="realistic">Réaliste</SelectItem>
                  <SelectItem value="pessimistic">Pessimiste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lignes par tableau</Label>
              <Select value={rowsPerTable} onValueChange={setRowsPerTable}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rapports automatiques</CardTitle>
          <CardDescription>Configurez l'envoi automatique de rapports par email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {autoReports.map((report, idx) => (
            <div
              key={report.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <Switch
                  checked={report.enabled}
                  onCheckedChange={(checked) => {
                    const updated = [...autoReports];
                    updated[idx] = { ...report, enabled: !!checked };
                    setAutoReports(updated);
                  }}
                />
                <div>
                  <p className="text-sm font-medium">{report.name}</p>
                </div>
              </div>
              <Select
                value={report.schedule}
                onValueChange={(v) => {
                  const updated = [...autoReports];
                  updated[idx] = { ...report, schedule: v as 'daily' | 'weekly' | 'monthly' };
                  setAutoReports(updated);
                }}
              >
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  // ─── Tab 5: Notifications ─────────────────────────────────────────────────

  const renderNotifications = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Canaux de notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted">
            <div>
              <Label>In-app</Label>
              <p className="text-sm text-muted-foreground">Notifications dans l'application</p>
            </div>
            <Switch checked={true} disabled />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>SMS</Label>
              <p className="text-sm text-muted-foreground">{user.phone}</p>
            </div>
            <Switch checked={smsNotif} onCheckedChange={setSmsNotif} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>WhatsApp</Label>
              <p className="text-sm text-muted-foreground">{user.whatsapp}</p>
            </div>
            <Switch checked={whatsappNotif} onCheckedChange={setWhatsappNotif} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Push</Label>
              <p className="text-sm text-muted-foreground">Notifications navigateur</p>
            </div>
            <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Types de notifications</CardTitle>
          <CardDescription>{notificationTypes.filter((n) => n.enabled).length}/{notificationTypes.length} types activés</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Notification</TableHead>
                <TableHead>Activée</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Canaux</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notificationTypes.map((nt, idx) => (
                <TableRow key={nt.id}>
                  <TableCell className="font-medium">{nt.label}</TableCell>
                  <TableCell>
                    <Switch
                      checked={nt.enabled}
                      onCheckedChange={(checked) => {
                        const updated = [...notificationTypes];
                        updated[idx] = { ...nt, enabled: !!checked };
                        setNotificationTypes(updated);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={nt.level}
                      onValueChange={(v) => {
                        const updated = [...notificationTypes];
                        updated[idx] = { ...nt, level: v as 'info' | 'warning' | 'critical' };
                        setNotificationTypes(updated);
                      }}
                    >
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Avertissement</SelectItem>
                        <SelectItem value="critical">Critique</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {['in_app', 'email', 'sms', 'whatsapp', 'push'].map((ch) => (
                        <Badge
                          key={ch}
                          variant={nt.channels.includes(ch) ? 'default' : 'outline'}
                          className="cursor-pointer text-xs"
                          onClick={() => {
                            const updated = [...notificationTypes];
                            const channels = nt.channels.includes(ch)
                              ? nt.channels.filter((c) => c !== ch)
                              : [...nt.channels, ch];
                            updated[idx] = { ...nt, channels };
                            setNotificationTypes(updated);
                          }}
                        >
                          {ch === 'in_app' ? 'App' : ch === 'whatsapp' ? 'WA' : ch.charAt(0).toUpperCase() + ch.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plage horaire & Digest</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Heure de début</Label>
              <Select value={notifStartHour} onValueChange={setNotifStartHour}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                    <SelectItem key={h} value={h}>{h}:00</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Heure de fin</Label>
              <Select value={notifEndHour} onValueChange={setNotifEndHour}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                    <SelectItem key={h} value={h}>{h}:00</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Mode silence week-end</Label>
              <p className="text-sm text-muted-foreground">Pas de notifications SMS/Push le week-end (sauf critiques)</p>
            </div>
            <Switch checked={weekendDnd} onCheckedChange={setWeekendDnd} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Digest quotidien</Label>
              <p className="text-sm text-muted-foreground">Recevoir un résumé quotidien par email à 08:00</p>
            </div>
            <Switch checked={dailyDigest} onCheckedChange={setDailyDigest} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Tab 6: API & Integrations ────────────────────────────────────────────

  const renderApiIntegrations = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Tokens API</CardTitle>
              <CardDescription>Gérez vos jetons d'accès à l'API</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setApiTokens([
                  ...apiTokens,
                  {
                    id: `tok-${Date.now()}`,
                    name: 'Nouveau Token',
                    prefix: `cp_live_${Math.random().toString(36).slice(2, 6)}`,
                    created: new Date().toISOString().split('T')[0],
                    last_used: '-',
                    expires: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
                    status: 'active',
                  },
                ]);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un token
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Préfixe</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Dernière utilisation</TableHead>
                <TableHead>Expire le</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiTokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell className="font-medium">{token.name}</TableCell>
                  <TableCell className="font-mono text-sm">{token.prefix}...</TableCell>
                  <TableCell>{token.created}</TableCell>
                  <TableCell>{token.last_used}</TableCell>
                  <TableCell>{token.expires}</TableCell>
                  <TableCell>
                    <Badge variant={token.status === 'active' ? 'default' : token.status === 'expired' ? 'secondary' : 'destructive'}>
                      {token.status === 'active' ? 'Actif' : token.status === 'expired' ? 'Expiré' : 'Révoqué'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {token.status === 'active' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setApiTokens(apiTokens.map((t) =>
                            t.id === token.id ? { ...t, status: 'revoked' } : t
                          ))
                        }
                      >
                        Révoquer
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Restrictions IP</CardTitle>
          <CardDescription>Limitez l'accès API à certaines adresses IP</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Plages IP autorisées (une par ligne, notation CIDR)</Label>
            <Textarea
              value={ipRestrictions}
              onChange={(e) => setIpRestrictions(e.target.value)}
              rows={3}
              className="font-mono"
              placeholder="192.168.1.0/24&#10;10.0.0.0/8"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Webhooks</CardTitle>
              <CardDescription>Points de terminaison pour les événements en temps réel</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setWebhooks([
                  ...webhooks,
                  {
                    id: `wh-${Date.now()}`,
                    url: '',
                    events: [],
                    status: 'inactive',
                    last_triggered: '-',
                  },
                ]);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Événements</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernier déclenchement</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((wh) => (
                <TableRow key={wh.id}>
                  <TableCell className="font-mono text-sm max-w-[300px] truncate">{wh.url || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {wh.events.map((e) => (
                        <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={wh.status === 'active' ? 'default' : 'secondary'}>
                      {wh.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{wh.last_triggered}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setWebhooks(webhooks.filter((w) => w.id !== wh.id))}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Tab 7: Access & Roles ────────────────────────────────────────────────

  const renderAccessRoles = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rôle principal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <p className="text-lg font-bold">Directeur Financier</p>
              <p className="text-sm text-muted-foreground">
                Accès complet à la trésorerie, prévisions, budget, et validation des paiements jusqu'à 100 000 000 FCFA
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accès aux entités</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entité</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Accordé par</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companyAccess.map((ca) => (
                <TableRow key={ca.id}>
                  <TableCell className="font-medium">{ca.company}</TableCell>
                  <TableCell>
                    <Badge variant={ca.role === 'Directeur Financier' ? 'default' : 'secondary'}>
                      {ca.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{ca.granted_by}</TableCell>
                  <TableCell>{ca.granted_date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permissions effectives</CardTitle>
          <CardDescription>Résumé des permissions sur l'entité principale</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { perm: 'Tableau de bord', access: 'Lecture/Écriture' },
              { perm: 'Trésorerie', access: 'Lecture/Écriture' },
              { perm: 'Prévisions', access: 'Lecture/Écriture' },
              { perm: 'Budget', access: 'Lecture/Écriture' },
              { perm: 'Validation paiements', access: 'Jusqu\'à 100M FCFA' },
              { perm: 'Contreparties', access: 'Lecture/Écriture' },
              { perm: 'Rapprochement bancaire', access: 'Lecture/Écriture' },
              { perm: 'Paramètres', access: 'Lecture seule' },
              { perm: 'Gestion utilisateurs', access: 'Non autorisé' },
            ].map((p) => (
              <div key={p.perm} className="flex items-center justify-between rounded-lg border p-2">
                <span className="text-sm">{p.perm}</span>
                <Badge
                  variant={p.access === 'Non autorisé' ? 'destructive' : p.access === 'Lecture seule' ? 'secondary' : 'default'}
                  className="text-xs"
                >
                  {p.access}
                </Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" className="mt-4">
            Demander une modification d'accès
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Tab 8: Activity ──────────────────────────────────────────────────────

  const filteredActivities = useMemo(() => {
    if (activityFilter === 'all') return activities;
    return activities.filter((a) => a.status === activityFilter);
  }, [activities, activityFilter]);

  const renderActivity = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Journal d'activité personnel</CardTitle>
            <CardDescription>{activities.length} entrées</CardDescription>
          </div>
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout</SelectItem>
              <SelectItem value="success">Succès</SelectItem>
              <SelectItem value="failure">Échecs</SelectItem>
              <SelectItem value="warning">Avertissements</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Détails</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActivities.map((act) => (
              <TableRow key={act.id}>
                <TableCell className="font-mono text-sm whitespace-nowrap">{act.date}</TableCell>
                <TableCell className="font-medium">{act.action}</TableCell>
                <TableCell className="max-w-[300px] truncate">{act.detail}</TableCell>
                <TableCell className="font-mono text-sm">{act.ip}</TableCell>
                <TableCell>
                  <Badge variant={
                    act.status === 'success' ? 'default' :
                    act.status === 'failure' ? 'destructive' : 'secondary'
                  }>
                    {act.status === 'success' ? 'Succès' :
                     act.status === 'failure' ? 'Échec' : 'Attention'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  // ─── Main Render ───────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback>{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">{user.first_name} {user.last_name}</h2>
          <p className="text-muted-foreground">{user.title} - {user.tenant}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="info" className="gap-1">
            <User className="h-3 w-3" />Informations
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1">
            <Shield className="h-3 w-3" />Sécurité
          </TabsTrigger>
          <TabsTrigger value="delegations" className="gap-1">
            <Users className="h-3 w-3" />Délégations
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-1">
            <Settings className="h-3 w-3" />Préférences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1">
            <Bell className="h-3 w-3" />Notifications
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-1">
            <Code2 className="h-3 w-3" />API & Intégrations
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-1">
            <Lock className="h-3 w-3" />Accès & Rôles
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1">
            <Activity className="h-3 w-3" />Activité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">{renderInfo()}</TabsContent>
        <TabsContent value="security" className="mt-4">{renderSecurity()}</TabsContent>
        <TabsContent value="delegations" className="mt-4">{renderDelegations()}</TabsContent>
        <TabsContent value="preferences" className="mt-4">{renderPreferences()}</TabsContent>
        <TabsContent value="notifications" className="mt-4">{renderNotifications()}</TabsContent>
        <TabsContent value="api" className="mt-4">{renderApiIntegrations()}</TabsContent>
        <TabsContent value="access" className="mt-4">{renderAccessRoles()}</TabsContent>
        <TabsContent value="activity" className="mt-4">{renderActivity()}</TabsContent>
      </Tabs>

      {/* Save button */}
      <Separator />
      <div className="flex justify-end pb-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </div>
  );
}
