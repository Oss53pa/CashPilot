import { useCompanyStore } from '@/stores/company.store';

export function useCurrentCompany() {
  const company = useCompanyStore((s) => s.currentCompany);
  if (!company) throw new Error('No company selected');
  return company;
}
