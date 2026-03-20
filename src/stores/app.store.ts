import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type Locale = 'fr' | 'en';

interface AppState {
  sidebarCollapsed: boolean;
  theme: Theme;
  locale: Locale;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'light',
      locale: 'fr',
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'cashpilot-app-settings',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        locale: state.locale,
      }),
    }
  )
);
