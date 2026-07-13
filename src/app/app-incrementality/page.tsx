"use client";
import { useState } from "react";
import { Stack, Grid, Row, Card, CardHeader, CardBody, Callout, Stat, Table, SectionHeading, Eyebrow, H1, Lead, Caption, Divider } from "@/components/ui";
import { BarChartX, LineChartX, IntervalPlot } from "@/components/charts";
import { Toggle } from "@/components/Toggle";
import { AnalysisSummary, Methodology, NextSteps } from "@/components/sections";
import {
  NAIVE_ORDERS_LIFT, NAIVE_GMV_LIFT, PEN_CATS, PEN_LOCS, PEN_GROWTH, BALANCE,
  OUTCOME, OUTCOME_ORDER, type OutcomeKey,
  INCR_SUMMARY, INCR_METHOD, INCR_NEXT,
  K_CATS, K_DIFF_ORD, PROP_CATS, PROP_DEFS, PROP_N, PROP_SW_ORD, PROP_CT_ORD, PROP_DIFF_ORD, PROP_REL,
  COHORT_DIFF_ORD, COHORT_DIFF_GMV, COHORT_RET_PP, COHORT_REL_ORD, COHORT_REL_GMV, COHORT_REL_RET, COHORT_SW, COHORT_ORD_CI, WHALE_VS_SINGLE,
  STORE_DID_180, STORE_DID_180_REL,
  STORE_DID_180_LO, STORE_DID_180_HI, STORE_BALANCE, ES4_CATS, ES4_TREATED, ES4_CONTROL,
  ES3_CATS, ES3_TREATED, ES3_CONTROL, R3_ANCHOR, R3_PRE_ORDERS, R3_180,
} from "@/data/incrementality";

