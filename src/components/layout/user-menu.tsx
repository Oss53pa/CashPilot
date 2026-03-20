import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, Settings, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/config/supabase';

/**
 * User dropdown menu showing profile info and quick actions.
 *
 * In a full implementation this would read the authenticated user from a
 * dedicated auth store. For now it shows a placeholder that will be wired
 * up once the auth context is available.
 */
export function UserMenu() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  // TODO: replace with real auth store / context
  const user = {
    full_name: 'John Doe',
    email: 'john@example.com',
    avatar_url: null as string | null,
    role: 'admin' as const,
  };

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
          <Avatar className="h-7 w-7">
            {user.avatar_url && (
              <AvatarImage src={user.avatar_url} alt={user.full_name} />
            )}
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[100px] truncate text-sm font-medium sm:inline-block">
            {user.full_name}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground capitalize">
              {user.role}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
            <User className="mr-2 h-4 w-4" />
            {t('sidebar.profile', 'Profile')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            {t('sidebar.settings', 'Settings')}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          {t('auth.logout', 'Logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
