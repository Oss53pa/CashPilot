import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

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

export function UserSettings() {
  const { t } = useTranslation();

  // Placeholder data
  const users = [
    { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active' },
    { id: '2', name: 'Finance Manager', email: 'finance@example.com', role: 'manager', status: 'active' },
    { id: '3', name: 'Viewer', email: 'viewer@example.com', role: 'viewer', status: 'inactive' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('settings.users', 'Users')}</CardTitle>
          <CardDescription>
            {t('settings.usersDesc', 'Manage user accounts and permissions.')}
          </CardDescription>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {t('settings.inviteUser', 'Invite User')}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('settings.userName', 'Name')}</TableHead>
              <TableHead>{t('settings.email', 'Email')}</TableHead>
              <TableHead>{t('settings.role', 'Role')}</TableHead>
              <TableHead>{t('settings.status', 'Status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
