import * as XLSX from 'xlsx';

// ============================================================================
// Import Template Generator — Downloadable Excel templates for all imports
// ============================================================================

interface TemplateSheet {
  name: string;
  headers: string[];
  sampleRows: (string | number)[][];
  instructions?: string[];
  columnWidths?: number[];
}

function generateTemplate(fileName: string, sheets: TemplateSheet[]) {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    // Build data array: instructions + headers + sample rows
    const data: (string | number)[][] = [];

    // Instructions rows (if any)
    if (sheet.instructions) {
      for (const instruction of sheet.instructions) {
        data.push([instruction]);
      }
      data.push([]); // blank row
    }

    // Headers
    data.push(sheet.headers);

    // Sample data
    for (const row of sheet.sampleRows) {
      data.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    if (sheet.columnWidths) {
      ws['!cols'] = sheet.columnWidths.map(w => ({ wch: w }));
    } else {
      ws['!cols'] = sheet.headers.map(h => ({ wch: Math.max(h.length + 4, 15) }));
    }

    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }

  XLSX.writeFile(wb, fileName);
}

// ============================================================================
// TEMPLATE 1: Budget Annual Import
// ============================================================================

export function downloadBudgetTemplate() {
  generateTemplate('CashPilot_Template_Budget_Annuel.xlsx', [
    {
      name: 'Budget',
      instructions: [
        'CASHPILOT — Template Import Budget Annuel',
        'Instructions :',
        '1. Remplissez chaque ligne avec le code categorie, le libelle, le type (recette/depense) et les montants mensuels en FCFA',
        '2. Les montants sont en FCFA (pas en centimes) — le systeme convertit automatiquement',
        '3. Utilisez les codes categorie fournis ou creez les votres',
        '4. Ne modifiez pas la ligne d\'en-tete (ligne 7)',
        '5. Supprimez les lignes d\'exemple avant d\'importer',
      ],
      headers: ['Code', 'Categorie', 'Sous-categorie', 'Type', 'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre', 'Hypothese'],
      sampleRows: [
        ['REV-01', 'Loyers bureaux', '', 'recette', 21_700_000, 21_700_000, 21_700_000, 21_700_000, 21_700_000, 21_700_000, 21_700_000, 21_700_000, 21_700_000, 21_700_000, 21_700_000, 21_700_000, 'Taux occupation 97%'],
        ['REV-02', 'Charges locatives', '', 'recette', 8_500_000, 8_500_000, 8_500_000, 8_500_000, 8_500_000, 8_500_000, 8_500_000, 8_500_000, 8_500_000, 8_500_000, 8_500_000, 8_500_000, 'Provision charges'],
        ['REV-03', 'Revenus annexes', 'Parking', 'recette', 2_800_000, 2_800_000, 2_800_000, 2_800_000, 2_800_000, 2_800_000, 2_800_000, 2_800_000, 2_800_000, 2_800_000, 2_800_000, 4_500_000, 'Pic decembre'],
        ['OPX-01', 'Salaires', '', 'depense', 12_300_000, 12_300_000, 12_300_000, 12_300_000, 12_300_000, 12_300_000, 12_300_000, 12_300_000, 12_300_000, 12_300_000, 12_300_000, 12_300_000, 'Effectif stable'],
        ['OPX-02', 'Maintenance', 'Contrats fixes', 'depense', 4_800_000, 4_800_000, 4_800_000, 4_800_000, 4_800_000, 4_800_000, 4_800_000, 4_800_000, 4_800_000, 4_800_000, 4_800_000, 4_800_000, ''],
        ['OPX-03', 'Energie', '', 'depense', 2_800_000, 2_900_000, 3_200_000, 3_500_000, 3_800_000, 4_200_000, 4_500_000, 4_300_000, 3_800_000, 3_200_000, 2_900_000, 2_800_000, 'Saisonnalite energie'],
        ['CPX-01', 'CAPEX', 'Renovation facade', 'depense', 0, 0, 0, 15_000_000, 15_000_000, 12_500_000, 0, 0, 0, 0, 0, 0, 'Travaux T2 2026'],
        ['RMB-01', 'Remboursement emprunt', 'SGBCI', 'depense', 9_850_000, 9_850_000, 9_850_000, 9_850_000, 9_850_000, 9_850_000, 9_850_000, 9_850_000, 9_850_000, 9_850_000, 9_850_000, 9_850_000, 'Echeance fixe'],
      ],
      columnWidths: [10, 22, 18, 10, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 25],
    },
    {
      name: 'Categories',
      instructions: ['Liste des codes categorie CashPilot'],
      headers: ['Code', 'Libelle', 'Type', 'Description'],
      sampleRows: [
        ['REV-01', 'Loyers bureaux', 'recette', 'Loyers fixes mensuels'],
        ['REV-02', 'Loyers commerces', 'recette', 'Loyers commerciaux'],
        ['REV-03', 'Charges recuperables', 'recette', 'Provisions de charges locataires'],
        ['REV-04', 'Parking & stockage', 'recette', 'Revenus parking et espaces de stockage'],
        ['REV-05', 'Revenus annexes', 'recette', 'Affichage, evenements, kiosques'],
        ['REV-06', 'Indemnites recues', 'recette', 'Penalites et indemnites percues'],
        ['OPX-01', 'Salaires', 'depense', 'Salaires bruts + charges patronales'],
        ['OPX-02', 'Maintenance', 'depense', 'Contrats maintenance + curatif'],
        ['OPX-03', 'Energie', 'depense', 'Electricite + eau + carburant'],
        ['OPX-04', 'Securite', 'depense', 'Securite et gardiennage'],
        ['OPX-05', 'Nettoyage', 'depense', 'Nettoyage et hygiene'],
        ['OPX-06', 'Assurances', 'depense', 'Toutes polices'],
        ['OPX-07', 'Honoraires', 'depense', 'Conseil, juridique, comptable'],
        ['OPX-08', 'Marketing', 'depense', 'Communication et marketing'],
        ['OPX-09', 'Frais generaux', 'depense', 'Administratif, fournitures, telecom'],
        ['OPX-10', 'Taxes exploitation', 'depense', 'Patente, taxe fonciere'],
        ['FIN-01', 'Interets emprunts', 'depense', 'Interets sur emprunts bancaires'],
        ['FIN-02', 'Frais bancaires', 'depense', 'Commissions et frais'],
        ['CPX-01', 'CAPEX', 'depense', 'Investissements immobiliers'],
        ['RMB-01', 'Remboursement emprunts', 'depense', 'Capital rembourse'],
      ],
    },
  ]);
}

