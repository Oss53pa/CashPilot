import { useState } from 'react';
import {
  BookOpen, LayoutDashboard, ArrowDownToLine,
  TrendingUp, Landmark, Calculator,
  Building2, Gavel,
  ShieldCheck, AlertTriangle, Activity, MessageSquare, Shield,
  Settings, HelpCircle,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';

// ---------------------------------------------------------------------------
// Guide sections data
// ---------------------------------------------------------------------------

interface GuideSection {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  items: { title: string; content: string }[];
}

const sections: GuideSection[] = [
  {
    id: 'premiers-pas',
    icon: HelpCircle,
    title: 'Premiers pas',
    description: 'Connexion, navigation et prise en main',
    items: [
      {
        title: 'Comment me connecter ?',
        content: `Entrez votre email et mot de passe sur la page de connexion, puis cliquez sur "Se connecter". Si vous avez oublie votre mot de passe, cliquez sur "Mot de passe oublie" pour recevoir un lien de reinitialisation par email.`,
      },
      {
        title: 'Comment changer de societe ?',
        content: `Si votre organisation gere plusieurs societes, un selecteur apparait en haut de l'ecran a cote de votre nom. Cliquez dessus pour changer de societe. Toutes les donnees affichees seront filtrees selon la societe selectionnee.`,
      },
      {
        title: 'Comment naviguer dans l\'application ?',
        content: `La barre laterale a gauche est votre menu principal, organisee par sections : Tresorerie, Comptes, Gestion, Financement, Risques, Workflows et Administration. Vous pouvez la reduire en cliquant sur la fleche en bas. Le bouton rond "Proph3t" en bas a droite donne un acces rapide aux modules d'intelligence artificielle.`,
      },
      {
        title: 'Comment changer la langue ?',
        content: `Allez dans Parametres (icone engrenage dans la sidebar) pour passer du francais a l'anglais ou inversement.`,
      },
    ],
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Votre tableau de bord personnalise',
    items: [
      {
        title: 'Que montre le dashboard ?',
        content: `Le dashboard affiche une vue synthetique adaptee a votre role. Les cartes en haut montrent la position de tresorerie, les encaissements et decaissements du mois, et le solde previsionnel. Des graphiques montrent l'evolution sur les derniers mois.`,
      },
      {
        title: 'Pourquoi mon dashboard est different de celui de mon collegue ?',
        content: `Le dashboard s'adapte a votre role : Directeur General (vue strategique), Directeur Financier (vue financiere), Tresorier (vue operationnelle), Gestionnaire de centre (vue par site). Chaque role voit les informations les plus pertinentes pour ses responsabilites.`,
      },
    ],
  },
  {
    id: 'tresorerie',
    icon: ArrowDownToLine,
    title: 'Tresorerie',
    description: 'Encaissements, decaissements et previsions',
    items: [
      {
        title: 'Comment saisir un encaissement ?',
        content: `Allez dans Tresorerie > Encaissements, puis cliquez sur "+ Nouvel encaissement". Remplissez le formulaire : date, montant, categorie, compte bancaire, contrepartie (locataire). Validez pour enregistrer.`,
      },
      {
        title: 'Comment saisir un decaissement ?',
        content: `Allez dans Tresorerie > Decaissements, puis cliquez sur "+ Nouveau decaissement". Meme principe que les encaissements. Attention : les montants au-dessus du seuil de delegation necessitent une validation par le circuit d'approbation.`,
      },
      {
        title: 'Comment filtrer et rechercher ?',
        content: `Utilisez la barre de recherche au-dessus du tableau pour filtrer par mot-cle. Cliquez sur les en-tetes de colonnes pour trier. Utilisez les filtres de date et de categorie pour affiner.`,
      },
      {
        title: 'Comment exporter les donnees ?',
        content: `La plupart des tableaux ont un bouton d'export Excel. Cliquez dessus pour telecharger un fichier avec les donnees filtrees actuellement affichees.`,
      },
    ],
  },
  {
    id: 'comptes',
    icon: Landmark,
    title: 'Comptes',
    description: 'Comptes bancaires, caisses et Mobile Money',
    items: [
      {
        title: 'Comment ajouter un compte bancaire ?',
        content: `Allez dans Comptes > Comptes bancaires, cliquez sur "+ Ajouter". Renseignez la banque, le numero de compte, le type (courant, epargne, Mobile Money), la devise et le solde initial.`,
      },
      {
        title: 'Comment voir le detail d\'un compte ?',
        content: `Cliquez sur une ligne du tableau des comptes pour acceder au detail : historique des mouvements, releves importes, alertes sur le compte.`,
      },
      {
        title: 'Comment faire un comptage de caisse ?',
        content: `Allez dans Comptes > Caisse & Mobile Money. Cliquez sur "Comptage". Saisissez les quantites par coupure/billet. Le systeme calcule automatiquement le total et detecte les ecarts avec le solde theorique.`,
      },
    ],
  },
  {
    id: 'gestion',
    icon: Calculator,
    title: 'Gestion',
    description: 'Budget, contreparties et transferts',
    items: [
      {
        title: 'Comment saisir un budget ?',
        content: `Allez dans Gestion > Budget. Vous pouvez saisir les montants previsionnels par categorie et par mois dans la grille, ou importer un fichier Excel avec le bouton "Importer". La vue comparaison montre les ecarts previsionnel/realise.`,
      },
      {
        title: 'Comment gerer les contreparties (locataires/fournisseurs) ?',
        content: `Allez dans Gestion > Contreparties. Vous y trouvez tous vos locataires et fournisseurs. Cliquez sur un nom pour voir sa fiche complete : coordonnees, IBAN, profil de paiement (delai moyen, taux de recouvrement), et classification de fiabilite.`,
      },
      {
        title: 'Comment faire un transfert interne ?',
        content: `Allez dans Gestion > Transferts internes. Cliquez sur "+ Nouveau transfert", selectionnez le compte source et le compte destination, saisissez le montant et validez. Utile pour equilibrer la tresorerie entre vos comptes.`,
      },
    ],
  },
  {
    id: 'financement',
    icon: Building2,
    title: 'Financement',
    description: 'CAPEX, dette, placements, lignes de credit',
    items: [
      {
        title: 'Comment suivre les projets CAPEX ?',
        content: `Allez dans Financement > CAPEX. Le tableau de bord montre le budget engage vs realise par projet. Cliquez sur un projet pour voir l'echeancier des paiements prevus et les factures associees.`,
      },
      {
        title: 'Comment gerer la dette ?',
        content: `Allez dans Financement > Dette. Vous y trouvez vos contrats de pret avec le tableau d'amortissement automatique. Le systeme calcule le solde restant du et surveille le ratio dette/EBITDA.`,
      },
      {
        title: 'Comment suivre les placements ?',
        content: `Allez dans Financement > Placements. Enregistrez vos DAT (Depots a Terme) avec le montant, le taux, la date d'echeance. Le systeme calcule le rendement attendu et vous alerte avant l'echeance.`,
      },
      {
        title: 'Comment utiliser les lignes de credit ?',
        content: `Allez dans Financement > Lignes de credit. Vous voyez le montant total, le montant utilise et le disponible pour chaque ligne. Le cout (taux d'interet) est affiche pour vous aider a choisir la ligne la moins couteuse.`,
      },
    ],
  },
  {
    id: 'risques',
    icon: Gavel,
    title: 'Risques',
    description: 'Contentieux et fiscal',
    items: [
      {
        title: 'Comment suivre un contentieux ?',
        content: `Allez dans Risques > Contentieux. Chaque dossier a une timeline montrant les evenements. Renseignez le statut (en cours, gagne, perdu, transige) et les provisions constituees.`,
      },
      {
        title: 'Comment gerer les echeances fiscales ?',
        content: `Allez dans Risques > Fiscal. Le calendrier fiscal liste les echeances a venir (TVA, IS, taxes). Le suivi TVA montre la TVA collectee et deductible. Le systeme vous alerte avant chaque echeance.`,
      },
    ],
  },
  {
    id: 'workflows',
    icon: ShieldCheck,
    title: 'Approbations',
    description: 'Validation des paiements',
    items: [
      {
        title: 'Comment fonctionne le circuit de validation ?',
        content: `Les paiements au-dessus du seuil de delegation (DOA) passent par un circuit de validation : 1) Le tresorier cree la demande, 2) Le gestionnaire approuve en niveau 1, 3) Le directeur financier approuve en niveau 2 pour les gros montants, 4) Le paiement est execute.`,
      },
      {
        title: 'Comment approuver un paiement ?',
        content: `Allez dans Workflows > Approbations. Les paiements en attente de votre validation apparaissent en haut. Cliquez sur un paiement pour voir les details, puis "Approuver" ou "Rejeter" avec un motif.`,
      },
      {
        title: 'Comment configurer le seuil de delegation ?',
        content: `Allez dans Parametres > DOA. Definissez les seuils par niveau de validation. Par exemple : Niveau 1 jusqu'a 5 000 000 FCFA, Niveau 2 au-dessus.`,
      },
    ],
  },
  {
    id: 'proph3t-previsions',
    icon: TrendingUp,
    title: 'Proph3t — Previsions IA',
    description: 'Previsions multi-modeles avec intervalles de confiance',
    items: [
      {
        title: 'Comment lire les previsions ?',
        content: `La page Proph3t > Previsions IA montre un graphique avec 3 scenarios (Base, Optimiste, Pessimiste) sur 4 horizons (J+7, J+30, J+90, J+365). La ligne continue = donnees reelles, la ligne en pointilles = prevision, les bandes colorees = intervalles de confiance. Plus la bande est large, plus l'incertitude est grande.`,
      },
      {
        title: 'Quel modele est utilise ?',
        content: `Le moteur choisit automatiquement le meilleur modele selon la quantite d'historique disponible. Avec moins de 3 mois : Moyenne Mobile. 3-12 mois : Holt-Winters. 12-18 mois : ARIMA. 18-24 mois : SARIMA. Plus de 24 mois : Ensemble (combinaison des meilleurs modeles).`,
      },
      {
        title: 'Comment forcer un recalcul ?',
        content: `Cliquez sur le bouton "Recalculer" en haut a droite. Le moteur relancera les calculs avec les dernieres donnees disponibles. Les resultats apparaissent en quelques secondes.`,
      },
    ],
  },
  {
    id: 'proph3t-alertes',
    icon: AlertTriangle,
    title: 'Proph3t — Alertes',
    description: 'Alertes predictives et recommandations',
    items: [
      {
        title: 'Quels types d\'alertes existent ?',
        content: `8 types : Tension de liquidite (tresorerie risque de passer en negatif), Risque de recouvrement (locataires degrades), Desequilibre comptes (liquidite mal repartie), Covenant en risque (ratio dette proche du seuil), Excedent placable (opportunite de placement), Tension CAPEX (investissements trop lourds), Score locataire critique (chute d'un locataire), Anomalie critique (transactions suspectes).`,
      },
      {
        title: 'Comment gerer une alerte ?',
        content: `Cliquez sur une alerte pour voir les details et les causes. Puis : "Acquitter" (prise de connaissance), "Action en cours" (en resolution), "Resoudre" (probleme regle), ou "Rejeter" (fausse alerte). Chaque alerte propose des recommandations avec des actions concretes.`,
      },
    ],
  },
  {
    id: 'proph3t-scoring',
    icon: Activity,
    title: 'Proph3t — Scoring locataires',
    description: 'Evaluation automatique de la fiabilite de chaque locataire',
    items: [
      {
        title: 'Comment lire les scores ?',
        content: `Chaque locataire recoit un score de 0 a 100 : 80-100 = Excellent (vert), 65-79 = Bon (vert clair), 50-64 = A surveiller (jaune), 35-49 = A risque (orange), 0-34 = Critique (rouge). Les fleches indiquent la tendance sur 4 semaines.`,
      },
      {
        title: 'Sur quels criteres le score est-il calcule ?',
        content: `12 criteres : ponctualite de paiement (3 derniers mois), taux de paiement complet vs partiel vs impaye, tendance des retards, montant des arrieres, regularite, anciennete de la derniere transaction, nombre de relances, couverture par depot de garantie, etc.`,
      },
      {
        title: 'Que faire avec un locataire critique ?',
        content: `Le systeme recommande une action selon le score et la tendance : Surveillance renforcee, Contact preventif, Mise en demeure, ou Procedure judiciaire. Cliquez sur le locataire pour voir les facteurs de risque detailles.`,
      },
    ],
  },
  {
    id: 'proph3t-whatif',
    icon: MessageSquare,
    title: 'Proph3t — Simulation What-If',
    description: 'Simulez des scenarios sur votre tresorerie',
    items: [
      {
        title: 'Comment utiliser le simulateur ?',
        content: `Ajustez les curseurs a gauche : taux de recouvrement, delai de paiement, variation des revenus/depenses, decalage CAPEX. Le graphique a droite se met a jour en temps reel pour montrer l'impact par rapport au scenario de base. Les cartes d'impact montrent le total, le pire mois et le meilleur mois.`,
      },
      {
        title: 'Exemples de questions a simuler',
        content: `"Que se passe-t-il si le taux de recouvrement tombe a 70% ?" → Baissez le curseur recouvrement a 70%. "Et si les revenus augmentent de 15% grace a de nouveaux baux ?" → Montez le curseur revenus a +15%. "Si on reporte 30% des CAPEX ?" → Mettez le curseur CAPEX a -30%.`,
      },
    ],
  },
  {
    id: 'proph3t-fraude',
    icon: Shield,
    title: 'Proph3t — Detection de fraude',
    description: 'Detection automatique des transactions suspectes',
    items: [
      {
        title: 'Quels patterns sont detectes ?',
        content: `8 regles : Doublons de paiement, Montants inhabituels, Fournisseurs non autorises, Transactions hors horaires (22h-6h), Montants ronds suspects (fractionnement), Modification RIB suivie d'un paiement, Fractionnement sous le seuil de validation, Exces de caisse non reverse.`,
      },
      {
        title: 'Comment traiter une alerte de fraude ?',
        content: `Cliquez sur l'icone oeil pour ouvrir le detail. Consultez les elements de preuve et les actions recommandees. Puis choisissez : "Investiguer" (enquete en cours), "Faux positif" (alerte non justifiee), ou "Confirmer fraude" (fraude averee). Les transactions critiques sont bloquees automatiquement.`,
      },
    ],
  },
  {
    id: 'proph3t-narratifs',
    icon: BookOpen,
    title: 'Proph3t — Rapports narratifs',
    description: 'Rapports hebdomadaires generes par l\'IA',
    items: [
      {
        title: 'Que contient le rapport ?',
        content: `6 sections : Situation generale (position, flux), Points d'attention (alertes, risques), Prevision semaine (anticipation 30j), Bonnes nouvelles (ameliorations), Vigilance CAPEX (poids des investissements), Performance modele (precision de l'IA). Chaque section a un indicateur de sentiment colore.`,
      },
      {
        title: 'Comment changer la langue du rapport ?',
        content: `Utilisez le bouton FR/EN en haut a droite de la page. Les rapports sont disponibles en francais et en anglais.`,
      },
      {
        title: 'Comment consulter les anciens rapports ?',
        content: `Utilisez le selecteur de date en haut de la page pour naviguer entre les rapports precedents.`,
      },
    ],
  },
  {
    id: 'admin',
    icon: Settings,
    title: 'Administration',
    description: 'Rapports, audit et parametres',
    items: [
      {
        title: 'Quels rapports sont disponibles ?',
        content: `10 types : Position de tresorerie, Flux de tresorerie, Creances agees, Recouvrement, Ecart budgetaire, CAPEX, Multi-banques, Fiscal, Contentieux, Rapport hebdomadaire. Tous exportables en Excel.`,
      },
      {
        title: 'Qu\'est-ce que l\'Audit Trail ?',
        content: `Le journal d'audit enregistre automatiquement toutes les actions : qui a fait quoi, quand, sur quelle donnee. Filtrez par utilisateur, action, ou date. La cloture de periode permet de verrouiller les donnees passees.`,
      },
      {
        title: 'Comment gerer les utilisateurs ?',
        content: `Allez dans Parametres. Ajoutez des utilisateurs avec leur email et attribuez-leur un role (CFO, Gestionnaire, Tresorier, Lecteur, Auditeur). Chaque role a des droits d'acces specifiques.`,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader
        title="Guide d'utilisation"
        description="Tout ce que vous devez savoir pour utiliser CashPilot"
      />

      {/* Quick nav */}
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Badge
              key={s.id}
              variant={activeSection === s.id ? 'default' : 'outline'}
              className="cursor-pointer text-xs py-1.5 px-3"
              onClick={() => {
                setActiveSection(activeSection === s.id ? null : s.id);
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <Icon className="h-3 w-3 mr-1.5" />
              {s.title}
            </Badge>
          );
        })}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.id} id={section.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple">
                  {section.items.map((item, i) => (
                    <AccordionItem key={i} value={`${section.id}-${i}`}>
                      <AccordionTrigger className="text-sm font-medium">
                        {item.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {item.content}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
