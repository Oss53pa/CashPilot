import { useState, useCallback } from "react";
import {
  Building2,
  FileText,
  FilePlus2,
  BarChart3,
  UserCheck,
  Shield,
  Umbrella,
  Hammer,
  History,
  Scale,
  Save,
  Printer,
  Archive,
  X,
  Banknote,
} from "lucide-react";
import type { Counterparty } from "@/types/database";
import type {
  TenantIdentity,
  LeaseDetails,
  DepositGuarantee,
  TenantInsurance,
} from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useTenantFullProfile,
  useSaveTenantFullProfile,
  usePaymentProfile,
  useUpdatePaymentProfile,
  useLeaseContracts,
  useColdStartProfile,
} from "../hooks/use-counterparties";
import { STATUS_LABELS, STATUS_VARIANTS } from "./tenant-form-utils";

import { TabIdentity } from "./tenant-tab-identity";
import { TabLease } from "./tenant-tab-lease";
import { TabAmendments } from "./tenant-tab-amendments";
import { TabDeclaredRevenue } from "./tenant-tab-revenue";
import { TabBehavior } from "./tenant-tab-behavior";
import { TabDeposits } from "./tenant-tab-deposits";
import { TabInsurance } from "./tenant-tab-insurance";
import { TabWorks } from "./tenant-tab-works";
import { TabHistory } from "./tenant-tab-history";
import { TabDisputes } from "./tenant-tab-disputes";

// ─── Tab Config ──────────────────────────────────────────────────────────────

const TAB_CONFIG = [
  { id: "identity", label: "Identite", icon: Building2 },
  { id: "lease", label: "Bail & Loyers", icon: FileText },
  { id: "amendments", label: "Avenants", icon: FilePlus2 },
  { id: "revenue", label: "CA Declare", icon: BarChart3 },
  { id: "behavior", label: "Comportement", icon: UserCheck },
  { id: "deposits", label: "Depots & Garanties", icon: Shield },
  { id: "insurance", label: "Assurances", icon: Umbrella },
  { id: "works", label: "Travaux", icon: Hammer },
  { id: "history", label: "Historique", icon: History },
  { id: "disputes", label: "Contentieux", icon: Scale },
] as const;

// ─── Props ───────────────────────────────────────────────────────────────────