// ============================================================================
// TEMPLATE 2: Balance d'Ouverture — Creances
// ============================================================================

export function downloadReceivablesTemplate() {
  generateTemplate('CashPilot_Template_Creances_Ouverture.xlsx', [
    {
      name: 'Creances',
      instructions: [
        'CASHPILOT — Template Import Creances Anterieures',
        'Instructions :',
        '1. Une ligne par creance non encore encaissee a la date de demarrage',
        '2. Montants en FCFA',
        '3. Probabilite en % (0 a 100)',
        '4. Statut : normal / en_retard / litigieux / contentieux / irrecouvrable',
      ],
      headers: ['Contrepartie', 'Nature', 'Periode', 'Montant brut', 'Montant recouvrable', 'Statut', 'Date encaissement probable', 'Probabilite (%)', 'Observations'],
      sampleRows: [
        ['ZARA CI', 'Loyer', 'Janvier 2026', 2_478_000, 2_478_000, 'normal', '2026-02-12', 94, ''],
        ['CARREFOUR Market', 'Loyer', 'Decembre 2025', 4_484_000, 4_484_000, 'en_retard', '2026-02-20', 85, 'Relance envoyee'],
        ['MY PLACE', 'Loyer', 'Oct-Dec 2025', 24_800_000, 0, 'contentieux', '', 0, 'Dossier CONT-2026-003'],
      ],
      columnWidths: [20, 12, 16, 16, 18, 14, 22, 14, 30],
    },
  ]);
}

// ============================================================================
// TEMPLATE 3: Balance d'Ouverture — Dettes
// ============================================================================

export function downloadPayablesTemplate() {
  generateTemplate('CashPilot_Template_Dettes_Ouverture.xlsx', [
    {
      name: 'Dettes',
      instructions: [
        'CASHPILOT — Template Import Dettes Anterieures',
        '1. Une ligne par dette non encore payee a la date de demarrage',
        '2. Montants en FCFA',
        '3. Statut : a_payer / en_retard / litigieux',
      ],
      headers: ['Contrepartie', 'Nature', 'Montant du', 'Date echeance', 'Date paiement prevue', 'Statut', 'Compte decaissement', 'Observations'],
      sampleRows: [
        ['Prestataire Securite', 'Maintenance', 4_200_000, '2026-01-31', '2026-02-28', 'a_payer', 'SGBCI', ''],
        ['CIE', 'Energie', 3_500_000, '2026-01-20', '2026-02-15', 'en_retard', 'SGBCI', 'Facture en attente'],
      ],
      columnWidths: [22, 14, 14, 16, 18, 12, 16, 30],
    },
  ]);
}

