import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompanyStore } from '@/stores/company.store';
import {
  useScenarios,
  useCreateScenario,
  useDeleteScenario,
  useRunScenario,
} from '../hooks/use-scenarios';
import { ScenarioForm } from '../components/scenario-form';
import { ScenarioComparison } from '../components/scenario-comparison';
import { StressTests } from '../components/stress-tests';
import { WhatIfSimulator } from '../components/what-if-simulator';
import type { ScenarioFormData } from '../types';

export default function ScenariosPage() {
  const { currentCompany } = useCompanyStore();
  const companyId = currentCompany?.id;

  const [formOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('scenarios');

  const { data: scenarios = [] } = useScenarios(companyId);
  const createScenario = useCreateScenario();
  const deleteScenario = useDeleteScenario();
  const runScenario = useRunScenario();

  function handleSubmit(data: ScenarioFormData) {
    createScenario.mutate(
      { companyId: companyId!, userId: '', data },
      { onSuccess: () => setFormOpen(false) },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Scenarios" description="Model and compare cash flow scenarios">
        {activeTab === 'scenarios' && (
          <Button onClick={() => setFormOpen(true)}>Create Scenario</Button>
        )}
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="stress-tests">Stress Tests</TabsTrigger>
          <TabsTrigger value="what-if">What-If Simulator</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <Card key={scenario.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-medium">{scenario.name}</CardTitle>
                  <Badge variant="secondary">
                    {scenario.type.replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {scenario.adjustments.length} adjustment(s)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runScenario.mutate(scenario.id)}
                      disabled={runScenario.isPending}
                    >
                      Run
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteScenario.mutate(scenario.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {scenarios.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No scenarios yet. Create one to get started.
              </div>
            )}
          </div>

          <ScenarioComparison scenarios={scenarios} />
        </TabsContent>

        <TabsContent value="stress-tests" className="mt-6">
          <StressTests />
        </TabsContent>

        <TabsContent value="what-if" className="mt-6">
          <WhatIfSimulator />
        </TabsContent>
      </Tabs>

      <ScenarioForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        isLoading={createScenario.isPending}
      />
    </div>
  );
}
