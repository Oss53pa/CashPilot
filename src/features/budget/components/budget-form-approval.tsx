import { Check, Clock, X, User, CalendarDays, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BudgetApprovalStep } from "../types";
import { APPROVAL_STATUS_CONFIG } from "./budget-form-utils";

// ─── Props ───────────────────────────────────────────────────────────────────

interface BudgetFormApprovalProps {
  approvalSteps: BudgetApprovalStep[];
  onUpdateApprovalComment: (stepIndex: number, comment: string) => void;
}

// ─── Section F — Approval Workflow ──────────────────────────────────────────

export function BudgetFormApproval({
  approvalSteps,
  onUpdateApprovalComment,
}: BudgetFormApprovalProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Section F — Circuit d'approbation
        </CardTitle>
        <CardDescription>
          5 étapes de validation du budget : Saisie - Revue DAF - DGA - DG -
          Activation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual stepper */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto py-4">
          {approvalSteps.map((step, idx) => {
            const config = APPROVAL_STATUS_CONFIG[step.status];
            const isLast = idx === approvalSteps.length - 1;

            return (
              <div key={step.step} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2",
                      step.status === "approved" &&
                        "bg-green-100 border-green-500 text-green-700",
                      step.status === "rejected" &&
                        "bg-red-100 border-red-500 text-red-700",
                      step.status === "pending" &&
                        "bg-muted border-muted-foreground/30 text-muted-foreground",
                      step.status === "skipped" &&
                        "bg-muted border-dashed text-muted-foreground",
                    )}
                  >
                    {step.status === "approved" && (
                      <Check className="h-5 w-5" />
                    )}
                    {step.status === "rejected" && <X className="h-5 w-5" />}
                    {step.status === "pending" && <Clock className="h-5 w-5" />}
                    {step.status === "skipped" && (
                      <span className="text-xs">-</span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-center max-w-[80px]">
                    {step.role}
                  </span>
                  <Badge variant={config.variant} className="text-[10px]">
                    {config.label}
                  </Badge>
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "w-12 h-0.5 mx-1",
                      approvalSteps[idx + 1]?.status === "approved" ||
                        step.status === "approved"
                        ? "bg-green-500"
                        : "bg-muted-foreground/20",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Step details */}
        <div className="space-y-4">
          {approvalSteps.map((step, idx) => {
            const config = APPROVAL_STATUS_CONFIG[step.status];
            return (
              <div
                key={step.step}
                className={cn(
                  "rounded-md border p-4 space-y-2",
                  step.status === "approved" &&
                    "border-green-200 bg-green-50/50 dark:bg-green-950/10",
                  step.status === "rejected" &&
                    "border-red-200 bg-red-50/50 dark:bg-red-950/10",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">Étape {step.step}</span>
                    <Badge variant={config.variant}>{config.label}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {step.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    {step.actor_name}
                    {step.date && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {step.date}
                      </span>
                    )}
                    <span>Délai: {step.deadline_days}j</span>
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-1">
                  {step.comment && step.status !== "pending" && (
                    <p className="text-sm italic text-muted-foreground">
                      « {step.comment} »
                    </p>
                  )}
                  {step.status === "pending" && (
                    <Textarea
                      placeholder="Ajouter un commentaire..."
                      className="h-16 text-sm"
                      value={step.comment ?? ""}
                      onChange={(e) =>
                        onUpdateApprovalComment(idx, e.target.value)
                      }
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
