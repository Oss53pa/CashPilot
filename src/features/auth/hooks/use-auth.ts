import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: session, isLoading } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: authService.getSession,
    retry: false,
  });

  const signIn = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.signIn(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      navigate('/dashboard');
    },
  });

  const signUp = useMutation({
    mutationFn: ({ email, password, fullName }: { email: string; password: string; fullName: string }) =>
      authService.signUp(email, password, fullName),
    onSuccess: () => navigate('/login'),
  });

  const signOut = useMutation({
    mutationFn: authService.signOut,
    onSuccess: () => {
      queryClient.clear();
      navigate('/login');
    },
  });

  const resetPassword = useMutation({
    mutationFn: ({ email }: { email: string }) => authService.resetPassword(email),
  });

  return { session, isLoading, signIn, signUp, signOut, resetPassword, isAuthenticated: !!session };
}
