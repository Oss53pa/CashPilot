import { useState, useEffect } from 'react';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { FederatedSettings } from '../components/federated/federated-settings';
import { FederatedPerformanceViz } from '../components/federated/federated-performance';
import { FederatedAudit } from '../components/federated/federated-audit';

import * as proph3tService from '../services/proph3t.service';
import type { FederatedConfig, FederatedPerformance, FederatedAuditEntry } from '../components/federated/federated-types';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FederatedPage() {
  const [config, setConfig] = useState<FederatedConfig | null>(null);
  const [performance, setPerformance] = useState<FederatedPerformance[]>([]);
  const [auditLog, setAuditLog] = useState<FederatedAuditEntry[]>([]);

  useEffect(() => {
    const tenantId = 'mock';
    Promise.all([
      proph3tService.getFederatedConfig(tenantId),
      proph3tService.getFederatedPerformance(tenantId),
      proph3tService.getFederatedAuditLog(tenantId),
    ]).then(([c, p, a]) => {
      setConfig(c);
      setPerformance(p);
      setAuditLog(a);
    });
  }, []);

  const handleToggle = (optIn: boolean) => {
    proph3tService.toggleFederatedLearning('mock', optIn);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader
        title="Apprentissage Federe"
        description="Ameliorez vos modeles en beneficiant de l'intelligence collective, sans partager vos donnees"
      />

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {/* Tab 1: Configuration */}
        <TabsContent value="config">
          {config ? (
            <FederatedSettings config={config} performance={performance} onToggle={handleToggle} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Chargement de la configuration...</CardContent></Card>
          )}
        </TabsContent>

        {/* Tab 2: Performance */}
        <TabsContent value="performance">
          {performance.length > 0 ? (
            <FederatedPerformanceViz performance={performance} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Chargement des performances...</CardContent></Card>
          )}
        </TabsContent>

        {/* Tab 3: Audit */}
        <TabsContent value="audit">
          {auditLog.length > 0 ? (
            <FederatedAudit entries={auditLog} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Chargement du journal d'audit...</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
