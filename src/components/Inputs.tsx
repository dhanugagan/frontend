import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { Search, X } from "lucide-react";

export function SearchInput({ value, onChange, onSubmit, placeholder, label, className = "", inputMode }: { value: string; onChange: (v: string) => void; onSubmit?: () => void; placeholder?: string; label: string; className?: string; inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"] }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" aria-hidden />
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
        <button type="button" aria-label="Clear search" onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-silver transition hover:text-cloud">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block min-w-[8rem]">
      <span className="eyebrow mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-silver">{hint}</span>}
    </label>
  );
}

export function Select({ value, onChange, options, label, disabled }: { value: string; onChange: (v: string) => void; options: { value: string; label: string; disabled?: boolean }[]; label: string; disabled?: boolean } & Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value">) {
  return (
    <select aria-label={label} disabled={disabled} className="input appearance-none bg-[length:1rem] pr-8" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled} className="bg-ink-900 text-cloud">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SegmentedControl<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-xl border border-white/10 bg-ink-950/90 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition duration-150 ${
            value === o.value ? "bg-gradient-to-r from-brand-500 to-model-500 text-ink-900 shadow-glow" : "font-medium text-silver hover:text-cloud"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap text-xs text-cloud/90">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-4 w-7 rounded-full bg-ink-800 ring-1 ring-inset ring-white/15 transition peer-checked:bg-brand-500 peer-checked:ring-brand-500 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/70 after:absolute after:left-0.5 after:top-0.5 after:h-3 after:w-3 after:rounded-full after:bg-cloud after:transition peer-checked:after:translate-x-3 peer-checked:after:bg-ink-900" />
      {label}
    </label>
  );
}
