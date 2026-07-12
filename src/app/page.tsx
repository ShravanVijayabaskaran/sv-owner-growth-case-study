import Link from "next/link";
import { Stack, Grid, Card, CardBody, Callout, Stat, SectionHeading, Eyebrow, H1, Lead, Caption, Chip, Divider } from "@/components/ui";
import { EXEC_INTRO, EXEC_KPIS, EXEC_FINDINGS, EXEC_NEXT, EXEC_CAVEATS } from "@/data/exec";
import { DATASET } from "@/data/meta";

const FIND_LINKS = ["/growth", "/app-incrementality"];

export default function ExecutiveSummary() {
  return (
    <Stack gap={32}>
      <Stack gap={12}>
        <Eyebrow>Executive summary</Eyebrow>
        <H1>Does Owner Grow Restaurants and is the App Incremental?</H1>
        <Lead>{EXEC_INTRO}</Lead>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          <Chip>{DATASET.rows.toLocaleString()} orders</Chip>
          <Chip>{DATASET.brands} brands · {DATASET.locations} locations</Chip>
          <Chip>~{Math.round(DATASET.guests / 1000)}K guests</Chip>
          <Chip>{DATASET.dateStart} → {DATASET.dateEnd}</Chip>
        </div>
      </Stack>

      <Grid cols={4} min="200px" gap={14}>
        {EXEC_KPIS.map((k, i) => (
          <Card key={i}>
            <CardBody>
              <Stat value={k.value} label={k.label} tone={k.tone ?? "neutral"} />
            </CardBody>
          </Card>
        ))}
      </Grid>

      <Stack gap={14}>
        <SectionHeading title="The Two Questions" sub="Each has its own deep-dive page — click through for the full evidence." />
        <Grid cols={2} min="360px" gap={16}>
          {EXEC_FINDINGS.map((f, i) => (
            <Card key={i}>
              <CardBody>
                <Stack gap={10}>
                  <Eyebrow>{f.q}</Eyebrow>
                  <div className={`h2 tone-${f.tone}`} style={{ fontSize: 18 }}>{f.verdict}</div>
                  <Caption style={{ fontSize: 13.5, lineHeight: 1.6 }}>{f.body}</Caption>
                  <Link href={FIND_LINKS[i]} className="pill" style={{ alignSelf: "flex-start" }}>
                    View the Analysis →
                  </Link>
                </Stack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </Stack>

      <Divider />

      <Grid cols={2} min="360px" gap={16}>
        <Stack gap={12}>
          <SectionHeading title="Next Steps" />
          <Stack gap={10}>
            {EXEC_NEXT.map((a, i) => (
              <Row key={i} text={a} />
            ))}
          </Stack>
        </Stack>
        <Stack gap={12}>
          <SectionHeading title="Honest Caveats" />
          <Callout tone="warning" title="Read the numbers with these in mind">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {EXEC_CAVEATS.map((c, i) => (
                <li key={i} style={{ marginBottom: 6 }}>{c}</li>
              ))}
            </ul>
          </Callout>
        </Stack>
      </Grid>
    </Stack>
  );
}

function Row({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent)", marginTop: 8, flexShrink: 0 }} />
      <span style={{ fontSize: 13.5, color: "var(--text-2)" }}>{text}</span>
    </div>
  );
}
