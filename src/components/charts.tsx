import { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { COLORS, SERIES } from "@/utils/palette";

const tooltipStyle = { background: "#0a1220", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, color: "#e2e8f0" };
const axisProps = { stroke: COLORS.axis, fontSize: 11, tickLine: false, axisLine: { stroke: COLORS.grid } } as const;

export function ChartFrame({ height = 260, children, label }: { height?: number; children: ReactNode; label: string }) {
  return (
    <div role="img" aria-label={label} style={{ height }} className="w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={80}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

export interface Slice {
  name: string;
  value: number;
  color: string;
}

export function DonutChart({ data, label, center }: { data: Slice[]; label: string; center?: { top: string; bottom: string } }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative">
      <ChartFrame label={label} height={230}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={2} stroke="none" isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${Number(v).toLocaleString()} (${total ? ((Number(v) / total) * 100).toFixed(2) : 0}%)`, String(n)]} />
        </PieChart>
      </ChartFrame>
      {center && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-lg font-semibold text-white">{center.top}</span>
          <span className="text-[11px] text-slate-400">{center.bottom}</span>
        </div>
      )}
      <ul className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-300">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
            {d.name} <span className="num text-slate-400">{d.value.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface StackedDatum {
  name: string;
  [series: string]: string | number;
}

export function StackedBars({ data, series, label, height = 240 }: { data: StackedDatum[]; series: { key: string; name: string; color: string }[]; label: string; height?: number }) {
  return (
    <ChartFrame label={label} height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="name" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} stackId="a" fill={s.color} isAnimationActive={false} />
        ))}
      </BarChart>
    </ChartFrame>
  );
}

export interface GroupedDatum {
  name: string;
  [metric: string]: string | number | null;
}

export function GroupedBars({ data, series, label, height = 300, domain = [0, 1] }: { data: GroupedDatum[]; series: { key: string; name: string; color?: string }[]; label: string; height?: number; domain?: [number, number] }) {
  return (
    <ChartFrame label={label} height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={2}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="name" {...axisProps} interval={0} tick={{ fontSize: 10, fill: COLORS.axis }} />
        <YAxis {...axisProps} domain={domain} tickFormatter={(v) => v.toFixed(1)} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v) => (typeof v === "number" ? v.toFixed(3) : "—")} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color ?? SERIES[i % SERIES.length]} radius={[3, 3, 0, 0]} isAnimationActive={false} />
        ))}
      </BarChart>
    </ChartFrame>
  );
}

export function TimeStepChart({ data, label }: { data: { step: number; illicit: number; share: number }[]; label: string }) {
  return (
    <ChartFrame label={label} height={260}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="step" {...axisProps} interval={3} label={{ value: "time step", position: "insideBottom", offset: -2, fill: COLORS.axis, fontSize: 11 }} />
        <YAxis yAxisId="l" {...axisProps} />
        <YAxis yAxisId="r" orientation="right" {...axisProps} tickFormatter={(v) => `${v}%`} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="l" dataKey="illicit" name="Illicit transactions" fill={COLORS.illicit} fillOpacity={0.85} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        <Line yAxisId="r" dataKey="share" name="Illicit % of all nodes" stroke={COLORS.brand} strokeWidth={2} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ChartFrame>
  );
}

export function HistogramChart({ data, label, color = COLORS.model, height = 220 }: { data: { bin: string; count: number }[]; label: string; color?: string; height?: number }) {
  return (
    <ChartFrame label={label} height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barCategoryGap={2}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="bin" {...axisProps} interval={0} tick={{ fontSize: 9, fill: COLORS.axis }} />
        <YAxis {...axisProps} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v) => [Number(v).toLocaleString(), "transactions"]} />
        <Bar dataKey="count" fill={color} radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartFrame>
  );
}

export function RadarCompare({ data, series, label }: { data: { metric: string; [model: string]: string | number }[]; series: { key: string; name: string }[]; label: string }) {
  return (
    <ChartFrame label={label} height={340}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={COLORS.grid} />
        <PolarAngleAxis dataKey="metric" tick={{ fill: COLORS.axis, fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 1]} tick={{ fill: COLORS.axis, fontSize: 9 }} angle={90} />
        {series.map((s, i) => (
          <Radar key={s.key} dataKey={s.key} name={s.name} stroke={SERIES[i % SERIES.length]} fill={SERIES[i % SERIES.length]} fillOpacity={0.12} isAnimationActive={false} />
        ))}
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => (typeof v === "number" ? v.toFixed(3) : String(v))} />
      </RadarChart>
    </ChartFrame>
  );
}

export function PrScatter({ points, label }: { points: { name: string; precision: number; recall: number; color: string }[]; label: string }) {
  return (
    <ChartFrame label={label} height={300}>
      <ScatterChart margin={{ top: 8, right: 16, left: -4, bottom: 8 }}>
        <CartesianGrid stroke={COLORS.grid} />
        <XAxis type="number" dataKey="recall" name="Recall" domain={[0, 1]} {...axisProps} label={{ value: "recall", position: "insideBottom", offset: -4, fill: COLORS.axis, fontSize: 11 }} />
        <YAxis type="number" dataKey="precision" name="Precision" domain={[0, 1]} {...axisProps} label={{ value: "precision", angle: -90, position: "insideLeft", fill: COLORS.axis, fontSize: 11 }} />
        <ZAxis range={[90, 90]} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} formatter={(v) => (typeof v === "number" ? v.toFixed(3) : String(v))} labelFormatter={() => ""} />
        {points.map((p) => (
          <Scatter key={p.name} name={p.name} data={[p]} fill={p.color} isAnimationActive={false} />
        ))}
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </ScatterChart>
    </ChartFrame>
  );
}
