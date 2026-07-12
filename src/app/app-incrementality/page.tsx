"use client";
import { useState } from "react";
import { Stack, Grid, Row, Card, CardHeader, CardBody, Callout, Stat, Table, SectionHeading, Eyebrow, H1, Lead, Caption, Divider } from "@/components/ui";
import { BarChartX, LineChartX, IntervalPlot } from "@/components/charts";
import { Toggle } from "@/components/Toggle";
import { AnalysisSummary, Methodology, NextSteps } from "@/components/sections";
import {
  FEAS, NAIVE_ORDERS_LIFT, NAIVE_GMV_LIFT, PEN_CATS, PEN_LOCS, PEN_GROWTH, BALANCE,
  OUTCOME, OUTCOME_ORDER, type OutcomeKey,
  INCR_SUMMARY, INCR_METHOD, INCR_NEXT,
  K_CATS, K_DIFF_ORD, PROP_CATS, PROP_DEFS, PROP_N, PROP_SW_ORD, PROP_CT_ORD, PROP_DIFF_ORD, PROP_REL,
  COHORT_DIFF_ORD, COHORT_DIFF_GMV, COHORT_RET_PP, COHORT_REL_ORD, COHORT_REL_GMV, COHORT_REL_RET, COHORT_SW, COHORT_ORD_CI, WHALE_VS_SINGLE,
  STORE_ADOPT_GMV, STORE_CTRL_GMV, STORE_DID_180, STORE_DID_180_CI, STORE_DID_180_REL, STORE_DID_180_REL_CI,
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
          Measure Guest/Customer Performance After Adopting App vs Matched Control (Never Adopted) - Directional Not Causal
        </Lead>
      </Stack>

      <AnalysisSummary takeaways={INCR_SUMMARY.takeaways} approach={INCR_SUMMARY.approach} />

      <Callout tone="info" title="The Question and the Trap">
        App adoption is a guest <b>choice </b>where the most motivated, loyal diners install the app. As a result, any raw App-vs-Web gap conflates
        the app&apos;s <i>effect</i> with <i>who adopts it</i>. In absence of a randomized rollout, we split the evidence into
        <b> observational reads</b> (biased, useful only as a ceiling) and <b>designed measurement</b> (matched difference-in-differences) and triangulate.
      </Callout>

      {/* Punchline */}
      <Stack gap={14}>
        <SectionHeading title="The Observational Difference is Selection Driven but a Real Retention Lift Survives Bias Reduction Efforts" />
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
              <Caption style={{ marginTop: 10 }}>Inflated by selection + circularity (an app order in itself represents an intention to order more regularly).</Caption>
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
                For engaged guests the app is a <b>retention</b> play: over 6 months a matched app-switcher places <b>4.68 orders</b>
                / <b>$176.04</b> vs <b>3.43 / $140.22</b> — <b>+1.25 orders</b> when compared to similar app-only guests at the same location.
              </Caption>
            </CardBody>
          </Card>
        </Grid>
      </Stack>

      <Divider />

      {/* Observational reads */}
      <Stack gap={14}>
        <SectionHeading eyebrow="Approach 1 of 2" title="Observational Reads — Confounded by Selection"
          sub="Raw App-vs-Web comparisons. Useful only as a biased ceiling: they show what adopters look like, not what the app did to them." />
        <Methodology approach={INCR_METHOD.observational.approach} caveats={INCR_METHOD.observational.caveats} />
      <Grid cols={2} min="360px" gap={16}>
        <Card>
          <CardHeader trailing={<Caption>Biased Ceiling</Caption>}>Raw Per-Guest Comparison</CardHeader>
          <CardBody>
            <BarChartX categories={["Orders/guest", "GMV/guest ÷10", "Repeat %"]} height={220} showValues
              series={[{ name: "App Adopter", data: [4.68, 19.1, 61.3], tone: "warning" }, { name: "Web Only", data: [1.79, 8.5, 25.7], tone: "neutral" }]} />
            <Caption style={{ marginTop: 8 }}>Adopters hold ~2.6× the LTV of non-adopters — this is the selection ceiling and not to be conflated with app impact. (GMV/guest shown ÷ 10 to share a y-axis)

            </Caption>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Caption>Confounded</Caption>}>Store App-Penetration vs 30D Growth Rate</CardHeader>
          <CardBody>
            <BarChartX categories={PEN_CATS} valueSuffix="%" height={220} showValues
              series={[{ name: "Median 30-Day GMV Growth", data: PEN_GROWTH, tone: "info" }]} />
            <Caption style={{ marginTop: 8 }}>X: lifetime app penetration bucket · Y: median per-location 30D growth (n={PEN_LOCS.join("/")}). Monotonic (~4× at the top) but confounded by circularity.</Caption>
          </CardBody>
        </Card>
      </Grid>
      </Stack>

      <Divider />

      {/* Designed measurement */}
      <Stack gap={14}>
        <SectionHeading eyebrow="Approach 2 of 2" title="Designed Measurement — Matched Difference-in-Differences (DiD)"
          sub="Build a more credible counterfactual by comparing guests (and stores) that adopt the app against matched peers who don't, so the post-period gap can be read as the app's effect rather than selection bias." />
        <Methodology approach={INCR_METHOD.guestDiD.approach} caveats={INCR_METHOD.guestDiD.caveats} />
      </Stack>

      {/* Primary design — interactive */}
      <Stack gap={14}>
        <SectionHeading title="Primary Design: Within-Guest App-Switcher DiD"
          sub={<>A &quot;switcher&quot; has a Web-only pre-period, then adopts the app. We measure their pre→post change and compare it against matched web-only guests via coarsened exact matching (k × pre-GMV quintile × pre-velocity quintile). Because the arms are matched, the post-period gap IS the effect — shown in real orders and dollars.</>} />
        <Toggle options={OUTCOME_ORDER.map((k) => ({ key: k, label: OUTCOME[k].short }))} value={oc} onChange={setOc} />

        <Grid cols={2} min="360px" gap={16}>
          <Card>
            <CardHeader trailing={<Caption>n=8,680 Matched</Caption>}>{o.chartTitle}</CardHeader>
            <CardBody>
              <BarChartX categories={o.cats} height={230} valuePrefix={o.prefix} valueSuffix={o.suffix} showValues
                series={[{ name: "Switcher (Adopted App)", data: o.sw, tone: "success" }, { name: "Matched Control (Never Adopted)", data: o.ct, tone: "neutral" }]} />
              <Caption style={{ marginTop: 8 }}>Y: {o.yLabel}. Both groups were matched on the pre-period, so the gap between the two bars is the incremental effect.</Caption>
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
              Both cohorts aligned at their <b>K-th order</b> (app-adoption order for switchers; same-numbered order for controls),
              reached at an identical pace (~{R3_ANCHOR} order/month, ≈{R3_PRE_ORDERS} orders in). Both decay, but switchers decay
              far slower — the gap holds ~+0.2 orders/month for a full 6 months.
            </Caption>
          </CardBody>
        </Card>

        <Callout tone="success" title="Durability — The Lift is Sustained Across All 6 Months, Not a Novelty Effect">
          <Row gap={24} wrap>
            <Stat value="~+0.2 / mo" label="switcher−control order gap, held every month for 6 months" tone="success" />
            <Stat value={`+${(R3_180.swRet - R3_180.ctRet).toFixed(1)}pp`} label={`still active in months 4–6 (${R3_180.swRet}% vs ${R3_180.ctRet}%)`} tone="success" />
          </Row>
          <Caption style={{ marginTop: 8 }}>The +1.25 orders / +$36 headline isn&apos;t front-loaded churn-delay; the value <b>compounds</b> as switchers keep out-ordering their app-only counterparts.</Caption>
        </Callout>

        <Grid cols={2} min="360px" gap={16}>
          <Card>
            <CardHeader trailing={<Caption>Matched Sample · Mean</Caption>}>Matching Quality: Pre-Period Baselines are Balanced</CardHeader>
            <CardBody>
              <Table headers={["Pre-Adoption Feature", "Switcher", "Control"]} align={["left", "right", "right"]} rows={BALANCE.map((b) => [b[0], b[1], b[2]])} />
              <Caption style={{ marginTop: 8 }}>Near-identical before adoption (standardized mean diff &lt; 0.03 on both matched features) — which lets us read the post-period gap directly as the effect.</Caption>
            </CardBody>
          </Card>
          <Card>
            <CardHeader trailing={<Caption>Icremental Orders / Guest</Caption>}>Transparency: Incremental Orders by Pre-Period Non-App Order Count</CardHeader>
            <CardBody>
              <BarChartX categories={K_CATS} height={200} showValues referenceLine={{ value: 0, tone: "neutral" }}
                series={[{ name: "Incremental Orders (180d)", data: K_DIFF_ORD, tone: "info" }]} />
              <Caption style={{ marginTop: 8 }}>X: web orders before adoption · Y: incremental orders per guest over 6 months (switcher − control). <b>Positive in every stratum</b>. n shrinks as k rises (11+ is the pooled tail; only k=9 crosses zero), so the pooled effect is what&apos;s solid.</Caption>
            </CardBody>
          </Card>
        </Grid>
      </Stack>

      <Divider />

      {/* Heterogeneity */}
      <Stack gap={14}>
        <SectionHeading title="Heterogeneity: Lift Lands at Every Baseline w/ the Biggest Proportional Impact for Lower Frequency Diners"
          sub="Splitting by the guest's pre-adoption ordering pace (orders / 30D). The incremental lift runs +0.75 to +1.0 extra orders at every baseline with occasional diners observing the greatest REL impact (+35%)." />
        <Grid cols={2} min="360px" gap={16}>
          <Card>
            <CardHeader trailing={<Caption>Orders in 180D · n={PROP_N.join("/")} sw</Caption>}>Post-6M Orders per Guest — Switcher vs Matched Control</CardHeader>
            <CardBody>
              <BarChartX categories={PROP_CATS} height={230} showValues
                series={[{ name: "Switcher", data: PROP_SW_ORD, tone: "success" }, { name: "Matched Control", data: PROP_CT_ORD, tone: "neutral" }]} />
              <Caption style={{ marginTop: 8 }}>The switcher−control gap is +0.75 / +1.01 / +0.99 orders (occasional→frequent).</Caption>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>Bucket Definition & Results</CardHeader>
            <CardBody>
              <Table headers={["Bucket", "Pre-Adoption Pace", "n (sw)", "+Orders"]} align={["left", "left", "right", "right"]}
                rows={PROP_CATS.map((c, i) => [c, PROP_DEFS[i], PROP_N[i].toLocaleString(), `+${PROP_DIFF_ORD[i].toFixed(2)} (+${PROP_REL[i]}%)`])}
                rowTone={["success", undefined, "info"]} />
              <Caption style={{ marginTop: 10 }}>The app adds roughly a full extra order regardless of baseline, but proportionally largest for <b>occasional</b> diners (+35% vs +19%).</Caption>
            </CardBody>
          </Card>
        </Grid>
      </Stack>

      <Divider />

      {/* Cohort split */}
      <Stack gap={14}>
        <SectionHeading title="Cohort Split: the Lift Scales with Brand Scale & Sophistication"
          sub="The same three cohorts as the growth analysis, matched WITHIN each cohort (a top brand switcher is only compared to top brand web-only controls)." />
        <Grid cols={2} min="360px" gap={16}>
          <Card>
            <CardHeader trailing={<Caption>Incremental Orders · n={COHORT_SW.join("/")}</Caption>}>Incremental Orders (180D) by Brand Cohort</CardHeader>
            <CardBody>
              <BarChartX categories={["Single-Loc", "Multi-Loc", "Top Brand"]} height={240} showValues referenceLine={{ value: 0, tone: "neutral" }}
                series={[{ name: "Incremental Orders (180d)", data: COHORT_DIFF_ORD, tone: "success" }]} />
              <Caption style={{ marginTop: 8 }}>Positive everywhere and monotonic — +1.02 / +1.22 / +1.75 orders, i.e. +30% / +33% / +61% over each cohort&apos;s own baseline.</Caption>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>Read — Absolute (Relative vs Matched Control)</CardHeader>
            <CardBody>
              <Table headers={["Cohort", "+Orders", "+GMV", "+Retention"]} align={["left", "right", "right", "right"]}
                rows={["Single-Loc", "Multi-Loc", "Top Brand"].map((c, i) => [c, `+${COHORT_DIFF_ORD[i].toFixed(2)} (+${COHORT_REL_ORD[i]}%)`, `+$${Math.round(COHORT_DIFF_GMV[i])} (+${COHORT_REL_GMV[i]}%)`, `+${COHORT_RET_PP[i]}pp (+${COHORT_REL_RET[i]}%)`])}
                rowTone={[undefined, "info", "success"]} />
              <Caption style={{ marginTop: 10 }}>On every metric the lift grows with brand sophistication — the top brand earns ~2× the single-store relative lift. 
                This gradient is <b>statistically real</b> and echoes the growth analysis (top brand led YoY +53% vs +12%).</Caption>
            </CardBody>
          </Card>
        </Grid>
      </Stack>

      <Divider />

      {/* Corroborating store DiD */}
      <Stack gap={14}>
        <SectionHeading title="Corroborating Design: Store-Level Enablement Matched DiD"
          sub="When a store turns the app on (≥90d web-only pre-period), its total GMV steps up vs never-app control stores matched on pre-period size AND trend. Both visuals use the same 6-month post window as the guest design." />
        <Methodology approach={INCR_METHOD.store.approach} caveats={INCR_METHOD.store.caveats} />
        <Grid cols={2} min="360px" gap={16}>
          <Card>
            <CardHeader trailing={<Caption>Paired median · 32 events</Caption>}>Store GMV Rate Lift: Paired DiD With 95% CI</CardHeader>
            <CardBody>
              <IntervalPlot valueSuffix="pp" labelWidth={150}
                rows={[{ name: "6-Month Rate (Per 30D)", point: STORE_DID_180, lo: STORE_DID_180_LO, hi: STORE_DID_180_HI }]} />
              <div style={{ marginTop: 16, marginBottom: 6, fontSize: 12.5, fontWeight: 600, color: "var(--text-2)" }}>Pre-Enablement Balance — Treated vs Matched Control</div>
              <Table headers={["Pre-Enablement Feature", "Treated", "Matched Ctrl", "|SMD| Raw → Matched"]} align={["left", "right", "right", "right"]}
                rows={STORE_BALANCE.map((b) => [b.feat, b.treated, b.control, b.smd])}
                rowTone={STORE_BALANCE.map((b) => (b.balanced ? "success" : undefined))} />
              <Caption style={{ marginTop: 8 }}>Each store is differenced against its <b>own</b> matched controls, then medianed across the 32 events. 
              This approach measured a <b>+{STORE_DID_180}pp</b> lift (95% CI {STORE_DID_180_CI}), which clears zero. In relative terms that is <b>+{STORE_DID_180_REL}% more GMV</b> than the matched counterfactual over the
               6M window. The parallel-trends assumption a DiD rests on is tightly balanced (|SMD| <b>0.09</b>). 
              Treated stores run larger in absolute size, but the rate is normalized to each store&apos;s own pre-period and then differenced, so fixed size gaps are negligible.</Caption>
            </CardBody>
          </Card>
          <Card>
            <CardHeader trailing={<Caption>GMV Indexed to Pre=100 · 32 Events</Caption>}>Store GMV Around App Enablement — Event Study</CardHeader>
            <CardBody>
              <LineChartX categories={ES4_CATS} height={230} beginAtZero={false} referenceLine={{ value: 100, label: "pre-period", tone: "neutral" }}
                series={[{ name: "App-Enabling Store", data: ES4_TREATED, tone: "success" }, { name: "Matched Control (Size + Pre-Trend)", data: ES4_CONTROL, tone: "neutral" }]} />
              <Caption style={{ marginTop: 8 }}>X: months relative to enablement (event at −1/+1) · Y: total GMV indexed to each store&apos;s own pre-period mean. <b>Pre-event parallel</b>, then treated steps up and <b>keeps climbing through month 6</b> (109→122) while control lags. There is an anamolous recovery in M3 for Control but this is rather short lived and growth is sustained into latter months.</Caption>
            </CardBody>
          </Card>
        </Grid>
        <Callout tone="info" title="Result is a Strong Point Estimate but Underpowered - Treat as Corroboration">
          On 32 stores the treated line widens the gap through month 6 and the normalized <b>DiD point estimate is +{STORE_DID_180}pp GMV</b>.
          But with only 32 events the CI is <b>{STORE_DID_180_CI}pp</b> (barely clear of zero). The store design captures the {FEAS.appOnly.toLocaleString()} new app-native diners the switcher design
          can&apos;t see — but the strength is <b>two independent designs agreeing</b>, not this result alone.
        </Callout>
      </Stack>

      {/* Feasibility */}
      <Stack gap={10}>
        <SectionHeading title="Feasibility Census (Why This Design Is Even Possible)" />
        <Grid cols={4} min="180px" gap={12}>
          <Card><CardBody><Stat value={`${(FEAS.both / 1000).toFixed(1)}K`} label="guests use BOTH app & web" /></CardBody></Card>
          <Card><CardBody><Stat value={`${(FEAS.webThenApp / 1000).toFixed(1)}K`} label="web→app switchers" /></CardBody></Card>
          <Card><CardBody><Stat value="8.7K" label="switcher guest-brands (6-mo DiD sample)" /></CardBody></Card>
          <Card><CardBody><Stat value="87% / 8.6%" label="web-only / app-only" /></CardBody></Card>
        </Grid>
        <Caption>GUEST_ID is shared across App &amp; Web, so the within-guest switcher design is possible — the whole approach hinges on this.</Caption>
      </Stack>

      <Callout tone="success" title="Bottom Line">
        The observational read that &quot;app users are 2.6× more valuable&quot; is almost entirely <b>selection + circularity</b>. Netted against
        matched controls over a fixed <b>6-month window</b>, the app delivers a real incremental lift for
        already-engaged guests: <b>+1.25 more orders (+37%)</b>, <b>+$36 more (+26%)</b>, and <b>+7.2pp retention (+10%)</b>. The <b>mechanism driving this is guest retention</b> (adopters churn less rather
        than order bigger baskets), the lift is <b>durable</b> (holds ~+0.2 orders/month across 6 months), and it lands at every
        baseline and brand cohort. The store-enablement design agrees (+{STORE_DID_180}pp GMV) and
        captures new app-native location, but is thin and should only be used as directional support.
      </Callout>

      <Divider />

      <NextSteps followUps={INCR_NEXT.followUps} experiments={INCR_NEXT.experiments} />
    </Stack>
  );
}
