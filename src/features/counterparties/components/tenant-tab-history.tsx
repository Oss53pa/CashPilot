import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TransactionHistoryEntry } from "../types";
import { formatFrancs } from "@/utils/currency";
import { formatDate } from "./tenant-form-utils";

interface TabHistoryProps {
  entries: TransactionHistoryEntry[];
}

export function TabHistory({ entries }: TabHistoryProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">
        Historique des transactions ({entries.length})
      </h3>

      <Card>
        <CardContent className="pt-4">
          {entries.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Aucune transaction enregistree.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Montant (FCFA)</TableHead>
                  <TableHead className="text-right">Solde apres</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.slice(0, 30).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {e.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.reference ?? "-"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${e.amount < 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {e.amount < 0 ? "-" : "+"}
                      {formatFrancs(Math.abs(e.amount))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatFrancs(e.balance_after)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
