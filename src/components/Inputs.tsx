import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { Search, X } from "lucide-react";

export function SearchInput({ value, onChange, onSubmit, placeholder, label, className = "", inputMode }: { value: string; onChange: (v: string) => void; onSubmit?: () => void; placeholder?: string; label: string; className?: string; inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"] }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
      <input
        aria-label={label}
        className="input pl-9 pr-8"
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
      />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 hover:text-white">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block min-w-[8rem]">
      <span className="eyebrow mb-1 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

export function Select({ value, onChange, options, label, disabled }: { value: string; onChange: (v: string) => void; options: { value: string; label: string; disabled?: boolean }[]; label: string; disabled?: boolean } & Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value">) {
  return (
    <select aria-label={label} disabled={disabled} className="input appearance-none bg-[length:1rem] pr-8" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled} className="bg-ink-900">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SegmentedControl<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-lg bg-ink-900 p-0.5 ring-1 ring-inset ring-white/10">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${value === o.value ? "bg-brand-400/15 text-brand-300 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-300">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-4 w-7 rounded-full bg-white/10 transition peer-checked:bg-brand-500 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400/70 after:absolute after:left-0.5 after:top-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-3" />
      {label}
    </label>
  );
}
