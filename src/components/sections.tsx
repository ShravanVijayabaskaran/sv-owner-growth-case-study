"use client";
import { useState } from "react";
import { Stack, Grid, Card, CardBody, Caption, SectionHeading } from "@/components/ui";

function TagLabel({ tone, children }: { tone: "info" | "warning" | "success" | "neutral"; children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-block", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em",
      textTransform: "uppercase", padding: "2px 7px", borderRadius: 5, marginRight: 8,
      color: `var(--${tone === "neutral" ? "text-2" : tone})`,
      background: `var(--${tone === "neutral" ? "surface-2" : tone + "-soft"})`,
      border: "1px solid var(--border)", whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function Bullets({ items, dot = "var(--accent)" }: { items: string[]; dot?: string }) {
  return (
    <Stack gap={8}>
      {items.map((t, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: dot, marginTop: 7, flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55 }}>{t}</span>
        </div>
      ))}
    </Stack>
  );
}

/* Collapsible methodology + caveats block, placed under a topline result.
   Optionally carries a nested, separately-collapsible chart view. */
export function Methodology({ approach, caveats, chart, chartLabel = "Chart View" }: {
  approach: string; caveats: string; chart?: React.ReactNode; chartLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [showChart, setShowChart] = useState(false);
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface-2)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-3)", fontSize: 12 }}>{open ? "▾" : "▸"}</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-2)" }}>Methodology &amp; Caveats</span>
      </button>
      {open ? (
        <Stack gap={9} style={{ padding: "0 14px 13px 32px" }}>
          <div><TagLabel tone="info">Approach</TagLabel><Caption style={{ display: "inline", fontSize: 13, lineHeight: 1.6 }}>{approach}</Caption></div>
          <div><TagLabel tone="warning">Caveats</TagLabel><Caption style={{ display: "inline", fontSize: 13, lineHeight: 1.6 }}>{caveats}</Caption></div>
          {chart ? (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              <button
                type="button"
                onClick={() => setShowChart((v) => !v)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: 0, background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                <span style={{ fontFamily: "var(--font-mono), monospace", color: "var(--accent)", fontSize: 12 }}>{showChart ? "▾" : "▸"}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)" }}>{chartLabel}</span>
              </button>
              {showChart ? <div style={{ marginTop: 12 }}>{chart}</div> : null}
            </div>
          ) : null}
        </Stack>
      ) : null}
    </div>
  );
}

/* High-level takeaways + analytical approach, pinned at the top of a page. */
export function AnalysisSummary({ takeaways, approach }: { takeaways: string[]; approach: string }) {
  return (
    <Card style={{ borderLeft: "3px solid var(--accent)" }}>
      <CardBody>
        <Stack gap={14}>
          <div className="eyebrow">Analysis summary</div>
          <Bullets items={takeaways} />
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <TagLabel tone="neutral">Approach</TagLabel>
            <Caption style={{ display: "inline", fontSize: 13, lineHeight: 1.6 }}>{approach}</Caption>
          </div>
        </Stack>
      </CardBody>
    </Card>
  );
}

/* Follow-up analyses + designed experiments, pinned at the bottom of a page. */
export function NextSteps({ followUps, experiments }: { followUps: string[]; experiments: string[] }) {
  return (
    <Stack gap={12}>
      <SectionHeading eyebrow="Next steps" title="Where Do We Go From Here?" />
      <Grid cols={2} min="320px" gap={16}>
        <Card>
          <CardBody>
            <Stack gap={12}>
              <span style={{ fontWeight: 650, fontSize: 14.5 }}>Follow-up Analyses</span>
              <Bullets items={followUps} dot="var(--info)" />
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stack gap={12}>
              <span style={{ fontWeight: 650, fontSize: 14.5 }}>Designed Experiments to Run</span>
              <Bullets items={experiments} dot="var(--success)" />
            </Stack>
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}
