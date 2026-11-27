import { ReactNode } from "react";
import { X } from "lucide-react";

export function DetailPanel({ title, subtitle, onClose, children, className = "" }: { title: ReactNode; subtitle?: ReactNode; onClose?: () => void; children: ReactNode; className?: string }) {
  return (
    <aside aria-label="Details" className={`card flex flex-col overflow-hidden animate-fade ${className}`}>
      <div className="tri-gradient-bar h-[2px] w-full" aria-hidden />
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-4 py-3.5">
        <div className="min-w-0">
          <h3 className="truncate font-display text-sm font-semibold text-cloud">{title}</h3>
          {subtitle && <div className="mt-0.5 text-xs text-silver">{subtitle}</div>}
        </div>
        {onClose && (
          <button type="button" aria-label="Close details" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-silver transition hover:bg-white/5 hover:text-cloud focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </aside>
  );
}

export function KV({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] py-2.5 text-xs last:border-0">
      <dt className="shrink-0 text-silver">{label}</dt>
      <dd className={`min-w-0 break-words text-right text-cloud ${mono ? "num" : ""}`}>{children}</dd>
    </div>
  );
}
