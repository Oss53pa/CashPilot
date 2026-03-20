# CASHPILOT

## Cahier des Charges Produit — Spécification Complète
## Product Requirements Document — Complete Specification

**Version :** 1.0
**Date :** Mars 2026 / March 2026
**Éditeur / Publisher :** Praedium Tech — Atlas Studio
**Statut / Status :** Document de référence / Reference Document
**Confidentialité / Confidentiality :** Confidentiel — Diffusion restreinte / Confidential — Restricted Distribution

---

## TABLE DES MATIÈRES / TABLE OF CONTENTS

1. [Résumé Exécutif / Executive Summary](#chapitre-1--résumé-exécutif--executive-summary)
2. [Vision Produit & Positionnement Stratégique / Product Vision & Strategic Positioning](#chapitre-2--vision-produit--positionnement-stratégique--product-vision--strategic-positioning)
3. [Architecture Multi-Tenant & Multi-Company / Multi-Tenant & Multi-Company Architecture](#chapitre-3--architecture-multi-tenant--multi-company)
4. [Parties Prenantes & Profils Utilisateurs / Stakeholders & User Profiles](#chapitre-4--parties-prenantes--profils-utilisateurs--stakeholders--user-profiles)
5. [Périmètre Fonctionnel — 19 Modules / Functional Scope — 19 Modules](#chapitre-5--périmètre-fonctionnel--19-modules--functional-scope--19-modules)
6. [Exigences Non Fonctionnelles / Non-Functional Requirements](#chapitre-6--exigences-non-fonctionnelles--non-functional-requirements)
7. [Architecture Technique Frontend-Only + Supabase BaaS](#chapitre-7--architecture-technique-frontend-only--supabase-baas)
8. [Intégrations & Interopérabilité / Integrations & Interoperability](#chapitre-8--intégrations--interopérabilité)
9. [Expérience Utilisateur & Design / User Experience & Design](#chapitre-9--expérience-utilisateur--design)
10. [Tableaux de Bord & Reporting — Spécification Détaillée](#chapitre-10--tableaux-de-bord--reporting--spécification-détaillée)
11. [Roadmap & Priorisation / Roadmap & Prioritization](#chapitre-11--roadmap--priorisation)
12. [Plan de Validation & Recette / Validation & Acceptance Plan](#chapitre-12--plan-de-validation--recette)
13. [Gouvernance, Budget & Modèle Opérationnel](#chapitre-13--gouvernance-budget--modèle-opérationnel)
14. [Annexes / Appendices](#chapitre-14--annexes--appendices)

---

## CHAPITRE 1 — RÉSUMÉ EXÉCUTIF / EXECUTIVE SUMMARY

### 1.1 Résumé exécutif (Français)

CashPilot est une application SaaS standalone de gestion et de prévision de trésorerie, conçue nativement en architecture multi-tenant et multi-company, reposant exclusivement sur un stack frontend-only (React + TypeScript + Tailwind CSS) couplé à Supabase comme Backend-as-a-Service (BaaS). Elle s'adresse aux entreprises opérant dans les zones UEMOA et CEMAC, en priorité aux gestionnaires d'actifs immobiliers commerciaux, groupes multi-entités, PME et ETI africaines dont les flux combinent circuits bancaires, caisse physique, Mobile Money et cartes prépayées.

CashPilot répond à une défaillance structurelle du marché : l'absence d'outil de trésorerie calibré sur les réalités opérationnelles africaines — multiplicité des circuits de liquidité, comportements de paiement locaux, cadre réglementaire OHADA/SYSCOHADA, et structures multi-entités fréquentes.

Le produit couvre l'intégralité du cycle de trésorerie en 19 modules : collecte et normalisation des données multi-sources, moteur de prévision glissante (J+7 / J+30 / J+90 / J+365), gestion des scénarios, surveillance des seuils, reporting multi-profils, gestion des contentieux, du CAPEX, de la dette financière, des placements, et workflow d'approbation des paiements intégré à la délégation d'autorité de l'entreprise.

**Choix architectural fondateur** : zéro backend propriétaire. Toute la logique métier, la sécurité, l'authentification, le stockage et les API sont portés par Supabase (PostgreSQL, Row Level Security, Edge Functions, Realtime, Storage). Le frontend React consomme directement les services Supabase. Ce choix garantit une vélocité de développement maximale, des coûts d'infrastructure maîtrisés, et une scalabilité native sans DevOps dédié.

### 1.2 Executive Summary (English)

CashPilot is a standalone SaaS treasury management and forecasting application, built natively on a multi-tenant, multi-company architecture, running exclusively on a frontend-only stack (React + TypeScript + Tailwind CSS) backed by Supabase BaaS. It targets companies operating in the WAEMU and CEMAC zones, primarily commercial real estate managers, multi-entity groups, and African SMEs and mid-caps whose cash flows span banking circuits, physical cash, Mobile Money, and prepaid cards.

CashPilot addresses a structural market gap: the absence of a treasury tool calibrated to African operational realities — multiple liquidity circuits, local payment behaviors, OHADA/SYSCOHADA regulatory framework, and frequent multi-entity structures.

The product covers the full treasury cycle across 19 modules: multi-source data collection and normalization, rolling forecast engine (D+7 / D+30 / D+90 / D+365), scenario management, threshold monitoring, multi-profile reporting, dispute management, CAPEX tracking, debt management, investment optimization, and a payment approval workflow integrated with the company's delegation of authority framework.

**Founding architectural decision**: zero proprietary backend. All business logic, security, authentication, storage, and APIs are handled by Supabase (PostgreSQL, Row Level Security, Edge Functions, Realtime, Storage). The React frontend consumes Supabase services directly. This choice ensures maximum development velocity, controlled infrastructure costs, and native scalability without dedicated DevOps.

---

## CHAPITRE 2 — VISION PRODUIT & POSITIONNEMENT STRATÉGIQUE / PRODUCT VISION & STRATEGIC POSITIONING

### 2.1 Problème métier / Business Problem

#### Français

Les entreprises africaines — et particulièrement les gestionnaires d'actifs immobiliers commerciaux — pilotent leur trésorerie avec des outils inadaptés : tableurs Excel mis à jour manuellement, modules trésorerie d'ERP génériques non paramétrés pour les spécificités locales, ou absence totale d'outil structuré. Les conséquences sont systémiques :

- **Ruptures de liquidité non anticipées** : le gestionnaire découvre le problème le jour J, sans délai d'action
- **Trésorerie sur-estimée** : les créances douteuses, les contentieux et les dépôts de garantie sont traités comme des disponibilités réelles
- **Circuits de liquidité invisibles** : caisse physique, Mobile Money et cartes prépayées sont hors du système de pilotage
- **Consolidation groupe inexistante** : chaque entité est pilotée isolément, sans vision agrégée
- **Prévision statique** : le budget annuel est confondu avec la prévision de trésorerie — deux outils fondamentalement distincts

#### English

African companies — particularly commercial real estate managers — manage their treasury with inadequate tools: manually updated Excel spreadsheets, generic ERP treasury modules not configured for local specificities, or a complete absence of structured tools. The consequences are systemic:

- **Unanticipated liquidity shortfalls**: the manager discovers the problem on the day it occurs, with no time to act
- **Overstated treasury positions**: doubtful receivables, disputes, and security deposits are treated as real available funds
- **Invisible liquidity circuits**: physical cash, Mobile Money, and prepaid cards are outside the management system
- **No group consolidation**: each entity is managed in isolation, without an aggregated view
- **Static forecasting**: the annual budget is confused with the cash flow forecast — two fundamentally distinct tools

### 2.2 Proposition de valeur / Value Proposition

#### Français

CashPilot transforme la gestion de trésorerie d'une activité réactive (constater ce qui s'est passé) en activité prospective (anticiper ce qui va se passer et agir avant). La proposition de valeur se décline en cinq axes :

1. **Anticipation** : projection glissante J+7 à J+365 recalculée automatiquement à chaque mise à jour du réalisé
2. **Exhaustivité** : tous les circuits de liquidité dans un seul système — banques, caisses, Mobile Money, cartes prépayées, transferts internes
3. **Précision contextuelle** : paramétrage fin par locataire/fournisseur, gestion des contentieux, TVA, dépôts de garantie, indexations de loyers
4. **Consolidation** : vision groupe multi-entités en temps réel avec élimination automatique des flux inter-compagnies
5. **Gouvernance** : workflow d'approbation intégré à la DOA, piste d'audit complète, clôtures périodiques

#### English

CashPilot transforms treasury management from a reactive activity (recording what happened) to a prospective one (anticipating what will happen and acting in advance). The value proposition spans five dimensions:

1. **Anticipation**: rolling forecast from D+7 to D+365, automatically recalculated with each actuals update
2. **Completeness**: all liquidity circuits in one system — banks, cash, Mobile Money, prepaid cards, internal transfers
3. **Contextual precision**: detailed parameterization per tenant/supplier, dispute management, VAT, security deposits, rent indexation
4. **Consolidation**: real-time multi-entity group view with automatic inter-company flow elimination
5. **Governance**: approval workflow integrated with the delegation of authority, complete audit trail, period closings

### 2.3 Marché cible / Target Market

#### Segments primaires / Primary Segments

| Segment | Caractéristiques | Potentiel UEMOA/CEMAC |
|---------|-----------------|----------------------|
| Gestionnaires d'actifs immobiliers commerciaux | Centres commerciaux, immeubles de bureaux, entrepôts logistiques | Fort — marché en croissance rapide |
| Groupes multi-entités (holdings) | 3 à 20 filiales, consolidation groupe requise | Très fort — besoin non couvert |
| ETI africaines (50–500 employés) | Multi-banques, flux complexes, pas d'ERP trésorerie | Très fort — volume important |
| Cabinets d'expertise comptable | Gestion trésorerie pour compte de clients | Fort — effet multiplicateur |

#### Segments secondaires / Secondary Segments

- Institutions de microfinance (MFI) — gestion des liquidités de réseau
- Promoteurs immobiliers — suivi trésorerie projet par projet
- Distributeurs et négociants — flux fournisseurs complexes, Mobile Money intensif

### 2.4 Positionnement concurrentiel / Competitive Positioning

| Solution | Force | Faiblesse vs CashPilot |
|----------|-------|----------------------|
| Excel / Google Sheets | Flexibilité totale, zéro coût | Manuel, pas de prévision automatique, pas de multi-banques |
| Sage Trésorerie | Mature, intégré ERP Sage | Non adapté Afrique, pas de Mobile Money, coût élevé |
| Kyriba / ION Treasury | Référence mondiale | Hors de portée PME/ETI africaines, pas de contextualisation locale |
| Solutions bancaires locales | Gratuites, intégrées banque | Mono-banque, pas de consolidation, pas de prévision |
| Odoo Trésorerie | Open source, modulaire | Générique, pas de Mobile Money, complexité de déploiement |
| **CashPilot** | **Contextualisé Afrique, multi-circuits, multi-entités, SaaS abordable** | **—** |

### 2.5 Modèle économique / Business Model

#### Tarification / Pricing (en FCFA HT / XOF excl. tax)

| Plan | Cible | Prix mensuel | Entités | Utilisateurs | Comptes bancaires |
|------|-------|-------------|---------|-------------|------------------|
| Starter | PME mono-entité | 45 000 FCFA | 1 | 3 | 5 |
| Business | ETI multi-banques | 120 000 FCFA | 3 | 10 | 15 |
| Corporate | Groupe multi-entités | 280 000 FCFA | 10 | 30 | Illimité |
| Enterprise | Grand groupe / holding | Sur devis | Illimité | Illimité | Illimité |

- Facturation annuelle : remise 15%
- Modules CAPEX avancé et Dette financière : inclus Corporate et Enterprise
- Onboarding et paramétrage initial : forfait séparé selon complexité
- Support premium : forfait mensuel optionnel

### 2.6 Indicateurs de succès produit / Product Success Metrics

| KPI | Cible 12 mois | Cible 24 mois |
|-----|--------------|--------------|
| Tenants actifs | 50 | 200 |
| ARR (Annual Recurring Revenue) | 72 000 000 FCFA | 320 000 000 FCFA |
| Taux de rétention mensuel | > 95% | > 97% |
| NPS (Net Promoter Score) | > 40 | > 55 |
| Précision prévision J+30 (MAPE) | < 8% | < 5% |
| Délai moyen d'onboarding | < 5 jours | < 3 jours |
| Taux d'adoption mobile | > 40% | > 60% |

---

## CHAPITRE 3 — ARCHITECTURE MULTI-TENANT & MULTI-COMPANY

### 3.1 Définitions et distinctions fondamentales

#### Français

L'architecture de CashPilot repose sur deux niveaux hiérarchiques distincts et non interchangeables :

**Tenant** : une organisation cliente de CashPilot. Un tenant souscrit un abonnement, gère ses utilisateurs, et peut contenir une ou plusieurs companies. Le tenant est l'unité de facturation et d'isolement des données.

**Company (Société)** : une entité juridique distincte au sein d'un tenant. Une company possède ses propres comptes bancaires, caisses, budgets, locataires, fournisseurs et états financiers. Plusieurs companies d'un même tenant peuvent être consolidées en vision groupe.

**Exemple concret :**

```
Tenant : CRMC / New Heaven SA (le client CashPilot)
  ├── Company 1 : Cosmos Yopougon SA
  │     ├── Comptes bancaires Yopougon
  │     ├── Locataires Yopougon
  │     └── Budget Yopougon
  └── Company 2 : Cosmos Angré SA
        ├── Comptes bancaires Angré
        ├── Locataires Angré
        └── Budget Angré

Vision consolidée groupe : Cosmos Yopougon + Cosmos Angré
Flux inter-companies : tracés et éliminés en consolidation
```

#### English

CashPilot's architecture rests on two distinct, non-interchangeable hierarchical levels:

**Tenant**: a CashPilot customer organization. A tenant holds a subscription, manages its users, and can contain one or more companies. The tenant is the billing and data isolation unit.

**Company**: a distinct legal entity within a tenant. A company owns its bank accounts, cash registers, budgets, tenants, suppliers, and financial statements. Multiple companies within the same tenant can be consolidated into a group view.

### 3.2 Modèle de données multi-tenant / Multi-tenant Data Model

#### Stratégie d'isolement / Isolation Strategy

CashPilot adopte la stratégie **shared database, shared schema with Row Level Security (RLS)** — la stratégie native de Supabase.

Chaque table métier contient obligatoirement deux colonnes de contexte :

```sql
tenant_id  UUID NOT NULL REFERENCES tenants(id)
company_id UUID NOT NULL REFERENCES companies(id)
```

Les politiques RLS Supabase garantissent qu'un utilisateur ne peut accéder qu'aux données de son tenant et des companies auxquelles il est autorisé :

```sql
-- Exemple de politique RLS sur la table cash_flows
CREATE POLICY "tenant_isolation" ON cash_flows
  FOR ALL USING (
    tenant_id = auth.jwt() ->> 'tenant_id'
    AND company_id = ANY(
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
    )
  );
```

#### Hiérarchie des tables / Table Hierarchy

```
tenants
  └── companies (appartient à un tenant)
        ├── bank_accounts (appartient à une company)
        ├── cash_registers (appartient à une company)
        ├── mobile_money_accounts (appartient à une company)
        ├── prepaid_cards (appartient à une company)
        ├── budgets (appartient à une company)
        ├── counterparties (locataires/fournisseurs — appartient à une company)
        ├── cash_flows (appartient à une company)
        ├── forecasts (appartient à une company)
        ├── capex_operations (appartient à une company)
        ├── debt_contracts (appartient à une company)
        ├── investments (appartient à une company)
        └── dispute_files (appartient à une company)

intercompany_flows (référence deux companies du même tenant)
consolidated_views (agrège plusieurs companies d'un même tenant)
```

### 3.3 Gestion des utilisateurs multi-tenant / Multi-tenant User Management

#### Modèle de rôles / Role Model

CashPilot implémente un modèle RBAC (Role-Based Access Control) à trois niveaux :

**Niveau Tenant :**

| Rôle | Périmètre | Droits |
|------|-----------|--------|
| Tenant Admin | Tout le tenant | Gestion utilisateurs, companies, abonnement, paramètres globaux |
| Group CFO | Toutes les companies | Lecture/écriture toutes companies + consolidation groupe |
| Group Viewer | Toutes les companies | Lecture seule toutes companies |

**Niveau Company :**

| Rôle | Périmètre | Droits |
|------|-----------|--------|
| Company CFO / DAF | Une company | Lecture/écriture complète + validation paiements niveau 2 |
| Company Manager | Une company | Saisie opérationnelle + validation niveau 1 |
| Treasurer | Une company | Saisie encaissements/décaissements, rapprochement bancaire |
| Viewer | Une company | Lecture seule, exports |
| Auditor | Une company | Lecture seule + accès piste d'audit complète |

**Niveau Module :**

Chaque rôle peut être affiné par module. Exemple : un utilisateur peut avoir le rôle Treasurer sur la company principale et Viewer sur les autres companies du groupe.

#### Matrice d'accès inter-companies / Inter-company Access Matrix

```
Un utilisateur peut être :
  → Autorisé sur 1 company spécifique
  → Autorisé sur N companies sélectionnées
  → Autorisé sur toutes les companies du tenant (rôle groupe)

La vue consolidée groupe n'est accessible qu'aux rôles
ayant accès à toutes les companies consolidées.
```

### 3.4 Consolidation groupe / Group Consolidation

#### Périmètre de consolidation / Consolidation Scope

Le Tenant Admin définit le périmètre de consolidation :

- Quelles companies sont incluses dans le groupe
- La devise de consolidation (FCFA par défaut)
- La méthode de consolidation des flux inter-companies

#### Élimination des flux inter-companies / Intercompany Flow Elimination

```
Flux inter-company détecté :
  Company A → Company B (même tenant) : 50 000 000 FCFA

Traitement consolidation :
  Comptabilité Company A : Créance sur Company B + 50M
  Comptabilité Company B : Dette envers Company A - 50M
  Vision consolidée groupe : ÉLIMINÉ (impact net = zéro)

Suivi du flux :
  Convention inter-co : référencée et archivée
  Taux d'intérêt éventuel : calculé et comptabilisé
  Remboursement : programmé dans le calendrier de trésorerie
```

#### Devises et taux de change / Currencies and Exchange Rates

- Devise fonctionnelle par company (FCFA, EUR, USD, GNF, XAF, etc.)
- Devise de consolidation paramétrable au niveau tenant
- Taux de change : saisie manuelle ou import depuis source externe
- Écarts de conversion : calculés et affichés séparément dans la consolidation

---

## CHAPITRE 4 — PARTIES PRENANTES & PROFILS UTILISATEURS / STAKEHOLDERS & USER PROFILES

### 4.1 Cartographie des parties prenantes / Stakeholder Map

| Partie prenante | Rôle | Intérêt dans CashPilot |
|----------------|------|----------------------|
| Directeur Général / CEO | Décideur stratégique | Vision consolidée groupe, alertes critiques, KPIs |
| Directeur Général Adjoint / Deputy CEO | Pilotage opérationnel | Supervision multi-entités, validation haute valeur |
| DAF / CFO | Responsable financier | Gestion complète trésorerie, reporting, clôtures |
| Trésorier | Opérationnel trésorerie | Saisie quotidienne, rapprochement, suivi comptes |
| Responsable Comptable | Interface comptabilité | Synchronisation écritures, clôtures, exports |
| Center Manager | Gestionnaire terrain | Encaissements locataires, caisse, relances |
| Juriste / Avocat | Contentieux | Suivi dossiers judiciaires, provisions |
| Auditeur interne / externe | Contrôle | Piste d'audit, exports conformité |
| Banquier | Partenaire financier | Reporting covenant, situation de trésorerie |
| Actionnaire / Investisseur | Gouvernance | Tableaux de bord exécutifs, plan de financement |

### 4.2 Personas utilisateurs / User Personas

#### Persona 1 — Le Directeur Général / CEO

- **Profil** : Décideur, mobilité élevée, peu de temps, vision stratégique requise
- **Fréquence d'usage** : 2-3 fois par semaine, principalement sur mobile
- **Besoins critiques** :
  - Position de trésorerie consolidée groupe en 10 secondes
  - Alertes push si seuil critique franchi
  - Écart budget / réalisé par entité
  - Statut des dossiers contentieux majeurs
  - Validation des paiements haute valeur (DOA)
- **Jobs-to-be-done** :
  - "Je veux savoir en 30 secondes si mon groupe est en bonne santé de trésorerie"
  - "Je veux être alerté avant qu'un problème devienne une crise"
  - "Je veux valider les gros paiements depuis mon téléphone"

#### Persona 2 — La DAF / CFO

- **Profil** : Expert financier, usage quotidien intensif, desktop principalement
- **Fréquence d'usage** : Quotidienne, plusieurs heures
- **Besoins critiques** :
  - Position bancaire réelle par compte en temps réel
  - Plan de trésorerie 13 semaines mis à jour chaque lundi
  - Gestion des clôtures mensuelles
  - Suivi TVA et échéances fiscales
  - Réconciliation bancaire et inter-modules
  - Reporting pour le conseil d'administration
- **Jobs-to-be-done** :
  - "Je veux réconcilier la trésorerie en moins d'une heure chaque semaine"
  - "Je veux que les prévisions se mettent à jour sans que je saisisse tout manuellement"
  - "Je veux produire le rapport mensuel de trésorerie en 15 minutes"

#### Persona 3 — Le Trésorier / Responsable Comptable

- **Profil** : Utilisateur opérationnel, saisie quotidienne, desktop
- **Fréquence d'usage** : Quotidienne
- **Besoins critiques** :
  - Saisie rapide des encaissements et décaissements
  - Import et matching des relevés bancaires
  - Gestion des transferts inter-comptes
  - Arrêté de caisse quotidien
  - Suivi des flux non identifiés
- **Jobs-to-be-done** :
  - "Je veux importer le relevé bancaire et que le système fasse le matching automatiquement"
  - "Je veux que l'arrêté de caisse prenne moins de 10 minutes"
  - "Je veux un tableau de bord clair de ce qui reste à traiter aujourd'hui"

#### Persona 4 — Le Center Manager / Responsable Terrain

- **Profil** : Gestionnaire opérationnel, mobile et desktop, terrain
- **Fréquence d'usage** : Quotidienne
- **Besoins critiques** :
  - Liste des locataires à relancer aujourd'hui
  - Saisie des encaissements cash et Mobile Money
  - Validation des petites sorties de caisse
  - Statut de chaque locataire (à jour / en retard / contentieux)
- **Jobs-to-be-done** :
  - "Je veux savoir chaque matin quels locataires relancer"
  - "Je veux enregistrer un paiement locataire en moins d'une minute"
  - "Je veux voir l'état de ma caisse en temps réel"

---

## CHAPITRE 5 — PÉRIMÈTRE FONCTIONNEL — 19 MODULES / FUNCTIONAL SCOPE — 19 MODULES

### MODULE 01 — BUDGET ANNUEL & RÉFÉRENTIEL

#### Description

Le budget annuel est la colonne vertébrale de CashPilot. Il constitue la référence à partir de laquelle toutes les prévisions sont construites et tous les écarts sont mesurés. Il n'est pas la prévision — il en est le point de départ et la référence de performance.

#### Fonctionnalités

**01.1 Structure budgétaire paramétrable**

La structure du budget est définie par l'utilisateur selon la nature de son activité. Pour un gestionnaire de centre commercial, la structure type est :

```
REVENUS
  Loyers fixes
    └── Par locataire / par zone / par mois
  Charges locatives (appels de provisions)
    └── Par locataire / par nature / par mois
  Loyers variables (% chiffre d'affaires)
    └── Par locataire / par mois (hypothèse CA)
  Droits d'entrée et pas de porte
    └── Par bail / date prévisionnelle
  Revenus annexes
    ├── Parking
    ├── Affichage publicitaire
    ├── Location d'espaces événementiels
    ├── Kiosques temporaires
    └── Autres revenus

CHARGES D'EXPLOITATION
  Charges de personnel
    ├── Salaires bruts
    ├── Charges patronales
    └── Avantages en nature
  Maintenance & Facility Management
    ├── Contrats de maintenance (montants fixes)
    └── Maintenance curative (enveloppe estimée)
  Énergie
    ├── Électricité
    ├── Eau
    └── Carburant groupes électrogènes
  Sécurité & Gardiennage
  Nettoyage & Hygiène
  Assurances
  Honoraires et prestataires externes
  Frais généraux et administratifs
  Taxes et impôts d'exploitation
    ├── Patente
    ├── Taxe foncière
    └── Autres taxes locales

CHARGES FINANCIÈRES
  Intérêts sur emprunts (par contrat)
  Frais bancaires et commissions
  Pertes sur créances irrécouvrables (provision)

CAPEX
  Par opération / par mois prévu de décaissement

REMBOURSEMENTS D'EMPRUNTS
  Capital remboursé (par contrat d'emprunt)
```

**01.2 Saisie et import du budget**

- Saisie manuelle ligne par ligne dans l'interface
- Import depuis fichier Excel (template CashPilot fourni)
- Import depuis fichier CSV
- Duplication d'un budget existant avec modification (gain de temps d'une année sur l'autre)
- Versioning : plusieurs versions de budget (initial, révisé T1, révisé T2, etc.) avec activation de la version de référence

**01.3 Répartition temporelle**

- Répartition mensuelle manuelle (saisie mois par mois)
- Répartition automatique par règle : égale / pondérée par saison / progressive
- Intégration des saisonnalités connues (ex : pic de revenus annexes en décembre)
- Gestion des mois incomplets (démarrage d'activité en cours d'année)

**01.4 Budget par entité et consolidé**

- Un budget par company
- Vue consolidée groupe automatique (somme des budgets des companies sélectionnées)
- Élimination des flux budgétaires inter-companies en vue consolidée

**01.5 Révisions budgétaires**

- Création d'une révision à tout moment de l'exercice
- Conservation de toutes les versions avec horodatage et auteur
- Comparaison multi-versions (budget initial vs révision T1 vs révision T2)
- Activation de la version active (référence pour les écarts)

**Règles métier critiques :**

- Un budget doit couvrir exactement 12 mois consécutifs
- La version active ne peut pas être supprimée (archivage uniquement)
- Toute modification d'un budget validé génère automatiquement une nouvelle version
- Le budget est lié à une company et une devise fonctionnelle

---

### MODULE 02 — BALANCE D'OUVERTURE

#### Description

La balance d'ouverture est le stock de flux passés non encore réglés au moment du démarrage de CashPilot ou au début d'un nouvel exercice. Elle constitue le point de départ réel de toutes les prévisions. Une balance d'ouverture incorrecte rend toutes les prévisions fausses dès le premier jour.

#### Fonctionnalités

**02.1 Position bancaire réelle à date**

Saisie ou import du solde réel de chaque compte à la date de démarrage :

```
Compte SGBCI Opérationnel    : + 42 500 000 FCFA
Compte BICICI Loyers         : + 18 200 000 FCFA
Compte ECOBANK CAPEX         : +  8 100 000 FCFA
Compte UBA Provision         : + 57 700 000 FCFA
Caisse principale            : +  1 572 000 FCFA
Caisse technique FM          : +    284 000 FCFA
Orange Money entreprise      : +  1 015 200 FCFA
Carte prépayée Lynda         : +    187 500 FCFA
────────────────────────────────────────────────
Position nette totale        : +129 558 700 FCFA
```

**02.2 Portefeuille des créances antérieures**

Import Excel ou saisie manuelle de toutes les créances existantes à la date d'ouverture :

| Champ | Description |
|-------|------------|
| Contrepartie | Locataire / débiteur |
| Nature | Loyer / Charges / Pas de porte / Autre |
| Période concernée | Mois(s) facturé(s) |
| Montant brut | Montant facturé |
| Montant recouvrable estimé | Estimation réaliste d'encaissement |
| Statut | Normal / En retard / Litigieux / Contentieux / Irrécouvrable |
| Date d'encaissement probable | Estimation utilisateur |
| Probabilité d'encaissement | % attribué par l'utilisateur |
| Observations | Notes libres |

**02.3 Portefeuille des dettes antérieures**

Import Excel ou saisie manuelle de toutes les dettes existantes :

| Champ | Description |
|-------|------------|
| Contrepartie | Fournisseur / créancier |
| Nature | Maintenance / Énergie / Personnel / CAPEX / Fiscal / Autre |
| Montant dû | Montant exact de la dette |
| Date d'échéance initiale | Échéance contractuelle |
| Date de paiement prévue | Quand sera-t-il payé |
| Statut | À payer / En retard / Litigieux |
| Compte de décaissement prévu | Quel compte bancaire sera débité |

**02.4 Intégration dans le moteur de prévision**

- Les créances antérieures entrent dans la file des encaissements futurs avec leur probabilité et date estimée
- Les dettes antérieures entrent dans le calendrier des décaissements comme flux certains ou quasi-certains
- La position bancaire réelle est le point de départ de toutes les projections
- Les créances en statut Irrécouvrable sont exclues de toutes les prévisions et provisionnées en charge

**02.5 Balance d'ouverture de début d'exercice**

À chaque début d'exercice, le système génère automatiquement la balance d'ouverture à partir de la clôture de l'exercice précédent :

- Report du solde de clôture de chaque compte
- Report des créances non encore encaissées
- Report des dettes non encore payées
- Validation obligatoire par le DAF avant activation

---

### MODULE 03 — PARAMÉTRAGE DÉLAIS & PROFILS CONTREPARTIES

#### Description

C'est le module d'intelligence comportementale de CashPilot. Il capture le comportement réel de paiement de chaque locataire et de chaque fournisseur, et utilise ces données pour construire des prévisions ancrées dans la réalité — et non sur des hypothèses théoriques contractuelles.

#### Fonctionnalités

**03.1 Profil de paiement locataire**

Pour chaque locataire, le système maintient un profil comportemental complet :

```
PROFIL — Locataire X
────────────────────────────────────────────────────────
Données contractuelles
  Bail de référence          : BEFA du 01/01/2024
  Loyer mensuel HT           : 2 100 000 FCFA
  Charges mensuelles HT      :   350 000 FCFA
  Échéance contractuelle     : 1er de chaque mois
  Dépôt de garantie détenu   : 6 300 000 FCFA
  Indexation annuelle        : +3% au 01/01 de chaque année

Comportement observé (calculé automatiquement)
  Délai moyen de paiement    : J+11,3 après échéance
  Écart-type du délai        : ± 4,2 jours
  Taux de paiement complet   : 94% (paie en totalité)
  Taux de paiement partiel   : 6% (paie partiellement)
  Montant moyen si partiel   : 85% du dû
  Historique sur N mois      : 18 mois
  Tendance récente           : Dégradation (+3 jours vs N-6)

Paramètres manuels (surchargent le calculé si renseignés)
  Délai forcé                : — (non forcé)
  Probabilité de paiement    : Automatique (calculée)
  Statut de vigilance        : Normal / Surveillance / Alerte
  Note de risque             : 3/5
```

**03.2 Gestion des indexations de loyers**

| Type d'indexation | Paramétrage |
|------------------|-------------|
| Taux fixe annuel | % appliqué à chaque anniversaire du bail |
| Indice externe | Lien vers un indice (IHPC Côte d'Ivoire, etc.) |
| Escalier contractuel | Montants et dates définis contractuellement |
| Révision à l'amiable | Saisie manuelle du nouveau loyer à chaque révision |

Le système applique automatiquement les révisions à leur date d'échéance et recalcule toutes les prévisions futures.

**03.3 Profil de paiement fournisseur**

```
PROFIL — Fournisseur Y (Prestataire Sécurité)
────────────────────────────────────────────────────────
Données contractuelles
  Contrat de référence       : Contrat annuel renouvelable
  Montant mensuel HT         : 4 200 000 FCFA
  Délai de paiement contractuel : 30 jours après facture

Comportement observé
  Délai moyen de réception facture : J+8 après fin de mois
  Délai moyen de paiement effectif : J+22 après réception
  Délai total moyen              : J+30 après fin de mois

Règle de prévision appliquée
  Décaissement prévu chaque mois : Fin de mois + 30 jours
  Compte de décaissement         : SGBCI Opérationnel
```

**03.4 Classification des flux par degré de certitude**

| Classe | Description | Traitement prévision |
|--------|------------|---------------------|
| Certain | Montant et date connus avec précision | Intégré à 100% dans le scénario base |
| Quasi-certain | Contrat signé, légère incertitude de timing | Intégré à 90-95% dans le scénario base |
| Probable | Comportement historique favorable | Intégré selon probabilité calculée dans le scénario base |
| Incertain | Aléatoire ou dépendant d'un tiers | Scénario optimiste uniquement |
| Exceptionnel | One-off saisi manuellement | Selon probabilité définie manuellement |

**03.5 Scoring des nouveaux locataires (cold start)**

Pour les locataires sans historique dans CashPilot (Cosmos Angré notamment) :

- Application d'un profil de démarrage par défaut (délai moyen sectoriel paramétré par l'administrateur)
- Convergence progressive vers le profil réel à mesure que les premières transactions sont enregistrées
- Alerte si le profil réel s'écarte significativement du profil de démarrage après 3 mois

---

### MODULE 04 — MOTEUR DE PRÉVISION GLISSANTE

#### Description

C'est le cœur intellectuel de CashPilot. Il produit en continu une projection de trésorerie sur quatre horizons temporels, en combinant trois méthodes complémentaires selon le type de flux, et se recalibre automatiquement à chaque mise à jour du réalisé.

#### Architecture du moteur

**04.1 Les quatre horizons de prévision**

| Horizon | Granularité | Méthode dominante | Précision cible |
|---------|------------|-------------------|----------------|
| J+7 | Journalier | Déterministe + quasi-certain | > 98% |
| J+30 | Hebdomadaire | Déterministe + statistique | > 92% |
| J+90 | Hebdomadaire | Statistique + ML | > 85% |
| J+365 | Mensuel | ML + tendance | > 75% |

**04.2 Les trois méthodes de prévision**

**Méthode 1 — Déterministe (flux certains et quasi-certains)**

Applicable à : loyers fixes contractuels, salaires, remboursements d'emprunts, échéances fiscales connues, CAPEX planifié, dépôts de garantie programmés.

```
Logique :
  Pour chaque flux déterministe :
    Montant = Montant contractuel × (1 + indexation applicable)
    Date = Date contractuelle + Délai moyen observé du payeur
    Certitude = 95-100%
```

**Méthode 2 — Statistique (flux réguliers mais variables)**

Applicable à : encaissements locataires (délai variable), charges d'énergie (saisonnalité), revenus annexes (variable).

Algorithmes utilisés, sélectionnés automatiquement selon l'historique disponible :

- Moyenne mobile pondérée (< 6 mois d'historique)
- Lissage exponentiel de Holt-Winters (6-12 mois, avec capture de saisonnalité)
- ARIMA/SARIMA (> 12 mois, tendance et saisonnalité multiples)

```
Logique pour encaissement locataire X :
  Loyer dû = 2 100 000 FCFA le 1er
  Délai moyen observé = J+11,3 ± 4,2 jours
  Montant moyen encaissé = 94% du dû = 1 974 000 FCFA
  Date probable = 12 du mois ± 4 jours
  Intervalle de confiance à 90% = [8 du mois, 16 du mois]
```

**Méthode 3 — Machine Learning (flux complexes, non-linéaires)**

Applicable à : revenus variables (% CA), comportements atypiques, prévisions J+90 à J+365.

Modèles déployés via Supabase Edge Functions :

- **LSTM** (Long Short-Term Memory) : capture des dépendances temporelles longues
- **XGBoost** : prévision à partir de features multiples (historique, calendrier, événements)
- **Ensemble hybride** : combinaison pondérée des modèles selon leur performance historique

> Note d'implémentation : les modèles ML sont exécutés via Supabase Edge Functions (Deno) et entraînés sur l'historique stocké dans PostgreSQL. Le frontend consomme les résultats via l'API Supabase.

**04.3 La boucle de recalibrage automatique**

```
À chaque enregistrement d'un règlement réel (encaissement ou décaissement) :

Étape 1 — Calcul de l'écart
  Prévu  : 2 100 000 FCFA le 01/03
  Réalisé: 1 974 000 FCFA le 12/03
  Écart montant  : -126 000 FCFA (-6%)
  Écart timing   : +11 jours

Étape 2 — Mise à jour du profil contrepartie
  Délai moyen    : recalculé avec la nouvelle observation
  Taux moyen     : recalculé avec la nouvelle observation
  Tendance       : détectée si dégradation/amélioration sur 3 mois

Étape 3 — Recalcul de toutes les prévisions futures
  Toutes les occurrences futures de ce locataire
  sont recalculées avec le nouveau profil

Étape 4 — Recalcul de la projection globale
  Nouvelle position bancaire réelle = point de départ
  Nouvelle projection J+7 / J+30 / J+90 / J+365

Étape 5 — Vérification des seuils et alertes
  Si la nouvelle projection franchit un seuil → alerte
```

**04.4 La mesure de performance du modèle**

| Métrique | Formule | Interprétation |
|----------|---------|---------------|
| MAE (Mean Absolute Error) | Moyenne des |réel - prévu| | Erreur absolue moyenne |
| MAPE (Mean Absolute Percentage Error) | Moyenne des |réel-prévu|/|réel| | Erreur en pourcentage |
| Biais | Moyenne de (réel - prévu) | Systématiquement optimiste ou pessimiste ? |
| Précision J+30 | MAPE sur horizon 30 jours | KPI principal du produit |

**04.5 Gestion du cold start**

- **Phase 1** (mois 1-3) : prévision déterministe uniquement (budget + délais paramétrés manuellement)
- **Phase 2** (mois 4-6) : activation des méthodes statistiques simples (moyenne mobile)
- **Phase 3** (mois 7-12) : activation du lissage exponentiel avec saisonnalité
- **Phase 4** (> 12 mois) : activation complète ML + ensemble hybride

---

### MODULE 05 — SCÉNARIOS & STRESS TEST

#### Description

La prévision unique est dangereuse. CashPilot produit systématiquement plusieurs scénarios simultanés, permettant au décideur de comprendre l'étendue des possibles et de préparer des plans d'action différenciés.

#### Fonctionnalités

**05.1 Scénarios standards automatiques**

| Scénario | Hypothèses encaissements | Hypothèses décaissements |
|----------|------------------------|------------------------|
| Base | Taux et délais moyens observés | Délais contractuels |
| Optimiste | Encaissements accélérés (+15%), taux de recouvrement max | Décaissements différés au maximum contractuel |
| Pessimiste | Encaissements ralentis (+30% de délai), taux de recouvrement min | Décaissements anticipés, charges imprévues +10% |

**05.2 Scénarios personnalisés**

L'utilisateur peut créer des scénarios sur mesure en modifiant n'importe quel paramètre :

- Taux de recouvrement par locataire ou global
- Délai de paiement par fournisseur ou catégorie
- Activation ou désactivation de flux spécifiques
- Ajout de flux exceptionnels (encaissement imprévu, dépense urgente)
- Modification du calendrier CAPEX
- Variation du taux de change si devises

**05.3 Stress tests**

| Stress test prédéfini | Description |
|----------------------|-------------|
| Perte d'un locataire majeur | Suppression des flux d'un ou plusieurs locataires pendant N mois |
| Retard de paiement massif | 30% des locataires ne paient pas pendant 60 jours |
| Choc de charges | Dépense exceptionnelle imprévue de X FCFA |
| Blocage bancaire | Un compte bancaire est indisponible pendant N jours |
| Choc de change | Appréciation/dépréciation de X% sur les flux en devise |
| Arrêt de la ligne de crédit | La ligne de crédit est révoquée par la banque |

Chaque stress test affiche :
- La position de trésorerie sous ce scénario
- Le délai avant franchissement du seuil critique
- Les leviers d'action disponibles et leur impact estimé

**05.4 Simulation what-if**

Interface interactive permettant de modifier en temps réel n'importe quelle hypothèse et de voir l'impact immédiat sur la projection.

---

### MODULE 06 — MULTI-BANQUES & CONSOLIDATION

#### Description

CashPilot traite chaque compte bancaire comme une entité distincte avec sa propre position, ses propres flux et ses propres règles de gestion, tout en offrant une vision consolidée instantanée de l'ensemble des liquidités bancaires.

#### Fonctionnalités

**06.1 Référentiel des comptes bancaires**

| Paramètre | Description |
|-----------|------------|
| Banque | Institution financière |
| Nom du compte | Intitulé libre |
| Numéro de compte / RIB / IBAN | Identifiant bancaire |
| Devise | Devise fonctionnelle du compte |
| Solde minimum de sécurité | Seuil d'alerte bas |
| Solde maximum avant placement | Seuil d'alerte haut (excédent à placer) |
| Usage principal | Opérationnel / Loyers / CAPEX / Provision / Épargne |
| Compte de rattachement | Company propriétaire |
| Format d'import relevé | MT940 / CAMT.053 / CSV propriétaire |
| Délai de valeur habituel | J / J+1 / J+2 selon la banque |

**06.2 Import multi-formats des relevés bancaires**

| Format | Banques concernées | Traitement |
|--------|-------------------|-----------|
| MT940 | SGBCI, ECOBANK, UBA, banques internationales | Parser natif |
| CAMT.053 (XML) | Banques européennes, filiales groupes internationaux | Parser natif |
| CSV propriétaire | BICICI, Versus Bank, NSIA, BNI | Templates configurables par banque |
| Excel | Toute banque avec export Excel | Mapping colonnes paramétrable |
| PDF (OCR) | Banques sans export structuré | Extraction OCR + validation manuelle |

**06.3 Matching automatique des transactions**

```
Algorithme de matching (par ordre de priorité) :
  1. Référence exacte (numéro de virement ou référence facture)
  2. Montant exact + contrepartie connue
  3. Montant exact + fourchette de dates (± 5 jours de la prévision)
  4. Montant approchant (± 2%) + contrepartie connue
  5. Aucun match → flux non identifié → file d'attente manuelle

Résultats du matching :
  ✅ Match certain → confirmation automatique
  🟡 Match probable → proposition à valider par l'utilisateur
  🔴 Non identifié → saisie manuelle requise
```

**06.4 Position consolidée multi-banques**

```
POSITION BANCAIRE CONSOLIDÉE — [Company] — [Date]
══════════════════════════════════════════════════
Compte              Banque    Solde réel   Prévu J+30  Statut
SGBCI Opérationnel  SGBCI     42 500 000   38 200 000  ✅
BICICI Loyers       BICICI    18 200 000   31 400 000  ✅
ECOBANK CAPEX       ECOBANK    8 100 000  -12 300 000  🔴
UBA Provision       UBA       57 700 000   49 900 000  ✅
──────────────────────────────────────────────────────
TOTAL BANCAIRE               126 500 000  107 200 000
```

**06.5 Alertes multi-banques**

| Déclencheur | Alerte |
|------------|--------|
| Solde < seuil minimum | Alerte déficit — suggestion de virement depuis autre compte |
| Solde > seuil maximum | Suggestion de placement ou transfert |
| Prévision J+30 < seuil minimum | Alerte anticipée avec délai d'action |
| Deux comptes en déséquilibre simultané | Suggestion de rééquilibrage avec montant et compte source |
| Relevé non importé depuis N jours | Rappel de mise à jour |

---

### MODULE 07 — MULTI-ENTITÉS & CONSOLIDATION GROUPE

#### Description

Pour les groupes possédant plusieurs companies, CashPilot offre une vision consolidée complète avec élimination des flux inter-companies.

#### Fonctionnalités

**07.1 Configuration du périmètre de consolidation**

- Les companies incluses dans le groupe consolidé
- La devise de consolidation (FCFA par défaut)
- Les paires de comptes inter-companies
- La méthode d'élimination

**07.2 Tableau de bord consolidé groupe**

```
TABLEAU DE BORD GROUPE — CRMC / NEW HEAVEN SA — Mars 2026
══════════════════════════════════════════════════════════

POSITION TRÉSORERIE CONSOLIDÉE
  Toutes entités              : +130 823 700 FCFA
  Prévision J+30              : +108 200 000 FCFA
  Prévision J+90              :  +94 700 000 FCFA

PAR ENTITÉ
  Cosmos Yopougon             :  +92 500 000 FCFA  ✅
  Cosmos Angré                :  +38 323 700 FCFA  ✅

FLUX INTER-ENTITÉS EN COURS
  Yopougon → Angré (avance)   :  50 000 000 FCFA
  (éliminé de la consolidation)

ÉCART BUDGET VS PRÉVISION (consolidé)
  Revenus prévus vs budget    : -4,2% ⚠️
  Charges prévues vs budget   : +1,8% ✅
```

**07.3 Reporting consolidé**

Tous les rapports disponibles au niveau company sont disponibles au niveau groupe avec consolidation automatique.

**07.4 Gestion des flux inter-companies**

Les flux inter-companies sont identifiés et éliminés en consolidation. Les conventions inter-co sont archivées et référencées.

**07.5 Simulation de montée en puissance (nouveau site)**

```
SIMULATION MONTÉE EN PUISSANCE — COSMOS ANGRÉ
══════════════════════════════════════════════
           Oct 26  Nov 26  Déc 26  Jan 27  Avr 27
Occupation   60%     70%     75%     78%     90%
Revenus      60%     70%     75%     78%     90%
Charges      85%     88%     90%     90%     95%
Cash flow   -25%    -18%    -15%    -12%    -5%
Position    Déf.    Déf.    Déf.    Déf.   Équil.
```

---

### MODULE 08 — CONTENTIEUX JUDICIAIRE

#### Description

Dès qu'une procédure judiciaire est ouverte contre un débiteur, la créance change de nature. Le module contentieux isole ces créances, les suit dans leur dimension judiciaire, et les réintègre dans la trésorerie uniquement en cas de résolution favorable.

#### Fonctionnalités

**08.1 Bascule en statut contentieux**

Déclenchement manuel. La bascule déclenche automatiquement :
- Exclusion de la créance de la prévision de trésorerie base
- Exclusion du calcul du taux de recouvrement normal
- Création d'un dossier contentieux dédié
- Notification au juriste/avocat responsable
- Suggestion de provision comptable

**08.2 Dossier contentieux**

```
DOSSIER CONTENTIEUX
────────────────────────────────────────────────────────
Identification
  Référence dossier    : CONT-2026-003
  Débiteur             : MY PLACE SARL
  Type de procédure    : Recouvrement de loyers impayés
  Juridiction          : Tribunal de Commerce d'Abidjan
  Date d'ouverture     : 15/02/2026
  Montant principal    : 24 800 000 FCFA
  Pénalités cumulées   :  1 488 000 FCFA (6% / an)
  Total en litige      : 26 288 000 FCFA

Scénarios de sortie (définis par l'utilisateur)
  Accord amiable avant jugement  : 35%  →  14 000 000 FCFA  Avr 26
  Jugement favorable + exécution : 25%  →  24 800 000 FCFA  Sep 26
  Jugement partiel               : 20%  →  12 000 000 FCFA  Oct 26
  Perte totale / insolvabilité   : 20%  →           0 FCFA   —

Valeur espérée calculée
  (35% × 14M) + (25% × 24,8M) + (20% × 12M) + (20% × 0)
  = 4,9M + 6,2M + 2,4M + 0 = 13 500 000 FCFA
```

**08.3 Intégration dans la prévision de trésorerie**

| Scénario | Traitement |
|----------|-----------|
| Scénario base | Créance exclue. Frais de procédure intégrés comme décaissements certains |
| Scénario optimiste | Valeur espérée intégrée à la date probable de résolution |
| Scénario pessimiste | Créance exclue + frais de procédure majorés |

**08.4 Tableau de bord contentieux**

```
PORTEFEUILLE CONTENTIEUX — [Company] — [Date]
══════════════════════════════════════════════
Dossiers actifs              :  3
Montant total en litige      : 47 300 000 FCFA
Valeur espérée nette         : 18 200 000 FCFA
Frais de procédure courus    :  4 100 000 FCFA
Prochaine audience           : MY PLACE — 28/04/2026 (J-10) ⚠️
```

---

### MODULE 09 — FISCAL, DÉPÔTS DE GARANTIE, AVOIRS & RÈGLEMENTS PARTIELS

#### Description

Ce module couvre quatre catégories de flux à traitement spécifique qui, si ignorées, génèrent des erreurs systématiques dans la prévision de trésorerie.

#### Fonctionnalités

**09.1 Gestion de la TVA comme flux autonome**

```
Encaissement loyer locataire X
  Montant HT                 : 2 100 000 FCFA  → revenu
  TVA collectée (18%)        :   378 000 FCFA  → dette fiscale
  Total encaissé             : 2 478 000 FCFA  → trésorerie réelle

Traitement automatique :
  Trésorerie créditée        : + 2 478 000 FCFA
  Provision TVA créditée     : +   378 000 FCFA (dette interne)
  Revenu net reconnu         :   2 100 000 FCFA
```

**09.2 Calendrier fiscal automatique**

| Obligation | Fréquence | Échéance type |
|-----------|-----------|--------------|
| Déclaration et paiement TVA | Mensuelle | 15 du mois suivant |
| Acomptes IS | Trimestrielle | 15 mars, 15 juin, 15 sept, 15 déc |
| Patente | Annuelle | 31 mars |
| Taxe foncière | Annuelle | Date paramétrable |
| CNPS (charges sociales) | Mensuelle | Fin du mois |
| Retenues à la source | Mensuelle | 15 du mois suivant |

**09.3 Gestion des dépôts de garantie**

```
REGISTRE DES DÉPÔTS DE GARANTIE
════════════════════════════════════════════════════
Locataire X  Entrée : 01/01/2024  Montant : 6 300 000 FCFA
  Statut      : Détenu (locataire actif)
  Restitution : Estimée à la fin du bail (31/12/2026)

Total dépôts détenus         : 47 300 000 FCFA
  → Déduit de la trésorerie disponible nette
  → Inclus dans les décaissements futurs estimés
```

**09.4 Gestion des avoirs et remboursements**

Cas couverts :
- Remboursement de trop-perçu à un locataire
- Avoir commercial suite à litige résolu
- Remboursement de caution à locataire sortant
- Note de crédit reçue d'un fournisseur
- Remboursement de frais avancés

**09.5 Régularisation annuelle des charges locatives**

```
RÉGULARISATION CHARGES — EXERCICE 2025
════════════════════════════════════════════════════
Charges réelles 2025         : 187 500 000 FCFA
Provisions appelées 2025     : 172 000 000 FCFA
Solde à appeler              :  15 500 000 FCFA (appel complémentaire)
```

**09.6 Gestion des règlements partiels**

```
Facture loyer mars           : 2 478 000 FCFA (TTC)
Paiement reçu               : 1 800 000 FCFA

Traitement automatique :
  Encaissement partiel enregistré  : 1 800 000 FCFA
  Solde restant dû calculé         :   678 000 FCFA
  Règle d'imputation               : FIFO (dette la plus ancienne)
  Reliquat reprojeté dans prévision : date estimée selon profil
  Taux de recouvrement recalculé   : 72,6% sur cette période
  Alerte si reliquat > 30 jours    : déclenchée automatiquement
```

Règle d'imputation paramétrable par le DAF : FIFO / LIFO / Prorata / Manuel.

---

### MODULE 10 — LIGNES DE CRÉDIT COURT TERME

#### Description

Les lignes de crédit bancaires sont des ressources de trésorerie disponibles sous conditions. CashPilot les intègre dans les scénarios de trésorerie.

#### Fonctionnalités

**10.1 Référentiel des facilités bancaires**

| Paramètre | Description |
|-----------|------------|
| Banque | Institution prêteuse |
| Type | Découvert autorisé / Crédit de campagne / Avance sur créances / Ligne spot |
| Plafond autorisé | Montant maximum mobilisable |
| Montant utilisé | Encours actuel |
| Disponible | Plafond - Utilisé |
| Taux d'intérêt | Taux annuel (fixe ou variable + spread) |
| Date d'expiration | Date de renouvellement ou d'échéance |

**10.2 Intégration dans les scénarios**

```
Sans activation ligne de crédit
  Position critique détectée le 15 avril (-8 200 000 FCFA)

Avec activation ligne SGBCI (plafond 50M, taux 9% / an)
  Tirage requis              :  10 000 000 FCFA
  Coût mensuel intérêts      :     75 000 FCFA
  Position sécurisée jusqu'au: 30 juin ✅
```

**10.3 Suivi des covenants bancaires**

| Covenant | Valeur requise | Valeur actuelle | Statut |
|----------|---------------|----------------|--------|
| Ratio dette nette / EBITDA | ≤ 3,5x | 2,8x | ✅ |
| Ratio de couverture du service de la dette | ≥ 1,2x | 1,4x | ✅ |
| Trésorerie minimum | ≥ 50 000 000 FCFA | 130 823 700 FCFA | ✅ |
| Taux d'occupation | ≥ 75% | 82% | ✅ |

---

### MODULE 11 — TABLEAUX DE BORD & REPORTING

(Voir Chapitre 10 pour la spécification détaillée)

**Résumé des livrables :**

- **4 dashboards distincts** : DG/CEO, DAF/CFO, Trésorier, Center Manager
- **10 rapports standards** : Situation quotidienne, Plan 13 semaines, Rapport mensuel, Balance âgée, Recouvrement, Contentieux, Multi-banques, CAPEX, Fiscal, Rapport annuel
- **Exports** : PDF, Excel, CSV pour tous les rapports

---

### MODULE 12 — CAPEX — SUIVI FINANCIER & INTÉGRATION TRÉSORERIE

#### Description

Le CAPEX est fondamentalement différent des charges d'exploitation. CashPilot intègre le suivi CAPEX directement dans la prévision de trésorerie.

#### Fonctionnalités

**12.1 Fiche opération CAPEX**

```
OPÉRATION CAPEX — Réhabilitation façade CY
────────────────────────────────────────────────────────
Identification
  Code              : CAPEX-CY-2026-003
  Company           : Cosmos Yopougon
  Nature            : Maintenance lourde
  Enveloppe budget  : 45 000 000 FCFA (CAPEX 2026)

Contractuel
  Prestataire       : Entreprise ABC
  Montant marché HT : 42 500 000 FCFA
  TVA (18%)         :  7 650 000 FCFA
  Montant TTC       : 50 150 000 FCFA

Échéancier de paiement
  Acompte 30%  : 12 750 000 FCFA  01/04/2026  ECOBANK CAPEX
  Situation 1  : 12 750 000 FCFA  30/04/2026  ECOBANK CAPEX
  Situation 2  : 12 750 000 FCFA  31/05/2026  ECOBANK CAPEX
  Solde 10%    :  4 250 000 FCFA  30/06/2026  ECOBANK CAPEX

Retenue de garantie
  Taux          : 5% du marché HT = 2 125 000 FCFA
  Libération    : 01/04/2027 (12 mois après réception)
```

**12.2 Suivi financier en temps réel**

| Indicateur | Valeur | Statut |
|-----------|--------|--------|
| Budget alloué | 45 000 000 FCFA | Référence |
| Engagé (marché signé) | 42 500 000 FCFA | -2 500 000 vs budget ✅ |
| Facturé | 25 500 000 FCFA | 60% de l'engagé |
| Décaissé | 12 750 000 FCFA | 30% de l'engagé |
| Reste à décaisser | 29 750 000 FCFA | Projeté dans prévision |

**12.3 Tableau de bord CAPEX consolidé**

```
CAPEX 2026 — CONSOLIDÉ GROUPE
══════════════════════════════════════════════════════

                    Budget      Engagé    Décaissé  Reste à
                    (FCFA)      (FCFA)    (FCFA)    décaisser
Cosmos Yopougon  330 000 000  287 500 000  134 500 000  153 000 000
Cosmos Angré     393 800 000  199 700 000            0  199 700 000
────────────────────────────────────────────────────────────────────
TOTAL GROUPE     723 800 000  487 200 000  134 500 000  352 700 000
```

**12.4 Règle de glissement**

Si une situation de travaux attendue n'est pas reçue à sa date prévue, le système recale automatiquement le décaissement probable.

---

### MODULE 13 — PISTE D'AUDIT & CONTRÔLE INTERNE

#### Description

Chaque action effectuée dans CashPilot est tracée de manière immuable.

#### Fonctionnalités

**13.1 Journal d'audit complet**

| Champ | Description |
|-------|------------|
| Horodatage | Date et heure exactes (UTC) |
| Utilisateur | Identité de l'auteur de l'action |
| Action | Type d'action (création / modification / suppression / validation / rejet) |
| Module | Module concerné |
| Entité | Objet concerné |
| Valeur avant | État avant modification |
| Valeur après | État après modification |
| Adresse IP | Pour les actions sensibles |
| Motif | Champ obligatoire pour les modifications de données validées |

**13.2 Immuabilité des données**

- Aucune donnée validée ne peut être supprimée — correction par écriture inverse
- Les clôtures de période sont irréversibles
- Les politiques RLS empêchent toute modification directe en base de données

**13.3 Clôtures de période**

```
PROCÉDURE DE CLÔTURE MENSUELLE
  Étape 1 : Rapprochement bancaire complet (tous comptes ✅)
  Étape 2 : Validation des flux non identifiés (file vide ✅)
  Étape 3 : Arrêté des caisses et Mobile Money (✅)
  Étape 4 : Réconciliation inter-modules (écart = 0 ✅)
  Étape 5 : Export comptable vers Atlas Finance (si connecté)
  Étape 6 : Validation DAF (signature électronique)
  Étape 7 : Clôture irréversible de la période
```

**13.4 Réconciliation inter-modules**

```
ÉQUATION DE RÉCONCILIATION
Position bancaire réelle (relevés confirmés)
= Trésorerie ouverture
+ Encaissements confirmés (tous modules)
- Décaissements confirmés (tous modules)
+ Transferts entrants confirmés
- Transferts sortants confirmés
+ Soldes caisses + Mobile Money + Cartes
- Passif cartes cadeaux

Écart = 0 ✅ → Clôture autorisée
Écart ≠ 0 ❌ → Clôture bloquée — investigation obligatoire
```

---

### MODULE 14 — CAISSE PHYSIQUE & MOBILE MONEY

#### Description

La caisse physique et le Mobile Money constituent des circuits de liquidité à part entière en zone UEMOA.

#### Fonctionnalités

**14.1 Référentiel des caisses physiques**

| Paramètre | Description |
|-----------|------------|
| Nom de la caisse | Identification libre |
| Responsable | Utilisateur propriétaire |
| Plafond maximum autorisé | Au-delà : reversement en banque obligatoire |
| Seuil minimum | En dessous : alerte réapprovisionnement |
| Fréquence d'arrêté obligatoire | Quotidien / Hebdomadaire |

**14.2 Référentiel Mobile Money**

| Paramètre | Description |
|-----------|------------|
| Opérateur | Orange Money / MTN / Wave / Moov / autre |
| Numéro de compte entreprise | Identifiant |
| Plafond de transaction | Limite opérateur |
| Frais de transaction | % ou montant fixe selon opérateur |
| Délai de disponibilité | H+0 / H+2 selon opérateur |

**14.3 Circuit de validation des sorties caisse**

```
CIRCUIT SORTIE CAISSE
Demande créée dans CashPilot
  → Qui demande / Montant / Objet / Pièce justificative

Validation selon seuil
  < 50 000 FCFA         → Responsable caisse
  50 000 → 200 000 FCFA → Center Manager
  > 200 000 FCFA        → DAF / DGA

Justification obligatoire sous 48h
Non justifié à J+48    → Alerte automatique + escalade
```

**14.4 Arrêté de caisse**

```
ARRÊTÉ CAISSE PRINCIPALE — [Date] — [Responsable]
══════════════════════════════════════════════════

Solde théorique (calculé)        : X FCFA
Solde compté physiquement        : X FCFA
────────────────────────────────────────────
ÉCART                            : X FCFA

Si écart < 1 000 FCFA            → Noté, justification libre
Si écart 1 000–10 000 FCFA       → Justification obligatoire 24h
Si écart > 10 000 FCFA           → Blocage caisse + alerte DAF/DGA
```

**14.5 Position complète intégrée**

```
POSITION TRÉSORERIE TOTALE — [Date]
════════════════════════════════════════════════════
Comptes bancaires              : X FCFA
Caisses physiques              : X FCFA
Mobile Money                   : X FCFA
Cartes prépayées               : X FCFA
────────────────────────────────────────────────────
Sous-total disponibilités brutes : X FCFA
Passif cartes cadeaux          : -X FCFA
Passif dépôts de garantie      : -X FCFA
────────────────────────────────────────────────────
POSITION NETTE RÉELLE          : X FCFA
```

---

### MODULE 15 — CARTES PRÉPAYÉES & CARTES CADEAUX

#### Description

Les cartes prépayées d'entreprise constituent un circuit de liquidité distinct. Les cartes cadeaux émises par l'entreprise créent un passif spécifique.

#### Fonctionnalités

**15.1 Cartes prépayées entreprise**

Cycle de vie : Création & paramétrage → Alimentation → Dépenses → Relevé mensuel → Rechargement ou clôture

**15.2 Cartes cadeaux**

```
GESTION CARTES CADEAUX COSMOS CLUB
════════════════════════════════════════════════════
Stock émis non utilisé    : 12 cartes — 480 000 FCFA
  → Passif envers porteurs (déduit trésorerie nette)

Traitement comptable
  Vente carte cadeau → encaissement immédiat + passif carte
  Utilisation carte  → transfert passif → règlement locataire
  Expiration         → reprise en produit exceptionnel
```

---

### MODULE 16 — TRANSFERTS INTERNES & COMPTE DE TRANSIT

#### Description

Les transferts internes sont des mouvements d'argent entre deux comptes appartenant à la même entité ou au même groupe. Leur traitement incorrect est la source la plus fréquente d'erreurs.

#### Fonctionnalités

**16.1 Qualification obligatoire**

Tout flux entre deux comptes internes doit être qualifié avant traitement.

**16.2 Gestion du compte de transit**

```
J0 14h00 — Virement SGBCI → ECOBANK 28 000 000 FCFA
  SGBCI débité            : -28 000 000 FCFA ✅
  Compte transit          : +28 000 000 FCFA (en attente)
  ECOBANK pas encore crédité

J1 09h00 — Crédit reçu ECOBANK
  Compte transit          : -28 000 000 FCFA (soldé) ✅
  ECOBANK crédité         : +28 000 000 FCFA ✅
```

**16.3 Transferts inter-entités**

```
Avance trésorerie Cosmos Yopougon → Cosmos Angré
  Montant              : 50 000 000 FCFA
  Nature               : Avance de trésorerie inter-co
  Taux d'intérêt       : 6% / an
  Remboursement prévu  : 01/09/2026

Traitement comptable
  Company Yopougon : Créance sur Angré +50M
  Company Angré    : Dette envers Yopougon +50M
  Consolidation    : ÉLIMINÉ (flux interne groupe)
```

**16.4 Matrice de validation des transferts**

| Montant | Validation |
|---------|-----------|
| < 500 000 FCFA | Responsable caisse / DAF |
| 500K → 5M FCFA | DAF — même jour |
| 5M → 50M FCFA | DAF + DGA — 24h |
| > 50M FCFA | DAF + DGA + DG — 48h |
| Inter-entités (tout montant) | DGA + DG + convention signée |

---

### MODULE 17 — PLACEMENTS & OPTIMISATION DU RENDEMENT

#### Description

CashPilot identifie les excédents de trésorerie et facilite leur placement dans des instruments adaptés.

#### Fonctionnalités

**17.1 Détection des excédents plaçables**

```
Compte UBA Provision — Solde actuel : 57 700 000 FCFA
Seuil maximum paramétré            : 30 000 000 FCFA
Excédent plaçable identifié        : 27 700 000 FCFA

Suggestion de placement :
  → DAT SGBCI 3 mois — taux 5,5% / an
  → Bon du Trésor UMOA-Titres 91j — taux 6,1% / an ← Recommandé
  → OPCVM monétaire — taux variable ~4,8%
```

**17.2 Référentiel des placements**

| Paramètre | Description |
|-----------|------------|
| Instrument | DAT / Bon du Trésor / OPCVM / Autre |
| Montant placé | Capital investi |
| Taux | Taux de rendement annuel |
| Date d'échéance | Date de remboursement du capital |
| Disponibilité | Liquide / Bloqué / Rachat avec pénalité |

**17.3 Tableau de bord des placements**

```
PLACEMENTS EN COURS — [Date]
════════════════════════════════════════════════════
                    Montant    Taux   Échéance  Intérêts
DAT SGBCI           20 000 000  5,5%  18/06/26   275 000
Bon Trésor UMOA     15 000 000  6,1%  01/07/26   230 000
────────────────────────────────────────────────────────
TOTAL PLACÉ         35 000 000         —          505 000

Rendement annualisé moyen      : 5,74%
```

---

### MODULE 18 — DETTE FINANCIÈRE & PLAN DE FINANCEMENT

#### Description

La dette financière structurelle génère des décaissements certains et récurrents qui doivent être parfaitement intégrés dans la prévision.

#### Fonctionnalités

**18.1 Référentiel des contrats d'emprunt**

```
CONTRAT D'EMPRUNT — SGBCI — Financement Cosmos Angré
────────────────────────────────────────────────────────
  Capital initial      : 800 000 000 FCFA
  Durée                : 120 mois (10 ans)
  Taux d'intérêt       : 7,5% fixe annuel
  Mensualité totale    :   9 850 000 FCFA
  Capital restant dû   : 687 400 000 FCFA (au 18/03/2026)

Covenants
  Taux d'occupation min: 75%
  DSCR minimum         : 1,2x
  Trésorerie minimum   : 50 000 000 FCFA
```

**18.2 Plan de financement dynamique**

```
PLAN DE FINANCEMENT DYNAMIQUE — GROUPE CRMC — 2026-2028
══════════════════════════════════════════════════════════

BESOINS (EMPLOIS)                    2026        2027        2028
CAPEX Cosmos Yopougon            330 000 000  150 000 000   80 000 000
CAPEX Cosmos Angré               393 800 000  120 000 000   50 000 000
Remboursements emprunts          118 200 000  118 200 000  118 200 000
BFR à financer                    20 000 000   15 000 000   10 000 000
────────────────────────────────────────────────────────────────────
TOTAL BESOINS                    862 000 000  403 200 000  258 200 000

RESSOURCES                           2026        2027        2028
Cash flow exploitation           520 000 000  610 000 000  720 000 000
Trésorerie disponible au 01/01   130 823 700  110 000 000  180 000 000
Placements arrivant à échéance    35 000 000   20 000 000   15 000 000
Lignes de crédit disponibles      50 000 000   50 000 000   50 000 000
────────────────────────────────────────────────────────────────────
TOTAL RESSOURCES                 735 823 700  790 000 000  965 000 000

SOLDE (Besoin) / Excédent       -126 176 300 +386 800 000 +706 800 000

⚠️ GAP 2026 : -126 176 300 FCFA → Financement complémentaire requis
```

---

### MODULE 19 — WORKFLOW VALIDATION PAIEMENTS & DOA

#### Description

CashPilot intègre le workflow d'approbation des paiements directement dans la Délégation d'Autorité (DOA) de l'entreprise.

#### Fonctionnalités

**19.1 Paramétrage de la DOA**

| Nature du paiement | Seuil | Approbateur(s) | Délai max |
|-------------------|-------|----------------|-----------|
| Tout paiement | < 500 000 FCFA | DAF seul | Immédiat |
| Tout paiement | 500K – 5M FCFA | DAF + DGA | 24h |
| Tout paiement | 5M – 50M FCFA | DAF + DGA + DG | 48h |
| Tout paiement | > 50M FCFA | DAF + DGA + DG + CA | 72h |
| CAPEX (tout montant) | > 5M FCFA | DAF + DGA + DG | 48h |
| Transfert inter-co | Tout montant | DGA + DG + Conv. | Avant exécution |
| Paiement urgence | Tout montant | DGA seul (notif. DG) | Immédiat |

**19.2 Circuit de validation**

```
CIRCUIT STANDARD
1. Création de la demande de paiement
2. Vérifications automatiques (fournisseur référencé, provision, budget, doublons)
3. Routage automatique selon DOA
4. Approbation / Rejet (signature électronique)
5. Exécution
6. Archivage (piste d'audit complète)
```

**19.3 Tableau de bord des paiements en attente**

```
PAIEMENTS EN ATTENTE DE VALIDATION — [Date]
════════════════════════════════════════════════════
En attente de mon approbation (vue DAF)
  #001  Entrepreneur CAPEX  42 500 000 FCFA  ⏳ Validé DGA — attend DG
  #002  Énergie SODECI       1 850 000 FCFA  ⏳ Attend DAF (vous)
  #003  Cabinet conseil      3 500 000 FCFA  ⏳ Attend DAF (vous)

Paiements urgents
  #005  Réparation urgente     480 000 FCFA  ⚡ Approuvé DGA — exécution aujourd'hui
```

**19.4 Notifications et rappels**

- Notification push mobile dès qu'un paiement requiert l'approbation
- Rappel à H+4 si aucune action
- Escalade automatique si délai DOA dépassé
- Résumé quotidien des paiements en attente

---

## CHAPITRE 6 — EXIGENCES NON FONCTIONNELLES / NON-FUNCTIONAL REQUIREMENTS

### 6.1 Performance

| Exigence | Cible | Priorité |
|----------|-------|----------|
| Temps de chargement dashboard | < 2 secondes | Critique |
| Temps de calcul prévision J+30 | < 5 secondes | Critique |
| Temps de calcul prévision J+365 | < 30 secondes | Important |
| Import relevé bancaire (500 lignes) | < 10 secondes | Important |
| Matching automatique (500 transactions) | < 15 secondes | Important |
| Export PDF rapport mensuel | < 10 secondes | Important |
| Concurrence utilisateurs par tenant | 50 simultanés sans dégradation | Critique |
| Temps de réponse API Supabase | < 200ms (p95) | Important |

### 6.2 Disponibilité & Fiabilité

| Exigence | Cible |
|----------|-------|
| SLA disponibilité | 99,5% (hors maintenance planifiée) |
| Fenêtre de maintenance | Dimanche 02h00–04h00 UTC |
| RPO (Recovery Point Objective) | < 1 heure |
| RTO (Recovery Time Objective) | < 4 heures |
| Sauvegarde automatique | Quotidienne + point-in-time recovery Supabase |
| Dégradation gracieuse | Fonctionnalités de saisie disponibles même si calcul ML indisponible |

### 6.3 Sécurité

| Exigence | Implémentation |
|----------|---------------|
| Authentification | Supabase Auth — email/password + MFA TOTP |
| Isolation des données | Row Level Security PostgreSQL (100% des tables) |
| Chiffrement at-rest | AES-256 (natif Supabase) |
| Chiffrement in-transit | TLS 1.3 obligatoire |
| Sessions | JWT avec expiration 8h + refresh token |
| Politique de mots de passe | Minimum 12 caractères, complexité obligatoire |
| MFA | Obligatoire pour les rôles DAF, DGA, DG, Tenant Admin |

### 6.4 Scalabilité

| Dimension | Capacité cible |
|-----------|---------------|
| Nombre de tenants | 1 000+ |
| Companies par tenant | 50+ |
| Utilisateurs par tenant | 500+ |
| Transactions par company / mois | 50 000+ |
| Volume de données par tenant | 10 GB+ sur 5 ans |
| Historique conservé | 10 ans minimum |

### 6.5 Conformité

| Exigence | Détail |
|----------|--------|
| RGPD / Loi ivoirienne | Consentement utilisateur, droit à l'oubli, export des données personnelles |
| OHADA / SYSCOHADA | Terminologie et structure budgétaire conformes au plan comptable SYSCOHADA révisé 2017 |
| BCEAO | Export dans le format requis pour les obligations de reporting |
| Hébergement des données | Préférence hébergement en zone Afrique de l'Ouest |
| Rétention des données | Minimum 10 ans pour les données financières (obligation légale OHADA) |

---

## CHAPITRE 7 — ARCHITECTURE TECHNIQUE FRONTEND-ONLY + SUPABASE BaaS

### 7.1 Principe fondateur

**CashPilot ne possède aucun backend propriétaire.** Ce choix est non négociable.

### 7.2 Stack technologique

```
FRONTEND
  Framework         : React 18 + TypeScript (strict mode)
  State management  : Zustand (global) + React Query (server state)
  Styling           : Tailwind CSS 3 + shadcn/ui components
  Charts            : Recharts + D3.js (visualisations complexes)
  Forms             : React Hook Form + Zod (validation)
  Tables            : TanStack Table v8
  PDF generation    : React-PDF
  Excel export      : SheetJS (xlsx)
  Date management   : date-fns
  Internationalisation : i18next (FR / EN)
  Build             : Vite
  Tests             : Vitest + React Testing Library + Playwright (E2E)

BACKEND-AS-A-SERVICE (Supabase)
  Base de données   : PostgreSQL 15 (hébergé Supabase)
  Authentification  : Supabase Auth (JWT + MFA)
  API               : PostgREST (auto-généré depuis le schéma PostgreSQL)
  Temps réel        : Supabase Realtime (WebSockets)
  Stockage fichiers : Supabase Storage
  Fonctions serveur : Supabase Edge Functions (Deno)
  Sécurité          : Row Level Security PostgreSQL
  Tâches planifiées : pg_cron

DÉPLOIEMENT
  Hosting frontend  : Vercel (ou Netlify) — CDN mondial
  CI/CD             : GitHub Actions → tests → build → deploy Vercel
  Monitoring        : Supabase Dashboard + Sentry
  Analytics         : PostHog
```

### 7.3 Schéma de la base de données

#### Tables de configuration

```sql
-- Tenants (clients CashPilot)
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  plan        TEXT NOT NULL, -- starter / business / corporate / enterprise
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Companies (entités juridiques)
CREATE TABLE companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,
  legal_form  TEXT,
  country     TEXT NOT NULL DEFAULT 'CI',
  currency    TEXT NOT NULL DEFAULT 'XOF',
  fiscal_year_start INTEGER DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Utilisateurs et accès
CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  full_name   TEXT NOT NULL,
  role_tenant TEXT NOT NULL
);

CREATE TABLE user_company_access (
  user_id     UUID REFERENCES user_profiles(id),
  company_id  UUID REFERENCES companies(id),
  role        TEXT NOT NULL,
  PRIMARY KEY (user_id, company_id)
);
```

#### Tables métier principales

```sql
-- Comptes bancaires
CREATE TABLE bank_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  company_id      UUID NOT NULL REFERENCES companies(id),
  name            TEXT NOT NULL,
  bank_name       TEXT NOT NULL,
  account_number  TEXT,
  currency        TEXT NOT NULL DEFAULT 'XOF',
  min_balance     BIGINT DEFAULT 0,
  max_balance     BIGINT,
  account_type    TEXT NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Contreparties (locataires + fournisseurs)
CREATE TABLE counterparties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  company_id      UUID NOT NULL REFERENCES companies(id),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL,
  payment_delay_days INTEGER DEFAULT 0,
  payment_delay_std  NUMERIC DEFAULT 0,
  recovery_rate   NUMERIC DEFAULT 1.0,
  risk_score      INTEGER DEFAULT 3,
  status          TEXT DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Flux de trésorerie (réalisé)
CREATE TABLE cash_flows (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  company_id      UUID NOT NULL REFERENCES companies(id),
  account_id      UUID REFERENCES bank_accounts(id),
  counterparty_id UUID REFERENCES counterparties(id),
  flow_date       DATE NOT NULL,
  value_date      DATE,
  amount          BIGINT NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'XOF',
  category        TEXT NOT NULL,
  status          TEXT NOT NULL,
  source          TEXT NOT NULL,
  reference       TEXT,
  description     TEXT,
  forecast_id     UUID,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Prévisions
CREATE TABLE forecasts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  company_id      UUID NOT NULL REFERENCES companies(id),
  account_id      UUID REFERENCES bank_accounts(id),
  counterparty_id UUID REFERENCES counterparties(id),
  forecast_date   DATE NOT NULL,
  amount          BIGINT NOT NULL,
  amount_optimistic BIGINT,
  amount_pessimistic BIGINT,
  probability     NUMERIC NOT NULL DEFAULT 1.0,
  certainty_class TEXT NOT NULL,
  method          TEXT NOT NULL,
  category        TEXT NOT NULL,
  status          TEXT DEFAULT 'active',
  realized_id     UUID REFERENCES cash_flows(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### Politique RLS type

```sql
ALTER TABLE cash_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_company_isolation" ON cash_flows
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    AND company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
    )
  );
```

### 7.4 Edge Functions Supabase

| Edge Function | Déclencheur | Rôle |
|--------------|------------|------|
| parse-mt940 | Upload relevé bancaire | Parser MT940 → transactions normalisées |
| parse-csv-bank | Upload relevé CSV | Mapping colonnes configurable |
| run-forecast-engine | Recalibrage périodique | Calcul ML complet (ARIMA, LSTM) |
| compute-scenarios | Modification paramètre | Recalcul scénarios |
| match-transactions | Import relevé | Algorithme de matching |
| check-alerts | Recalibrage forecast | Vérification seuils |
| send-notifications | Alerte générée | Push notification + email |
| generate-pdf-report | Demande d'export | Génération PDF |
| compute-capex-summary | Mise à jour CAPEX | Recalcul indicateurs CAPEX |
| eliminate-intercompany | Clôture période | Élimination flux inter-companies |

### 7.5 Tâches planifiées (pg_cron)

| Tâche | Fréquence | Description |
|-------|-----------|-------------|
| Recalibrage quotidien | Chaque matin 06h00 | Recalcul J+7 |
| Recalibrage hebdomadaire ML | Dimanche 03h00 | Réentraînement modèles |
| Vérification échéances fiscales | Quotidien | Alertes si échéance dans 10 jours |
| Vérification seuils comptes | Toutes les heures | Alertes trésorerie temps réel |
| Calcul intérêts inter-companies | Mensuel (1er du mois) | Facturation intérêts avances |

---

## CHAPITRE 8 — INTÉGRATIONS & INTEROPÉRABILITÉ

### 8.1 Connecteurs bancaires

| Format | Standard | Banques cibles | Implémentation |
|--------|---------|---------------|----------------|
| MT940 | SWIFT | SGBCI, ECOBANK, UBA, BNI, NordEst | Edge Function parser |
| CAMT.053 | ISO 20022 | Filiales groupes internationaux | Edge Function parser |
| CSV propriétaire | Spécifique | BICICI, Versus Bank, NSIA, Coris | Templates configurables |
| Excel | — | Toute banque avec export Excel | Mapping colonnes UI |
| PDF (OCR) | — | Banques sans export structuré | OCR + validation manuelle |
| API Open Banking | En développement | SGBCI (si API disponible) | Webhooks entrants |

### 8.2 Connecteurs Mobile Money

| Opérateur | Méthode | Données disponibles |
|-----------|---------|-------------------|
| Orange Money CI | Export CSV relevé | Transactions, solde |
| MTN Mobile Money CI | Export CSV relevé | Transactions, solde |
| Wave | Export CSV / API | Transactions, solde |
| Moov Money | Export CSV | Transactions, solde |

### 8.3 Intégration Atlas Studio (Praedium Tech)

| Produit | Direction | Données échangées |
|---------|-----------|------------------|
| Atlas Finance (ERP comptable) | Bidirectionnel | Écritures de trésorerie ↔ journaux comptables |
| COCKPIT (gestion de projet) | CashPilot ← COCKPIT | Décaissements CAPEX programmés |
| PRISM BI | CashPilot → PRISM | Données brutes pour analyses avancées |
| P-Screen (scoring locataires) | P-Screen → CashPilot | Score de risque locataire |

Protocole d'intégration : API REST via Supabase PostgREST + authentification service account.

### 8.4 API ouverte / Open API

CashPilot expose une API documentée (OpenAPI 3.0) :

```
GET  /api/v1/treasury/position          — Position de trésorerie consolidée
GET  /api/v1/treasury/forecast          — Prévisions par horizon
GET  /api/v1/treasury/accounts          — Liste et soldes des comptes
POST /api/v1/treasury/flows             — Enregistrement d'un flux
POST /api/v1/treasury/bank-import       — Import relevé bancaire
GET  /api/v1/capex/summary              — Résumé CAPEX
GET  /api/v1/reports/monthly            — Rapport mensuel (JSON)
POST /api/v1/payments/requests          — Création demande de paiement
GET  /api/v1/payments/pending           — Paiements en attente de validation
```

Authentification : API Key (header `X-CashPilot-API-Key`) + restriction par IP.

---

## CHAPITRE 9 — EXPÉRIENCE UTILISATEUR & DESIGN

### 9.1 Principes UX

- **Densité d'information calibrée** : les décideurs voient l'essentiel en 10 secondes ; les opérationnels ont accès au détail en 2 clics maximum
- **Mobile-first pour les décideurs** : le dashboard DG doit être parfaitement utilisable sur smartphone
- **Desktop-first pour les opérationnels** : les modules de saisie et de rapprochement sont optimisés pour desktop
- **Temps de prise en main < 2 heures** pour un trésorier avec expérience Excel
- **Zéro ambiguïté sur les chiffres** : toujours afficher la devise, la date de référence et le périmètre
- **Les alertes ne doivent jamais surprendre** : chaque alerte indique le délai disponible avant l'impact

### 9.2 Architecture de l'information

```
CashPilot
├── Dashboard (vue synthétique selon profil)
├── Trésorerie
│   ├── Position actuelle (tous comptes)
│   ├── Prévisions (J+7 / J+30 / J+90 / J+365)
│   ├── Scénarios & Stress tests
│   └── Plan 13 semaines
├── Encaissements
│   ├── Saisie encaissement
│   ├── Import relevé bancaire
│   ├── Matching & Rapprochement
│   └── Balance âgée créances
├── Décaissements
│   ├── Saisie décaissement
│   ├── Paiements en attente (DOA)
│   └── Calendrier des échéances
├── Comptes
│   ├── Bancaires
│   ├── Caisses
│   ├── Mobile Money
│   └── Cartes prépayées
├── Transferts internes
├── CAPEX
│   ├── Tableau de bord CAPEX
│   ├── Opérations
│   └── Échéancier
├── Dette & Financement
│   ├── Contrats d'emprunt
│   ├── Plan de financement
│   └── Covenants
├── Placements
├── Contentieux
├── Budget
│   ├── Saisie / Import budget
│   └── Révisions
├── Paramétrage
│   ├── Contreparties (locataires / fournisseurs)
│   ├── Profils de paiement
│   ├── Indexations
│   ├── DOA
│   └── Calendrier fiscal
├── Reporting
│   ├── Rapports standards (10 rapports)
│   └── Exports
└── Administration
    ├── Utilisateurs & Droits
    ├── Companies
    ├── Consolidation groupe
    └── Piste d'audit
```

### 9.3 Internationalisation

| Paramètre | Options |
|-----------|---------|
| Langues | Français (défaut) / Anglais |
| Devise d'affichage | FCFA (XOF) / EUR / USD / XAF / GNF / autres |
| Format des nombres | Espace milliers (1 500 000) ou virgule (1,500,000) |
| Format des dates | JJ/MM/AAAA (FR) ou MM/DD/YYYY (EN) |
| Calendrier fiscal | Ivoirien (défaut) / Camerounais / Sénégalais / Personnalisé |

### 9.4 Accessibilité

- Contraste WCAG AA minimum
- Navigation clavier complète
- Labels ARIA sur tous les champs de formulaire
- Support lecteur d'écran (NVDA, VoiceOver)

---

## CHAPITRE 10 — TABLEAUX DE BORD & REPORTING — SPÉCIFICATION DÉTAILLÉE

### 10.1 Dashboard DG / CEO

```
VUE PRINCIPALE
══════════════════════════════════════════════════════

POSITION CONSOLIDÉE GROUPE                    [18/03/2026]
  Trésorerie nette réelle    :  130 823 700 FCFA
  Prévision J+30             :  108 200 000 FCFA  ▼-17%
  Prévision J+90             :   94 700 000 FCFA  ▼-28%

ALERTES ACTIVES (2)
  🔴 ECOBANK CAPEX : déficit prévu le 15/04 (-12,3M FCFA)
  ⚠️ MY PLACE : audience le 28/04 (J-10)

ÉCART BUDGET VS RÉALISÉ (Mars 2026)
  Revenus      : -4,2%  ⚠️    Charges : +1,8%  ✅

TOP 3 LOCATAIRES EN RETARD
  MY PLACE      : 24 800 000 FCFA  >90 jours  🔴
  Locataire C   :  3 200 000 FCFA   60-90j    ⚠️
  Locataire B   :  1 800 000 FCFA   30-60j    🟡

PAIEMENTS EN ATTENTE MON APPROBATION (1)
  Entrepreneur CAPEX  :  42 500 000 FCFA  ⏳ Urgent

PAR ENTITÉ
  Cosmos Yopougon  :  +92 500 000 FCFA  ✅
  Cosmos Angré     :  +38 323 700 FCFA  ✅
```

### 10.2 Dashboard DAF / CFO

```
POSITION BANCAIRE TEMPS RÉEL
  [Tableau multi-comptes avec soldes, prévisions J+7, statuts]

PLAN 13 SEMAINES (glissant — mis à jour chaque lundi)

ACTIONS DU JOUR
  Flux non identifiés à qualifier   : 3
  Arrêtés de caisse manquants       : 1
  Paiements à approuver             : 3
  Relevés bancaires non importés    : 0 ✅

TVA À DÉCAISSER CE MOIS
  Montant : 7 200 000 FCFA  |  Échéance : 15/04/2026  |  J-28

RATIOS DE TRÉSORERIE
  Days Cash on Hand    : 47 jours  ✅
  DSO (délai clients)  : 38 jours  ✅
  Taux recouvrement    : 91%       ✅
  DSCR                 : 1,4x      ✅
```

### 10.3 Dashboard Trésorier

```
À TRAITER AUJOURD'HUI
  Encaissements reçus à matcher  : 5 transactions
  Flux non identifiés            : 3
  Arrêtés de caisse en attente   : 1 (Caisse principale)
  Justificatifs en retard (>48h) : 2

PROCHAINES ÉCHÉANCES (7 jours)
  20/03  SODECI Eau          1 100 000 FCFA  SGBCI
  22/03  Sécurité (loyer fév) 4 200 000 FCFA  SGBCI
  25/03  Salaires            28 400 000 FCFA  SGBCI
```

### 10.4 Dashboard Center Manager

```
RELANCES DU JOUR (3 locataires)
  MY PLACE      : 24,8M FCFA — Contentieux — Audience 28/04
  Locataire C   :  3,2M FCFA — 75 jours — Mise en demeure requise
  Locataire B   :  1,8M FCFA — 45 jours — 2ème relance

ÉTAT DE MA CAISSE
  Caisse principale  :  1 572 000 FCFA  ✅
  Orange Money       :  1 015 200 FCFA  ✅

STATUT LOCATAIRES
  À jour      : 34 (72%)  ✅
  En retard   :  9 (19%)  ⚠️
  Contentieux :  3 (6%)   🔴
  Vacant      :  1 (2%)
```

### 10.5 Les 10 rapports standards

1. **Situation de trésorerie quotidienne** — Soldes réels par compte, flux du jour, position nette
2. **Plan de trésorerie 13 semaines glissantes** — Flux semaine par semaine sur 13 semaines
3. **Rapport de trésorerie mensuel** — Réalisé vs prévu vs budget pour le mois écoulé
4. **Balance âgée des créances** — Créances par ancienneté et par locataire
5. **Tableau de bord de recouvrement** — Taux de recouvrement global et par locataire, DSO
6. **Rapport contentieux mensuel** — Dossiers actifs, provisions, frais
7. **Rapport multi-banques mensuel** — Position par compte, frais bancaires
8. **Rapport CAPEX trésorerie mensuel** — Budget / Engagé / Facturé / Décaissé
9. **Rapport fiscal et échéancier des taxes** — Taxes du mois, calendrier fiscal
10. **Rapport annuel de trésorerie** — Bilan exercice, performance modèle, recommandations

Tous les rapports sont exportables en **PDF, Excel et CSV**.

### 10.6 Visualisations clés

```
Courbe de trésorerie prévisionnelle multi-scénarios

Position (FCFA M)
    │                              ── Optimiste
150M┤                         ╭───
130M┤────╮               ╭────
110M┤    ╰─────╮    ╭────      ── Base
 90M┤          ╰────╯
 70M┤               ╰──────────── Pessimiste
 50M┤═══════════════════════════ Seuil minimum
    └──────────────────────────► Temps
      Auj J+7 J+30 J+60 J+90
```

Autres visualisations : Waterfall flux du mois, Balance âgée graphique, Écart budget/prévision/réalisé, Jauge CAPEX, Ratios financiers.

---

## CHAPITRE 11 — ROADMAP & PRIORISATION

### 11.1 Principe

CashPilot est livré complet en une seule version — pas de MVP intentionnellement tronqué.

### 11.2 Version initiale — Périmètre complet

Durée estimée : 9 à 12 mois (équipe de 3 à 5 développeurs)

| Phase | Durée | Modules | Pourquoi cet ordre |
|-------|-------|---------|--------------------|
| Phase 1 — Socle | 2 mois | Tenant/Company, Auth, Budget (M01), Balance ouverture (M02), Comptes (M06, M14, M15, M16) | Sans socle de données, rien ne fonctionne |
| Phase 2 — Prévision | 3 mois | Profils (M03), Moteur prévision (M04), Scénarios (M05) | Cœur de valeur du produit |
| Phase 3 — Opérationnel | 2 mois | Contentieux (M08), Fiscal (M09), CAPEX (M12), Transferts (M16), Caisse (M14) | Flux spécifiques et complexes |
| Phase 4 — Finance | 2 mois | Lignes de crédit (M10), Placements (M17), Dette (M18), DOA (M19) | Couche de pilotage financier avancé |
| Phase 5 — Reporting | 2 mois | Dashboards (M11), 10 rapports, Multi-entités (M07), Audit (M13) | Finalisation et mise en production |

### 11.3 Évolutions post-lancement (V1.1 → V2)

| Évolution | Priorité | Horizon |
|-----------|----------|---------|
| Connecteur API bancaire temps réel (Open Banking SGBCI) | Haute | 6 mois post-lancement |
| Application mobile native (React Native) | Haute | 6 mois |
| Intelligence artificielle Proph3t (Claude API) — assistant trésorerie | Haute | 6 mois |
| Benchmark sectoriel | Moyenne | 12 mois |
| Module FX avancé (couverture change, forward) | Moyenne | 12 mois |
| Intégration UMOA-Titres | Moyenne | 12 mois |
| Export format BCEAO officiel | Moyenne | 12 mois |
| Consolidation multi-devises avancée | Basse | 18 mois |
| Module tontine / épargne collective | Basse | 18 mois |

### 11.4 Matrice MoSCoW

- **Must have** : Modules 01, 02, 03, 04, 06, 11 (dashboard basique), 13, 14, multi-tenant/multi-company
- **Should have** : Modules 05, 07, 08, 09, 12, 16, 19
- **Could have** : Modules 10, 15, 17, 18, rapports 4 à 10
- **Won't have** (version initiale) : Application mobile native, Proph3t AI, Open Banking API temps réel

---

## CHAPITRE 12 — PLAN DE VALIDATION & RECETTE

### 12.1 Stratégie de test

| Type de test | Outil | Couverture cible | Responsable |
|-------------|-------|-----------------|-------------|
| Tests unitaires | Vitest | 80% logique métier | Développeur |
| Tests d'intégration | Vitest + Supabase local | Tous les modules | Développeur |
| Tests E2E | Playwright | Parcours critiques (20 scénarios) | QA |
| Tests de performance | k6 | Tous les endpoints critiques | DevOps |
| Tests de sécurité | OWASP ZAP + revue RLS | Toutes les politiques RLS | Sécurité |
| Tests de précision ML | Backtesting | MAPE < 8% à J+30 | Data scientist |
| UAT | — | 4 profils utilisateurs | Métier |

### 12.2 Métriques de précision du modèle ML

| Métrique | Seuil de validation | Mesure sur |
|----------|-------------------|-----------|
| MAPE J+7 | < 3% | Ensemble de test — 6 derniers mois |
| MAPE J+30 | < 8% | Ensemble de test — 6 derniers mois |
| MAPE J+90 | < 15% | Ensemble de test — 6 derniers mois |
| Taux de matching bancaire | > 85% auto | Sur 500 transactions test |

### 12.3 Critères de go-live

- [ ] Tous les tests unitaires passent (0 erreur)
- [ ] Tests E2E : 20/20 scénarios critiques validés
- [ ] Performance : tous les SLA respectés sous charge (50 utilisateurs simultanés)
- [ ] Sécurité : 0 vulnérabilité critique, 0 fuite inter-tenant détectée
- [ ] Précision ML : MAPE J+30 < 8% sur données de test
- [ ] UAT : validation formelle par les 4 profils utilisateurs
- [ ] Documentation utilisateur complète (FR + EN)
- [ ] Plan de support activé

### 12.4 Gestion des anomalies

| Sévérité | Définition | SLA correction |
|----------|-----------|---------------|
| P0 — Critique | Perte de données / faille sécurité / application inaccessible | < 4 heures |
| P1 — Bloquant | Fonctionnalité majeure indisponible | < 24 heures |
| P2 — Important | Fonctionnalité dégradée mais contournement possible | < 72 heures |
| P3 — Mineur | Bug cosmétique ou ergonomie | Prochain sprint |

---

## CHAPITRE 13 — GOUVERNANCE, BUDGET & MODÈLE OPÉRATIONNEL

### 13.1 Organisation projet

| Rôle | Responsabilité |
|------|---------------|
| Product Owner | Praedium Tech (DGA) — priorisation, validation fonctionnelle, go/no-go |
| Lead Developer | Architecture technique, revues de code, qualité |
| Développeur Frontend | Implémentation React + TypeScript |
| Développeur Supabase | Schéma PostgreSQL, RLS, Edge Functions, pg_cron |
| Data Scientist | Modèles ML (ARIMA, LSTM), backtesting, monitoring |
| QA Engineer | Tests E2E, tests de performance |
| UX Designer | Maquettes, design system, tests utilisateurs |

### 13.2 Méthodologie

- **Agilité Scrum** : sprints de 2 semaines
- **Cérémonies** : Sprint planning / Daily standup / Sprint review / Rétrospective
- **Outils** : Notion (documentation) / Linear (backlog) / GitHub (code + CI/CD) / Figma (design)
- **Definition of Done** : code reviewé + tests unitaires passants + UAT partiel + documentation mise à jour

### 13.3 Budget prévisionnel de développement

| Poste | Estimation |
|-------|-----------|
| Développement (9 mois × équipe 4 ETP) | À définir selon localisation équipe |
| Supabase Pro plan (développement) | ~150 USD / mois |
| Supabase Pro plan (production) | ~300-500 USD / mois selon volume |
| Vercel Pro (hosting frontend) | ~20 USD / mois |
| Outils (Figma, Linear, Sentry, PostHog) | ~200 USD / mois |
| Infrastructure ML (si compute externe) | ~100-300 USD / mois |
| Licences et APIs (OCR, notifications) | ~100-200 USD / mois |

### 13.4 Modèle de support post-lancement

| Niveau | Périmètre | SLA réponse |
|--------|-----------|------------|
| Support standard (inclus) | Bugs P2-P3, questions fonctionnelles | < 48h ouvrées |
| Support premium (forfait mensuel) | Bugs P0-P1, onboarding, formation | < 4h / 24h selon sévérité |
| Support Enterprise | SLA personnalisé, CSM dédié | Contractuel |

### 13.5 Plan de gestion du changement

- Onboarding guidé in-app (guided tour interactif)
- Templates de budget et de balance d'ouverture fournis (Excel CashPilot)
- Webinaires de formation par profil utilisateur
- Base de connaissances en ligne (FR + EN)
- Vidéos tutorielles pour les fonctionnalités complexes

---

## CHAPITRE 14 — ANNEXES / APPENDICES

### Annexe A — Glossaire / Glossary

| Terme | Définition (FR) | Definition (EN) |
|-------|----------------|-----------------|
| Balance d'ouverture | Stock de créances et dettes existantes au démarrage | Opening balance — existing receivables and payables at start date |
| BaaS | Backend-as-a-Service — infrastructure serveur hébergée et managée | Backend-as-a-Service |
| CAPEX | Capital Expenditure — investissements en immobilisations | Capital expenditure |
| Covenant | Clause financière imposée par un contrat de crédit | Financial covenant in a credit agreement |
| DSCR | Debt Service Coverage Ratio — ratio de couverture du service de la dette | Debt Service Coverage Ratio |
| DSO | Days Sales Outstanding — délai moyen d'encaissement | Days Sales Outstanding |
| DOA | Délégation d'Autorité — matrice des pouvoirs de validation | Delegation of Authority |
| Edge Function | Fonction serverless exécutée en périphérie du réseau (Supabase/Deno) | Serverless function executed at the network edge |
| FCFA | Franc CFA — devise des pays UEMOA (XOF) et CEMAC (XAF) | CFA Franc — currency of WAEMU (XOF) and CEMAC (XAF) countries |
| MAPE | Mean Absolute Percentage Error — erreur absolue moyenne en pourcentage | Mean Absolute Percentage Error |
| MT940 | Format SWIFT standard pour les relevés bancaires électroniques | SWIFT standard format for electronic bank statements |
| Multi-tenant | Architecture SaaS où un seul déploiement sert plusieurs clients isolés | SaaS architecture where a single deployment serves multiple isolated clients |
| OHADA | Organisation pour l'Harmonisation en Afrique du Droit des Affaires | Organization for the Harmonization of Business Law in Africa |
| OPEX | Operating Expenditure — charges d'exploitation | Operating expenditure |
| RLS | Row Level Security — sécurité au niveau de chaque ligne PostgreSQL | Row Level Security — PostgreSQL per-row access control |
| RPO | Recovery Point Objective — perte de données maximale acceptable | Recovery Point Objective |
| RTO | Recovery Time Objective — durée maximale d'indisponibilité acceptable | Recovery Time Objective |
| SYSCOHADA | Système Comptable OHADA — plan comptable des pays membres de l'OHADA | OHADA Accounting System |
| UEMOA | Union Économique et Monétaire Ouest-Africaine | West African Economic and Monetary Union |

### Annexe B — Palette de Couleurs & Design System

#### Grayscale (Thème professionnel monochrome)

| Token | Hex | Usage |
|-------|-----|-------|
| primary50 | `#fafafa` | Fond de page |
| primary100 | `#f5f5f5` | Fond de cartes |
| primary200 | `#e5e5e5` | Bordures |
| primary300 | `#d4d4d4` | Bordures subtiles |
| primary400 | `#a3a3a3` | Placeholder |
| primary500 | `#737373` | Texte secondaire |
| primary600 | `#525252` | Labels |
| primary700 | `#404040` | Boutons ghost |
| primary800 | `#262626` | Hover boutons |
| primary900 | `#171717` | Texte principal |
| primary950 | `#0a0a0a` | États actifs |

#### Couleurs de Statut

| Token | Hex | Usage |
|-------|-----|-------|
| success | `#22c55e` | Succès / Validé |
| warning | `#f59e0b` | Attention |
| error | `#ef4444` | Erreur |
| info | `#3b82f6` | Information |

#### Niveaux de Sévérité

| Token | Hex | Usage |
|-------|-----|-------|
| low | `#6b7280` | Basse |
| medium | `#f59e0b` | Moyenne |
| high | `#ef4444` | Haute |
| critical | `#7f1d1d` | Critique |

#### Typographie

| Type | Police | Usage |
|------|--------|-------|
| Sans | Exo 2 | Corps de texte |
| Décorative | Grand Hotel | Titres spéciaux |
| Monospace | JetBrains Mono | Code |

Graisses : 300 (light) → 800 (extrabold)

---

## CHAPITRE 15 — AUDIT DE CONFORMITÉ — Mars 2026

### 15.1 Résumé de l'audit

**Date de l'audit :** 19 mars 2026
**Complétude globale estimée : ~50%**
**Conclusion :** L'architecture du projet est solide (React + TypeScript + Supabase + Tailwind + i18n). Les fondations CRUD sont en place pour la majorité des modules. Cependant, la logique métier avancée (moteur de prévision, matching bancaire, DOA, profils comportementaux, stress tests, clôtures comptables) et les interfaces spécialisées par rôle sont largement manquantes.

| Catégorie | Modules | Complets | Partiels | Non implémentés |
|-----------|---------|----------|----------|-----------------|
| Socle | 4 | 1 | 3 | 0 |
| Prévision | 3 | 0 | 3 | 0 |
| Opérationnel | 5 | 1 | 3 | 1 |
| Finance | 4 | 3 | 1 | 0 |
| Reporting/Admin | 3 | 0 | 3 | 0 |
| **TOTAL** | **19 + Proph3t** | **5** | **13** | **1** |

### 15.2 Détail par module

| Module | Nom | Complétude | Lacunes critiques |
|--------|-----|------------|-------------------|
| M01 | Budget Annuel & Référentiel | 60% | Import Excel/CSV, répartition auto, duplication, vue consolidée |
| M02 | Balance d'Ouverture | 70% | Portefeuille créances/dettes antérieures, intégration prévision |
| M03 | Paramétrage Délais & Profils | 40% | Profils comportementaux, indexations, scoring cold-start |
| M04 | Moteur de Prévision | 50% | 3 méthodes (déterministe/statistique/ML), recalibrage, MAE/MAPE |
| M05 | Scénarios & Stress Test | 55% | Scénarios auto, 6 stress tests, what-if interactif |
| M06 | Multi-Banques | 50% | Import MT940/CAMT.053/CSV, matching auto, alertes |
| M07 | Consolidation Groupe | 40% | Périmètre consolidation, éliminations inter-co, reporting |
| M08 | Contentieux Judiciaire | 50% | Scénarios sortie multiples, valeur espérée, intégration prévision |
| M09 | Fiscal & Dépôts de Garantie | 45% | TVA flux autonome, calendrier auto, régularisations, paiements partiels |
| M10 | Lignes de Crédit | 90% | Intégration scénarios |
| M11 | Tableaux de Bord & Reporting | 25% | 4 dashboards par rôle, 7/10 rapports manquants, PDF/CSV export |
| M12 | CAPEX | 50% | Échéancier paiement, prestataire, retenue garantie, glissement |
| M13 | Piste d'Audit | 40% | Tables DB manquantes, immuabilité, clôtures, réconciliation |
| M14 | Caisse & Mobile Money | 55% | Arrêté caisse, validation sorties, position intégrée |
| M15 | Cartes Prépayées | 90% | Passif cartes cadeaux |
| M16 | Transferts Internes | 0% | Module entièrement absent |
| M17 | Placements | 90% | Suggestion placement optimale |
| M18 | Dette Financière | 90% | Plan de financement dynamique multi-années |
| M19 | Workflow DOA | 45% | Paramétrage DOA, routage auto, chaîne approbation, notifications |
| Proph3t | Moteur IA Trésorerie | 30% | 7 pages UI "Coming Soon", zéro interface |
| Auth/RBAC | Authentification & Rôles | 35% | MFA, 8 rôles, 3 niveaux RBAC |

### 15.3 Infrastructure transversale

| Composant | Complétude |
|-----------|-----------|
| I18n FR/EN (13 namespaces) | 100% |
| Company Switcher | 100% |
| Supabase Config | 90% |
| Stores (app, company, notifications) | 60% |
| Design System (Shadcn/UI + Tailwind) | 90% |
| Charts Recharts (4 types) | 100% |
| Migrations Supabase | 85% |

### 15.4 Top 10 priorités de correction

| # | Module | Impact | Effort |
|---|--------|--------|--------|
| 1 | Dashboard 4 vues par rôle (M11) | Critique | Fort |
| 2 | RBAC 8 rôles + 3 niveaux | Critique | Fort |
| 3 | Transferts Internes (M16) | Critique | Moyen |
| 4 | Import bancaire multi-formats (M06) | Critique | Fort |
| 5 | Moteur de prévision réel (M04) | Critique | Très fort |
| 6 | DOA paramétrable (M19) | Fort | Moyen |
| 7 | Proph3t UI (7 pages) | Fort | Fort |
| 8 | Rapports manquants + exports PDF/CSV (M11) | Fort | Moyen |
| 9 | Profils comportementaux contreparties (M03) | Fort | Moyen |
| 10 | Piste d'audit complète + clôtures (M13) | Fort | Moyen |
