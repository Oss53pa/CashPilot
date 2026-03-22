import { useState, useCallback, useMemo } from "react";
import {
  Building2,
  FileCheck,
  FileText,
  TrendingUp,
  Landmark,
  Star,
  History,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type {
  SupplierIdentity,
  SupplierReferencing,
  SupplierContract,
  SupplierBankAccount,
  SupplierScorecard,
  SupplierScorecardCriteria,
  SupplierTransaction,
  PaymentProfile,
} from "../types";

import {
  SUPPLIER_CATEGORIES,
  SUPPLIER_STATUSES,
  CRITICALITY_LEVELS,
  SCORECARD_CRITERIA,
  getDefaultIdentity,
  getDefaultReferencing,
  getDefaultContract,
  getDefaultBankAccounts,
  getDefaultPaymentProfile,
  getDefaultScorecards,
  getDefaultTransactions,
} from "./supplier-form-utils";

import { SupplierTabIdentity } from "./supplier-tab-identity";
import { SupplierTabReferencing } from "./supplier-tab-referencing";
import { SupplierTabContract } from "./supplier-tab-contract";
import { SupplierTabBank } from "./supplier-tab-bank";
import { SupplierTabBehavior } from "./supplier-tab-behavior";
import { SupplierTabScorecard } from "./supplier-tab-scorecard";
import { SupplierTabHistory } from "./supplier-tab-history";

// ─── Props ───────────────────────────────────────────────────────────────────

interface SupplierFormFullProps {
  supplierId?: string;
  onSave?: (data: unknown) => void;
  onSaveAndNext?: (data: unknown) => void;
  onGeneratePO?: () => void;
  onEvaluate?: () => void;
  onArchive?: () => void;
  onCancel?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SupplierFormFull({
  supplierId: _supplierId, // eslint-disable-line @typescript-eslint/no-unused-vars
  onSave,
  onSaveAndNext,
  onGeneratePO,
  onEvaluate,
  onArchive,
  onCancel,
}: SupplierFormFullProps) {
  const [activeTab, setActiveTab] = useState("identity");
  const [saving, setSaving] = useState(false);

  // State for all sections
  const [identity, setIdentity] =
    useState<SupplierIdentity>(getDefaultIdentity);
  const [referencing, setReferencing] = useState<SupplierReferencing>(
    getDefaultReferencing,
  );
  const [contract, setContract] =
    useState<SupplierContract>(getDefaultContract);
  const [paymentProfile] = useState<PaymentProfile>(getDefaultPaymentProfile);
  const [bankAccounts, setBankAccounts] = useState<SupplierBankAccount[]>(
    getDefaultBankAccounts,
  );
  const [scorecards, setScorecards] =
    useState<SupplierScorecard[]>(getDefaultScorecards);
  const [transactions] = useState<SupplierTransaction[]>(
    getDefaultTransactions,
  );

  // New scorecard draft
  const [newScorecard, setNewScorecard] = useState<SupplierScorecardCriteria[]>(
    SCORECARD_CRITERIA.map((name) => ({ name, score: 3 })),
  );
  const [newRecommendation, setNewRecommendation] = useState<
    "renew" | "tender" | "terminate"
  >("renew");

  const avgScore = useMemo(() => {
    const total = newScorecard.reduce((sum, c) => sum + c.score, 0);
    return (total / newScorecard.length).toFixed(1);
  }, [newScorecard]);

  const handleSave = useCallback(() => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSave?.({ identity, referencing, contract, bankAccounts, scorecards });
    }, 600);
  }, [identity, referencing, contract, bankAccounts, scorecards, onSave]);

  const handleSaveAndNext = useCallback(() => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSaveAndNext?.({
        identity,
        referencing,
        contract,
        bankAccounts,
        scorecards,
      });
    }, 600);
  }, [
    identity,
    referencing,
    contract,
    bankAccounts,
    scorecards,
    onSaveAndNext,
  ]);

  // ─── Main Render ───────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{identity.legal_name}</h2>
          <div className="flex items-center gap-2 mt-1">
            {identity.trade_name && (
              <span className="text-muted-foreground">
                {identity.trade_name}
              </span>
            )}
            <Badge
              variant={
                SUPPLIER_STATUSES.find((s) => s.value === identity.status)
                  ?.variant ?? "default"
              }
            >
              {
                SUPPLIER_STATUSES.find((s) => s.value === identity.status)
                  ?.label
              }
            </Badge>
            <Badge
              variant="outline"
              className={
                CRITICALITY_LEVELS.find((c) => c.value === identity.criticality)
                  ?.color
              }
            >
              {
                CRITICALITY_LEVELS.find((c) => c.value === identity.criticality)
                  ?.label
              }
            </Badge>
            <Badge variant="outline">
              {
                SUPPLIER_CATEGORIES.find((c) => c.value === identity.category)
                  ?.label
              }
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="identity" className="gap-1">
            <Building2 className="h-3 w-3" />
            Identité
          </TabsTrigger>
          <TabsTrigger value="referencing" className="gap-1">
            <FileCheck className="h-3 w-3" />
            Référencement
          </TabsTrigger>
          <TabsTrigger value="contract" className="gap-1">
            <FileText className="h-3 w-3" />
            Contrat & Conditions
          </TabsTrigger>
          <TabsTrigger value="behavior" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Comportement
          </TabsTrigger>
          <TabsTrigger value="bank" className="gap-1">
            <Landmark className="h-3 w-3" />
            Coordonnées bancaires
          </TabsTrigger>
          <TabsTrigger value="scorecard" className="gap-1">
            <Star className="h-3 w-3" />
            Scorecard
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1">
            <History className="h-3 w-3" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="mt-4">
          <SupplierTabIdentity identity={identity} setIdentity={setIdentity} />
        </TabsContent>
        <TabsContent value="referencing" className="mt-4">
          <SupplierTabReferencing
            referencing={referencing}
            setReferencing={setReferencing}
          />
        </TabsContent>
        <TabsContent value="contract" className="mt-4">
          <SupplierTabContract contract={contract} setContract={setContract} />
        </TabsContent>
        <TabsContent value="behavior" className="mt-4">
          <SupplierTabBehavior paymentProfile={paymentProfile} />
        </TabsContent>
        <TabsContent value="bank" className="mt-4">
          <SupplierTabBank
            bankAccounts={bankAccounts}
            setBankAccounts={setBankAccounts}
            legalName={identity.legal_name}
          />
        </TabsContent>
        <TabsContent value="scorecard" className="mt-4">
          <SupplierTabScorecard
            scorecards={scorecards}
            setScorecards={setScorecards}
            newScorecard={newScorecard}
            setNewScorecard={setNewScorecard}
            newRecommendation={newRecommendation}
            setNewRecommendation={setNewRecommendation}
            avgScore={avgScore}
          />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <SupplierTabHistory transactions={transactions} />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveAndNext}
            disabled={saving}
          >
            Enregistrer et créer suivant
          </Button>
          <Button variant="outline" onClick={onGeneratePO}>
            Générer BC
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEvaluate}>
            Évaluer
          </Button>
          <Button variant="destructive" onClick={onArchive}>
            Archiver
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
