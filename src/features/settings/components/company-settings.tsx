import { useTranslation } from 'react-i18next';
import { Plus, Pencil } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function CompanySettings() {
  const { t } = useTranslation();

  // Placeholder data - in production this would come from a hook
  const companies = [
    { id: '1', name: 'ACME Corp', country: 'Senegal', currency: 'XOF', status: 'active' },
    { id: '2', name: 'Tech Solutions SARL', country: "Cote d'Ivoire", currency: 'XOF', status: 'active' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('settings.companies', 'Companies')}</CardTitle>
          <CardDescription>
            {t('settings.companiesDesc', 'Manage companies in your organization.')}
          </CardDescription>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {t('settings.addCompany', 'Add Company')}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('settings.companyName', 'Company Name')}</TableHead>
              <TableHead>{t('settings.country', 'Country')}</TableHead>
              <TableHead>{t('settings.currency', 'Currency')}</TableHead>
              <TableHead>{t('settings.status', 'Status')}</TableHead>
              <TableHead>{t('settings.actions', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>{company.country}</TableCell>
                <TableCell>{company.currency}</TableCell>
                <TableCell>
                  <Badge variant="success">
                    {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
