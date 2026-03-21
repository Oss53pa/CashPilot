import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { TFTSection, TFTLineItem } from '../types';

// ---------------------------------------------------------------------------
// Line row
// ---------------------------------------------------------------------------

function TFTLineRow({ item, depth = 0 }: { item: TFTLineItem; depth?: number }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  function handleAmountClick() {
    toast({ title: 'Drill-down a venir', description: `Detail de "${item.label}" sera disponible prochainement.` });
  }

  const varianceColor =
    item.variance_amount != null
      ? item.variance_amount >= 0
        ? 'text-green-600'
        : 'text-red-600'
      : '';

  return (
    <>
      <div
        className={cn(
          'grid grid-cols-12 gap-2 items-center py-1.5 px-3 text-sm hover:bg-muted/40 transition-colors',
          item.is_subtotal && 'font-semibold bg-muted/20',
          item.is_total && 'font-bold border-t bg-muted/30',
          depth > 0 && 'text-muted-foreground',
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {/* Label */}
        <div className="col-span-4 flex items-center gap-1.5">
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-0.5 rounded hover:bg-accent"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <span className="text-xs text-muted-foreground/60 w-8">{item.code}</span>
          <span className="truncate">{item.label}</span>
        </div>

        {/* Current period */}
        <div className="col-span-2 text-right">
          <button onClick={handleAmountClick} className="hover:underline cursor-pointer">
            <CurrencyDisplay
              amount={item.sign === '-' ? -item.current_period : item.current_period}
              currency="XOF"
              colorize
            />
          </button>
        </div>

        {/* Previous period */}
        <div className="col-span-2 text-right text-muted-foreground">
          <CurrencyDisplay
            amount={item.sign === '-' ? -item.previous_period : item.previous_period}
            currency="XOF"
          />
        </div>

        {/* Variance amount */}
        <div className="col-span-2 text-right">
          {item.variance_amount != null ? (
            <span className={cn('text-xs', varianceColor)}>
              <CurrencyDisplay amount={item.variance_amount} currency="XOF" className={varianceColor} />
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>

        {/* Variance % */}
        <div className="col-span-2 text-right">
          {item.variance_pct != null ? (
            <Badge
              variant={item.variance_pct >= 0 ? 'success' : 'destructive'}
              className="text-[10px] px-1.5 py-0"
            >
              {item.variance_pct >= 0 ? '+' : ''}{item.variance_pct}%
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && item.children!.map((child) => (
        <TFTLineRow key={child.code} item={child} depth={depth + 1} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-section (Receipts / Disbursements)
// ---------------------------------------------------------------------------

function SubSection({
  title,
  items,
  total,
  isReceipt,
}: {
  title: string;
  items: TFTLineItem[];
  total: number;
  isReceipt: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/40 transition-colors rounded-md">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <CurrencyDisplay
          amount={isReceipt ? total : -total}
          currency="XOF"
          colorize
          className="text-sm font-semibold"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {/* Column headers */}
        <div className="grid grid-cols-12 gap-2 items-center py-1 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 border-b">
          <div className="col-span-4">Libelle</div>
          <div className="col-span-2 text-right">Periode</div>
          <div className="col-span-2 text-right">N-1</div>
          <div className="col-span-2 text-right">Ecart</div>
          <div className="col-span-2 text-right">Ecart %</div>
        </div>
        {items.map((item) => (
          <TFTLineRow key={item.code} item={item} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Main section component
// ---------------------------------------------------------------------------

interface TFTSectionComponentProps {
  section: TFTSection;
}

export function TFTSectionComponent({ section }: TFTSectionComponentProps) {
  const [open, setOpen] = useState(true);

  const netFlowStatus = section.net_flow >= 0 ? 'success' : 'destructive';

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              <CardTitle className="text-base">
                Section {section.code} — {section.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={netFlowStatus as 'success' | 'destructive'}>
                Flux net : <CurrencyDisplay amount={section.net_flow} currency="XOF" className="ml-1" />
              </Badge>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-2">
            <SubSection
              title="Encaissements"
              items={section.receipts}
              total={section.total_receipts}
              isReceipt
            />
            <SubSection
              title="Decaissements"
              items={section.disbursements}
              total={section.total_disbursements}
              isReceipt={false}
            />

            {/* Net flow total */}
            <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-md border">
              <span className="text-sm font-bold">Flux net de tresorerie ({section.code})</span>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Periode</p>
                  <CurrencyDisplay amount={section.net_flow} currency="XOF" colorize className="text-sm font-bold" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">N-1</p>
                  <CurrencyDisplay amount={section.net_flow_previous} currency="XOF" className="text-sm text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
