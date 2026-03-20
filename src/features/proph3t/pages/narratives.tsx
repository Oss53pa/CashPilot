import { useState } from 'react';
import { BookOpen, RefreshCw, Globe, Clock, TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Language = 'fr' | 'en';

interface NarrativeContent {
  positionSummary: string;
  keyRisks: string;
  opportunities: string;
  recommendations: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const narratives: Record<Language, NarrativeContent> = {
  fr: {
    positionSummary: `La position de tresorerie consolidee au 20 mars 2026 s'etablit a 487 600 000 FCFA, en hausse de 3.2% par rapport a la semaine precedente (472 500 000 FCFA). Cette amelioration s'explique principalement par l'encaissement anticipe de loyers de Banque Atlantique et Orange CI pour un montant cumule de 28 500 000 FCFA.

Le compte SGBCI Exploitation affiche le solde le plus eleve a 215 000 000 FCFA, suivi du compte SIB Operations a 142 000 000 FCFA. Le compte ECOBANK CAPEX reste sous tension a 18 600 000 FCFA, insuffisant pour couvrir les engagements d'investissement prevus dans les 30 prochains jours (estimees a 63 800 000 FCFA).

Le ratio de liquidite immediate est de 1.45x (vs 1.38x la semaine derniere), au-dessus du seuil interne de 1.20x. Les jours de tresorerie disponibles s'elevent a 52 jours d'exploitation courante.`,

    keyRisks: `Trois risques majeurs ont ete identifies cette semaine par le moteur Proph3t:

1. Deficit imminent compte ECOBANK CAPEX: Le modele previsionnel (Holt-Winters, MAPE 4.2%) anticipe un passage en negatif le 04 avril 2026, avec un deficit estime de -45 200 000 FCFA. Ce risque est lie a l'echeancier des travaux de renovation du Centre Commercial Plateau.

2. Degradation du taux de recouvrement: Le taux global est passe de 89% a 81% sur 4 semaines. Les principaux contribuants sont CARREFOUR Market (retard moyen +12 jours, encours 8 500 000 FCFA) et MTN Boutique (retard moyen +18 jours, encours 4 200 000 FCFA). Le score comportemental de Jumia CI a chute de 68 a 42 points, signalant un risque d'impaye eleve.

3. Echeance fiscale TVA: La declaration et le reglement TVA de fevrier 2026 sont dus le 25 mars pour un montant estime de 32 800 000 FCFA. La provision constituee est actuellement de 30 100 000 FCFA, soit un ecart de 2 700 000 FCFA.`,

    opportunities: `Le moteur IA a detecte deux opportunites d'optimisation:

1. Excedent placable: Avec 52 jours de tresorerie disponibles (seuil de securite: 40 jours), un excedent de 85 000 000 FCFA peut etre place en DAT 3 mois aupres de la Banque Atlantique au taux negocie de 5.25%, generant un rendement estime de 1 115 000 FCFA.

2. Optimisation du nivellement: Le desequilibre entre les comptes (SGBCI a +215M vs ECOBANK a +18.6M) suggere un transfert interne de 60 000 000 FCFA qui reduirait les agios debiteurs potentiels sur le compte ECOBANK et eviterait le recours a la ligne revolving (cout: BIAO +2.5%).`,

    recommendations: `Actions prioritaires recommandees par ordre d'urgence:

1. URGENT (J+2): Completer la provision TVA de 2 700 000 FCFA avant l'echeance du 25 mars. Verifier le calcul avec le comptable.

2. URGENT (J+5): Initier le transfert interne SGBCI vers ECOBANK CAPEX de 60 000 000 FCFA pour securiser les engagements d'investissement d'avril.

3. HAUTE (J+7): Contacter CARREFOUR Market et MTN Boutique pour les relances de paiement. Planifier un appel avec le responsable Jumia CI pour negocier un echeancier.

4. MOYENNE (J+15): Placer l'excedent identifie de 85 000 000 FCFA en DAT 3 mois. Obtenir la confirmation du taux de 5.25% aupres de Banque Atlantique.

5. SURVEILLANCE: Suivre hebdomadairement le ratio dette/EBITDA (actuellement 2.8x, covenant a 3.0x) et le score comportemental des locataires categories C et D.`,
  },

  en: {
    positionSummary: `The consolidated treasury position as of March 20, 2026 stands at 487,600,000 FCFA, up 3.2% compared to the previous week (472,500,000 FCFA). This improvement is mainly due to early collection of rental payments from Banque Atlantique and Orange CI for a combined amount of 28,500,000 FCFA.

The SGBCI Operations account shows the highest balance at 215,000,000 FCFA, followed by SIB Operations at 142,000,000 FCFA. The ECOBANK CAPEX account remains under pressure at 18,600,000 FCFA, insufficient to cover planned investment commitments over the next 30 days (estimated at 63,800,000 FCFA).

The immediate liquidity ratio is 1.45x (vs 1.38x last week), above the internal threshold of 1.20x. Available treasury days stand at 52 days of current operations.`,

    keyRisks: `Three major risks were identified this week by the Proph3t engine:

1. Imminent ECOBANK CAPEX account deficit: The forecasting model (Holt-Winters, MAPE 4.2%) anticipates the account going negative on April 4, 2026, with an estimated deficit of -45,200,000 FCFA. This risk is linked to the renovation schedule for the Centre Commercial Plateau.

2. Declining collection rate: The overall rate has dropped from 89% to 81% over 4 weeks. Main contributors are CARREFOUR Market (average delay +12 days, outstanding 8,500,000 FCFA) and MTN Boutique (average delay +18 days, outstanding 4,200,000 FCFA). Jumia CI's behavioral score has fallen from 68 to 42 points, signaling high default risk.

3. VAT tax deadline: The February 2026 VAT declaration and payment are due March 25 for an estimated amount of 32,800,000 FCFA. The current provision is 30,100,000 FCFA, leaving a gap of 2,700,000 FCFA.`,

    opportunities: `The AI engine has detected two optimization opportunities:

1. Investable surplus: With 52 days of available treasury (safety threshold: 40 days), a surplus of 85,000,000 FCFA can be placed in a 3-month term deposit with Banque Atlantique at the negotiated rate of 5.25%, generating an estimated return of 1,115,000 FCFA.

2. Account balancing optimization: The imbalance between accounts (SGBCI at +215M vs ECOBANK at +18.6M) suggests an internal transfer of 60,000,000 FCFA that would reduce potential debit charges on the ECOBANK account and avoid using the revolving line (cost: BIAO +2.5%).`,

    recommendations: `Recommended priority actions by urgency:

1. URGENT (D+2): Complete the VAT provision of 2,700,000 FCFA before the March 25 deadline. Verify calculation with the accountant.

2. URGENT (D+5): Initiate internal transfer from SGBCI to ECOBANK CAPEX of 60,000,000 FCFA to secure April investment commitments.

3. HIGH (D+7): Contact CARREFOUR Market and MTN Boutique for payment follow-up. Schedule a call with Jumia CI manager to negotiate a payment plan.

4. MEDIUM (D+15): Place the identified surplus of 85,000,000 FCFA in 3-month term deposit. Obtain confirmation of the 5.25% rate from Banque Atlantique.

5. MONITORING: Track weekly the debt/EBITDA ratio (currently 2.8x, covenant at 3.0x) and behavioral scores for category C and D tenants.`,
  },
};

const sectionConfig = [
  { key: 'positionSummary' as const, title: 'Resume de la position', titleEn: 'Position Summary', icon: TrendingUp, sentiment: 'positive' as const },
  { key: 'keyRisks' as const, title: 'Risques cles', titleEn: 'Key Risks', icon: AlertTriangle, sentiment: 'warning' as const },
  { key: 'opportunities' as const, title: 'Opportunites', titleEn: 'Opportunities', icon: Lightbulb, sentiment: 'positive' as const },
  { key: 'recommendations' as const, title: 'Recommandations', titleEn: 'Recommendations', icon: Target, sentiment: 'neutral' as const },
];

const sentimentStyles: Record<string, string> = {
  positive: 'border-l-4 border-l-green-500',
  warning: 'border-l-4 border-l-orange-500',
  neutral: 'border-l-4 border-l-blue-500',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Narratives() {
  const [language, setLanguage] = useState<Language>('fr');
  const [generatedAt, setGeneratedAt] = useState('20 mars 2026 a 06:00');

  const content = narratives[language];

  const handleRegenerate = () => {
    const now = new Date();
    setGeneratedAt(now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) + ' a ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader title="Analyses Narratives IA" description="Rapports de tresorerie generes automatiquement par Proph3t">
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="flex items-center rounded-lg border p-1">
            <Button
              variant={language === 'fr' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setLanguage('fr')}
            >
              <Globe className="mr-1 h-3 w-3" />
              FR
            </Button>
            <Button
              variant={language === 'en' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setLanguage('en')}
            >
              <Globe className="mr-1 h-3 w-3" />
              EN
            </Button>
          </div>

          <Button size="sm" onClick={handleRegenerate}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {language === 'fr' ? 'Regenerer' : 'Regenerate'}
          </Button>
        </div>
      </PageHeader>

      {/* Generated timestamp */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>{language === 'fr' ? 'Genere le' : 'Generated on'} {generatedAt}</span>
        <Badge variant="outline" className="ml-2">
          {language === 'fr' ? 'Periode: 14 - 20 mars 2026' : 'Period: Mar 14 - 20, 2026'}
        </Badge>
      </div>

      {/* Narrative Sections */}
      <div className="space-y-4">
        {sectionConfig.map((section) => {
          const Icon = section.icon;
          const title = language === 'fr' ? section.title : section.titleEn;
          const text = content[section.key];

          return (
            <Card key={section.key} className={sentimentStyles[section.sentiment]}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-5 w-5" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {text.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-sm leading-relaxed text-foreground mb-3 last:mb-0 whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
