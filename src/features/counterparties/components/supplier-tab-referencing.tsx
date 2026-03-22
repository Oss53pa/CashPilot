import { Check, X, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import type {
  SupplierReferencing,
  ReferencingStatus,
  TenderResult,
  RotationFrequency,
} from "../types";
import { REFERENCING_STATUSES } from "./supplier-form-utils";

interface SupplierTabReferencingProps {
  referencing: SupplierReferencing;
  setReferencing: React.Dispatch<React.SetStateAction<SupplierReferencing>>;
}

export function SupplierTabReferencing({
  referencing,
  setReferencing,
}: SupplierTabReferencingProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statut du referencement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Statut *</Label>
              <Select
                value={referencing.referencing_status}
                onValueChange={(v) =>
                  setReferencing({
                    ...referencing,
                    referencing_status: v as ReferencingStatus,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REFERENCING_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date de demande</Label>
              <Input
                type="date"
                value={referencing.request_date}
                onChange={(e) =>
                  setReferencing({
                    ...referencing,
                    request_date: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Date d'approbation</Label>
              <Input
                type="date"
                value={referencing.approval_date ?? ""}
                onChange={(e) =>
                  setReferencing({
                    ...referencing,
                    approval_date: e.target.value || undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Approuve par</Label>
              <Input
                value={referencing.approved_by ?? ""}
                onChange={(e) =>
                  setReferencing({
                    ...referencing,
                    approved_by: e.target.value || undefined,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents requis</CardTitle>
          <CardDescription>
            {referencing.documents.filter((d) => d.provided).length}/
            {referencing.documents.length} documents fournis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {referencing.documents.map((doc, idx) => (
              <div
                key={doc.type}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={doc.provided}
                    onCheckedChange={(checked) => {
                      const newDocs = [...referencing.documents];
                      newDocs[idx] = { ...doc, provided: !!checked };
                      setReferencing({ ...referencing, documents: newDocs });
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">{doc.type}</p>
                    {doc.file && (
                      <p className="text-xs text-muted-foreground">
                        {doc.file}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.provided ? (
                    <Badge variant="default">
                      <Check className="h-3 w-3 mr-1" />
                      Fourni
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <X className="h-3 w-3 mr-1" />
                      Manquant
                    </Badge>
                  )}
                  <Button variant="outline" size="sm">
                    <Upload className="h-3 w-3 mr-1" />
                    {doc.file ? "Remplacer" : "Joindre"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appel d'offres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Reference AO</Label>
              <Input
                value={referencing.tender_ref ?? ""}
                onChange={(e) =>
                  setReferencing({
                    ...referencing,
                    tender_ref: e.target.value || undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Date AO</Label>
              <Input
                type="date"
                value={referencing.tender_date ?? ""}
                onChange={(e) =>
                  setReferencing({
                    ...referencing,
                    tender_date: e.target.value || undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Resultat</Label>
              <Select
                value={referencing.tender_result ?? ""}
                onValueChange={(v) =>
                  setReferencing({
                    ...referencing,
                    tender_result: (v || undefined) as TenderResult | undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="selected">Retenu</SelectItem>
                  <SelectItem value="not_selected">Non retenu</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Justification</Label>
            <Textarea
              value={referencing.tender_justification ?? ""}
              onChange={(e) =>
                setReferencing({
                  ...referencing,
                  tender_justification: e.target.value || undefined,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rotation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Soumis a rotation</Label>
              <p className="text-sm text-muted-foreground">
                Remise en concurrence periodique obligatoire
              </p>
            </div>
            <Switch
              checked={referencing.subject_to_rotation}
              onCheckedChange={(v) =>
                setReferencing({ ...referencing, subject_to_rotation: v })
              }
            />
          </div>
          {referencing.subject_to_rotation && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Frequence de rotation</Label>
                <Select
                  value={referencing.rotation_frequency ?? ""}
                  onValueChange={(v) =>
                    setReferencing({
                      ...referencing,
                      rotation_frequency: (v || undefined) as
                        | RotationFrequency
                        | undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annuelle</SelectItem>
                    <SelectItem value="biennial">Biennale</SelectItem>
                    <SelectItem value="triennial">Triennale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prochain AO prevu</Label>
                <Input
                  type="date"
                  value={referencing.next_tender_date ?? ""}
                  onChange={(e) =>
                    setReferencing({
                      ...referencing,
                      next_tender_date: e.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
