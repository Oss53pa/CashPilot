import { useState } from 'react';
import { HelpCircle, X, ChevronRight, Lightbulb, BookOpen, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// ============================================================================
// Help Panel — Contextual help accessible from any page via ? button
// ============================================================================

export interface HelpStep {
  title: string;
  content: string;
  type?: 'info' | 'tip' | 'warning';
}

export interface HelpConfig {
  moduleTitle: string;
  description: string;
  steps: HelpStep[];
  faq?: { question: string; answer: string }[];
}

interface HelpPanelProps {
  config: HelpConfig;
}

const typeIcons = {
  info: BookOpen,
  tip: Lightbulb,
  warning: AlertTriangle,
};

const typeColors = {
  info: 'border-l-blue-500 bg-blue-50/50',
  tip: 'border-l-green-500 bg-green-50/50',
  warning: 'border-l-orange-500 bg-orange-50/50',
};

export function HelpPanel({ config }: HelpPanelProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'guide' | 'faq'>('guide');

  return (
    <>
      {/* Trigger button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full border"
        onClick={() => setOpen(true)}
        title="Aide"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      {/* Slide-over panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-background shadow-xl border-l flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-sm font-semibold">{config.moduleTitle}</h2>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tabs */}
            {config.faq && config.faq.length > 0 && (
              <div className="flex border-b px-5">
                <button
                  className={cn('px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
                    activeTab === 'guide' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setActiveTab('guide')}
                >
                  Guide
                </button>
                <button
                  className={cn('px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
                    activeTab === 'faq' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setActiveTab('faq')}
                >
                  FAQ ({config.faq.length})
                </button>
              </div>
            )}

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-5 space-y-3">
                {activeTab === 'guide' && config.steps.map((step, i) => {
                  const type = step.type || 'info';
                  const Icon = typeIcons[type];
                  return (
                    <div
                      key={i}
                      className={cn('border-l-4 rounded-r-lg p-3 space-y-1', typeColors[type])}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-xs font-semibold">{step.title}</span>
                        <Badge variant="outline" className="text-[9px] ml-auto">{i + 1}/{config.steps.length}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                        {step.content}
                      </p>
                    </div>
                  );
                })}

                {activeTab === 'faq' && config.faq?.map((item, i) => (
                  <details key={i} className="group border rounded-lg">
                    <summary className="flex items-center gap-2 px-3 py-2 text-xs font-medium cursor-pointer list-none hover:bg-muted/30">
                      <ChevronRight className="h-3 w-3 shrink-0 transition-transform group-open:rotate-90" />
                      {item.question}
                    </summary>
                    <div className="px-3 pb-3 pt-1 text-xs text-muted-foreground leading-relaxed">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// Pre-built help configs for each module
// ============================================================================

export const HELP_CONFIGS: Record<string, HelpConfig> = {
  dashboard: {
    moduleTitle: 'Tableau de bord',
    description: 'Vue synthetique de votre tresorerie',
    steps: [
      { title: 'Cartes KPI', content: 'Les cartes en haut affichent la position de tresorerie, les encaissements/decaissements du mois et le solde previsionnel.', type: 'info' },
      { title: 'Vue par role', content: 'Le dashboard s\'adapte a votre role (DG, DAF, Tresorier, Gestionnaire). Chaque profil voit les informations les plus pertinentes.', type: 'info' },
      { title: 'Alertes', content: 'Les alertes critiques apparaissent en rouge. Cliquez dessus pour voir le detail et les actions recommandees.', type: 'warning' },
      { title: 'Bouton Proph3t', content: 'Le bouton rond en bas a droite (cerveau) donne un acces rapide aux 7 modules d\'intelligence artificielle.', type: 'tip' },
    ],
  },
  receipts: {
    moduleTitle: 'Encaissements',
    description: 'Saisie et suivi des flux entrants',
    steps: [
      { title: 'Ajouter un encaissement', content: 'Cliquez sur "+ Nouvel encaissement" pour saisir un flux entrant (loyer recu, paiement client, etc.).', type: 'info' },
      { title: 'Filtrer et rechercher', content: 'Utilisez la barre de recherche et les filtres (date, categorie, statut) pour retrouver un flux specifique.', type: 'info' },
      { title: 'Import automatique', content: 'Importez vos releves bancaires depuis Comptes > Detail compte > Import. Le systeme matche automatiquement les flux.', type: 'tip' },
      { title: 'Exporter', content: 'Le bouton Excel exporte les donnees filtrees actuellement affichees.', type: 'info' },
    ],
    faq: [
      { question: 'Comment imputer un encaissement sur une creance ?', answer: 'Lors de la saisie, selectionnez le locataire dans le champ Contrepartie. Le systeme propose automatiquement les creances ouvertes. Choisissez la creance a solder.' },
      { question: 'Que faire si un paiement est partiel ?', answer: 'Saisissez le montant recu. Le solde restant sera automatiquement reporte dans la balance agee et une relance sera programmee selon les delais configures.' },
    ],
  },
  disbursements: {
    moduleTitle: 'Decaissements',
    description: 'Saisie et validation des flux sortants',
    steps: [
      { title: 'Saisir un decaissement', content: 'Cliquez sur "+ Nouveau decaissement". Renseignez le fournisseur, le montant, la categorie et le compte a debiter.', type: 'info' },
      { title: 'Workflow DOA', content: 'Les decaissements au-dessus du seuil de delegation necessitent une validation. Le circuit d\'approbation se declenche automatiquement.', type: 'warning' },
      { title: 'Programmation', content: 'Vous pouvez programmer un decaissement a une date future. Il apparaitra dans les previsions.', type: 'tip' },
    ],
  },
  accounts: {
    moduleTitle: 'Comptes bancaires',
    description: 'Gestion des comptes et rapprochement',
    steps: [
      { title: 'Ajouter un compte', content: 'Cliquez sur "+ Ajouter" pour creer un compte bancaire. Renseignez la banque, le numero, le type et les seuils min/max.', type: 'info' },
      { title: 'Importer un releve', content: 'Dans le detail d\'un compte, onglet Imports, deposez votre releve. Formats supportes : MT940, CAMT.053, CSV, Excel, PDF, Image (OCR).', type: 'info' },
      { title: 'Rapprochement', content: 'Apres import, allez dans l\'onglet Matching. Le systeme propose des correspondances. Confirmez ou corrigez manuellement.', type: 'info' },
      { title: 'Template', content: 'Telechargez le template CashPilot depuis l\'ecran d\'import si votre banque n\'a pas de format standard.', type: 'tip' },
    ],
    faq: [
      { question: 'Quels formats de releve sont supportes ?', answer: 'MT940 (SWIFT), CAMT.053 (XML ISO 20022), CSV (mapping configurable), Excel, PDF (texte + OCR), et images/photos (OCR Tesseract). Le systeme detecte automatiquement le format.' },
      { question: 'Que faire si un flux n\'est pas matche ?', answer: 'Il apparait dans la file de qualification. Ouvrez-le et soit confirmez la suggestion du systeme, soit imputez-le manuellement sur une creance/dette existante.' },
    ],
  },
  budget: {
    moduleTitle: 'Budget',
    description: 'Saisie et suivi budgetaire',
    steps: [
      { title: 'Creer un budget', content: 'Saisissez votre budget annuel mois par mois, ou importez-le depuis Excel. Telechargez d\'abord le template CashPilot.', type: 'info' },
      { title: 'Versions', content: 'Vous pouvez creer plusieurs versions (initial, revise T1, revise T2). Activez la version qui sert de reference pour les ecarts.', type: 'info' },
      { title: 'Ecarts', content: 'L\'ecart Budget vs Realise est calcule automatiquement. Consultez-le dans Rapports > Ecart budgetaire.', type: 'tip' },
    ],
  },
  counterparties: {
    moduleTitle: 'Contreparties',
    description: 'Locataires et fournisseurs',
    steps: [
      { title: 'Fiche locataire', content: 'Chaque locataire a un profil complet : bail, loyer, indexation, depot de garantie, historique de paiement, score Proph3t.', type: 'info' },
      { title: 'Profil de paiement', content: 'Le delai moyen, le taux de recouvrement et la tendance sont calcules automatiquement par Proph3t a partir de l\'historique reel.', type: 'info' },
      { title: 'Import locataires', content: 'Importez vos locataires en masse via Excel. Telechargez le template depuis la librairie de templates.', type: 'tip' },
    ],
  },
  forecast: {
    moduleTitle: 'Previsions',
    description: 'Previsions glissantes multi-horizons',
    steps: [
      { title: 'Horizons', content: '4 horizons : J+7 (quotidien), J+30 (hebdomadaire), J+90 (hebdomadaire), J+365 (mensuel). La precision diminue avec l\'horizon.', type: 'info' },
      { title: 'Modeles', content: 'Proph3t choisit automatiquement le meilleur modele selon l\'historique : WMA → Holt-Winters → ARIMA → SARIMA → Prophet → LSTM → Ensemble.', type: 'info' },
      { title: 'Tableau annuel', content: 'Le Tableau de Prevision Annuelle compile budget, previsions et realise sur 12 mois avec des lignes collapsables.', type: 'tip' },
      { title: 'Recalcul', content: 'Cliquez sur "Recalculer" pour forcer un nouveau calcul. Les previsions se recalculent aussi automatiquement apres chaque import de releve.', type: 'info' },
    ],
  },
  reports: {
    moduleTitle: 'Rapports',
    description: 'Generation et export de rapports',
    steps: [
      { title: 'Navigation', content: 'Selectionnez un rapport dans le menu de gauche. Le contenu s\'affiche a droite avec les graphiques et tableaux.', type: 'info' },
      { title: '15 rapports', content: 'Position de tresorerie, flux, ecart budgetaire, balance agee creances/dettes, recouvrement, contentieux, multi-banques, CAPEX, fiscal, TFT SYSCOHADA, 12 mois glissants, plan 13 semaines.', type: 'info' },
      { title: 'Export', content: 'Exportez en Excel, CSV ou PDF via le bouton Exporter en haut a droite.', type: 'tip' },
    ],
  },
  'proph3t-forecasts': {
    moduleTitle: 'Previsions IA',
    description: 'Previsions multi-modeles Proph3t',
    steps: [
      { title: 'Scenarios', content: '3 scenarios calcules en permanence : Base, Optimiste, Pessimiste. Basculez entre eux avec le selecteur.', type: 'info' },
      { title: 'Graphique', content: 'La ligne continue = historique reel. Les pointilles = prevision. Les bandes = intervalles de confiance (80% et 95%).', type: 'info' },
      { title: 'Phase du moteur', content: 'Le moteur Proph3t s\'ameliore avec le temps. Phase 1 (< 3 mois) utilise des modeles simples. Phase 4 (> 24 mois) utilise l\'ensemble hybride.', type: 'tip' },
    ],
  },
  'proph3t-fraud': {
    moduleTitle: 'Detection de fraude',
    description: '8 regles anti-fraude en temps reel',
    steps: [
      { title: '8 patterns surveilles', content: 'Doublons, fournisseurs fantomes, fractionnement, horaires suspects, modification RIB, exces de caisse, transferts non autorises, montants inhabituels.', type: 'info' },
      { title: 'Gestion des alertes', content: 'Cliquez sur l\'oeil pour voir les preuves et actions recommandees. Choisissez : Investiguer, Faux positif, ou Confirmer fraude.', type: 'info' },
      { title: 'Blocage automatique', content: 'Les alertes de severite critique bloquent automatiquement la transaction en attente de validation.', type: 'warning' },
    ],
  },
  settings: {
    moduleTitle: 'Parametres',
    description: 'Configuration de l\'application',
    steps: [
      { title: 'Onglets', content: 'General (devise, langue), Societes, Utilisateurs (roles), Securite (MFA), Notifications, Parametrage (delais, DOA).', type: 'info' },
      { title: 'Delais de paiement', content: 'Dans l\'onglet Parametrage, configurez les delais par defaut, par categorie, le calendrier fiscal et les regles de relance.', type: 'tip' },
      { title: 'DOA', content: 'La Delegation d\'Autorite definit les seuils de validation par type de transaction. Configurez-la dans Parametrage > DOA.', type: 'info' },
    ],
  },
};