export default function AppIncrementality() {
  const [oc, setOc] = useState<OutcomeKey>("freq");
  const o = OUTCOME[oc];

  return (
    <Stack gap={32}>
      <Stack gap={12}>
        <Eyebrow>Is our app driving incremental value?</Eyebrow>
        <H1>Entity Matched App Driven Difference-in-Differences Analysis</H1>
        <Lead>
          Measure Guest/Customer Performance After Adopting App vs Matched Control (Never Adopted)
        </Lead>
      </Stack>

      <AnalysisSummary takeaways={INCR_SUMMARY.takeaways} approach={INCR_SUMMARY.approach} />

      <Callout tone="info" title="The Question and the Trap">
        App adoption is a guest <b>choice </b>where the most motivated, loyal diners install the app. As a result, any raw App-vs-Web gap conflates
        the app&apos;s <i>effect</i> with <i>who adopts it</i>. In absence of a randomized rollout, we split the evidence into
        <b> observational reads</b> (biased, useful only as a ceiling) and <b>designed measurement</b> (matched difference-in-differences) to eliminate as much selection bias as possible.
      </Callout>

      {/* Punchline */}
      <Stack gap={14}>
        <SectionHeading title="A Real Retention Lift Survives a Matched DiD Analysis" />
        <Grid cols={2} min="360px" gap={16}>
          <Card>
            <CardHeader trailing={<Caption>Biased Ceiling</Caption>}>Raw App-vs-Web Guest Comparison</CardHeader>
            <CardBody>
              <Grid cols={2} gap={14}>
                <Stat value={`+${NAIVE_ORDERS_LIFT}%`} label="orders / guest (adopter vs web-only)" tone="warning" />
                <Stat value={`+${NAIVE_GMV_LIFT}%`} label="GMV / guest" tone="warning" />
                <Stat value="61% vs 26%" label="repeat rate" tone="warning" />
                <Stat value="−$5" label="AOV (app is LOWER)" tone="danger" />
              </Grid>
              <Caption style={{ marginTop: 10 }}>Inflated by selection and circularity as an app order in itself represents an intention to order more regularly.</Caption>
            </CardBody>
          </Card>
          <Card>
            <CardHeader trailing={<Caption>Designed Measurement</Caption>}>Matched Entity Level DiD (Incremental)</CardHeader>
            <CardBody>
              <Grid cols={2} gap={14}>
                <Stat value="+1.25" label="orders / guest over 6 months (+37%)" tone="success" />
                <Stat value="+$36" label="GMV / guest over 6 months (+26%)" tone="success" />
                <Stat value="+7.2pp" label="6-month retention (80.1% vs 73.0%)" tone="success" />
                <Stat value={`+${STORE_DID_180}pp`} label="store GMV (enablement DiD, trend-matched)" tone="success" />
              </Grid>
              <Caption style={{ marginTop: 10 }}>
                Over 6 months an app-adopter places <b>4.68 orders</b>
                / <b>$176.04</b> vs <b>3.43 / $140.22</b> when compared to similar app-only guests.
              </Caption>
            </CardBody>
          </Card>
        </Grid>
      </Stack>

      <Divider />

      {/* Observational reads */}
      <Stack gap={14}>
        <SectionHeading eyebrow="Approach 1 of 2" title="Observational Views (Confounded by Selection)"
          sub="Raw App-vs-Web comparisons. Useful only as a biased ceiling: they show what adopters look like, not what the app did to them." />
        <Methodology approach={INCR_METHOD.observational.approach} caveats={INCR_METHOD.observational.caveats} />
      <Grid cols={2} min="360px" gap={16}>
        <Card>
          <CardHeader trailing={<Caption>Biased Ceiling</Caption>}>Raw Per-Guest Comparison</CardHeader>
          <CardBody>
            <BarChartX categories={["Orders/guest", "GMV/guest ÷10", "Repeat %"]} height={220} showValues
              series={[{ name: "App Adopter", data: [4.68, 19.1, 61.3], tone: "warning" }, { name: "Web Only", data: [1.79, 8.5, 25.7], tone: "neutral" }]} />
            <Caption style={{ marginTop: 8 }}>App adopters contribute over 2x the LTV of web-only guests and are substantially more likely to place consistent orders with a brand. That being said, this is expected as app adoption is a guest choice and not a random event.

            </Caption>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Caption>Confounded</Caption>}>Location Level App-Penetration vs 30D Growth Rate</CardHeader>
          <CardBody>
            <BarChartX categories={PEN_CATS} valueSuffix="%" height={220} showValues
              series={[{ name: "Median 30-Day GMV Growth", data: PEN_GROWTH, tone: "info" }]} />
            <Caption style={{ marginTop: 8 }}>30D GMV growth rate looks to scale monotonically with app penetration however this could be heavily skewed by selection bias as app-penetration is structurally higher amongst top restaurants.</Caption>
          </CardBody>
        </Card>
      </Grid>
      </Stack>

      <Divider />

      {/* Designed measurement */}
      <Stack gap={14}>
        <SectionHeading eyebrow="Approach 2 of 2" title="Designed Measurement (Matched DiD Analyses)"
          sub="Build a more credible counterfactual by comparing guests (and stores) that adopt the app against matched peers who don't so the post-period gap can be interpreted as the app's effect rather than selection bias." />
        <Methodology approach={INCR_METHOD.guestDiD.approach} caveats={INCR_METHOD.guestDiD.caveats} />
      </Stack>

      {/* Primary design — interactive */}
      <Stack gap={14}>
        <SectionHeading title="Primary Design: Within-Guest App-Switcher DiD"
          sub={<>We match each app-adopter with a set of similar web-only control guest to compare their behavior against one another. Because the treatment and control cohort are matched, the metric gap post-adoption IS the effect shown in real orders and dollars.</>} />
        <Toggle options={OUTCOME_ORDER.map((k) => ({ key: k, label: OUTCOME[k].short }))} value={oc} onChange={setOc} />

        <Grid cols={2} min="360px" gap={16}>
          <Card>
            <CardHeader trailing={<Caption>n=8,680 Matched</Caption>}>{o.chartTitle}</CardHeader>
            <CardBody>
              <BarChartX categories={o.cats} height={230} valuePrefix={o.prefix} valueSuffix={o.suffix} showValues
                series={[{ name: "Switcher (Adopted App)", data: o.sw, tone: "success" }, { name: "Matched Control (Never Adopted)", data: o.ct, tone: "neutral" }]} />
              <Caption style={{ marginTop: 8 }}>Both groups are welll matched in the pre-period, so the gap between the two bars is the incremental effect the app is driving.</Caption>
            </CardBody>
          </Card>
          <Stack gap={12}>
            <Card>
              <CardHeader>Incremental Effect (per Guest)</CardHeader>
              <CardBody>
                <Stat value={o.effect} label={o.effectLabel} tone="success" />
                <Caption style={{ marginTop: 10 }}>{o.note}</Caption>
              </CardBody>
            </Card>
          </Stack>
        </Grid>

        <Card>
          <CardHeader trailing={<Caption>Orders / Guest per 30D</Caption>}>From the First App Order Onward: Matched Ordering Frequency</CardHeader>
          <CardBody>
            <LineChartX categories={ES3_CATS} height={230} valueSuffix=" ord"
              referenceLine={{ value: R3_ANCHOR, label: "shared pace at K-th order", tone: "neutral" }}
              series={[{ name: "Switcher (Adopted App)", data: ES3_TREATED, tone: "success" }, { name: "Matched Control (Never Adopted)", data: ES3_CONTROL, tone: "neutral" }]} />
            <Caption style={{ marginTop: 8 }}>
              Both cohorts are aligned to their <b>K-th order</b> (adoption event / matched synthetic adoption event),
              reached at a consistent order velocity. Both cohorts observe decay, but adopters decay
              at a much slower rate than their web-only counterparts across the entire post-period window.
            </Caption>
          </CardBody>
        </Card>

        <Callout tone="success" title="The Lift is Sustained Across All 6 Months, Not a Novelty Effect">
          <Row gap={24} wrap>
            <Stat value="~+0.2 / mo" label="switcher−control order gap, held every month for 6 months" tone="success" />
            <Stat value={`+${(R3_180.swRet - R3_180.ctRet).toFixed(1)}pp`} label={`still active in months 4–6 (${R3_180.swRet}% vs ${R3_180.ctRet}%)`} tone="success" />
          </Row>
          <Caption style={{ marginTop: 8 }}>The +1.25 orders / +$36 headline isn&apos;t a novelty effect but the value of the app <b>compounding</b> as adopters keep out-ordering their app-only counterparts.</Caption>
        </Callout>

        <Grid cols={2} min="360px" gap={16}>
          <Card>
            <CardHeader trailing={<Caption>Matched Sample · Mean</Caption>}>Matching Quality: Pre-Period Baselines are Balanced</CardHeader>
            <CardBody>
              <Table headers={["Pre-Adoption Feature", "Adopter", "Control"]} align={["left", "right", "right"]} rows={BALANCE.map((b) => [b[0], b[1], b[2]])} />
              <Caption style={{ marginTop: 8 }}>Near-identical pre-adoption features(SMD &lt; 0.03) which lets us read the post-period gap directly as the effect.</Caption>
            </CardBody>
          </Card>
          <Card>
            <CardHeader trailing={<Caption>Icremental Orders / Guest</Caption>}>Incremental Orders by Pre-Adoption Non-App Order Count</CardHeader>
            <CardBody>
              <BarChartX categories={K_CATS} height={200} showValues referenceLine={{ value: 0, tone: "neutral" }}
                series={[{ name: "Incremental Orders (180d)", data: K_DIFF_ORD, tone: "info" }]} />
              <Caption style={{ marginTop: 8 }}>App adoption drives an increase in orders place irrespetive of how many orders a customer placed prior to adoption. Sample size shrinks as X rises so don't anchor an the right tail's results.</Caption>
            </CardBody>
          </Card>
        </Grid>
      </Stack>

      <Divider />

      {/* Heterogeneity */}
      <Stack gap={14}>
        <SectionHeading title="HTE: Lift Lands at Every Baseline w/ the Biggest Proportional Impact for Lower Frequency Diners"
          sub="Splitting by the guest's pre-adoption ordering pace (orders / 30D). App adoption drives extra orders across every with occasional diners observing the greatest REL impact (+35%)." />
        <Grid cols={2} min="360px" gap={16}>
          <Card>
            <CardHeader trailing={<Caption>Orders in 180D · n={PROP_N.join("/")} sw</Caption>}>Post-6M Orders per Guest by Pre-Adoption Order Frequency</CardHeader>
            <CardBody>
              <BarChartX categories={PROP_CATS} height={230} showValues
                series={[{ name: "Switcher", data: PROP_SW_ORD, tone: "success" }, { name: "Matched Control", data: PROP_CT_ORD, tone: "neutral" }]} />
              <Caption style={{ marginTop: 8 }}>The ABS order lift is relatively consistent across cohorts however occasional diners see the greatest REL impact due to a lower expected baseline.</Caption>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>Bucket Definition & Results</CardHeader>
            <CardBody>
              <Table headers={["Bucket", "Pre-Adoption Pace", "n (sw)", "+Orders"]} align={["left", "left", "right", "right"]}
                rows={PROP_CATS.map((c, i) => [c, PROP_DEFS[i], PROP_N[i].toLocaleString(), `+${PROP_DIFF_ORD[i].toFixed(2)} (+${PROP_REL[i]}%)`])}
                rowTone={["success", undefined, "info"]} />
              <Caption style={{ marginTop: 10 }}>The app adds roughly a full extra order regardless of cohort, but the lift is proportionally <b>largest for occasional diners</b> when compared against adopters with a preceding habituation towards a brand (+35% vs +19%). This is expected as occasional diners likely engage with the app with intention of placing more orders down the line while frequent diners already view the brand as a staple in their routine.</Caption>
            </CardBody>
          </Card>
        </Grid>
      </Stack>

      <Divider />

      {/* Cohort split */}
      <Stack gap={14}>
        <SectionHeading title="Cohort Split: the Lift Scales with Brand Scale"
          sub="We applied an additional guest match leveraging the same brand cohorts from the growth analysis (a top brand adopter is only compared against another top brand web-only control)." />
        <Grid cols={2} min="360px" gap={16}>
          <Card>
            <CardHeader trailing={<Caption>Incremental Orders · n={COHORT_SW.join("/")}</Caption>}>Incremental Orders (180D) by Brand Cohort</CardHeader>
            <CardBody>
              <BarChartX categories={["Single-Loc", "Multi-Loc", "Top Brand"]} height={240} showValues referenceLine={{ value: 0, tone: "neutral" }}
                series={[{ name: "Incremental Orders (180d)", data: COHORT_DIFF_ORD, tone: "success" }]} />
              <Caption style={{ marginTop: 8 }}>The incremental order lift is positive everywhere and monotonic scalining linearly with brand scale and sophistication.</Caption>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>Brand Cohort App-Adoption Results Detail</CardHeader>
            <CardBody>
              <Table headers={["Cohort", "+Orders", "+GMV", "+Retention"]} align={["left", "right", "right", "right"]}
                rows={["Single-Loc", "Multi-Loc", "Top Brand"].map((c, i) => [c, `+${COHORT_DIFF_ORD[i].toFixed(2)} (+${COHORT_REL_ORD[i]}%)`, `+$${Math.round(COHORT_DIFF_GMV[i])} (+${COHORT_REL_GMV[i]}%)`, `+${COHORT_RET_PP[i]}pp (+${COHORT_REL_RET[i]}%)`])}
                rowTone={[undefined, "info", "success"]} />
              <Caption style={{ marginTop: 10 }}>On every metric the lift grows with brand complexity with the top brand driving ~2× the single-store relative lift. 
                This trend echoes the growth analysis as well where the top brand was significantly outperforming its peers.</Caption>
            </CardBody>
          </Card>
        </Grid>
      </Stack>

      <Divider />

      {/* Corroborating store DiD */}
      <Stack gap={14}>
        <SectionHeading title="Supporting Analysis: Store-Level App Enablement Matched DiD"
          sub="When a store turns the app on (≥90d web-only pre-period), its total GMV increases relative to never-app control stores matched on pre-period size and trends." />
        <Methodology approach={INCR_METHOD.store.approach} caveats={INCR_METHOD.store.caveats} />
        <Grid cols={2} min="360px" gap={16}>
          <Card>
            <CardHeader trailing={<Caption>Paired median · 32 events</Caption>}>Store GMV Rate Lift: Paired DiD With 95% CI</CardHeader>
            <CardBody>
              <IntervalPlot valueSuffix="pp" labelWidth={150}
                rows={[{ name: "6-Month Rate (Per 30D)", point: STORE_DID_180, lo: STORE_DID_180_LO, hi: STORE_DID_180_HI }]} />
              <div style={{ marginTop: 16, marginBottom: 6, fontSize: 12.5, fontWeight: 600, color: "var(--text-2)" }}>Pre-Enablement Balance (App Enablers vs Matched Control)</div>
              <Table headers={["Pre-Enablement Feature", "Treated", "Matched Ctrl", "|SMD| Raw → Matched"]} align={["left", "right", "right", "right"]}
                rows={STORE_BALANCE.map((b) => [b.feat, b.treated, b.control, b.smd])}
                rowTone={STORE_BALANCE.map((b) => (b.balanced ? "success" : undefined))} />
              <Caption style={{ marginTop: 8 }}>Each store is ompared against its <b>own</b> matched controls, then medianed across all 32 events. 
              This approach measured a <b>+{STORE_DID_180}pp</b> ABS or <b>+{STORE_DID_180_REL}% REL GMV lift </b> than the matched counterfactual over the
               6M window. Treated stores ran larger in absolute size, but the rate is normalized to each store&apos;s own pre-period and then differenced, so fixed pre-period size disparities are accounted for. The parallel-trends assumption also holds as the matched slopes are aligned across groups.</Caption>
            </CardBody>
          </Card>
          <Card>
            <CardHeader trailing={<Caption>GMV Indexed to Pre=100 · 32 Events</Caption>}>Store GMV via App Enablement Event Study</CardHeader>
            <CardBody>
              <LineChartX categories={ES4_CATS} height={230} beginAtZero={false} referenceLine={{ value: 100, label: "pre-period", tone: "neutral" }}
                series={[{ name: "App-Enabling Store", data: ES4_TREATED, tone: "success" }, { name: "Matched Control (Size + Pre-Trend)", data: ES4_CONTROL, tone: "neutral" }]} />
              <Caption style={{ marginTop: 8 }}> Pre period trends are comparable between groups and then post app-adoption we observe both cohorts grow over the analysis window however treatment is growing at a faster rate while control lags behind. There is an anamolous recovery in M3 for Control but this is rather short lived and growth is sustained in M4 and beyond.</Caption>
            </CardBody>
          </Card>
        </Grid>
      </Stack>

      <Divider />

      <NextSteps followUps={INCR_NEXT.followUps} experiments={INCR_NEXT.experiments} />
    </Stack>
  );
}
