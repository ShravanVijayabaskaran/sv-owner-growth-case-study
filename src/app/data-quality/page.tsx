import { Stack, Grid, Row, Card, CardHeader, CardBody, Callout, Stat, Table, SectionHeading, Eyebrow, H1, Lead, Caption, Divider } from "@/components/ui";
import { BarChartX } from "@/components/charts";
import { COVERAGE, ORDER_SOURCE, ORDER_TYPE, IDENTITY, TENURE, CONCENTRATION, DQ_FINDINGS, DATA_MODEL, MONITORING, REVENUE } from "@/data/dataQuality";

const sevTone: Record<string, "success" | "warning" | "info"> = { EXCLUDE: "warning", NOTE: "info", CLEAN: "success" };

export default function DataQuality() {
  return (
    <Stack gap={32}>
      <Stack gap={12}>
        <Eyebrow>Data exploration & quality assessment</Eyebrow>
        <H1>What's in the Data and Can We Trust It?</H1>
        <Lead>
          1.5M Rows of Order Level Data Spanning from 2020 - 2025
        </Lead>
      </Stack>

      <Grid cols={4} min="190px" gap={14}>
        <Card><CardBody><Stat value={COVERAGE.distinctOrders.toLocaleString()} label="orders (ORDER_ID unique → grain = 1 order)" /></CardBody></Card>
        <Card><CardBody><Stat value={`${COVERAGE.brands} / ${COVERAGE.locations}`} label="brands / locations" /></CardBody></Card>
        <Card><CardBody><Stat value={COVERAGE.guests.toLocaleString()} label="distinct guests" /></CardBody></Card>
        <Card><CardBody><Stat value={`$${COVERAGE.gmvAvg}`} label={`avg GMV (range $${COVERAGE.gmvMin} … $${COVERAGE.gmvMax.toLocaleString()})`} /></CardBody></Card>
      </Grid>

      <Stack gap={12}>
        <SectionHeading eyebrow="brand cohorts" title="Book-of-Business Concentration"
          sub="How the 292-location clean base splits across brand cohorts. The 'top brand' is only 8.6% of locations but ~24% of GMV while multi-location brands are also materially larger than single-location brands on average." />
        <Table
          headers={["Segment", "Brands", "Locations", "% of locations", "% of GMV"]}
          align={["left", "right", "right", "right", "right"]}
          rows={CONCENTRATION.map((c) => [c.seg, c.brands, c.loc, c.pctLoc, c.pctGmv])}
          rowTone={CONCENTRATION.map((c) => c.tone)}
        />
        <Callout tone="warning" title="Why Segment: One Brand Is a Whale">
          A single brand runs <b>25 of 292 locations</b> but accounts for <b>~24% of GMV</b>. The brand is so large it inflates any average aggregation across the group which is why we'll anchor on the group median.
        </Callout>
      </Stack>

      <Grid cols={2} min="360px" gap={16}>
        <Card>
          <CardHeader trailing={<Caption>Orders by Channel</Caption>}>Channel Mix — Where Orders Come From</CardHeader>
          <CardBody>
            <BarChartX
              categories={ORDER_SOURCE.cats}
              series={[{ name: "Orders", data: ORDER_SOURCE.orders, tone: "info" }]}
              height={220}
              showValues
            />
            <Caption style={{ marginTop: 6 }}>
              Web({Math.round((ORDER_SOURCE.orders[0] / COVERAGE.totalRows) * 100)}%) | App
              ({Math.round((ORDER_SOURCE.orders[1] / COVERAGE.totalRows) * 100)}%) | POS+Phone <0.1%.
            </Caption>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Caption>Orders by Fulfillment Type</Caption>}>Fulfillment Mix</CardHeader>
          <CardBody>
            <BarChartX
              categories={ORDER_TYPE.cats}
              series={[{ name: "Orders", data: ORDER_TYPE.orders, tone: "neutral" }]}
              height={220}
              showValues
            />
            <Caption style={{ marginTop: 6 }}>
              Pickup represents ~83% of total volume.
            </Caption>
          </CardBody>
        </Card>
      </Grid>

      <Callout tone="success" title="Only ~13% of Guests Have Placed an Order via App">
        <Row gap={24} wrap>
          <Stat value={IDENTITY.bothChannels.toLocaleString()} label="guests use BOTH app & web" tone="success" />
          <Stat value={IDENTITY.anyApp.toLocaleString()} label="guests with any app order" tone="neutral" />
          <Stat value={`${IDENTITY.pctRepeat}%`} label={`repeat guests (${IDENTITY.repeat2plus.toLocaleString()} with 2+ orders)`} tone="neutral" />
        </Row>
        <Caption style={{ marginTop: 8 }}>
          GUEST_ID is shared universally across both App and Web channels
        </Caption>
      </Callout>

      <Stack gap={14}>
        <SectionHeading eyebrow="findings ledger" title="Data-Quality Findings" sub="Severity: EXCLUDE = removed from base · NOTE = retained with caveat · CLEAN = verified no issue." />
        <Table
          headers={["Severity", "Finding", "Detail", "Action"]}
          align={["left", "left", "left", "left"]}
          rows={DQ_FINDINGS.map((f) => [
            <span key="s" className={`chip tone-${sevTone[f.severity]}`} style={{ fontWeight: 700 }}>{f.severity}</span>,
            <b key="f">{f.finding}</b>,
            f.detail,
            f.action,
          ])}
          rowTone={DQ_FINDINGS.map((f) => (f.severity === "EXCLUDE" ? "warning" : f.severity === "CLEAN" ? "success" : undefined))}
        />
        <Caption>
          Entity Exclusions: 5 non-human/demo guests (558 orders, 0.037% of orders / 0.02% of GMV) and
          3 locations that re-onboarded under the same LOCATION_ID (4,957 orders, 0.33% / 0.43% of GMV)
        </Caption>
      </Stack>

      <Grid cols={2} min="360px" gap={16}>
        <Card>
          <CardHeader trailing={<Caption>Table Build Order</Caption>}>Canonical Data Model</CardHeader>
          <CardBody>
            <Table
              headers={["Object", "In", "What It Is"]}
              align={["left", "left", "left"]}
              rows={DATA_MODEL.map((d) => [<code key="o" style={{ fontSize: 12 }}>{d.object}</code>, d.where, d.what])}
            />
            <Caption style={{ marginTop: 8 }}>All downstream queries and analysis is conducted on top of this 'CLEAN' table.</Caption>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Caption>Location Tenure</Caption>}>Tenure Feasibility</CardHeader>
          <CardBody>
            <Grid cols={2} gap={14}>
              <Stat value={TENURE.yr1plus.toString()} label="locations ≥1yr (supports MoM view)" tone="info" />
              <Stat value={TENURE.yr2plus.toString()} label="locations ≥2yr (supports rigorous YoY)" tone="warning" />
              <Stat value={`${TENURE.medianDays}d`} label="median tenure" tone="neutral" />
              <Stat value={`${TENURE.maxDays.toLocaleString()}d`} label="max tenure (~5 yrs)" tone="neutral" />
            </Grid>
            <Caption style={{ marginTop: 10 }}>
              Rigorous same-store YoY is thin (61 locations). Implication: report BOTH a YoY view (rigor) and a rolling
              30-day view (coverage) — which the growth page does.
            </Caption>
          </CardBody>
        </Card>
      </Grid>

      <Divider />

      <Grid cols={2} min="360px" gap={16}>
        <Stack gap={12}>
          <SectionHeading eyebrow="pipeline monitoring proposal" title="How We'd Catch Issues Going Forward" />
          <Table
            headers={["Check", "Rule"]}
            align={["left", "left"]}
            rows={MONITORING.map((m) => [<b key="c">{m.check}</b>, m.rule])}
          />
          <Caption>Can Implement Checks Straight into ETL to Produce Daily Data Quality Report</Caption>
        </Stack>
        <Stack gap={12}>
          <SectionHeading eyebrow="Owner Subscription Revenue" title="Owner Revenue Proxy" sub="Plans: flat $499/mo OR $249/mo + 5% GMV (breakeven ≈ $5,000 GMV/mo). Estimated on a daily-rate basis." />
          <Card>
            <CardBody>
              <Grid cols={2} gap={14}>
                <Stat value={`${REVENUE.pctAboveBreakeven}%`} label="locations above breakeven → flat plan" tone="success" />
                <Stat value={`$${REVENUE.medianDailyGmv}`} label="median daily GMV/location" tone="neutral" />
                <Stat value={`$${REVENUE.estMonthlyRev.toLocaleString()}`} label="est. Owner revenue / mo (sample)" tone="info" />
                <Stat value={REVENUE.arr} label="implied ARR on the sample" tone="info" />
              </Grid>
            </CardBody>
          </Card>
        </Stack>
      </Grid>
    </Stack>
  );
}
