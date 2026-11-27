import { CSSProperties, MouseEvent, ReactNode, useEffect, useRef, useState } from "react";

/** Smooth 3D perspective tilt card with cursor-tracked Lime Green / Pure White lighting. */
export function TiltCard({
  children,
  className = "",
  intensity = 5,
  glowColor,
  animatedBorder = false,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glowColor?: string;
  animatedBorder?: boolean;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / Math.max(1, rect.width);
    const py = (e.clientY - rect.top) / Math.max(1, rect.height);
    const rx = (0.5 - py) * intensity * 2;
    const ry = (px - 0.5) * intensity * 2;
    setStyle({
      transform: `perspective(1100px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translate3d(0, -3px, 0)`,
      backgroundImage: `radial-gradient(360px circle at ${Math.round(px * 100)}% ${Math.round(py * 100)}%, ${glowColor ?? "rgba(163, 230, 53, 0.12)"}, rgba(255, 255, 255, 0.04) 42%, transparent 68%)`,
    });
  };

  const onLeave = () => {
    setStyle({
      transform: "perspective(1100px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)",
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={style}
      className={`card card-3d ${animatedBorder ? "animated-border" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/** Scroll-triggered reveal wrapper with zero-latency fallback when IntersectionObserver is unavailable or reduced-motion is set. */
export function ScrollReveal({ children, className = "", delayMs = 0 }: { children: ReactNode; className?: string; delayMs?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(() => typeof window === "undefined" || typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (shown) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduced) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** Thin gradient scroll progress bar pinned to the top edge of the viewport. */
export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2.5px] bg-white/[0.04]">
      <div
        className="tri-gradient-bar h-full origin-left transition-transform duration-100"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}

/**
 * Smoothly animates formatted numeric strings (e.g., "203,769", "6.50%", "0.7892") on browser mount.
 * Immediately renders the exact target string when IntersectionObserver is unavailable (SSR / Vitest) or reduced-motion is set.
 */
export function AnimatedCounter({ value }: { value: string }) {
  const [display, setDisplay] = useState(value);
  const animatedRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setDisplay(value);
      return;
    }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      setDisplay(value);
      return;
    }

    const match = value.trim().match(/^([^0-9-]*)(-?\d[\d,]*(?:\.\d+)?)(.*)$/);
    if (!match) {
      setDisplay(value);
      return;
    }
    const [, prefix, numRaw, suffix] = match;
    const target = Number(numRaw.replace(/,/g, ""));
    if (!Number.isFinite(target) || animatedRef.current === value) {
      setDisplay(value);
      return;
    }
    animatedRef.current = value;

    const decimals = numRaw.includes(".") ? numRaw.split(".")[1].length : 0;
    const hasComma = numRaw.includes(",");
    const duration = 420;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = target * eased;
      const formatted =
        decimals > 0
          ? current.toFixed(decimals)
          : hasComma
            ? Math.round(current).toLocaleString("en-US")
            : String(Math.round(current));
      setDisplay(`${prefix}${formatted}${suffix}`);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}</>;
}
