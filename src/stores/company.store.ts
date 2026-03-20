import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Company } from '@/types/database';

interface CompanyState {
  currentCompany: Company | null;
  companies: Company[];
  setCurrentCompany: (company: Company | null) => void;
  setCompanies: (companies: Company[]) => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      currentCompany: null,
      companies: [],
      setCurrentCompany: (company) => set({ currentCompany: company }),
      setCompanies: (companies) => set({ companies }),
    }),
    {
      name: 'cashpilot-company',
      partialize: (state) => ({
        currentCompany: state.currentCompany,
      }),
    }
  )
);
