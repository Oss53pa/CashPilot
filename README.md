# CashPilot

Plateforme SaaS de gestion de tresorerie pour l'immobilier commercial en Afrique de l'Ouest (zone UEMOA / FCFA).

Multi-tenant, multi-societe, avec moteur IA predictif integre (**Proph3t Treasury Engine**).

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui (Radix) |
| State | Zustand (global) + React Query (server) |
| Routing | React Router v6 |
| Charts | Recharts |
| Tables | TanStack Table |
| i18n | i18next (FR / EN) |
| Backend | Supabase (BaaS) — PostgreSQL + Auth + Storage + Realtime |
| Edge Functions | Deno / TypeScript (10 fonctions Proph3t) |
| Auth | Supabase Auth (JWT + RLS) |

---

## Prerequis

- **Node.js** >= 18
- **npm** >= 9
- **Supabase CLI** (`npm install -g supabase`)
- Un projet **Supabase** (cloud ou local)

---

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/Oss53pa/CashPilot.git
cd CashPilot
```

### 2. Installer les dependances

```bash
npm install
```

### 3. Configurer l'environnement

Copier le fichier d'exemple et renseigner vos cles Supabase :

```bash
cp .env.example .env
```

Editer `.env` :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-anon-key
```

> Ces valeurs se trouvent dans **Supabase Dashboard > Settings > API**.

### 4. Initialiser la base de donnees

```bash
# Lier au projet Supabase
supabase link --project-ref votre-project-ref

# Appliquer les migrations
supabase db push
```

Les 4 migrations creent toutes les tables :

| Migration | Contenu |
|---|---|
| `000001_foundation_tables` | Tenants, companies, users, profiles, RBAC, audit |
| `000002_core_business_tables` | Cash flows, bank accounts, budgets, counterparties, CAPEX, debt, etc. |
| `000010_proph3t_ai_tables` | 10 tables Proph3t (forecasts, anomalies, alerts, scores, narratives, etc.) |
| `000011_proph3t_cron_triggers` | pg_cron jobs + triggers pour l'execution automatique des Edge Functions |

### 5. Deployer les Edge Functions

```bash
supabase functions deploy proph3t-forecast
supabase functions deploy proph3t-anomaly-scan
supabase functions deploy proph3t-fraud-check
supabase functions deploy proph3t-alert-engine
supabase functions deploy proph3t-recommendation
supabase functions deploy proph3t-behavior-score
supabase functions deploy proph3t-narrative
supabase functions deploy proph3t-whatif
supabase functions deploy proph3t-model-select
supabase functions deploy proph3t-retrain
```

Ou tout deployer d'un coup :

```bash
supabase functions deploy --all
```

### 6. Lancer l'application

```bash
npm run dev
```

L'application demarre sur **http://localhost:5173**.

---

## Developpement local avec Supabase

Pour travailler entierement en local sans projet cloud :

```bash
# Demarrer Supabase local (Docker requis)
supabase start

# Les migrations s'appliquent automatiquement
# Studio accessible sur http://localhost:54323
# API sur http://localhost:54321
```

