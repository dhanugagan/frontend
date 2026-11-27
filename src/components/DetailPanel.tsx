import { ReactNode } from "react";
import { X } from "lucide-react";

export function DetailPanel({ title, subtitle, onClose, children, className = "" }: { title: ReactNode; subtitle?: ReactNode; onClose?: () => void; children: ReactNode; className?: string }) {
  return (
    <aside aria-label="Details" className={`card flex flex-col overflow-hidden animate-fade ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">{title}</h3>
          {subtitle && <div className="mt-0.5 text-xs text-slate-400">{subtitle}</div>}
        </div>
        {onClose && (
          <button aria-label="Close details" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white">
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
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.04] py-2 text-xs last:border-0">
      <dt className="shrink-0 text-slate-400">{label}</dt>
      <dd className={`min-w-0 break-words text-right text-slate-100 ${mono ? "num" : ""}`}>{children}</dd>
    </div>
  );
}
