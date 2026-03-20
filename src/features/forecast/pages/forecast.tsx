import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useCompanyStore } from '@/stores/company.store';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useForecasts,
  useCreateForecast,
  useDeleteForecast,
  useForecastVsActual,
  useForecastAccuracy,
} from '../hooks/use-forecast';
import { getForecastColumns } from '../components/forecast-columns';
import { ForecastForm } from '../components/forecast-form';
import { ForecastDashboard } from '../components/forecast-dashboard';
import { ForecastMethods } from '../components/forecast-methods';
import { ForecastMetricsDashboard } from '../components/forecast-metrics';
import { RecalibrationLog } from '../components/recalibration-log';
import type { ForecastInput } from '../types';

export default function ForecastPage() {
  const { t } = useTranslation('forecast');
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id ?? '';

  const [activeHorizon, setActiveHorizon] = useState('monthly');
  const [formOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('forecasts');

  const { data: forecasts = [] } = useForecasts(companyId);
  const createForecast = useCreateForecast(companyId);
  const deleteForecast = useDeleteForecast(companyId);

  const today = new Date().toISOString().split('T')[0];
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data: forecastVsActual } = useForecastVsActual(companyId, {
    from: threeMonthsAgo,
    to: today,
  });
  const { data: accuracy } = useForecastAccuracy(companyId);

  function handleCreate(data: ForecastInput) {
    createForecast.mutate(data);
  }

  function handleDelete(forecast: { id: string }) {
    deleteForecast.mutate(forecast.id);
  }

  const columns = useMemo(
    () =>
      getForecastColumns({
        onEdit: () => setFormOpen(true),
        onDelete: handleDelete,
        currency: currentCompany?.currency,
      }),
    [currentCompany?.currency]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title', 'Forecast')}
        description={t('description', 'Manage and track your cash flow forecasts.')}
      >
        {activeTab === 'forecasts' && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('add', 'Add Forecast')}
          </Button>
        )}
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          <TabsTrigger value="methods">Methods & Engine</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="recalibration">Recalibration</TabsTrigger>
        </TabsList>

        <TabsContent value="forecasts" className="mt-6 space-y-6">
          <ForecastDashboard
            forecasts={forecasts}
            forecastVsActual={forecastVsActual}
            accuracy={accuracy}
            activeHorizon={activeHorizon}
            onHorizonChange={setActiveHorizon}
            currency={currentCompany?.currency}
          />

          <DataTable
            columns={columns}
            data={forecasts}
            searchKey="category"
            searchPlaceholder={t('search', 'Search forecasts...')}
          />
        </TabsContent>

        <TabsContent value="methods" className="mt-6">
          <ForecastMethods />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <ForecastMetricsDashboard />
        </TabsContent>

        <TabsContent value="recalibration" className="mt-6">
          <RecalibrationLog />
        </TabsContent>
      </Tabs>

      <ForecastForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isPending={createForecast.isPending}
      />
    </div>
  );
}
