import { useState, useMemo } from "react";
import {
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileUpload } from "@/components/shared/file-upload";
import { cn } from "@/lib/utils";

import * as XLSX from "xlsx";

// ============================================================================
// TYPES
// ============================================================================

type FlowType = "receipt" | "disbursement" | "payroll" | "tax" | "loan";

interface ParsedInvoice {
  row: number;
  date: string;
  counterparty: string;
  reference: string;
  description: string;
  amount_ht: number;
  tva_rate: number;
  tva_amount: number;
  amount_ttc: number;
  category: string;
  due_date: string;
  account: string;
  status: "valid" | "warning" | "error";
  error?: string;
}

interface BulkImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: FlowType;
}

// ============================================================================
// TEMPLATE GENERATOR
// ============================================================================

const TYPE_LABELS: Record<FlowType, string> = {
  receipt: "Factures de vente (encaissements)",
  disbursement: "Factures d'achat (decaissements)",
  payroll: "Salaires et charges sociales",
  tax: "Taxes et impots",
  loan: "Echeances d'emprunts",
};

function downloadInvoiceTemplate(type: FlowType) {
  const wb = XLSX.utils.book_new();

  if (type === "payroll") {
    const data = [
      ["CASHPILOT — Template Import Salaires et Charges Sociales"],
      [
        "Instructions : une ligne par employe ou par poste de charge. Montants en FCFA.",
      ],
      [""],
      [
        "Nom employe / Poste",
        "Matricule",
        "Salaire brut",
        "Charges patronales",
        "Net a payer",
        "Date paiement",
        "Compte bancaire",
        "Observations",
      ],
      [
        "Kouame Jean",
        "EMP-001",
        850000,
        212500,
        680000,
        "25/03/2026",
        "SGBCI",
        "",
      ],
      [
        "Traore Aminata",
        "EMP-002",
        1200000,
        300000,
        960000,
        "25/03/2026",
        "SGBCI",
        "",
      ],
      [
        "Diallo Moussa",
        "EMP-003",
        750000,
        187500,
        600000,
        "25/03/2026",
        "SGBCI",
        "",
      ],
      [
        "Kone Awa",
        "EMP-004",
        950000,
        237500,
        760000,
        "25/03/2026",
        "SGBCI",
        "",
      ],
      [
        "Ouattara Ibrahim",
        "EMP-005",
        1500000,
        375000,
        1200000,
        "25/03/2026",
        "SGBCI",
        "Directeur adjoint",
      ],
      [
        "CNPS Cotisations",
        "CNPS-MARS",
        0,
        1312500,
        1312500,
        "31/03/2026",
        "SGBCI",
        "Charges sociales globales",
      ],
      [
        "Primes annuelles",
        "PRIME-Q1",
        2500000,
        625000,
        2000000,
        "25/03/2026",
        "SGBCI",
        "Prime T1 2026",
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [22, 12, 14, 16, 14, 14, 14, 20].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, "Salaires");
    XLSX.writeFile(wb, "CashPilot_Template_Salaires.xlsx");
    return;
  }

  if (type === "tax") {
    const data = [
      ["CASHPILOT — Template Import Taxes et Impots"],
      ["Instructions : une ligne par echeance fiscale. Montants en FCFA."],
      [""],
      [
        "Type taxe",
        "Periode",
        "Montant",
        "Date echeance",
        "Date paiement prevue",
        "Reference declaration",
        "Compte bancaire",
        "Statut",
        "Observations",
      ],
      [
        "TVA",
        "Fevrier 2026",
        7200000,
        "15/03/2026",
        "14/03/2026",
        "DGI-TVA-2026-02",
        "SGBCI",
        "paye",
        "",
      ],
      [
        "TVA",
        "Mars 2026",
        7800000,
        "15/04/2026",
        "14/04/2026",
        "DGI-TVA-2026-03",
        "SGBCI",
        "a_payer",
        "",
      ],
      [
        "CNPS",
        "Mars 2026",
        4200000,
        "31/03/2026",
        "30/03/2026",
        "CNPS-2026-03",
        "SGBCI",
        "a_payer",
        "",
      ],
      [
        "Acompte IS",
        "T1 2026",
        8200000,
        "15/03/2026",
        "14/03/2026",
        "IS-ACO-2026-T1",
        "SGBCI",
        "paye",
        "",
      ],
      [
        "Patente",
        "2026",
        2400000,
        "31/03/2026",
        "",
        "PAT-2026",
        "SGBCI",
        "en_retard",
        "Regulariser avant 30/04",
      ],
      [
        "Taxe fonciere",
        "2026",
        1800000,
        "30/06/2026",
        "",
        "TF-2026",
        "UBA",
        "a_payer",
        "",
      ],
      [
        "Retenue source",
        "Mars 2026",
        1500000,
        "15/04/2026",
        "",
        "RS-2026-03",
        "SGBCI",
        "a_payer",
        "Prestataires et honoraires",
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [16, 14, 14, 14, 18, 20, 14, 12, 24].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, "Taxes");
    XLSX.writeFile(wb, "CashPilot_Template_Taxes_Impots.xlsx");
    return;
  }

  if (type === "loan") {
    const data = [
      ["CASHPILOT — Template Import Echeances d'Emprunts"],
      ["Instructions : une ligne par echeance. Montants en FCFA."],
      [""],
      [
        "Banque / Preteur",
        "Reference contrat",
        "Date echeance",
        "Capital rembourse",
        "Interets",
        "Total echeance",
        "Capital restant du",
        "Compte bancaire",
        "Observations",
      ],
      [
        "SGBCI",
        "EMP-SGBCI-2023-001",
        "01/04/2026",
        4245000,
        5605000,
        9850000,
        683155000,
        "SGBCI",
        "",
      ],
      [
        "SGBCI",
        "EMP-SGBCI-2023-001",
        "01/05/2026",
        4271000,
        5579000,
        9850000,
        678884000,
        "SGBCI",
        "",
      ],
      [
        "SGBCI",
        "EMP-SGBCI-2023-001",
        "01/06/2026",
        4298000,
        5552000,
        9850000,
        674586000,
        "SGBCI",
        "",
      ],
      [
        "BOA",
        "EMP-BOA-2024-003",
        "15/04/2026",
        2100000,
        1400000,
        3500000,
        42000000,
        "BOA",
        "Credit court terme",
      ],
      [
        "BOA",
        "EMP-BOA-2024-003",
        "15/05/2026",
        2100000,
        1350000,
        3450000,
        39900000,
        "BOA",
        "",
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [18, 22, 14, 16, 14, 14, 18, 14, 20].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, "Echeances emprunts");
    XLSX.writeFile(wb, "CashPilot_Template_Echeances_Emprunts.xlsx");
    return;
  }

  const instructions = [
    `CASHPILOT — Template Import ${type === "receipt" ? "Factures de Vente (Encaissements)" : "Factures d'Achat (Decaissements)"}`,
    "Instructions :",
    "1. Remplissez une ligne par facture",
    "2. Montants en FCFA (pas en centimes)",
    "3. Format date : JJ/MM/AAAA",
    "4. Le montant TTC est calcule automatiquement si vide (HT + TVA)",
    "5. Supprimez les lignes d'exemple avant d'importer",
    "",
  ];

  const headers = [
    "Date facture",
    "Contrepartie",
    "N° Facture",
    "Description",
    "Montant HT",
    "Taux TVA (%)",
    "Montant TVA",
    "Montant TTC",
    "Categorie",
    "Date echeance",
    "Compte bancaire",
  ];

  const sampleRows =
    type === "receipt"
      ? [
          [
            "01/03/2026",
            "ZARA CI",
            "FAC-V-2026-001",
            "Loyer mars 2026",
            2100000,
            18,
            378000,
            2478000,
            "Loyer",
            "01/03/2026",
            "BICICI Loyers",
          ],
          [
            "01/03/2026",
            "CARREFOUR Market",
            "FAC-V-2026-002",
            "Loyer mars 2026",
            3800000,
            18,
            684000,
            4484000,
            "Loyer",
            "01/03/2026",
            "BICICI Loyers",
          ],
          [
            "01/03/2026",
            "Orange CI",
            "FAC-V-2026-003",
            "Loyer mars 2026",
            4200000,
            18,
            756000,
            4956000,
            "Loyer",
            "01/03/2026",
            "BICICI Loyers",
          ],
          [
            "01/03/2026",
            "Banque Atlantique",
            "FAC-V-2026-004",
            "Loyer mars 2026",
            5500000,
            18,
            990000,
            6490000,
            "Loyer",
            "01/03/2026",
            "BICICI Loyers",
          ],
          [
            "01/03/2026",
            "ZARA CI",
            "FAC-V-2026-005",
            "Charges mars 2026",
            350000,
            18,
            63000,
            413000,
            "Charges locatives",
            "01/03/2026",
            "BICICI Loyers",
          ],
          [
            "05/03/2026",
            "Parking Public",
            "FAC-V-2026-010",
            "Parking mars",
            800000,
            18,
            144000,
            944000,
            "Revenus annexes",
            "05/03/2026",
            "SGBCI",
          ],
        ]
      : [
          [
            "28/02/2026",
            "Prestataire Securite",
            "FAC-A-2026-001",
            "Gardiennage fevrier",
            4200000,
            18,
            756000,
            4956000,
            "Securite",
            "30/03/2026",
            "SGBCI",
          ],
          [
            "01/03/2026",
            "CIE",
            "CIE-2026-03",
            "Electricite fevrier",
            2800000,
            18,
            504000,
            3304000,
            "Energie",
            "20/03/2026",
            "SGBCI",
          ],
          [
            "01/03/2026",
            "SODECI",
            "SOD-2026-03",
            "Eau fevrier",
            1100000,
            18,
            198000,
            1298000,
            "Energie",
            "20/03/2026",
            "SGBCI",
          ],
          [
            "05/03/2026",
            "Nettoyage Pro",
            "NP-2026-03",
            "Nettoyage mars",
            1800000,
            18,
            324000,
            2124000,
            "Nettoyage",
            "04/04/2026",
            "SGBCI",
          ],
          [
            "10/03/2026",
            "Cabinet Conseil X",
            "CC-2026-03",
            "Honoraires mars",
            3500000,
            18,
            630000,
            4130000,
            "Honoraires",
            "09/04/2026",
            "SGBCI",
          ],
          [
            "15/03/2026",
            "Assurance AXA",
            "AXA-2026-T1",
            "Prime Q1 2026",
            8400000,
            0,
            0,
            8400000,
            "Assurances",
            "15/03/2026",
            "UBA",
          ],
        ];

  const data = [...instructions.map((i) => [i]), headers, ...sampleRows];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [14, 22, 18, 28, 14, 12, 14, 14, 18, 14, 18].map((w) => ({
    wch: w,
  }));
  XLSX.utils.book_append_sheet(
    wb,
    ws,
    type === "receipt" ? "Factures vente" : "Factures achat",
  );

  // Categories sheet
  const cats =
    type === "receipt"
      ? [
          ["Loyer"],
          ["Charges locatives"],
          ["Revenus annexes"],
          ["Pas de porte"],
          ["Parking"],
          ["Indemnites"],
          ["Autres revenus"],
        ]
      : [
          ["Securite"],
          ["Energie"],
          ["Nettoyage"],
          ["Maintenance"],
          ["Honoraires"],
          ["Assurances"],
          ["Marketing"],
          ["Frais generaux"],
          ["CAPEX"],
          ["Salaires"],
          ["Taxes"],
        ];

  const catWs = XLSX.utils.aoa_to_sheet([["Categories disponibles"], ...cats]);
  XLSX.utils.book_append_sheet(wb, catWs, "Categories");

  XLSX.writeFile(
    wb,
    `CashPilot_Template_${type === "receipt" ? "Factures_Vente" : "Factures_Achat"}.xlsx`,
  );
}

// ============================================================================
// PARSER
// ============================================================================

function parseExcelInvoices(file: File): Promise<ParsedInvoice[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          header: 1,
        });

        // Find header row (first row with "Date" or "Contrepartie")
        let headerIdx = -1;
        for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
          const row = rawRows[i] as unknown as unknown[];
          if (
            row?.some(
              (cell) =>
                String(cell || "")
                  .toLowerCase()
                  .includes("date") ||
                String(cell || "")
                  .toLowerCase()
                  .includes("contrepartie"),
            )
          ) {
            headerIdx = i;
            break;
          }
        }
        if (headerIdx === -1) headerIdx = 0;

        const invoices: ParsedInvoice[] = [];
        const dataRows = rawRows.slice(headerIdx + 1);

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i] as unknown as unknown[];
          if (!row || row.length < 5) continue;

          // Skip empty rows
          const hasContent = row.some(
            (cell) => cell != null && String(cell).trim() !== "",
          );
          if (!hasContent) continue;

          const dateRaw = String(row[0] || "");
          const counterparty = String(row[1] || "").trim();
          const reference = String(row[2] || "").trim();
          const description = String(row[3] || "").trim();
          const amountHT =
            parseFloat(
              String(row[4] || "0")
                .replace(/\s/g, "")
                .replace(",", "."),
            ) || 0;
          const tvaRate =
            parseFloat(String(row[5] || "18").replace(",", ".")) || 0;
          const tvaAmount =
            parseFloat(
              String(row[6] || "0")
                .replace(/\s/g, "")
                .replace(",", "."),
            ) || Math.round((amountHT * tvaRate) / 100);
          const amountTTC =
            parseFloat(
              String(row[7] || "0")
                .replace(/\s/g, "")
                .replace(",", "."),
            ) || amountHT + tvaAmount;
          const category = String(row[8] || "").trim();
          const dueDate = String(row[9] || dateRaw).trim();
          const account = String(row[10] || "").trim();

          // Parse date
          let isoDate = "";
          if (typeof row[0] === "number") {
            // Excel serial number
            const d = XLSX.SSF.parse_date_code(row[0] as number);
            isoDate = `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
          } else {
            const parts = dateRaw.split(/[/\-.]/);
            if (parts.length >= 3) {
              isoDate = `${parts[2].length === 2 ? "20" + parts[2] : parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
            }
          }

          // Validate
          let status: ParsedInvoice["status"] = "valid";
          let error: string | undefined;

          if (!isoDate) {
            status = "error";
            error = "Date invalide";
          } else if (!counterparty) {
            status = "error";
            error = "Contrepartie manquante";
          } else if (amountHT <= 0 && amountTTC <= 0) {
            status = "error";
            error = "Montant invalide";
          } else if (!category) {
            status = "warning";
            error = 'Categorie manquante (sera classee "Autre")';
          }

          invoices.push({
            row: headerIdx + i + 2,
            date: isoDate,
            counterparty,
            reference,
            description,
            amount_ht: Math.round(amountHT * 100),
            tva_rate: tvaRate,
            tva_amount: Math.round(tvaAmount * 100),
            amount_ttc: Math.round(amountTTC * 100),
            category: category || "Autre",
            due_date: dueDate,
            account,
            status,
            error,
          });
        }

        resolve(invoices);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BulkImport({
  open,
  onOpenChange,
  defaultType = "receipt",
}: BulkImportProps) {
  const [flowType, setFlowType] = useState<FlowType>(defaultType);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [invoices, setInvoices] = useState<ParsedInvoice[]>([]);
  const [importing, setImporting] = useState(false);

  const stats = useMemo(() => {
    const valid = invoices.filter((i) => i.status === "valid").length;
    const warnings = invoices.filter((i) => i.status === "warning").length;
    const errors = invoices.filter((i) => i.status === "error").length;
    const totalHT = invoices
      .filter((i) => i.status !== "error")
      .reduce((s, i) => s + i.amount_ht, 0);
    const totalTVA = invoices
      .filter((i) => i.status !== "error")
      .reduce((s, i) => s + i.tva_amount, 0);
    const totalTTC = invoices
      .filter((i) => i.status !== "error")
      .reduce((s, i) => s + i.amount_ttc, 0);
    return {
      valid,
      warnings,
      errors,
      total: invoices.length,
      totalHT,
      totalTVA,
      totalTTC,
    };
  }, [invoices]);

  const handleFileUpload = async (f: File) => {
    setFile(f);
    try {
      const parsed = await parseExcelInvoices(f);
      setInvoices(parsed);
      setStep("preview");
    } catch (err) {
      console.error("Parse error:", err);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    // Simulate import delay — in production, this calls supabase to insert cash_flows
    await new Promise((r) => setTimeout(r, 1500));
    setImporting(false);
    setStep("result");
  };

  const handleReset = () => {
    setFile(null);
    setInvoices([]);
    setStep("upload");
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  function fmtFCFA(centimes: number) {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
      centimes / 100,
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import en masse — {TYPE_LABELS[flowType]}
          </DialogTitle>
        </DialogHeader>

        {/* ============ STEP 1: UPLOAD ============ */}
        {step === "upload" && (
          <div className="space-y-4">
            {/* Type selector */}
            <div className="space-y-2">
              <Label>Type d'import</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={flowType === "receipt" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFlowType("receipt")}
                >
                  <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />
                  Factures vente
                </Button>
                <Button
                  variant={flowType === "disbursement" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFlowType("disbursement")}
                >
                  <ArrowUpFromLine className="h-3.5 w-3.5 mr-1.5" />
                  Factures achat
                </Button>
                <Button
                  variant={flowType === "payroll" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFlowType("payroll")}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                  Salaires
                </Button>
                <Button
                  variant={flowType === "tax" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFlowType("tax")}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                  Taxes / Impots
                </Button>
                <Button
                  variant={flowType === "loan" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFlowType("loan")}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                  Echeances emprunts
                </Button>
              </div>
            </div>

            {/* Template download */}
            <Card className="bg-blue-50/50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      1. Telechargez le modele
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Remplissez vos donnees dans le template Excel —{" "}
                      {TYPE_LABELS[flowType]}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadInvoiceTemplate(flowType)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Telecharger
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* File upload */}
            <div>
              <p className="text-sm font-medium mb-2">
                2. Importez votre fichier rempli
              </p>
              <FileUpload
                accept=".xlsx,.xls,.csv"
                maxSize={10 * 1024 * 1024}
                onUpload={handleFileUpload}
                label="Deposez votre fichier de factures ici"
              />
            </div>
          </div>
        )}

        {/* ============ STEP 2: PREVIEW ============ */}
        {step === "preview" && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Factures lues
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {stats.valid}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Valides</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.warnings}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Avertissements
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {stats.errors}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Erreurs</p>
                </CardContent>
              </Card>
            </div>

            {/* Totals */}
            <div className="flex items-center gap-4 text-sm bg-muted/30 rounded-lg p-3">
              <div>
                <span className="text-muted-foreground">Total HT : </span>
                <span className="font-bold">{fmtFCFA(stats.totalHT)} FCFA</span>
              </div>
              <div>
                <span className="text-muted-foreground">TVA : </span>
                <span className="font-medium">
                  {fmtFCFA(stats.totalTVA)} FCFA
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Total TTC : </span>
                <span className="font-bold">
                  {fmtFCFA(stats.totalTTC)} FCFA
                </span>
              </div>
              <Badge variant="outline" className="ml-auto text-xs">
                {file?.name}
              </Badge>
            </div>

            {/* Preview table */}
            <div className="rounded-md border max-h-[350px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Contrepartie</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">HT</TableHead>
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">TTC</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow
                      key={inv.row}
                      className={cn(
                        "text-xs",
                        inv.status === "error" && "bg-red-50 text-red-700",
                        inv.status === "warning" && "bg-yellow-50",
                      )}
                    >
                      <TableCell className="text-muted-foreground">
                        {inv.row}
                      </TableCell>
                      <TableCell>{inv.date}</TableCell>
                      <TableCell className="font-medium max-w-[120px] truncate">
                        {inv.counterparty}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.reference}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {inv.description}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtFCFA(inv.amount_ht)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {fmtFCFA(inv.tva_amount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {fmtFCFA(inv.amount_ttc)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px]">
                          {inv.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {inv.status === "valid" && (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                        )}
                        {inv.status === "warning" && (
                          <span title={inv.error}>
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto" />
                          </span>
                        )}
                        {inv.status === "error" && (
                          <span title={inv.error}>
                            <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Error summary */}
            {stats.errors > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-xs font-medium text-red-800 mb-1">
                  {stats.errors} ligne(s) en erreur — elles seront ignorees a
                  l'import :
                </p>
                {invoices
                  .filter((i) => i.status === "error")
                  .slice(0, 5)
                  .map((i) => (
                    <p key={i.row} className="text-xs text-red-600">
                      Ligne {i.row} : {i.error}
                    </p>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ============ STEP 3: RESULT ============ */}
        {step === "result" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Import termine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-green-50">
                  <p className="text-2xl font-bold text-green-600">
                    {stats.valid + stats.warnings}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Factures importees
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-50">
                  <p className="text-2xl font-bold text-red-600">
                    {stats.errors}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ignorees (erreurs)
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <p className="text-2xl font-bold text-blue-600">
                    {fmtFCFA(stats.totalTTC)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total TTC importe
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Les donnees importees apparaissent dans les flux de tresorerie
                et dans les previsions Proph3t. Les echeances sont integrees
                dans le calendrier de tresorerie.
              </p>
            </CardContent>
          </Card>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Retour
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || stats.valid + stats.warnings === 0}
              >
                {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importer {stats.valid + stats.warnings} ligne(s)
              </Button>
            </>
          )}
          {step === "result" && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Importer un autre fichier
              </Button>
              <Button onClick={handleClose}>Fermer</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
