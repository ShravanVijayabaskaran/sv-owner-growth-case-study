import React from "react";
import type { Tone } from "@/lib/theme";

type Div = React.HTMLAttributes<HTMLDivElement>;

/* ---------- layout ---------- */
export function Stack({ gap = 16, style, ...p }: Div & { gap?: number }) {
  return <div {...p} style={{ display: "flex", flexDirection: "column", gap, ...style }} />;
}
export function Row({ gap = 12, align = "stretch", wrap, style, ...p }: Div & { gap?: number; align?: string; wrap?: boolean }) {
  return <div {...p} style={{ display: "flex", flexDirection: "row", gap, alignItems: align, flexWrap: wrap ? "wrap" : "nowrap", ...style }} />;
}
export function Grid({ cols = 2, gap = 16, min, style, ...p }: Div & { cols?: number; gap?: number; min?: string }) {
  return (
    <div
      {...p}
      style={{
        display: "grid",
        gridTemplateColumns: min ? `repeat(auto-fit, minmax(${min}, 1fr))` : `repeat(${cols}, minmax(0, 1fr))`,
        gap,
        ...style,
      }}
    />
  );
}
export function Divider() {
  return <hr className="divider" />;
}

/* ---------- typography ---------- */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}
export function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="h1">{children}</h1>;
}
export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="h2">{children}</h2>;
}
export function Caption({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="caption" style={style}>{children}</div>;
}
export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="lead" style={{ margin: 0 }}>{children}</p>;
}

export function SectionHeading({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: React.ReactNode }) {
  return (
    <Stack gap={4}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <H2>{title}</H2>
      {sub ? <Caption>{sub}</Caption> : null}
    </Stack>
  );
}

/* ---------- card ---------- */
export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="card" style={style}>{children}</div>;
}
export function CardHeader({ children, trailing }: { children: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <div className="card-header">
      <span>{children}</span>
      {trailing ? <span style={{ fontWeight: 400 }}>{trailing}</span> : null}
    </div>
  );
}
export function CardBody({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="card-body" style={style}>{children}</div>;
}

/* ---------- callout ---------- */
export function Callout({ tone = "info", title, children }: { tone?: "info" | "success" | "warning" | "danger" | "neutral"; title?: string; children: React.ReactNode }) {
  return (
    <div className={`callout ${tone}`}>
      {title ? <div className="callout-title">{title}</div> : null}
      <div style={{ fontSize: 13.5, color: "var(--text-2)" }}>{children}</div>
    </div>
  );
}

/* ---------- stat ---------- */
export function Stat({ value, label, tone = "neutral" }: { value: React.ReactNode; label: React.ReactNode; tone?: Tone }) {
  return (
    <div>
      <div className={`stat-value tone-${tone}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ---------- table ---------- */
export function Table({
  headers,
  rows,
  align,
  rowTone,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  align?: ("left" | "right" | "center")[];
  rowTone?: (("success" | "warning" | "info") | undefined)[];
}) {
  return (
    <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
      <table className="tbl">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ textAlign: align?.[i] ?? "left" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className={rowTone?.[ri] ? `row-${rowTone[ri]}` : undefined}>
              {r.map((c, ci) => (
                <td key={ci} className="num" style={{ textAlign: align?.[ci] ?? "left" }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return <span className="chip">{children}</span>;
}
