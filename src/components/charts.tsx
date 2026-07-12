"use client";
import React from "react";
import {
  BarChart as RBarChart,
  Bar,
  LineChart as RLineChart,
  Line,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import { chart, toneColor, type Tone } from "@/lib/theme";

export type Series = { name: string; data: number[]; tone?: Tone; n?: number[] };

const axisStyle = { fontSize: 11.5, fill: chart.text3 } as const;

function fmt(v: number, prefix = "", suffix = "") {
  const n = Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 1 ? v.toFixed(1) : v.toFixed(2);
  return `${prefix}${n}${suffix}`;
}

function toRows(categories: string[], series: Series[]) {
  return categories.map((c, i) => {
    const row: Record<string, number | string> = { cat: c };
    series.forEach((s) => {
      row[s.name] = s.data[i];
      if (s.n) row[`${s.name}__n`] = s.n[i];
    });
    return row;
  });
}

type TooltipEntry = { name: string; value: number; color: string; dataKey?: string; payload?: Record<string, number | string> };
function TooltipBox({ active, payload, label, prefix = "", suffix = "" }: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  prefix?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--text)" }}>{label}</div>
      {payload.map((p) => {
        const key = p.dataKey ?? p.name;
        const nVal = p.payload?.[`${key}__n`];
        return (
          <div key={p.name} style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--text-2)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: "inline-block" }} />
            <span style={{ flex: 1 }}>{p.name}</span>
            {nVal != null ? <span style={{ color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>n={nVal}</span> : null}
            <span style={{ fontWeight: 600, color: "var(--text)" }}>{fmt(p.value, prefix, suffix)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function BarChartX({
  categories,
  series,
  height = 240,
  valuePrefix = "",
  valueSuffix = "",
  showValues,
  referenceLine,
  domain,
}: {
  categories: string[];
  series: Series[];
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  showValues?: boolean;
  referenceLine?: { value: number; label?: string; tone?: Tone };
  domain?: [number | "auto", number | "auto"];
}) {
  const rows = toRows(categories, series);
  const multi = series.length > 1;
  const showLabels = showValues ?? (!multi && categories.length <= 8);
  // Reserve room on the right so an outside reference-line label isn't clipped.
  const refLabelWidth = referenceLine?.label ? Math.max(referenceLine.label.length * 6.5 + 10, 44) : 0;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RBarChart data={rows} margin={{ top: 16, right: 8 + refLabelWidth, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
        <XAxis dataKey="cat" tick={axisStyle} tickLine={false} axisLine={{ stroke: chart.axis }} interval={0} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={44} domain={domain} tickFormatter={(v) => fmt(v, valuePrefix, valueSuffix)} />
        <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} content={<TooltipBox prefix={valuePrefix} suffix={valueSuffix} />} />
        {multi ? <Legend wrapperStyle={{ fontSize: 12.5, paddingTop: 8 }} iconType="circle" iconSize={8} /> : null}
        {referenceLine ? (
          <ReferenceLine y={referenceLine.value} stroke={referenceLine.tone ? toneColor[referenceLine.tone] : chart.axis} strokeDasharray="4 3" label={referenceLine.label ? { value: referenceLine.label, position: "right", fontSize: 11, fill: chart.text3 } : undefined} />
        ) : null}
        {series.map((s, i) => (
          <Bar key={s.name} dataKey={s.name} fill={s.tone ? toneColor[s.tone] : [chart.accent, chart.neutral, chart.info][i % 3]} radius={[3, 3, 0, 0]} maxBarSize={multi ? 46 : 70}>
            {showLabels ? <LabelList dataKey={s.name} position="top" fontSize={11} fill={chart.text2} formatter={(v) => fmt(Number(v), valuePrefix, valueSuffix)} /> : null}
          </Bar>
        ))}
      </RBarChart>
    </ResponsiveContainer>
  );
}

export function LineChartX({
  categories,
  series,
  height = 240,
  valuePrefix = "",
  valueSuffix = "",
  fill,
  beginAtZero = true,
  referenceLine,
}: {
  categories: string[];
  series: Series[];
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  fill?: boolean;
  beginAtZero?: boolean;
  referenceLine?: { value: number; label?: string; tone?: Tone };
}) {
  const rows = toRows(categories, series);
  const Comp = (fill ? ComposedChart : RLineChart) as React.ComponentType<{
    data: Record<string, number | string>[];
    margin?: { top?: number; right?: number; left?: number; bottom?: number };
    children?: React.ReactNode;
  }>;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Comp data={rows} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
        <XAxis dataKey="cat" tick={axisStyle} tickLine={false} axisLine={{ stroke: chart.axis }} interval={0} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={44} domain={beginAtZero ? [0, "auto"] : ["auto", "auto"]} tickFormatter={(v) => fmt(v, valuePrefix, valueSuffix)} />
        <Tooltip content={<TooltipBox prefix={valuePrefix} suffix={valueSuffix} />} />
        <Legend wrapperStyle={{ fontSize: 12.5, paddingTop: 8 }} iconType="circle" iconSize={8} />
        {referenceLine ? (
          <ReferenceLine y={referenceLine.value} stroke={referenceLine.tone ? toneColor[referenceLine.tone] : chart.axis} strokeDasharray="4 3" label={referenceLine.label ? { value: referenceLine.label, position: "insideTopRight", fontSize: 11, fill: chart.text3 } : undefined} />
        ) : null}
        {series.map((s, i) => {
          const color = s.tone ? toneColor[s.tone] : [chart.accent, chart.neutral, chart.info][i % 3];
          return fill ? (
            <Area key={s.name} type="monotone" dataKey={s.name} stroke={color} fill={color} fillOpacity={0.14} strokeWidth={2} dot={{ r: 2.5, fill: color }} />
          ) : (
            <Line key={s.name} type="monotone" dataKey={s.name} stroke={color} strokeWidth={2} dot={{ r: 2.5, fill: color }} activeDot={{ r: 4 }} />
          );
        })}
      </Comp>
    </ResponsiveContainer>
  );
}

/* Point estimate + 95% CI whiskers around a zero line — for effect sizes
   (e.g. a paired-median DiD) where the interval, not a level, is the story.
   A CI that crosses zero is drawn muted; one that clears zero is toned. */
export function IntervalPlot({
  rows,
  valueSuffix = "",
  labelWidth = 150,
  decimals = 1,
}: {
  rows: { name: string; point: number; lo: number; hi: number }[];
  valueSuffix?: string;
  labelWidth?: number;
  decimals?: number;
}) {
  const lo = Math.min(0, ...rows.map((r) => r.lo));
  const hi = Math.max(0, ...rows.map((r) => r.hi));
  const pad = ((hi - lo) || 1) * 0.08;
  const min = lo - pad;
  const range = (hi + pad) - min || 1;
  const pos = (v: number) => ((v - min) / range) * 100;
  const sign = (v: number) => (v > 0 ? "+" : "");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 10 }}>
      {rows.map((r) => {
        const excl0 = r.lo > 0 || r.hi < 0;
        const color = excl0 ? (r.point >= 0 ? chart.success : chart.danger) : chart.neutral;
        return (
          <div key={r.name} style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: labelWidth, fontSize: 12.5, color: "var(--text-2)" }}>{r.name}</div>
            <div style={{ flex: 1, position: "relative", height: 30 }}>
              <div style={{ position: "absolute", left: `${pos(0)}%`, top: 0, bottom: 0, width: 1, background: "var(--border-strong)" }} />
              <div style={{ position: "absolute", left: `${pos(r.lo)}%`, width: `${pos(r.hi) - pos(r.lo)}%`, top: 13, height: 4, background: color, opacity: 0.35, borderRadius: 2 }} />
              <div style={{ position: "absolute", left: `${pos(r.lo)}%`, top: 8, height: 14, width: 1.5, background: color }} />
              <div style={{ position: "absolute", left: `${pos(r.hi)}%`, top: 8, height: 14, width: 1.5, background: color }} />
              <div style={{ position: "absolute", left: `${pos(r.point)}%`, top: 9, width: 12, height: 12, marginLeft: -6, borderRadius: "50%", background: color, border: "2px solid var(--surface)" }} />
            </div>
            <div className="num" style={{ width: 138, textAlign: "right", fontSize: 12.5, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
              {sign(r.point)}{r.point.toFixed(decimals)}{valueSuffix} [{sign(r.lo)}{r.lo.toFixed(decimals)}, {sign(r.hi)}{r.hi.toFixed(decimals)}]
            </div>
          </div>
        );
      })}
      <span className="caption" style={{ marginTop: 2 }}>Dot = paired-median DiD · bar = 95% CI · vertical line = 0 (no effect)</span>
    </div>
  );
}

/* Diverging horizontal bars around a centered zero line — for the AOV
   decomposition and standardized driver betas. */
export function DivergingBars({
  rows,
  scale,
  labelWidth = 150,
  valueSuffix = "",
  decimals = 2,
  showStar,
  legend,
}: {
  rows: { name: string; value: number; sig?: boolean; strong?: boolean }[];
  scale?: number;
  labelWidth?: number;
  valueSuffix?: string;
  decimals?: number;
  showStar?: boolean;
  legend?: { pos: string; neg: string };
}) {
  const half = scale ?? Math.max(...rows.map((r) => Math.abs(r.value)), 0.001) * 1.15;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {rows.map((r) => {
        const wPct = (Math.abs(r.value) / (half * 2)) * 100;
        const leftPct = r.value >= 0 ? 50 : 50 - wPct;
        const color = r.value >= 0 ? chart.success : chart.danger;
        return (
          <div key={r.name} style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: labelWidth, fontSize: 12.5, color: r.strong ? "var(--text)" : "var(--text-2)", fontWeight: r.strong ? 600 : 400 }}>{r.name}</div>
            <div style={{ flex: 1, position: "relative", height: 22, background: "var(--surface-2)", borderRadius: 5, border: "1px solid var(--border)" }}>
              <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "var(--border-strong)" }} />
              <div style={{ position: "absolute", left: `${leftPct}%`, width: `${wPct}%`, top: 3, bottom: 3, background: color, borderRadius: 3 }} />
            </div>
            <div className="num" style={{ width: 62, textAlign: "right", fontSize: 12.5, color: "var(--text)" }}>
              {r.value > 0 ? "+" : ""}{r.value.toFixed(decimals)}{valueSuffix}{showStar && r.sig ? "*" : ""}
            </div>
          </div>
        );
      })}
      {legend ? (
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 2 }}>
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}><span style={{ width: 10, height: 10, background: chart.success, borderRadius: 2 }} /><span className="caption">{legend.pos}</span></span>
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}><span style={{ width: 10, height: 10, background: chart.danger, borderRadius: 2 }} /><span className="caption">{legend.neg}</span></span>
          <span className="caption">vertical line = 0</span>
        </div>
      ) : null}
    </div>
  );
}