interface TenantFormFullProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  counterparty: Counterparty;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function TenantFormFull({
  open,
  onOpenChange,
  counterparty,
}: TenantFormFullProps) {
  const [activeTab, setActiveTab] = useState<string>("identity");

  // Fetch full profile
  const { data: profile, isLoading } = useTenantFullProfile(
    counterparty.id,
    counterparty.name,
  );

  // Save mutation
  const saveMutation = useSaveTenantFullProfile(counterparty.id);

  // Payment profile (reuse existing)
  const { data: paymentProfile, isLoading: ppLoading } = usePaymentProfile(
    counterparty.id,
    counterparty.name,
  );
  const updatePaymentProfile = useUpdatePaymentProfile(counterparty.id);
  const { data: leaseContracts = [] } = useLeaseContracts(counterparty.id);
  const { data: coldStart } = useColdStartProfile(
    counterparty.id,
    counterparty.name,
  );

  // Local state for edits
  const [identity, setIdentity] = useState<TenantIdentity | null>(null);
  const [lease, setLease] = useState<LeaseDetails | null>(null);
  const [deposit, setDeposit] = useState<DepositGuarantee | null>(null);
  const [insurance, setInsurance] = useState<TenantInsurance | null>(null);

  // Initialize local state from fetched profile
  const initializeState = useCallback(() => {
    if (profile) {
      if (!identity) setIdentity({ ...profile.identity });
      if (!lease) setLease({ ...profile.lease });
      if (!deposit) setDeposit({ ...profile.deposit_guarantee });
      if (!insurance) setInsurance({ ...profile.insurance });
    }
  }, [profile, identity, lease, deposit, insurance]);

  // Initialize when profile loads
  if (profile && !identity) {
    initializeState();
  }

  const currentIdentity = identity ?? profile?.identity;
  const currentLease = lease ?? profile?.lease;
  const currentDeposit = deposit ?? profile?.deposit_guarantee;
  const currentInsurance = insurance ?? profile?.insurance;

  // Handlers
  function handleSave() {
    if (!profile) return;
    saveMutation.mutate({
      ...profile,
      identity: identity ?? profile.identity,
      lease: lease ?? profile.lease,
      deposit_guarantee: deposit ?? profile.deposit_guarantee,
      insurance: insurance ?? profile.insurance,
    });
  }

  function handleSaveAndNext() {
    handleSave();
    onOpenChange(false);
  }

  function updateIdentityField<K extends keyof TenantIdentity>(
    key: K,
    value: TenantIdentity[K],
  ) {
    setIdentity((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  function updateLeaseField<K extends keyof LeaseDetails>(
    key: K,
    value: LeaseDetails[K],
  ) {
    setLease((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  function updateDepositField<K extends keyof DepositGuarantee>(
    key: K,
    value: DepositGuarantee[K],
  ) {
    setDeposit((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  function updateInsuranceField<K extends keyof TenantInsurance>(
    key: K,
    value: TenantInsurance[K],
  ) {
    setInsurance((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  function toggleTag(tag: string) {
    if (!identity) return;
    const tags = identity.tags.includes(tag)
      ? identity.tags.filter((t) => t !== tag)
      : [...identity.tags, tag];
    setIdentity({ ...identity, tags });
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] h-[92vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">
                Profil Locataire : {counterparty.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentIdentity?.activity_sector ?? "Chargement..."}
                {currentIdentity?.status && (
                  <Badge
                    variant={STATUS_VARIANTS[currentIdentity.status]}
                    className="ml-2"
                  >
                    {STATUS_LABELS[currentIdentity.status]}
                  </Badge>
                )}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body: Tabs */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Chargement du profil...</p>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="border-b px-6 pt-2">
              <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-t-md rounded-b-none px-3 py-2"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6">
                <TabsContent value="identity" className="mt-0">
                  <TabIdentity
                    data={currentIdentity}
                    onUpdate={updateIdentityField}
                    onToggleTag={toggleTag}
                  />
                </TabsContent>
                <TabsContent value="lease" className="mt-0">
                  <TabLease data={currentLease} onUpdate={updateLeaseField} />
                </TabsContent>
                <TabsContent value="amendments" className="mt-0">
                  <TabAmendments amendments={profile?.amendments ?? []} />
                </TabsContent>
                <TabsContent value="revenue" className="mt-0">
                  <TabDeclaredRevenue
                    revenues={profile?.declared_revenues ?? []}
                    hasVariableRent={currentLease?.has_variable_rent ?? false}
                  />
                </TabsContent>
                <TabsContent value="behavior" className="mt-0">
                  <TabBehavior
                    counterparty={counterparty}
                    paymentProfile={paymentProfile}
                    lease={leaseContracts[0]}
                    coldStart={coldStart}
                    isLoading={ppLoading}
                    onUpdateOverrides={(o) => updatePaymentProfile.mutate(o)}
                    installmentPlans={profile?.installment_plans ?? []}
                  />
                </TabsContent>
                <TabsContent value="deposits" className="mt-0">
                  <TabDeposits
                    data={currentDeposit}
                    onUpdate={updateDepositField}
                  />
                </TabsContent>
                <TabsContent value="insurance" className="mt-0">
                  <TabInsurance
                    data={currentInsurance}
                    onUpdate={updateInsuranceField}
                  />
                </TabsContent>
                <TabsContent value="works" className="mt-0">
                  <TabWorks works={profile?.works ?? []} />
                </TabsContent>
                <TabsContent value="history" className="mt-0">
                  <TabHistory entries={profile?.transaction_history ?? []} />
                </TabsContent>
                <TabsContent value="disputes" className="mt-0">
                  <TabDisputes disputes={profile?.disputes ?? []} />
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        )}

        {/* Footer */}
        <div className="border-t px-6 py-3 flex items-center justify-between bg-muted/30">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Annuler
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Imprimer
            </Button>
            <Button variant="outline" size="sm">
              <Archive className="mr-1.5 h-3.5 w-3.5" />
              Archiver
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Banknote className="mr-1.5 h-3.5 w-3.5" />
              Generer relance
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSaveAndNext}
              disabled={saveMutation.isPending}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Enregistrer et creer suivant
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
