import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const V: Record<Variant, string> = {
  primary: "bg-brand-500 text-ink-950 hover:bg-brand-400 font-semibold shadow-glow disabled:shadow-none",
  secondary: "bg-white/5 text-slate-200 ring-1 ring-inset ring-white/10 hover:bg-white/10",
  ghost: "text-slate-300 hover:bg-white/5 hover:text-white",
  danger: "bg-fraud-500/15 text-fraud-300 ring-1 ring-inset ring-fraud-400/30 hover:bg-fraud-500/25",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = "secondary", size = "md", loading, icon, children, className = "", disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3.5 text-sm"} ${V[variant]} ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}