Mettre a jour `.env` :

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJ... (affiche par supabase start)
```

---

## Structure du projet

```
CashPilot/
├── src/
│   ├── app/                    # App, router, providers
│   ├── components/
│   │   ├── ui/                 # shadcn/ui (Button, Card, Dialog, etc.)
│   │   ├── shared/             # DataTable, PageHeader, EmptyState, etc.
│   │   ├── charts/             # Recharts wrappers
│   │   └── layout/             # Sidebar, Header, RootLayout
│   ├── features/               # Modules fonctionnels (26 features)
│   │   ├── auth/               # Login, register, auth guard
│   │   ├── dashboard/          # Tableaux de bord par role
│   │   ├── cashflow/           # Encaissements / decaissements
│   │   ├── bank-accounts/      # Comptes bancaires
│   │   ├── budget/             # Gestion budgetaire
│   │   ├── counterparties/     # Locataires / fournisseurs
│   │   ├── capex/              # Investissements CAPEX
│   │   ├── debt/               # Gestion de la dette
│   │   ├── investments/        # Placements financiers
│   │   ├── credit-lines/       # Lignes de credit
│   │   ├── fiscal/             # TVA, taxes, charges
│   │   ├── disputes/           # Contentieux
│   │   ├── payment-workflows/  # Circuits de validation
│   │   ├── proph3t/            # Moteur IA (voir section dediee)
│   │   └── ...                 # reporting, settings, scenarios, etc.
│   ├── config/                 # Supabase client, i18n, React Query
│   ├── hooks/                  # Hooks globaux
│   ├── lib/                    # Utilitaires (format, RBAC, validators)
│   ├── locales/                # Traductions FR / EN
│   ├── stores/                 # Zustand (company, app, notifications)
│   └── types/                  # TypeScript (database, proph3t, enums)
├── supabase/
│   ├── config.toml             # Configuration Supabase local
│   ├── migrations/             # 4 fichiers SQL
│   └── functions/              # 10 Edge Functions + shared utils
└── package.json
```

---

## Modules fonctionnels

### Tresorerie

| Route | Module | Description |
|---|---|---|
| `/dashboard` | Dashboard | 4 vues par role (CEO, CFO, Tresorier, Gestionnaire) |
| `/receipts` | Encaissements | Saisie, import, suivi des encaissements |
| `/disbursements` | Decaissements | Saisie, validation, suivi des decaissements |
| `/forecast` | Previsions | Previsions classiques avec methodes statistiques |

### Comptes

| Route | Module | Description |
|---|---|---|
| `/accounts` | Comptes bancaires | CRUD, soldes, rapprochement bancaire |
| `/accounts/:id` | Detail compte | Historique, releves, alertes |
| `/cash-registers` | Caisses | Comptage, retraits, validation |

### Gestion

| Route | Module | Description |
|---|---|---|
| `/budget` | Budget | Saisie budgetaire, comparaison previsionnel/realise |
| `/counterparties` | Contreparties | Locataires, fournisseurs, profils de paiement |
| `/transfers` | Virements internes | Transferts inter-comptes |

### Financement

| Route | Module | Description |
|---|---|---|
| `/capex` | CAPEX | Projets d'investissement, echeanciers |
| `/debt` | Dette | Contrats de pret, tableaux d'amortissement |
| `/investments` | Placements | DAT, bons du tresor, OPCVM |
| `/credit-lines` | Lignes de credit | Suivi des lignes revolving / spot |

### Risques

| Route | Module | Description |
|---|---|---|
| `/disputes` | Contentieux | Dossiers litiges, suivi juridique |
| `/fiscal` | Fiscal | TVA, IS, taxes, calendrier fiscal |

### Administration

| Route | Module | Description |
|---|---|---|
| `/payment-workflows` | Workflows | Circuits de validation, DOA |
| `/reports` | Rapports | 10 types de rapports (position, tresorerie, budget, etc.) |
| `/audit-trail` | Audit | Journal d'audit, clotures de periode |
| `/settings` | Parametres | Utilisateurs, societe, securite, notifications |
| `/scenarios` | Scenarios | Simulations, stress tests |
| `/consolidation` | Consolidation | Vue groupe multi-societe |
| `/opening-balance` | Soldes initiaux | Assistant de reprise des soldes |
| `/prepaid-cards` | Cartes prepayees | Gestion des cartes corporate |

---

## Proph3t Treasury Engine (IA)

Moteur d'intelligence artificielle predictif integre. 8 capacites, 10 Edge Functions, 7 pages.

### Pages IA

| Route | Capacite | Description |
|---|---|---|
| `/proph3t/forecasts` | Previsions IA | 7 modeles (WMA, Holt-Winters, ARIMA, SARIMA, Prophet, LSTM, Ensemble), intervalles de confiance, 4 horizons |
| `/proph3t/alerts` | Alertes predictives | 8 regles (liquidite, recouvrement, covenant, CAPEX...), remediations automatiques |
| `/proph3t/scoring` | Scoring locataires | 12 features, classification (Excellent → Critique), tendance, action recommandee |
| `/proph3t/narratives` | Analyses narratives | Rapports hebdomadaires auto-generes (FR/EN), 6 sections avec sentiment |
| `/proph3t/what-if` | Simulation What-If | Questions en langage naturel, 8 types de simulation |
| `/proph3t/fraud` | Detection de fraude | 8 regles (doublons, fournisseurs fantomes, fractionnement, horaires...) |
| `/proph3t/performance` | Performance moteur | MAPE par horizon, comparaison modeles, historique entrainement |

### Edge Functions

| Fonction | Execution | Description |
|---|---|---|
| `proph3t-forecast` | pg_cron quotidien + manuel | Previsions multi-modeles avec backtesting |
| `proph3t-anomaly-scan` | Trigger sur INSERT cash_flows | Detection d'anomalies par Isolation Forest |
| `proph3t-fraud-check` | Trigger sur INSERT cash_flows | 8 regles anti-fraude avec blocage automatique |
| `proph3t-alert-engine` | pg_cron quotidien 18h | 8 regles d'alerte avec deduplication 24h |
| `proph3t-recommendation` | Appele par alert-engine | Generation de remediations (transfert, credit, report CAPEX, relance) |
| `proph3t-behavior-score` | pg_cron hebdo lundi 05h | Scoring comportemental des locataires |
| `proph3t-narrative` | pg_cron hebdo dimanche | Rapports narratifs automatiques bilingues |
| `proph3t-whatif` | Manuel (UI) | Simulateur en langage naturel (FR/EN) |
| `proph3t-model-select` | pg_cron mensuel 03h | Selection du meilleur modele par categorie via walk-forward CV |
| `proph3t-retrain` | pg_cron mensuel 02h | Re-estimation des parametres des modeles actifs |

### Modeles de prevision

| Modele | Historique requis | Usage |
|---|---|---|
| WMA | < 3 mois | Baseline rapide |
| Holt-Winters | 3-12 mois | Tendance + saisonnalite |
| ARIMA | 12-18 mois | Series differenciees |
| SARIMA | 18-24 mois | Saisonnalite forte |
| Prophet | > 12 mois | Decomposition tendance/saisonnalite/jours feries CI |
| LSTM | > 24 mois | Reseau de neurones (lookback 12 periodes) |
| Ensemble | > 24 mois | Moyenne ponderee des 2 meilleurs modeles (poids = 1/MAPE) |

---

## Roles et permissions

CashPilot utilise un systeme RBAC a 3 niveaux :

### Roles tenant (multi-societe)

| Role | Acces |
|---|---|
| `tenant_admin` | Acces total, gestion utilisateurs et parametres |
| `group_cfo` | Lecture/ecriture toutes societes, consolidation |
| `group_viewer` | Lecture seule toutes societes |

### Roles societe

| Role | Acces |
|---|---|
| `company_cfo` | Tout sauf parametres (lecture seule) |
| `company_manager` | Saisie operationnelle + validation niveau 1 |
| `treasurer` | Operations de caisse, virements, rapprochement |
| `viewer` | Lecture seule + exports |
| `auditor` | Lecture seule + audit trail complet |

---

## Internationalisation

L'application est disponible en **francais** et **anglais**.

Les fichiers de traduction sont dans `src/locales/{fr,en}/`. Chaque module a son propre fichier JSON (13 fichiers par langue).

---

## Scripts

```bash
npm run dev       # Serveur de developpement (Vite, port 5173)
npm run build     # Build de production (tsc + vite build)
npm run preview   # Preview du build de production
npm run lint      # Linter ESLint
```

---

## Variables d'environnement

| Variable | Description | Requis |
|---|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase | Oui |
| `VITE_SUPABASE_ANON_KEY` | Cle anonyme Supabase (publique) | Oui |

> Les cles service role sont configurees cote Supabase (Edge Functions) via `supabase secrets set`.

---

## Licence

Projet prive.
