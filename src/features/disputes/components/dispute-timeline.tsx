import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DisputeFile } from '@/types/database';

interface TimelineEvent {
  date: string;
  label: string;
  description?: string;
}

interface DisputeTimelineProps {
  dispute: DisputeFile;
}

export function DisputeTimeline({ dispute }: DisputeTimelineProps) {
  const events: TimelineEvent[] = [];

  events.push({
    date: dispute.opened_date,
    label: 'Dispute Opened',
    description: `Type: ${dispute.type}`,
  });

  if (dispute.next_hearing) {
    events.push({
      date: dispute.next_hearing,
      label: 'Next Hearing',
      description: dispute.court ? `Court: ${dispute.court}` : undefined,
    });
  }

  if (dispute.closed_date) {
    events.push({
      date: dispute.closed_date,
      label: 'Dispute Closed',
      description: `Status: ${dispute.status}`,
    });
  }

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {events.map((event, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-primary" />
                {index < events.length - 1 && (
                  <div className="w-px flex-1 bg-border" />
                )}
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium">{event.label}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.date).toLocaleDateString('fr-FR')}
                </p>
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <p className="text-muted-foreground text-sm">No events recorded.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
