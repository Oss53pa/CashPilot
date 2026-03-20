import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { CurrencyDisplay } from '@/components/shared/currency-display';
import type { TaxObligation } from '@/types/database';

interface TaxCalendarProps {
  obligations: TaxObligation[];
}

const statusColors: Record<string, string> = {
  upcoming: 'bg-gray-100 text-gray-800 border-gray-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  overdue: 'bg-red-100 text-red-800 border-red-200',
  contested: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function TaxCalendar({ obligations }: TaxCalendarProps) {
  // Group obligations by month
  const byMonth = new Map<number, TaxObligation[]>();
  for (const ob of obligations) {
    const month = new Date(ob.due_date).getMonth();
    const existing = byMonth.get(month) ?? [];
    existing.push(ob);
    byMonth.set(month, existing);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {months.map((monthName, index) => {
            const monthObligations = byMonth.get(index) ?? [];
            return (
              <div
                key={index}
                className="rounded-lg border p-3 space-y-2"
              >
                <p className="text-sm font-medium text-center">{monthName}</p>
                {monthObligations.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center">-</p>
                ) : (
                  monthObligations.map((ob) => (
                    <div
                      key={ob.id}
                      className={`rounded p-1.5 text-xs border ${statusColors[ob.status] ?? ''}`}
                    >
                      <p className="font-medium truncate">
                        {ob.type.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <CurrencyDisplay
                        amount={ob.amount}
                        currency={ob.currency}
                        className="text-xs"
                      />
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
