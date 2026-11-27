import { useEffect, useState } from "react";

const LATTICE_NODES = [
  { left: "9%", top: "18%", size: 2.5, delay: "0s", dur: "11s", color: "#a3e635" },
  { left: "21%", top: "66%", size: 2, delay: "1.4s", dur: "13s", color: "#84cc16" },
  { left: "34%", top: "26%", size: 2.5, delay: "2.2s", dur: "12s", color: "#ffffff" },
  { left: "46%", top: "76%", size: 2, delay: "0.8s", dur: "14s", color: "#a3e635" },
  { left: "58%", top: "22%", size: 2.5, delay: "1.9s", dur: "10.5s", color: "#84cc16" },
  { left: "69%", top: "56%", size: 2, delay: "2.9s", dur: "12.5s", color: "#b4b8c2" },
  { left: "79%", top: "16%", size: 2.5, delay: "0.6s", dur: "11.5s", color: "#a3e635" },
  { left: "89%", top: "48%", size: 2, delay: "2.1s", dur: "13.5s", color: "#ffffff" },
  { left: "15%", top: "46%", size: 2, delay: "3.1s", dur: "14s", color: "#ecfccb" },
  { left: "74%", top: "82%", size: 2.5, delay: "1.1s", dur: "12s", color: "#84cc16" },
];

/**
 * Lightweight, GPU-composited architectural backdrop:
 * - Midnight Black (#050507) base with mathematical coordinate grid
 * - Subtle geometric circuit lattice (decorative only)
 * - Restrained Deep Moss (#1A2E05), Lime Green (#A3E635 / #84CC16), and Pure White (#FFFFFF) radial lighting
 * - Gentle pointer spotlight & parallax, respecting prefers-reduced-motion
 */
export function AnimatedBackground() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pointer, setPointer] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 14;
        const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 10;
        setOffset({ x: nx, y: ny });
        setPointer({ x: e.clientX, y: e.clientY, active: true });
      });
    };
    const onLeave = () => setPointer((p) => ({ ...p, active: false }));
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{ contain: "strict" }}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-900"
    >
      {/* Mathematical coordinate grid */}
      <div
        className="bg-grid-pattern absolute -inset-12 opacity-65 transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${offset.x * 0.3}px, ${offset.y * 0.3}px, 0)`,
          maskImage: "radial-gradient(ellipse 88% 78% at 50% 24%, #000 35%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 88% 78% at 50% 24%, #000 35%, transparent 100%)",
        }}
      />

      {/* Subtle geometric circuit / graph lattice motif (purely decorative) */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.09]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <g stroke="#a3e635" strokeWidth="0.75">
          <path d="M120 140 L310 140 L390 220 L620 220 L700 140 L980 140" />
          <path d="M980 140 L1080 240 L1320 240" stroke="#ffffff" strokeOpacity="0.65" />
          <path d="M80 620 L260 620 L340 540 L540 540 L640 640 L920 640 L1010 550 L1360 550" stroke="#ffffff" strokeOpacity="0.4" />
          <path d="M390 220 L390 380 L540 540" stroke="#84cc16" />
          <path d="M1080 240 L1080 420 L1010 550" />
          <circle cx="1220" cy="180" r="96" stroke="#a3e635" strokeDasharray="4 6" opacity="0.55" />
          <circle cx="1220" cy="180" r="142" stroke="#ffffff" strokeDasharray="2 8" opacity="0.32" />
        </g>
        <g fill="#a3e635">
          <circle cx="310" cy="140" r="2.5" />
          <circle cx="620" cy="220" r="2.5" fill="#ffffff" />
          <circle cx="980" cy="140" r="2.5" />
          <circle cx="1080" cy="240" r="2.5" fill="#84cc16" />
          <circle cx="540" cy="540" r="2.5" fill="#ffffff" />
          <circle cx="1010" cy="550" r="2.5" />
        </g>
      </svg>

      {/* Deep Moss & Lime Green ambient top wash */}
      <div
        className="absolute inset-x-0 top-0 h-[400px] opacity-35 blur-[88px]"
        style={{
          background:
            "radial-gradient(58% 88% at 24% 8%, rgba(26,46,5,0.8), transparent 72%), radial-gradient(52% 84% at 78% 12%, rgba(163,230,53,0.18), transparent 74%), radial-gradient(42% 68% at 50% 42%, rgba(255,255,255,0.06), transparent 70%)",
        }}
      />

      {/* Interactive pointer-following subtle Lime Green spotlight */}
      {pointer.active && (
        <div
          className="absolute left-0 top-0 h-[420px] w-[420px] rounded-full opacity-20 blur-[96px] transition-opacity duration-300"
          style={{
            transform: `translate3d(${pointer.x - 210}px, ${pointer.y - 210}px, 0)`,
            background: "radial-gradient(circle, rgba(163,230,53,0.34) 0%, rgba(132,204,22,0.16) 48%, transparent 72%)",
          }}
        />
      )}

      {/* Drifting Lime Green ambient orb */}
      <div
        className="absolute -left-28 -top-24 h-[440px] w-[440px] rounded-full opacity-25 blur-[108px] animate-orbDriftA"
        style={{
          background: "radial-gradient(circle, rgba(163,230,53,0.3) 0%, rgba(163,230,53,0) 72%)",
          transform: `translate3d(${offset.x * 0.7}px, ${offset.y * 0.7}px, 0)`,
        }}
      />

      {/* Drifting Pure White / Vivid Lime ambient orb */}
      <div
        className="absolute -right-24 top-[18%] h-[420px] w-[420px] rounded-full opacity-25 blur-[110px] animate-orbDriftB"
        style={{
          background: "radial-gradient(circle, rgba(132,204,22,0.24) 0%, rgba(255,255,255,0.06) 45%, rgba(132,204,22,0) 74%)",
          transform: `translate3d(${-offset.x * 0.6}px, ${offset.y * 0.6}px, 0)`,
        }}
      />

      {/* Deep Moss lower anchor light */}
      <div
        className="absolute bottom-[-150px] left-[32%] h-[340px] w-[500px] rounded-full opacity-25 blur-[115px]"
        style={{
          background: "radial-gradient(circle, rgba(26,46,5,0.72) 0%, rgba(26,46,5,0) 74%)",
        }}
      />

      {/* Subtle moving light wave */}
      <div
        className="absolute -top-24 left-0 h-52 w-[170%] opacity-20 blur-3xl animate-waveSlide"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(26,46,5,0.55) 28%, rgba(163,230,53,0.2) 52%, rgba(255,255,255,0.1) 74%, transparent 100%)",
        }}
      />

      {/* Lightweight CSS lattice node motes */}
      {LATTICE_NODES.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 8px ${p.color}`,
            animation: `particleFloat ${p.dur} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}
