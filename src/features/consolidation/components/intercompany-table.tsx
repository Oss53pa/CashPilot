import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import type { InterCompanyFlow } from '../services/consolidation.service';

interface InterCompanyTableProps {
  flows: InterCompanyFlow[];
  isLoading?: boolean;
}

export function InterCompanyTable({ flows, isLoading }: InterCompanyTableProps) {
  // Build matrix: unique company names
  const companyNames = Array.from(
    new Set([
      ...flows.map((f) => f.from_company_name),
      ...flows.map((f) => f.to_company_name),
    ]),
  ).sort();

  // Build flow matrix
  const matrix = new Map<string, Map<string, number>>();
  for (const name of companyNames) {
    matrix.set(name, new Map());
  }
  for (const flow of flows) {
    const row = matrix.get(flow.from_company_name)!;
    const current = row.get(flow.to_company_name) ?? 0;
    row.set(flow.to_company_name, current + flow.amount);
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inter-Company Flows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (companyNames.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inter-Company Flows</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No inter-company flows recorded.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inter-Company Flows</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From \ To</TableHead>
                {companyNames.map((name) => (
                  <TableHead key={name} className="text-center">
                    {name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {companyNames.map((fromName) => (
                <TableRow key={fromName}>
                  <TableCell className="font-medium">{fromName}</TableCell>
                  {companyNames.map((toName) => {
                    const amount = matrix.get(fromName)?.get(toName) ?? 0;
                    return (
                      <TableCell key={toName} className="text-center">
                        {fromName === toName ? (
                          <span className="text-muted-foreground">-</span>
                        ) : amount > 0 ? (
                          <CurrencyDisplay amount={amount} />
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
