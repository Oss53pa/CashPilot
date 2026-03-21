import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Brain, X, TrendingUp, AlertTriangle, Activity, BookOpen, MessageSquare, Shield, GitBranch, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const proph3tLinks = [
  { to: '/proph3t/forecasts', icon: TrendingUp, label: 'Previsions IA' },
  { to: '/proph3t/alerts', icon: AlertTriangle, label: 'Alertes' },
  { to: '/proph3t/scoring', icon: Activity, label: 'Scoring' },
  { to: '/proph3t/narratives', icon: BookOpen, label: 'Narratifs' },
  { to: '/proph3t/what-if', icon: MessageSquare, label: 'What-If' },
  { to: '/proph3t/fraud', icon: Shield, label: 'Fraude' },
  { to: '/proph3t/causal', icon: GitBranch, label: 'Causal AI' },
  { to: '/proph3t/federated', icon: Users, label: 'Federe' },
];

export function Proph3tFloatingBall() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
      {/* Expanded menu */}
      <div
        className={cn(
          'absolute bottom-20 right-0 w-56 rounded-xl border bg-popover p-2 shadow-xl transition-all duration-200',
          open
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-4 scale-95 opacity-0'
        )}
      >
        <div className="mb-2 px-3 py-2">
          <p className="text-sm font-semibold text-foreground">Proph3t IA</p>
          <p className="text-xs text-muted-foreground">Moteur de tresorerie IA</p>
        </div>
        <div className="space-y-0.5">
          {proph3tLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <link.icon className="h-4 w-4 text-muted-foreground" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Floating ball */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'group relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl',
          open
            ? 'bg-foreground text-background'
            : 'bg-foreground text-background'
        )}
        aria-label="Proph3t IA"
      >
        {/* Pulse ring */}
        {!open && (
          <span className="absolute inset-0 animate-ping rounded-full bg-foreground/20" />
        )}

        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <Brain className="h-6 w-6" />
        )}

        {/* Label badge */}
        {!open && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-2 py-0.5 text-[9px] font-bold leading-none text-background whitespace-nowrap">
            Proph3t
          </span>
        )}
      </button>
    </div>
  );
}