// ============================================================================
// TEMPLATE 4: Locataires
// ============================================================================

export function downloadTenantsTemplate() {
  generateTemplate('CashPilot_Template_Locataires.xlsx', [
    {
      name: 'Locataires',
      instructions: [
        'CASHPILOT — Template Import Locataires',
        '1. Une ligne par locataire actif',
        '2. Montants en FCFA HT',
        '3. Taux indexation en % (ex: 3 pour 3%)',
      ],
      headers: ['Raison sociale', 'Secteur activite', 'Zone', 'Local', 'Surface (m2)', 'Debut bail', 'Fin bail', 'Loyer mensuel HT', 'Charges mensuelles HT', 'Jour echeance', 'Depot garantie', 'Taux indexation (%)', 'Date indexation', 'Contact', 'Email', 'Telephone'],
      sampleRows: [
        ['ZARA CI', 'Mode', 'Zone A', 'A-01', 250, '2024-01-01', '2029-12-31', 2_100_000, 350_000, 1, 6_300_000, 3, '01/01', 'M. Dupont', 'contact@zara-ci.com', '+225 XX XX XX XX'],
        ['CARREFOUR Market', 'Grande distribution', 'Zone A', 'A-05', 800, '2023-06-01', '2028-05-31', 3_800_000, 620_000, 1, 11_400_000, 3, '01/06', 'Mme Konan', 'gestion@carrefour-ci.com', '+225 XX XX XX XX'],
        ['Orange CI', 'Telecom', 'Zone B', 'B-03', 120, '2023-01-01', '2028-12-31', 4_200_000, 500_000, 1, 12_600_000, 3.5, '01/01', 'M. Traore', 'immo@orange.ci', '+225 XX XX XX XX'],
      ],
      columnWidths: [20, 18, 10, 8, 12, 12, 12, 16, 18, 13, 14, 16, 14, 14, 24, 18],
    },
  ]);
}

// ============================================================================
// TEMPLATE 5: Fournisseurs
// ============================================================================

export function downloadSuppliersTemplate() {
  generateTemplate('CashPilot_Template_Fournisseurs.xlsx', [
    {
      name: 'Fournisseurs',
      instructions: [
        'CASHPILOT — Template Import Fournisseurs',
        '1. Une ligne par fournisseur actif',
        '2. Delai de paiement en jours',
      ],
      headers: ['Raison sociale', 'Categorie', 'Montant mensuel HT', 'Delai paiement (jours)', 'Base calcul delai', 'IBAN', 'Banque', 'Contact', 'Email', 'Telephone', 'Numero contrat'],
      sampleRows: [
        ['Prestataire Securite', 'Securite', 4_200_000, 30, 'Fin de mois', 'CI08XXXXXXXXXXXX', 'SGBCI', 'M. Kouame', 'comptabilite@securite.ci', '+225 XX XX XX XX', 'CTR-2024-001'],
        ['CIE Cote d\'Ivoire', 'Energie', 3_100_000, 20, 'Reception facture', '', 'CIE', 'Service Grands Comptes', 'gc@cie.ci', '+225 XX XX XX XX', ''],
        ['Cabinet Conseil X', 'Honoraires', 3_500_000, 30, 'Reception facture', 'CI08XXXXXXXXXXXX', 'BOA', 'Me Bamba', 'contact@cabinetx.ci', '+225 XX XX XX XX', 'CTR-2025-012'],
      ],
      columnWidths: [22, 14, 18, 20, 18, 22, 12, 14, 24, 18, 16],
    },
  ]);
}

// ============================================================================
// TEMPLATE 6: Releve bancaire CSV generique
// ============================================================================

