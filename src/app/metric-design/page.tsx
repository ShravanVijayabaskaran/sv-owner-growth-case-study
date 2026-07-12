import { Stack, Grid, Row, Card, CardHeader, CardBody, Callout, Table, SectionHeading, Eyebrow, H1, Lead, Caption, Chip, Divider } from "@/components/ui";
import { MD_INTRO, PROFIT_ROOT, PROFIT_MODEL_NOTE, PROFIT_TREE, VISIBILITY_ROWS, VIS_LABEL, VIS_TONE, KPIS, CAT_TONE, MD_PRINCIPLES, type Visibility, type MetricNode } from "@/data/metrics";

const TONE_VAR: Record<"success" | "warning" | "danger", string> = { success: "var(--success)", warning: "var(--warning)", danger: "var(--danger)" };

function VisChip({ v }: { v: Visibility }) {
  return <span className={`chip tone-${VIS_TONE[v]}`} style={{ fontWeight: 600 }}>{VIS_LABEL[v]}</span>;
}

function TreeNode({ node }: { node: MetricNode }) {
  return (
    <li>
      <span className={`tbox tbox-${node.vis}`}>
        <span className="tdot" />
        {node.label}
      </span>
      {node.children?.length ? (
        <ul>
          {node.op ? <span className="tree-op">{node.op}</span> : null}
          {node.children.map((c) => (
            <TreeNode key={c.label} node={c} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function MetricDesign() {
  return (
    <Stack gap={32}>
      <Stack gap={12}>
        <Eyebrow>Metric design</Eyebrow>
        <H1>What We Measure and Why</H1>
        <Lead>{MD_INTRO}</Lead>
      </Stack>

      <Card>
        <CardHeader trailing={
          <Row gap={12} align="center">
            {(["full", "none"] as Visibility[]).map((v) => (
              <Row key={v} gap={5} align="center">
                <span style={{ width: 9, height: 9, borderRadius: 999, background: TONE_VAR[VIS_TONE[v]] }} />
                <Caption>{VIS_LABEL[v]}</Caption>
              </Row>
            ))}
          </Row>
        }>The Restaurant Profitability Framework</CardHeader>
        <CardBody>
          <div className="treewrap">
            <div className="tree">
              <ul>
                <TreeNode node={PROFIT_ROOT} />
              </ul>
            </div>
          </div>
          <Caption style={{ marginTop: 8, whiteSpace: "pre-line" }}>{PROFIT_MODEL_NOTE}</Caption>
        </CardBody>
      </Card>

      {/* Framework */}
      <Stack gap={14}>
        <SectionHeading eyebrow="Framework" title="How Owner Can Improve Restaurant Profitability" sub="Three potential branches of influence, each with it's own specific levers and product mechanisms. Of these mechanism, only some are observable directly with the data." />
        <Row gap={14} wrap>
          {(["full", "partial", "none"] as Visibility[]).map((v) => (
            <Row key={v} gap={6} align="center">
              <span className={`chip tone-${VIS_TONE[v]}`} style={{ fontWeight: 600 }}>{VIS_LABEL[v]}</span>
            </Row>
          ))}
        </Row>
        <Grid cols={3} min="300px" gap={16}>
          {PROFIT_TREE.map((b) => (
            <Card key={b.branch}>
              <CardHeader><span className={`tone-${b.tone}`}>{b.branch}</span></CardHeader>
              <CardBody>
                <Stack gap={12}>
                  <Caption style={{ fontStyle: "italic" }}>{b.ownerLever}</Caption>
                  <Divider />
                  <Stack gap={12}>
                    {b.levers.map((l) => (
                      <Stack key={l.name} gap={3}>
                        <Row gap={8} align="center" style={{ justifyContent: "space-between" }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{l.name}</span>
                          <VisChip v={l.visibility} />
                        </Row>
                        <Caption>{l.detail}</Caption>
                        {l.note ? <Caption style={{ color: "var(--text-3)", fontStyle: "italic" }}>{l.note}</Caption> : null}
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </Stack>

      <Divider />

      {/* Visibility matrix */}
      <Stack gap={14}>
        <SectionHeading eyebrow="Visibility" title="What the Data Does or Doesn't Let Us See" sub="The order level is relatively rich on the revenue side but leaves a lot to be desired across cost and conversion levers. This bounds every claim we can or can't make." />
        <Table
          headers={["Component", "Visibility", "What We Observe (or Proxy)"]}
          align={["left", "left", "left"]}
          rows={VISIBILITY_ROWS.map((r) => [<b key="c">{r.component}</b>, <VisChip key="v" v={r.visibility} />, r.observe])}
          rowTone={VISIBILITY_ROWS.map((r) => (r.visibility === "full" ? "success" : r.visibility === "none" ? undefined : undefined))}
        />
        <Callout tone="info" title="Consequence for Analyses">
          Because we can't see costs, marketplace commissions, or a pre-Owner baseline, we <b>cannot</b> measure profitability. Instead we measure top line <b>revenue growth and its drivers</b> (Growth Page) and the <b>incremental behavior</b> the
          app drives (App Page).
        </Callout>
      </Stack>

      <Divider />

      {/* KPIs */}
      <Stack gap={14}>
        <SectionHeading eyebrow="KPIs" title="The Metrics that Define Success" sub="Each KPI ties back to an observable branch of the framework and powers a specific downstream page." />
        <Table
          headers={["KPI", "Category", "Definition", "Why It Matters", "Used In"]}
          align={["left", "left", "left", "left", "left"]}
          rows={KPIS.map((k) => [
            <b key="n">{k.name}</b>,
            <span key="c" className={`chip tone-${CAT_TONE[k.category]}`} style={{ fontWeight: 600 }}>{k.category}</span>,
            <span key="d" style={{ whiteSpace: "pre-line" }}>{k.definition}</span>,
            <span key="w" style={{ whiteSpace: "pre-line" }}>{k.why}</span>,
            <Chip key="u">{k.used}</Chip>,
          ])}
        />
      </Stack>

      <Stack gap={12}>
        <SectionHeading eyebrow="Ground rules" title="Design Principles Behind Every Metric Above" />
        <Stack gap={10}>
          {MD_PRINCIPLES.map((p, i) => (
            <Card key={i}>
              <CardBody>
                <Row gap={14} align="flex-start">
                  <span style={{
                    flex: "none", width: 28, height: 28, borderRadius: 999,
                    background: "var(--accent-soft)", color: "var(--accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 14,
                  }}>{i + 1}</span>
                  <Stack gap={3}>
                    <span style={{ fontWeight: 650, fontSize: 14.5 }}>{p.title}</span>
                    <Caption style={{ fontSize: 13.5, lineHeight: 1.6 }}>{p.detail}</Caption>
                  </Stack>
                </Row>
              </CardBody>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}
