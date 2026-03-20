import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Crown,
  BarChart3,
  Landmark,
  Building,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { CEODashboard } from '../components/ceo-dashboard';
import { CFODashboard } from '../components/cfo-dashboard';
import { TreasurerDashboard } from '../components/treasurer-dashboard';
import { CenterManagerDashboard } from '../components/center-manager-dashboard';

type DashboardRole = 'ceo' | 'cfo' | 'treasurer' | 'center-manager';

const ROLE_OPTIONS: { value: DashboardRole; label: string; icon: React.ReactNode }[] = [
  { value: 'ceo', label: 'DG / CEO', icon: <Crown className="h-4 w-4" /> },
  { value: 'cfo', label: 'DAF / CFO', icon: <BarChart3 className="h-4 w-4" /> },
  { value: 'treasurer', label: 'Trésorier', icon: <Landmark className="h-4 w-4" /> },
  { value: 'center-manager', label: 'Responsable Centre', icon: <Building className="h-4 w-4" /> },
];

const ROLE_DESCRIPTIONS: Record<DashboardRole, string> = {
  ceo: 'Vue consolidée groupe, alertes et approbations',
  cfo: 'Positions bancaires, plan de trésorerie et ratios financiers',
  treasurer: 'Tâches opérationnelles et échéances à venir',
  'center-manager': 'Suivi locataires, caisses et relances',
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const [role, setRole] = useState<DashboardRole>('ceo');

  const currentRoleOption = ROLE_OPTIONS.find((r) => r.value === role);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dashboard.title', 'Tableau de bord')}
        description={ROLE_DESCRIPTIONS[role]}
      >
        <Select value={role} onValueChange={(v) => setRole(v as DashboardRole)}>
          <SelectTrigger className="w-[220px]">
            <div className="flex items-center gap-2">
              {currentRoleOption?.icon}
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      {role === 'ceo' && <CEODashboard />}
      {role === 'cfo' && <CFODashboard />}
      {role === 'treasurer' && <TreasurerDashboard />}
      {role === 'center-manager' && <CenterManagerDashboard />}
    </div>
  );
}
