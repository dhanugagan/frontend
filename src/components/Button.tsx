import { ButtonHTMLAttributes, CSSProperties, MouseEvent, ReactNode, useState } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const V: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-brand-500 to-model-500 text-ink-900 hover:brightness-105 font-semibold shadow-glow hover:-translate-y-0.5 active:translate-y-0 disabled:shadow-none",
  secondary:
    "bg-ink-800/80 text-cloud ring-1 ring-inset ring-white/12 hover:bg-ink-800 hover:ring-brand-500/45 hover:-translate-y-0.5 active:translate-y-0",
  ghost: "text-silver hover:bg-white/[0.06] hover:text-cloud",
  danger:
    "bg-fraud-500/15 text-fraud-300 ring-1 ring-inset ring-fraud-400/35 hover:bg-fraud-500/25 hover:-translate-y-0.5 active:translate-y-0",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
  loading?: boolean;
  magnetic?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading,
  magnetic,
  icon,
  children,
  className = "",
  disabled,
  onClick,
  onMouseMove,
  onMouseLeave,
  style,
  ...rest
}: Props) {
  const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(null);
  const [magnet, setMagnet] = useState<CSSProperties>({});

  const useMagnetic = (magnetic ?? variant === "primary") && !disabled && !loading;

  const handleMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (useMagnetic) {
      const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      if (!reduced) {
        const rect = e.currentTarget.getBoundingClientRect();
        const dx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 6;
        const dy = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 4;
        setMagnet({ transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)` });
      }
    }
    onMouseMove?.(e);
  };

  const handleLeave = (e: MouseEvent<HTMLButtonElement>) => {
    if (useMagnetic) setMagnet({});
    onMouseLeave?.(e);
  };

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      const rect = e.currentTarget.getBoundingClientRect();
      setRipple({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        key: Date.now(),
      });
    }
    onClick?.(e);
  };

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ ...style, ...magnet }}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap shrink-0 rounded-xl transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none ${
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm"
      } ${V[variant]} ${className}`}
    >
      {ripple && (
        <span
          key={ripple.key}
          aria-hidden
          onAnimationEnd={() => setRipple(null)}
          style={{ left: ripple.x - 16, top: ripple.y - 16 }}
          className="pointer-events-none absolute h-8 w-8 rounded-full bg-white/30 animate-rippleOut"
        />
      )}
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
