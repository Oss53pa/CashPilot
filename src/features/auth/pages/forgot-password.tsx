import { useState } from 'react';
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

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const { resetPassword } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  function onSubmit(values: ForgotPasswordFormValues) {
    resetPassword.mutate(values, {
      onSuccess: () => setSubmitted(true),
    });
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">CashPilot</CardTitle>
            <CardDescription>{t('forgot_password.success_title', 'Check your email')}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              {t('forgot_password.success_message', 'If an account with that email exists, we sent you a password reset link.')}
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Link to="/login" className="text-sm text-primary hover:underline underline-offset-4">
              {t('forgot_password.back_to_login', 'Back to sign in')}
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">CashPilot</CardTitle>
          <CardDescription>{t('forgot_password.subtitle', 'Reset your password')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('forgot_password.email', 'Email')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {resetPassword.isError && (
                <p className="text-sm text-destructive">
                  {resetPassword.error instanceof Error ? resetPassword.error.message : t('forgot_password.error', 'Something went wrong')}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
                {resetPassword.isPending ? t('forgot_password.sending', 'Sending...') : t('forgot_password.send', 'Send reset link')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
            {t('forgot_password.back_to_login', 'Back to sign in')}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
