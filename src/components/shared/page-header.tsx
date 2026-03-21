import { HelpPanel, type HelpConfig } from './help-panel';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  helpConfig?: HelpConfig;
}

export function PageHeader({ title, description, children, helpConfig }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {helpConfig && <HelpPanel config={helpConfig} />}
      </div>
    </div>
  );
}
