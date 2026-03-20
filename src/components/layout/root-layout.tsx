import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Proph3tFloatingBall } from '@/components/proph3t-floating-ball';
import { useAppStore } from '@/stores/app.store';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

export default function RootLayout() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden transition-all duration-300',
          isDesktop
            ? sidebarCollapsed
              ? 'ml-16'
              : 'ml-64'
            : 'ml-0'
        )}
      >
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      <Proph3tFloatingBall />
    </div>
  );
}
