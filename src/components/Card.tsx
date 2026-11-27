import { ReactNode } from "react";

export function Card({ children, className = "", pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <section className={`card ${pad ? "card-pad" : ""} animate-fade ${className}`}>{children}</section>;
}

export function CardHeader({ title, subtitle, icon, actions }: { title: string; subtitle?: ReactNode; icon?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-2.5 min-w-0">
        {icon && <div className="mt-0.5 shrink-0 text-brand-500">{icon}</div>}
        <div className="min-w-0">
          <h2 className="font-display text-sm font-semibold tracking-tight text-cloud">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs leading-relaxed text-silver">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight text-cloud [text-wrap:balance] sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-silver">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
