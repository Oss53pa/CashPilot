import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { useCompanyStore } from '@/stores/company.store';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Company } from '@/types/database';

export function CompanySwitcher() {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companies = useCompanyStore((s) => s.companies);
  const setCurrentCompany = useCompanyStore((s) => s.setCurrentCompany);

  const handleSelect = (company: Company) => {
    setCurrentCompany(company);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-label={t('actions.search', 'Search company')}
          className="h-8 gap-2 px-2"
        >
          <Avatar className="h-5 w-5">
            {currentCompany?.logo_url && (
              <AvatarImage src={currentCompany.logo_url} alt={currentCompany.name} />
            )}
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {currentCompany?.short_name?.slice(0, 2) ?? <Building2 className="h-3 w-3" />}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline-block">
            {currentCompany?.short_name ?? currentCompany?.name ?? t('sidebar.dashboard', 'Company')}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="end">
        <Command>
          <CommandInput placeholder={t('actions.search', 'Search') + '...'} />
          <CommandList>
            <CommandEmpty>{t('actions.noData', 'No company found.')}</CommandEmpty>
            <CommandGroup>
              {companies.map((company) => (
                <CommandItem
                  key={company.id}
                  value={company.name}
                  onSelect={() => handleSelect(company)}
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-5 w-5">
                    {company.logo_url && (
                      <AvatarImage src={company.logo_url} alt={company.name} />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {company.short_name?.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate">{company.name}</span>
                  {currentCompany?.id === company.id && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