export function downloadBankStatementTemplate() {
  generateTemplate('CashPilot_Template_Releve_Bancaire.xlsx', [
    {
      name: 'Releve',
      instructions: [
        'CASHPILOT — Template Import Releve Bancaire (format CSV/Excel)',
        'Instructions :',
        '1. Si votre banque fournit un releve MT940 ou CAMT.053, utilisez directement ce fichier',
        '2. Sinon, collez vos donnees dans ce format ou exportez votre releve au format CSV',
        '3. Les montants positifs = entrees (credits), negatifs = sorties (debits)',
        '4. Format date : JJ/MM/AAAA',
        '5. Le solde apres operation est optionnel mais aide a la verification',
      ],
      headers: ['Date operation', 'Date valeur', 'Libelle / Description', 'Reference', 'Contrepartie', 'Montant', 'Solde apres'],
      sampleRows: [
        ['01/03/2026', '01/03/2026', 'VIR LOYER MARS ZARA CI', 'VIR-20260301-001', 'ZARA CI', 2_478_000, 45_478_000],
        ['03/03/2026', '03/03/2026', 'PRLV SODECI EAU FEV', 'PRLV-20260303-001', 'SODECI', -1_100_000, 44_378_000],
        ['05/03/2026', '06/03/2026', 'VIR LOYER MARS ORANGE CI', 'VIR-20260305-002', 'ORANGE CI', 4_956_000, 49_334_000],
        ['10/03/2026', '10/03/2026', 'VIREMENT DIVERS', '', '', 2_000_000, 51_334_000],
        ['15/03/2026', '15/03/2026', 'CHQ 0012345', 'CHQ-0012345', 'FOURNISSEUR XYZ', -3_500_000, 47_834_000],
        ['25/03/2026', '25/03/2026', 'VIR SALAIRES MARS', 'SAL-MARS-2026', 'PAIE', -28_400_000, 19_434_000],
      ],
      columnWidths: [16, 14, 35, 22, 20, 14, 14],
    },
    {
      name: 'Formats supportes',
      instructions: ['CashPilot supporte les formats suivants :'],
      headers: ['Format', 'Extension', 'Banques concernees', 'Description'],
      sampleRows: [
        ['MT940 (SWIFT)', '.sta, .mt940, .txt', 'SGBCI, ECOBANK, UBA, BNI, SIB', 'Format standard international — recommande'],
        ['CAMT.053 (ISO 20022)', '.xml', 'Banques internationales', 'Format XML ISO — releve de compte'],
        ['CSV', '.csv', 'Toutes banques', 'Export CSV — configurez le separateur et les colonnes dans CashPilot'],
        ['Excel', '.xlsx, .xls', 'Toutes banques', 'Copiez votre releve dans ce template'],
      ],
    },
  ]);
}

// ============================================================================
// TEMPLATE 7: Historique de tresorerie (accelerateur cold start Proph3t)
// ============================================================================

export function downloadHistoryTemplate() {
  generateTemplate('CashPilot_Template_Historique_Tresorerie.xlsx', [
    {
      name: 'Historique',
      instructions: [
        'CASHPILOT — Template Import Historique de Tresorerie',
        'Objectif : Accelerer le demarrage de Proph3t en important votre historique Excel',
        'Instructions :',
        '1. Importez jusqu\'a 36 mois d\'historique',
        '2. Une ligne par flux (encaissement ou decaissement)',
        '3. Montants positifs = encaissements, negatifs = decaissements',
        '4. La categorie permet a Proph3t d\'apprendre les patterns par type de flux',
      ],
      headers: ['Date', 'Categorie', 'Sous-categorie', 'Contrepartie', 'Montant', 'Type (recette/depense)', 'Compte', 'Reference', 'Description'],
      sampleRows: [
        ['01/01/2024', 'Loyer', '', 'ZARA CI', 2_100_000, 'recette', 'BICICI', 'LOY-JAN-2024', 'Loyer janvier 2024'],
        ['01/01/2024', 'Loyer', '', 'CARREFOUR', 3_800_000, 'recette', 'BICICI', 'LOY-JAN-2024', 'Loyer janvier 2024'],
        ['25/01/2024', 'Salaires', '', 'PAIE', -12_300_000, 'depense', 'SGBCI', 'SAL-JAN-2024', 'Salaires janvier'],
        ['31/01/2024', 'Energie', 'Electricite', 'CIE', -2_800_000, 'depense', 'SGBCI', 'CIE-JAN-2024', 'Electricite janvier'],
        ['15/02/2024', 'TVA', '', 'DGI', -3_200_000, 'depense', 'SGBCI', 'TVA-JAN-2024', 'TVA janvier reversee'],
      ],
      columnWidths: [14, 14, 16, 18, 14, 18, 12, 18, 30],
    },
  ]);
}
