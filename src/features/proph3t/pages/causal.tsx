import { useState, useEffect } from 'react';
import { Brain, Info } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CausalGraphViz } from '../components/causal/causal-graph-viz';
import { CausalDecompositionViz } from '../components/causal/causal-decomposition';
import { CausalInterventions } from '../components/causal/causal-interventions';
import { GrangerResults } from '../components/causal/granger-results';

import * as proph3tService from '../services/proph3t.service';
import type { CausalGraph, CausalDecomposition, CausalIntervention, GrangerCausalityResult } from '../components/causal/causal-types';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CausalPage() {
  const [graph, setGraph] = useState<CausalGraph | null>(null);
  const [decomposition, setDecomposition] = useState<CausalDecomposition | null>(null);
  const [interventions, setInterventions] = useState<CausalIntervention[]>([]);
  const [grangerResults, setGrangerResults] = useState<GrangerCausalityResult[]>([]);

  useEffect(() => {
    const companyId = 'mock';
    Promise.all([
      proph3tService.getCausalGraph(companyId),
      proph3tService.getCausalDecomposition(companyId, '2026-03'),
      proph3tService.getCausalInterventions(companyId),
      proph3tService.getGrangerResults(companyId),
    ]).then(([g, d, iv, gr]) => {
      setGraph(g);
      setDecomposition(d);
      setInterventions(iv);
      setGrangerResults(gr);
    });
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader
        title="Intelligence Causale"
        description="Analyse des relations de cause a effet dans vos flux de tresorerie"
      />

      <Tabs defaultValue="graph" className="space-y-4">
        <TabsList>
          <TabsTrigger value="graph">Graphe Causal</TabsTrigger>
          <TabsTrigger value="decomposition">Decomposition</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="granger">Tests de Granger</TabsTrigger>
        </TabsList>

        {/* Tab 1: Causal Graph */}
        <TabsContent value="graph">
          {graph ? (
            <CausalGraphViz graph={graph} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Chargement du graphe causal...</CardContent></Card>
          )}
        </TabsContent>

        {/* Tab 2: Decomposition */}
        <TabsContent value="decomposition">
          {decomposition ? (
            <CausalDecompositionViz decomposition={decomposition} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Chargement de la decomposition...</CardContent></Card>
          )}
        </TabsContent>

        {/* Tab 3: Interventions */}
        <TabsContent value="interventions">
          {interventions.length > 0 ? (
            <CausalInterventions interventions={interventions} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Chargement des interventions...</CardContent></Card>
          )}
        </TabsContent>

        {/* Tab 4: Granger */}
        <TabsContent value="granger">
          {grangerResults.length > 0 ? (
            <GrangerResults results={grangerResults} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Chargement des resultats...</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Note */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="flex items-start gap-3 py-4">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Note sur l'analyse causale</p>
            <p className="mt-1">
              L'analyse causale necessite un minimum de 24 mois d'historique de donnees pour produire des resultats fiables.
              Les relations identifiees sont statistiques et doivent etre validees par un expert metier.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
