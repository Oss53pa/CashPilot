import { useState } from 'react';
import { Shield, ShieldCheck, ShieldX, Users, Clock, Cpu } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import type { FederatedConfig, FederatedPerformance } from './federated-types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FederatedSettingsProps {
  config: FederatedConfig;
  performance: FederatedPerformance[];
  onToggle: (optIn: boolean) => void;
}

export function FederatedSettings({ config, performance, onToggle }: FederatedSettingsProps) {
  const [optedIn, setOptedIn] = useState(config.is_opted_in);

  const handleToggle = (checked: boolean) => {
    setOptedIn(checked);
    onToggle(checked);
  };

  return (
    <div className="space-y-4">
      {/* Opt-in toggle card */}
      <Card className={optedIn ? 'border-green-200' : 'border-orange-200'}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {optedIn ? (
                <ShieldCheck className="h-6 w-6 text-green-600" />
              ) : (
                <ShieldX className="h-6 w-6 text-orange-600" />
              )}
              <div>
                <CardTitle className="text-base">Apprentissage Federe</CardTitle>
                <CardDescription>
                  {optedIn
                    ? 'Votre entreprise participe au programme d\'apprentissage federe'
                    : 'L\'apprentissage federe est desactive pour votre entreprise'}
                </CardDescription>
              </div>
            </div>
            <Switch checked={optedIn} onCheckedChange={handleToggle} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            L'apprentissage federe permet d'ameliorer la precision des modeles en beneficiant
            des patterns appris sur l'ensemble des participants CashPilot, <strong>sans jamais partager
            vos donnees financieres</strong>. Seuls les poids anonymises du modele sont partages.
          </p>
        </CardContent>
      </Card>

      {/* What is shared / what is NOT shared */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              Ce qui est partage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">&#8226;</span>
                Poids et parametres du modele (anonymises)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">&#8226;</span>
                Gradients agrege avec bruit differentiel (DP)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">&#8226;</span>
                Metriques de performance agregees
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">&#8226;</span>
                Statistiques de distribution (sans valeurs brutes)
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldX className="h-4 w-4 text-red-600" />
              Ce qui n'est JAMAIS partage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">&#8226;</span>
                Montants des transactions
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">&#8226;</span>
                Noms des contreparties ou locataires
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">&#8226;</span>
                Dates de transactions individuelles
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">&#8226;</span>
                Numeros de comptes bancaires
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">&#8226;</span>
                Donnees d'identification de l'entreprise
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Current status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Statut actuel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Participants</p>
                <p className="text-lg font-bold">{config.total_participants}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Cpu className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Version modele global</p>
                <p className="text-lg font-bold">{config.global_model_version}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Derniere aggregation</p>
                <p className="text-sm font-medium">{formatDate(config.last_aggregation)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Prochaine aggregation</p>
                <p className="text-sm font-medium">{formatDate(config.next_aggregation)}</p>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Badge variant={config.privacy_level === 'high' ? 'success' : 'outline'}>
              Niveau de confidentialite: {config.privacy_level === 'high' ? 'Eleve' : 'Standard'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Performance comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Comparaison de performance</CardTitle>
          <CardDescription>Impact de l'apprentissage federe sur la precision de vos modeles</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Metrique</th>
                  <th className="text-center px-4 py-3 font-medium">Local seul</th>
                  <th className="text-center px-4 py-3 font-medium">Avec federe</th>
                  <th className="text-center px-4 py-3 font-medium">Amelioration</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((p, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.metric}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{p.local_only}%</td>
                    <td className="px-4 py-3 text-center font-semibold">{p.with_federated}%</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="success" className="text-xs">
                        {p.metric.startsWith('MAPE') ? '-' : '+'}{p.improvement_pct}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Highlight */}
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="py-4">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            Le federated learning ameliore votre MAPE J+30 de 6.8% a 5.2%, soit une amelioration de 23.5%.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
