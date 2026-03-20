import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="text-4xl font-bold font-display text-primary">
            CashPilot
          </span>
          <p className="text-sm text-muted-foreground">
            Gestion intelligente de tresorerie
          </p>
        </div>

        {/* Auth card */}
        <div className="rounded-xl border bg-card p-6 shadow-lg sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
