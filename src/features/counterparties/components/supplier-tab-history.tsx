import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SupplierTransaction } from "../types";
import { fmt } from "./supplier-form-utils";

interface SupplierTabHistoryProps {
  transactions: SupplierTransaction[];
}

export function SupplierTabHistory({ transactions }: SupplierTabHistoryProps) {
  const typeLabel = {
    invoice: "Facture",
    payment: "Paiement",
    credit_note: "Avoir",
    advance: "Acompte",
  };
  const statusLabel = {
    paid: "Paye",
    pending: "En attente",
    overdue: "En retard",
    cancelled: "Annule",
  };
  const statusVariant = {
    paid: "default" as const,
    pending: "secondary" as const,
    overdue: "destructive" as const,
    cancelled: "outline" as const,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Historique des transactions</CardTitle>
        <CardDescription>
          {transactions.length} transactions - Montant total:{" "}
          {fmt(transactions.reduce((s, t) => s + t.amount, 0))}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-mono text-sm">{tx.date}</TableCell>
                <TableCell>
                  <Badge variant="outline">{typeLabel[tx.type]}</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {tx.reference}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {tx.description}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {fmt(tx.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[tx.status]}>
                    {statusLabel[tx.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
