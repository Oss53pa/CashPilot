import { useState } from 'react';
import { useCompanyStore } from '@/stores/company.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { useRecalibrationLog, useTriggerRecalibration } from '../hooks/use-forecast';
import { formatDate } from '@/lib/utils';

export function RecalibrationLog() {
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id ?? '';

  const { data: events = [], isLoading } = useRecalibrationLog(companyId);
  const triggerRecalibration = useTriggerRecalibration(companyId);
  const [autoRecalibration, setAutoRecalibration] = useState(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading recalibration log...
      </div>
    );
  }

  const lastEvent = events.length > 0 ? events[0] : null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Card className="flex-1 w-full sm:w-auto">
          <CardContent className="flex items-center gap-3 py-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Last Recalibration</p>
              <p className="text-xs text-muted-foreground">
                {lastEvent
                  ? `${formatDate(lastEvent.timestamp)} - ${lastEvent.trigger}`
                  : 'No recalibration yet'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-recal"
              checked={autoRecalibration}
              onCheckedChange={setAutoRecalibration}
            />
            <Label htmlFor="auto-recal" className="text-sm">
              Auto-recalibration
            </Label>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerRecalibration.mutate()}
            disabled={triggerRecalibration.isPending}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${triggerRecalibration.isPending ? 'animate-spin' : ''}`}
            />
            {triggerRecalibration.isPending ? 'Recalibrating...' : 'Manual Recalibration'}
          </Button>
        </div>
      </div>

      {/* Success message */}
      {triggerRecalibration.isSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Recalibration complete</p>
              <p className="text-xs text-green-600">
                {triggerRecalibration.data?.forecasts_updated} forecasts updated
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recalibration Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Recalibrations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Old Profile</TableHead>
                <TableHead>New Profile</TableHead>
                <TableHead className="text-right">Forecasts Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDate(event.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {event.trigger}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{event.counterparty}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {event.old_profile}
                  </TableCell>
                  <TableCell className="text-sm">{event.new_profile}</TableCell>
                  <TableCell className="text-right font-medium">
                    {event.forecasts_updated_count}
                  </TableCell>
                </TableRow>
              ))}
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No recalibration events recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
