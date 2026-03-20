import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const { signIn } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(values: LoginFormValues) {
    signIn.mutate(values);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">CashPilot</CardTitle>
          <CardDescription>{t('login.subtitle', 'Sign in to your account')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('login.email', 'Email')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('login.password', 'Password')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {signIn.isError && (
                <p className="text-sm text-destructive">
                  {signIn.error instanceof Error ? signIn.error.message : t('login.error', 'Authentication failed')}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={signIn.isPending}>
                {signIn.isPending ? t('login.signing_in', 'Signing in...') : t('login.sign_in', 'Sign in')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm">
          <Link to="/forgot-password" className="text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
            {t('login.forgot_password', 'Forgot your password?')}
          </Link>
          <p className="text-muted-foreground">
            {t('login.no_account', "Don't have an account?")}{' '}
            <Link to="/register" className="text-primary hover:underline underline-offset-4">
              {t('login.register', 'Sign up')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
