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

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { t } = useTranslation('auth');
  const { signUp } = useAuth();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  function onSubmit(values: RegisterFormValues) {
    signUp.mutate({
      email: values.email,
      password: values.password,
      fullName: values.fullName,
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">CashPilot</CardTitle>
          <CardDescription>{t('register.subtitle', 'Create a new account')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.full_name', 'Full name')}</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.email', 'Email')}</FormLabel>
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
                    <FormLabel>{t('register.password', 'Password')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.confirm_password', 'Confirm password')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {signUp.isError && (
                <p className="text-sm text-destructive">
                  {signUp.error instanceof Error ? signUp.error.message : t('register.error', 'Registration failed')}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={signUp.isPending}>
                {signUp.isPending ? t('register.signing_up', 'Creating account...') : t('register.sign_up', 'Create account')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p className="w-full text-muted-foreground">
            {t('register.have_account', 'Already have an account?')}{' '}
            <Link to="/login" className="text-primary hover:underline underline-offset-4">
              {t('register.sign_in', 'Sign in')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
