import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { useMediaQuery } from '@/hooks/use-media-query';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Breadcrumbs } from './breadcrumbs';
import { CompanySwitcher } from './company-switcher';
import { UserMenu } from './user-menu';

export function Header() {
  const { i18n } = useTranslation();
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const handleToggleLocale = () => {
    const next = locale === 'fr' ? 'en' : 'fr';
    setLocale(next);
    i18n.changeLanguage(next);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
      {/* Mobile menu button – dispatches a custom event the sidebar listens to */}
      {!isDesktop && (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() =>
            window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))
          }
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open sidebar</span>
        </Button>
      )}

      {/* Breadcrumbs */}
      <div className="flex-1 overflow-hidden">
        <Breadcrumbs />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-14 text-xs font-semibold uppercase"
          onClick={handleToggleLocale}
        >
          {locale === 'fr' ? 'EN' : 'FR'}
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Company switcher */}
        <CompanySwitcher />

        <Separator orientation="vertical" className="h-6" />

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
}
