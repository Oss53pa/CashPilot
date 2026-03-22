import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SupplierScorecard, SupplierScorecardCriteria } from "../types";
import { SCORECARD_CRITERIA } from "./supplier-form-utils";

interface SupplierTabScorecardProps {
  scorecards: SupplierScorecard[];
  setScorecards: React.Dispatch<React.SetStateAction<SupplierScorecard[]>>;
  newScorecard: SupplierScorecardCriteria[];
  setNewScorecard: React.Dispatch<
    React.SetStateAction<SupplierScorecardCriteria[]>
  >;
  newRecommendation: "renew" | "tender" | "terminate";
  setNewRecommendation: React.Dispatch<
    React.SetStateAction<"renew" | "tender" | "terminate">
  >;
  avgScore: string;
}

export function SupplierTabScorecard({
  scorecards,
  setScorecards,
  newScorecard,
  setNewScorecard,
  newRecommendation,
  setNewRecommendation,
  avgScore,
}: SupplierTabScorecardProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouvelle evaluation</CardTitle>
          <CardDescription>
            Evaluez le fournisseur sur 6 criteres (note de 1 a 5)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {newScorecard.map((criterion, idx) => (
            <div key={criterion.name} className="flex items-center gap-4">
              <div className="w-48 text-sm font-medium">{criterion.name}</div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <Button
                    key={score}
                    variant={criterion.score >= score ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      const updated = [...newScorecard];
                      updated[idx] = { ...criterion, score };
                      setNewScorecard(updated);
                    }}
                  >
                    {score}
                  </Button>
                ))}
              </div>
              <Input
                placeholder="Commentaire..."
                className="flex-1"
                value={criterion.comment ?? ""}
                onChange={(e) => {
                  const updated = [...newScorecard];
                  updated[idx] = {
                    ...criterion,
                    comment: e.target.value || undefined,
                  };
                  setNewScorecard(updated);
                }}
              />
            </div>
          ))}
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Score global</p>
              <p className="text-3xl font-bold">{avgScore} / 5</p>
            </div>
            <div className="space-y-2 w-48">
              <Label>Recommandation</Label>
              <Select
                value={newRecommendation}
                onValueChange={(v) =>
                  setNewRecommendation(v as "renew" | "tender" | "terminate")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="renew">Renouveler</SelectItem>
                  <SelectItem value="tender">
                    Remettre en concurrence
                  </SelectItem>
                  <SelectItem value="terminate">Resilier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={() => {
              const sc: SupplierScorecard = {
                id: `sc-${Date.now()}`,
                criteria: [...newScorecard],
                overall_score: Number(avgScore),
                evaluator_id: "current-user",
                evaluation_date: new Date().toISOString().split("T")[0],
                period: new Date().getFullYear().toString(),
                recommendation: newRecommendation,
              };
              setScorecards([sc, ...scorecards]);
              setNewScorecard(
                SCORECARD_CRITERIA.map((name) => ({ name, score: 3 })),
              );
            }}
          >
            Enregistrer l'evaluation
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Historique des evaluations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scorecards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune evaluation enregistree
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Periode</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Recommandation</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scorecards.map((sc) => (
                  <TableRow key={sc.id}>
                    <TableCell className="font-medium">{sc.period}</TableCell>
                    <TableCell>{sc.evaluation_date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-bold">
                          {sc.overall_score.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground">/ 5</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sc.recommendation === "renew"
                            ? "default"
                            : sc.recommendation === "tender"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {sc.recommendation === "renew"
                          ? "Renouveler"
                          : sc.recommendation === "tender"
                            ? "Remettre en concurrence"
                            : "Resilier"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {sc.criteria.map((c) => (
                          <div
                            key={c.name}
                            className={`h-5 w-5 rounded text-[10px] flex items-center justify-center font-bold ${c.score >= 4 ? "bg-green-100 text-green-700" : c.score >= 3 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                            title={`${c.name}: ${c.score}/5`}
                          >
                            {c.score}
                          </div>
                        ))}
                      </div>
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
