import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, CreditCard, Calendar, Building2 } from 'lucide-react';
import type { Counterparty } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentProfileCard } from './payment-profile-card';
import { RentIndexation } from './rent-indexation';
import { CertaintyClassification } from './certainty-classification';
import {
  usePaymentProfile,
  useUpdatePaymentProfile,
  useLeaseContracts,
  useIndexationHistory,
  useApplyIndexation,
  useColdStartProfile,
  useFlowCertaintyClasses,
  useCounterpartyCertainties,
  useUpdateCounterpartyCertainty,
} from '../hooks/use-counterparties';

interface CounterpartyProfileProps {
  counterparty: Counterparty;
  companyId?: string;
}

export function CounterpartyProfile({ counterparty, companyId }: CounterpartyProfileProps) {
  const { t } = useTranslation('counterparties');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);

  // Payment profile data
  const { data: paymentProfile, isLoading: profileLoading } = usePaymentProfile(
    counterparty.id,
    counterparty.name
  );
  const updateProfile = useUpdatePaymentProfile(counterparty.id);

  // Lease contracts
  const { data: leaseContracts = [], isLoading: leasesLoading } = useLeaseContracts(counterparty.id);
  const activeLease = leaseContracts[0] ?? undefined;
  const leaseForIndexation = selectedLeaseId
    ? leaseContracts.find((l) => l.id === selectedLeaseId) ?? activeLease
    : activeLease;

  // Indexation
  const { data: indexationHistory = [], isLoading: historyLoading } = useIndexationHistory(
    leaseForIndexation?.id ?? ''
  );
  const applyIndexation = useApplyIndexation();

  // Cold-start
  const { data: coldStartProfile } = useColdStartProfile(counterparty.id, counterparty.name);

  // Flow certainty
  const { data: certaintyClasses = [] } = useFlowCertaintyClasses();
  const { data: counterpartyCertainties = [] } = useCounterpartyCertainties(companyId ?? '');
  const updateCertainty = useUpdateCounterpartyCertainty();

  return (
    <div className="w-full max-w-4xl">
      {/* Header Card */}
      <Card className="rounded-b-none border-b-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{counterparty.name}</CardTitle>
              {counterparty.short_name && (
                <CardDescription>{counterparty.short_name}</CardDescription>
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant={counterparty.is_active ? 'success' : 'destructive'}>
                {counterparty.is_active
                  ? t('profile.active', 'Active')
                  : t('profile.inactive', 'Inactive')}
              </Badge>
              <Badge>
                {counterparty.type.charAt(0).toUpperCase() + counterparty.type.slice(1)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {counterparty.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.email', 'Email')}</p>
                  <p className="font-medium">{counterparty.email}</p>
                </div>
              </div>
            )}

            {counterparty.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.phone', 'Phone')}</p>
                  <p className="font-medium">{counterparty.phone}</p>
                </div>
              </div>
            )}

            {counterparty.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.address', 'Address')}</p>
                  <p className="font-medium">{counterparty.address}</p>
                </div>
              </div>
            )}

            {counterparty.tax_id && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.tax_id', 'Tax ID')}</p>
                  <p className="font-medium">{counterparty.tax_id}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('profile.payment_terms', 'Payment Terms')}
                </p>
                <p className="font-medium">{counterparty.payment_terms} days</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('profile.scoring', 'Scoring')}
                </p>
                {counterparty.scoring != null ? (
                  <div className="flex items-center gap-2">
                    <Progress value={counterparty.scoring} className="h-2 w-20" />
                    <span className="font-medium">{counterparty.scoring}/100</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">-</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Sections */}
      <Card className="rounded-t-none">
        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">
                {t('profile.tab_overview', 'Payment Profile')}
              </TabsTrigger>
              <TabsTrigger value="indexation">
                {t('profile.tab_indexation', 'Rent & Indexation')}
              </TabsTrigger>
              <TabsTrigger value="certainty">
                {t('profile.tab_certainty', 'Certainty')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <PaymentProfileCard
                counterparty={counterparty}
                profile={paymentProfile}
                lease={activeLease}
                coldStart={coldStartProfile}
                isLoading={profileLoading || leasesLoading}
                onUpdateOverrides={(overrides) => updateProfile.mutate(overrides)}
              />
            </TabsContent>

            <TabsContent value="indexation">
              {leaseForIndexation ? (
                <>
                  {leaseContracts.length > 1 && (
                    <div className="mb-4 flex gap-2">
                      {leaseContracts.map((lease) => (
                        <Badge
                          key={lease.id}
                          variant={lease.id === leaseForIndexation.id ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => setSelectedLeaseId(lease.id)}
                        >
                          {lease.lease_reference}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <RentIndexation
                    lease={leaseForIndexation}
                    history={indexationHistory}
                    isLoadingHistory={historyLoading}
                    onApplyIndexation={(leaseId) => applyIndexation.mutate(leaseId)}
                    isApplying={applyIndexation.isPending}
                  />
                </>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>{t('profile.no_lease', 'No lease contract found for this counterparty.')}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="certainty">
              <CertaintyClassification
                classes={certaintyClasses}
                counterpartyCertainties={counterpartyCertainties}
                onUpdateCertainty={(cpId, cls, pct) =>
                  updateCertainty.mutate({
                    counterpartyId: cpId,
                    certaintyClass: cls,
                    forecastPct: pct,
                  })
                }
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
