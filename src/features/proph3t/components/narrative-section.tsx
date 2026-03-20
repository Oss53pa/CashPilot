import { Badge } from '@/components/ui/badge';
import { SentimentIndicator } from './sentiment-indicator';
import type { NarrativeSection as NarrativeSectionType } from '@/types/proph3t';

interface NarrativeSectionProps {
  section: NarrativeSectionType;
}

export function NarrativeSection({ section }: NarrativeSectionProps) {
  return (
    <div className="space-y-2 p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{section.title}</h3>
        <SentimentIndicator sentiment={section.sentiment} />
      </div>
      <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
        {section.content}
      </p>
      {section.data_points.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {section.data_points.map((dp, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {dp.label}: <span className="font-semibold ml-1">{dp.value}</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
