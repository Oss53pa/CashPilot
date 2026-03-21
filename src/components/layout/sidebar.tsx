import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  Landmark,
  Wallet,
  Calculator,
  Users,
  ArrowLeftRight,
  Building2,
  CreditCard,
  PiggyBank,
  BadgeDollarSign,
  Gavel,
  FileText,
  ShieldCheck,
  ClipboardList,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  type LucideIcon,
  BarChart3,
  FileSpreadsheet,
  CalendarRange,
} from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  Landmark,
  Wallet,
  Calculator,
  Users,
  ArrowLeftRight,
  Building2,
  CreditCard,
  PiggyBank,
  BadgeDollarSign,
  Gavel,
  FileText,
  ShieldCheck,
  ClipboardList,
  Settings,
  HelpCircle,
  BarChart3,
  FileSpreadsheet,
  CalendarRange,
};

// ---------------------------------------------------------------------------
// Navigation structure
// ---------------------------------------------------------------------------
interface NavSection {
  titleKey: string;
  items: NavItemDef[];
}

interface NavItemDef {
  labelKey: string;
  icon: string;
  path: string;
}

const SIDEBAR_SECTIONS: NavSection[] = [
  {
    titleKey: '',
    items: [
      { labelKey: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
    ],
  },
  {
    titleKey: 'Tresorerie',
    items: [
      { labelKey: 'Encaissements', icon: 'ArrowDownToLine', path: '/receipts' },
      { labelKey: 'Decaissements', icon: 'ArrowUpFromLine', path: '/disbursements' },
      { labelKey: 'Previsions', icon: 'TrendingUp', path: '/forecast' },
      { labelKey: 'Tableau annuel', icon: 'BarChart3', path: '/forecast/annual' },
      { labelKey: 'TFT', icon: 'FileSpreadsheet', path: '/tft' },
      { labelKey: 'Prévisions 12 mois', icon: 'CalendarRange', path: '/rolling-forecast' },
    ],
  },
  {
    titleKey: 'Comptes',
    items: [
      { labelKey: 'Comptes bancaires', icon: 'Landmark', path: '/accounts' },
      { labelKey: 'Caisse & Mobile Money', icon: 'Wallet', path: '/cash-registers' },
    ],
  },
  {
    titleKey: 'Gestion',
    items: [
      { labelKey: 'Budget', icon: 'Calculator', path: '/budget' },
      { labelKey: 'Contreparties', icon: 'Users', path: '/counterparties' },
      { labelKey: 'Cycle de vie locataires', icon: 'Users', path: '/tenant-lifecycle' },
      { labelKey: 'Transferts internes', icon: 'ArrowLeftRight', path: '/transfers' },
    ],
  },
  {
    titleKey: 'Financement',
    items: [
      { labelKey: 'CAPEX', icon: 'Building2', path: '/capex' },
      { labelKey: 'Dette', icon: 'CreditCard', path: '/debt' },
      { labelKey: 'Placements', icon: 'PiggyBank', path: '/investments' },
      { labelKey: 'Lignes de credit', icon: 'BadgeDollarSign', path: '/credit-lines' },
    ],
  },
  {
    titleKey: 'Risques',
    items: [
      { labelKey: 'Contentieux', icon: 'Gavel', path: '/disputes' },
      { labelKey: 'Fiscal', icon: 'FileText', path: '/fiscal' },
    ],
  },
  {
    titleKey: 'Workflows',
    items: [
      { labelKey: 'Approbations', icon: 'ShieldCheck', path: '/payment-workflows' },
    ],
  },
  {
    titleKey: 'Administration',
    items: [
      { labelKey: 'Rapports', icon: 'ClipboardList', path: '/reports' },
      { labelKey: 'Audit Trail', icon: 'FileText', path: '/audit-trail' },
      { labelKey: 'Parametres', icon: 'Settings', path: '/settings' },
      { labelKey: 'Delais paiement', icon: 'ClipboardList', path: '/settings/payment-delays' },
      { labelKey: 'Guide d\'utilisation', icon: 'HelpCircle', path: '/guide' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Sidebar nav item
// ---------------------------------------------------------------------------
function SidebarNavItem({
  item,
  collapsed,
}: {
  item: NavItemDef;
  collapsed: boolean;
}) {
  const Icon = iconMap[item.icon] ?? LayoutDashboard;
  const label = item.labelKey;

  const link = (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
            : 'text-muted-foreground',
          collapsed && 'justify-center px-2'
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

// ---------------------------------------------------------------------------
// Sidebar content (shared between desktop and mobile)
// ---------------------------------------------------------------------------
function SidebarContent({
  collapsed,
  onCollapse,
}: {
  collapsed: boolean;
  onCollapse?: () => void;
}) {

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b px-4',
          collapsed ? 'justify-center' : 'gap-2'
        )}
      >
        {collapsed ? (
          <span className="text-xl font-bold font-display text-primary">CP</span>
        ) : (
          <span className="text-xl font-bold font-display text-primary">
            CashPilot
          </span>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <TooltipProvider>
          <nav className="flex flex-col gap-0.5">
            {SIDEBAR_SECTIONS.map((section, sIdx) => (
              <div key={sIdx}>
                {sIdx > 0 && <Separator className="my-3" />}
                {section.titleKey && !collapsed && (
                  <p className="mb-2 mt-1 px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
                    {section.titleKey}
                  </p>
                )}
                {section.titleKey && collapsed && sIdx > 0 && (
                  <div className="mx-auto my-1 h-px w-6 bg-border" />
                )}
                <div className="flex flex-col gap-0.5">
                  {section.items.map((item) => (
                    <SidebarNavItem
                      key={item.path}
                      item={item}
                      collapsed={collapsed}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      {/* Collapse toggle (desktop only) */}
      {onCollapse && (
        <div className="shrink-0 border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            className={cn('w-full', collapsed ? 'justify-center' : 'justify-start')}
            onClick={onCollapse}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Reduire</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Sidebar export
// ---------------------------------------------------------------------------
export function Sidebar() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Desktop sidebar
  if (isDesktop) {
    return (
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 border-r bg-card transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent collapsed={sidebarCollapsed} onCollapse={toggleSidebar} />
      </aside>
    );
  }

  // Mobile sidebar (drawer pattern)
  return (
    <>
      {/* Hamburger trigger rendered in header via portal, but we also need the drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative z-50 w-64 bg-card shadow-xl">
            <SidebarContent collapsed={false} />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-3"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </aside>
        </div>
      )}
    </>
  );
}

// Export the mobile toggle for the header to use
export function MobileSidebarTrigger() {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [, setMobileOpen] = useState(false);

  if (isDesktop) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={() => setMobileOpen(true)}
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Open sidebar</span>
    </Button>
  );
}
