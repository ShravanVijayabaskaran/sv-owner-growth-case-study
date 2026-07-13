"use client";
import { useState } from "react";
import { Stack, Grid, Card, CardHeader, CardBody, Callout, Stat, SectionHeading, Eyebrow, H1, Lead, Caption, Divider } from "@/components/ui";
import { BarChartX, LineChartX, DivergingBars } from "@/components/charts";
import { Toggle } from "@/components/Toggle";
import { AnalysisSummary, Methodology, NextSteps } from "@/components/sections";
import {
  SEG, SEG_ORDER, type SegKey, CMP_CATS, CMP_YOY, CMP_YOY_MEAN, CMP_30D, CMP_30D_MEAN,
  NAT_YEARS, NAT_SPEND_T, NAT_CAGR, ATTRIB, AOV_DECOMP, COUPON,
  RETN, RETN_SEG_CATS, RETN_CHURN_BY_SEG, RETN_YOY_BINS, RETN_YOY_DIST, RETN_MOM_BINS, RETN_MOM_DIST,
  DRV_BASELINE, DRV_LIFECYCLE, DRV_SCALE,
  GROWTH_SUMMARY, GROWTH_METHOD, GROWTH_NEXT,
  STEP_CATS, STEP_MEDIAN, STEP_GEO, STEP_N, STEP_POSTRAMP_MEDIAN,
} from "@/data/growth";

// Per-location rolling-30d and tenure-YoY distributions per segment (Q1b/YoY engines)
const HIST_BINS = ["≤−15", "−15…−10", "−10…−5", "−5…0", "0…5", "5…10", "10…15", ">15"];
const HIST_30D: Record<SegKey, number[]> = {
  all: [3, 11, 8, 50, 159, 33, 12, 9], single_loc: [3, 9, 8, 35, 117, 21, 5, 7],
  multi_loc: [0, 2, 0, 14, 34, 5, 2, 1], top_brand: [0, 0, 0, 1, 8, 7, 5, 1],
};
const HIST_YOY_BINS = ["≤−20", "−20…0", "0…20", "20…40", "40…60", "60…100", ">100"];
const HIST_YOY: Record<SegKey, number[]> = {
  all: [9, 5, 21, 4, 6, 5, 2], single_loc: [9, 4, 18, 3, 4, 3, 2],
  multi_loc: [0, 1, 3, 0, 0, 0, 0], top_brand: [0, 0, 0, 1, 2, 2, 0],
};

export default function Growth() {
  const [seg, setSeg] = useState<SegKey>("all");
  const [dist, setDist] = useState<"mom" | "yoy">("mom");
  const [retnDist, setRetnDist] = useState<"mom" | "yoy">("mom");
  const s = SEG[seg];
  const isYoY = dist === "yoy";
  const distBins = isYoY ? HIST_YOY_BINS : HIST_BINS;
  const distData = isYoY ? HIST_YOY[seg] : HIST_30D[seg];
  const distN = distData.reduce((a, b) => a + b, 0);

  const yoyN = SEG_ORDER.map((k) => SEG[k].yoyN);
  const g30N = SEG_ORDER.map((k) => SEG[k].n30);
  const segN = [SEG.single_loc.nLoc, SEG.multi_loc.nLoc, SEG.top_brand.nLoc];

  const retIsYoY = retnDist === "yoy";
  const retBins = retIsYoY ? RETN_YOY_BINS : RETN_MOM_BINS;
  const retDist = retIsYoY ? RETN_YOY_DIST : RETN_MOM_DIST;
  const retNRet = retIsYoY ? RETN.retained.yoyN : RETN.retained.momN;
  const retNChn = retIsYoY ? RETN.churned.yoyN : RETN.churned.momN;

  const aovRows = [
    { name: "AOV", value: AOV_DECOMP[seg].aov, strong: true },
    { name: "Items / order", value: AOV_DECOMP[seg].items },
    { name: "Price / item", value: AOV_DECOMP[seg].price },
  ];

  const stepChart = (
    <>
      <LineChartX categories={STEP_CATS} valueSuffix="%" beginAtZero={false} height={240}
        series={[
          { name: "Median across locations", data: STEP_MEDIAN, tone: "info", n: STEP_N },
          { name: "Geometric mean across locations", data: STEP_GEO, tone: "neutral", n: STEP_N },
        ]}
        referenceLine={{ value: STEP_POSTRAMP_MEDIAN, label: `Post-ramp median +${STEP_POSTRAMP_MEDIAN}%`, tone: "success" }} />
      <Caption style={{ marginTop: 8 }}>
        Y-axis plots the 30-day growth across the first 6 months in the location's lifecycle (M1–M6). The first transition (M0→M1)
        is pure onboarding ramp as locations slowly transition their existing volume over to the platform. If we included this window we would 
        greatly skews our results so instead we ignore the first 30D of a location's data prior to measuring its growth.
      </Caption>
    </>
  );

  return (
    <Stack gap={32}>
      <Stack gap={12}>
        <Eyebrow>Does Owner drive growth?</Eyebrow>
        <H1>Per-Location GMV Growth Analysis</H1>
        <Lead>
          Measures MoM/YoY GMV Growth for Each Tenure Qualified Location
        </Lead>
      </Stack>

      <AnalysisSummary takeaways={GROWTH_SUMMARY.takeaways} approach={GROWTH_SUMMARY.approach} />

      <Stack gap={14}>
        <SectionHeading title="Topline Result by Segment" sub="Single-location brands grew faster than their multi-location counterparts however Owner's top brand outperforms all other locations by ~5x." />
        <Methodology approach={GROWTH_METHOD.headline.approach} caveats={GROWTH_METHOD.headline.caveats}
          chart={stepChart} chartLabel="Show Growth-by-Window Trend (M1–M6)" />
        <Grid cols={2} min="360px" gap={16}>
          <Card>
            <CardHeader>Tenure YoY Growth (Median &amp; Mean CAGR)</CardHeader>
            <CardBody>
              <BarChartX categories={CMP_CATS} valueSuffix="%" showValues height={230}
                series={[{ name: "Median (Headline)", data: CMP_YOY, tone: "success", n: yoyN }, { name: "Mean", data: CMP_YOY_MEAN, tone: "neutral", n: yoyN }]} />
              <Caption style={{ marginTop: 6 }}>The typical Owner location grew ~12% YoY with Owner's Top Brand outperforming all other cohorts by ~5x.</Caption>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>Rolling 30D Growth (Median &amp; Mean)</CardHeader>
            <CardBody>
              <BarChartX categories={CMP_CATS} valueSuffix="%" showValues height={230}
                series={[{ name: "Median (Headline)", data: CMP_30D, tone: "success", n: g30N }, { name: "Mean", data: CMP_30D_MEAN, tone: "neutral", n: g30N }]} />
              <Caption style={{ marginTop: 6 }}> The typical Owner location grows 1.8% MoM (~24% YoY) with Owner's Top Brand once again outperforming all other cohorts substantially.</Caption>
            </CardBody>
          </Card>
        </Grid>
      </Stack>

      <Stack gap={14}>
        <SectionHeading title="Owner Locations vs US Restaurant Spend" sub="When benchmarking Owner per-location median YoY GMV growth against the national total restaurant spend growth, Owner comfortably outperforms the broader market across all segments." />
        <Methodology approach={GROWTH_METHOD.benchmark.approach} caveats={GROWTH_METHOD.benchmark.caveats} />
        <Grid cols={2} min="360px" gap={16}>
          <Card>
            <CardHeader trailing={<Caption>Source: USDA Food Expenditure Series</Caption>}>US Restaurant Spend ($T)</CardHeader>
            <CardBody>
              <LineChartX categories={NAT_YEARS} valuePrefix="$" valueSuffix="T" beginAtZero={false} height={210}
                series={[{ name: "US Restaurant Spend", data: NAT_SPEND_T, tone: "neutral" }]} />
              <Caption style={{ marginTop: 8 }}>The US total restaurant spend has grown at a rate of~{NAT_CAGR}%/yr between 2020 and 2025, decelerating to &lt;1% since 2024.</Caption>
            </CardBody>
          </Card>
          <Card>
            <CardHeader trailing={<Caption>vs US ~{NAT_CAGR}%/Y</Caption>}>Owner Per-Location Median YoY Growth by Segment</CardHeader>
            <CardBody>
              <BarChartX categories={CMP_CATS} valueSuffix="%" showValues height={210}
                series={[{ name: "Owner median YoY", data: CMP_YOY, tone: "info", n: yoyN }]}
                referenceLine={{ value: NAT_CAGR, label: `US ~${NAT_CAGR}%`, tone: "warning" }} />
              <Caption style={{ marginTop: 8 }}>Every segment comfortably clears the national average while the typical Owner location grows ~3× the market rate (could be skewed by channel-shift + survivorship).</Caption>
            </CardBody>
          </Card>
        </Grid>
      </Stack>

      <Divider />

      {/* Explore a segment */}
      <Stack gap={14}>
        <SectionHeading title="Explore a Segment" sub="Toggle a Cohort to See its Growth and What Drives that Result" />
        <Methodology approach={GROWTH_METHOD.attribution.approach} caveats={GROWTH_METHOD.attribution.caveats} />
        <Toggle options={SEG_ORDER.map((k) => ({ key: k, label: SEG[k].short }))} value={seg} onChange={setSeg} />

        <Callout tone={seg === "top_brand" ? "warning" : "info"} title={s.label}>
          {s.note} ({s.nBrands.toLocaleString()} brand{s.nBrands === 1 ? "" : "s"} · {s.nLoc} locations · {s.pctGmv}% of GMV)
        </Callout>

        <Grid cols={3} min="200px" gap={14}>
          <Card><CardBody><Stat value={`+${s.yoy}%`} label={`Tenure YoY (Median) · Mean +${s.yoyMean}% · n=${s.yoyN}`} tone="success" /></CardBody></Card>
          <Card><CardBody><Stat value={`+${s.g30}%`} label={`Rolling 30D (Median) · Mean +${s.mean30}% · n=${s.n30}`} tone="success" /></CardBody></Card>
          <Card><CardBody><Stat value={`${s.pctGrow}%`} label="Locations Growing (30D)" /></CardBody></Card>
        </Grid>

        <Card>
          <CardHeader trailing={<Toggle options={[{ key: "mom", label: "30-day" }, { key: "yoy", label: "YoY" }]} value={dist} onChange={setDist} />}>
            Distribution of {isYoY ? "Tenure YoY" : "30-Day"} Growth - {s.short}
          </CardHeader>
          <CardBody>
            <BarChartX categories={distBins} showValues height={220}
              series={[{ name: `${s.short} Locations`, data: distData, tone: seg === "top_brand" ? "warning" : "info", n: distBins.map(() => distN) }]} />
            <Caption style={{ marginTop: 6 }}>
              {isYoY
                ? <># locations by per-location geometric tenure YoY CAGR (%). Smaller sample — survivors ≥760d, day-30 clock (n={distN}). Wider & right-shifted (annual compounding). Median +{s.yoy}%.</>
                : <># locations by per-location geometric 30-day growth (%). Post-ramp, n={distN}. {s.pctGrow}% sit above zero; median +{s.g30}%.</>}
            </Caption>
          </CardBody>
        </Card>

        <Grid cols={2} min="360px" gap={16}>
          <Card>
            <CardHeader trailing={<Caption>GMV +{ATTRIB[seg].gmv}%/30d · geo mean</Caption>}>Growth Attribution (Contribution Share)</CardHeader>
            <CardBody>
              <DivergingBars rows={ATTRIB[seg].levers.map((l) => ({ name: l.name, value: l.share }))} decimals={1} valueSuffix="%" labelWidth={130}
                legend={{ pos: "adds to growth", neg: "drag" }} />
              <Caption style={{ marginTop: 10 }}>
                Growth is a customer-count story in every segment driving ~90%+ of the entire impact across all segments; AOV is a small drag overall (−6%) and a larger one for multi-loc (−28.6%).</Caption>
            </CardBody>
          </Card>
          <Card>
            <CardHeader trailing={<Caption>AOV = Items/Order × Price/Item</Caption>}>AOV Drill-Down (Basket Size or Price per Item)</CardHeader>
            <CardBody>
              <DivergingBars rows={aovRows} decimals={2} valueSuffix="%" labelWidth={96} legend={{ pos: "lifts AOV", neg: "drags AOV" }} />
              <Caption style={{ marginTop: 10 }}>
                The main AOV downbar stems from <b>multi-loc</b> brands experiencing a decrease in the size of each order, not lower unit prices.
              </Caption>
            </CardBody>
          </Card>
        </Grid>
      </Stack>

      <Divider />

      {/* Survivorship */}
      <Stack gap={14}>
        <SectionHeading title="Survivorship Check (Churned vs Retained)" sub="Churn is defined at the brand level where retained = the location's brand has at least one order within 14D of the last date in the data. Growth is measured over each location's own tenure." />
        <Methodology approach={GROWTH_METHOD.survivorship.approach} caveats={GROWTH_METHOD.survivorship.caveats} />
        <Callout tone="warning" title="A Third of Locations Churned and Slower Growth is a Leading Indicator">
          <b>{RETN.churned.nLoc} of {RETN.churned.nLoc + RETN.retained.nLoc} locations ({RETN.churned.pctLoc}%)</b> belong to brands that look to have churned before the last date in the data. These brands however, 
            hold only <b>{RETN.churned.pctGmv}% of GMV</b>. Growth looks like one of the North Star conditions for retention as we see a material difference in growth rates between the two groups.
        </Callout>
        <Grid cols={2} min="360px" gap={16}>
          <Card>
            <CardHeader>Growth Before Churn (Median by Cohort)</CardHeader>
            <CardBody>
              <BarChartX categories={["Tenure YoY", "Rolling 30D"]} valueSuffix="%" showValues height={220}
                series={[
                  { name: "Retained", data: [RETN.retained.yoyMed, RETN.retained.momMed], tone: "success", n: [RETN.retained.yoyN, RETN.retained.momN] },
                  { name: "Churned", data: [RETN.churned.yoyMed, RETN.churned.momMed], tone: "danger", n: [RETN.churned.yoyN, RETN.churned.momN] },
                ]} />
              <Caption style={{ marginTop: 6 }}>
                Churned grew over 25% less than Retained locations YoY (+{RETN.churned.yoyMed}% vs +{RETN.retained.yoyMed}%) and underperformed by ~30% MoM (+{RETN.churned.momMed}% vs +{RETN.retained.momMed}%); with only {RETN.churned.momGrow}% growing vs {RETN.retained.momGrow}%.
              </Caption>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>Churn Rate by Brand Segment</CardHeader>
            <CardBody>
              <BarChartX categories={RETN_SEG_CATS} valueSuffix="%" showValues height={220}
                series={[{ name: "% Churned", data: RETN_CHURN_BY_SEG, tone: "warning", n: segN }]} />
              <Caption style={{ marginTop: 6 }}>
                Churn rate is highest amongst independent single-location brands ({RETN_CHURN_BY_SEG[0]}%), while the top brand retained <b>100%</b> of its 25 locations.
              </Caption>
            </CardBody>
          </Card>
        </Grid>
        <Card>
          <CardHeader trailing={<Toggle options={[{ key: "mom", label: "30-day" }, { key: "yoy", label: "YoY" }]} value={retnDist} onChange={setRetnDist} />}>
            Growth Distribution (Churned vs Retained)
          </CardHeader>
          <CardBody>
            <LineChartX
              categories={retBins}
              valueSuffix="%" fill height={240}
              series={[
                { name: "Retained", data: retDist.retained, tone: "success", n: retBins.map(() => retNRet) },
                { name: "Churned", data: retDist.churned, tone: "danger", n: retBins.map(() => retNChn) },
              ]} />
            <Caption style={{ marginTop: 6 }}>
               {retnDist === "yoy"
                ? <>The churned cohort doesn't have any locations growing above +20% while retained cohorts have a much larger right tail.</>
                : <>The chruned cohort skews towards the left as ~39% of these locations experience flat/declining compared to only ~19% of the retained cohort.</>}
            </Caption>
          </CardBody>
        </Card>
      </Stack>

      <Divider />

      {/* Drivers */}
      <Stack gap={14}>
        <SectionHeading title="What Predicts Whether a Location Grows with Owner?" sub="Built a regression model using both predictive and descriptive features in an attempt to predict customer traits associated with outsized growth" />
        <Methodology approach={GROWTH_METHOD.drivers.approach} caveats={GROWTH_METHOD.drivers.caveats} />
        <Callout tone="warning" title="Honest Answer: a Store's Early Profile Cannot Reasonably Predict its Growth">
          <b>25% of locations decline</b> post-ramp but baseline features explain only a modest, noisy share of
          what drives growth. The strongest generalizable signals are small baseline GMV
          and being the <b>top brand</b> while the rest is noise. The order level data alone is not enough to build a reasonable predictive model. That being said, our desriptive model identified % App Order and Repeat-Order Share as correlated with larger growth rates however this model is more descriptive in nature.
        </Callout>
        <Grid cols={2} min="360px" gap={16}>
          <Card>
            <CardHeader trailing={<Caption>OLS R²=0.33 · CV R²≈0.18</Caption>}>Baseline Drivers (Causal-Leaning)</CardHeader>
            <CardBody>
              <DivergingBars rows={DRV_BASELINE} scale={DRV_SCALE} decimals={2} showStar labelWidth={156} legend={{ pos: "adds", neg: "drags" }} />
              <Caption style={{ marginTop: 8 }}>Of the baseline features, baseline GMV size is a driver of growth however this is likely because a smaller ABS shift in GMV on a small baseline would drive a higher proportional growth rate. Additionally, onboarding vintage presents itself across both regressions, suggesting that could be some macro trends influencing growth for Owner customers.</Caption>
            </CardBody>
          </Card>
          <Card>
            <CardHeader trailing={<Caption>CV R²≈0.12</Caption>}>Lifecycle Correlates (Observational)</CardHeader>
            <CardBody>
              <DivergingBars rows={DRV_LIFECYCLE} scale={DRV_SCALE} decimals={2} showStar labelWidth={156} legend={{ pos: "adds", neg: "drags" }} />
              <Caption style={{ marginTop: 8 }}>The most meaningful features correlated with growth are % App Orders and Repeat Order Share, both of which suggest the app could be driving real incremental value. The top brand flag came back positive as well but is ultimately unhelpful as we look to more strategically onboard new customers or prevent existing brands from churning.</Caption>
            </CardBody>
          </Card>
        </Grid>
        <Callout tone="info" title="No Influential Feature Overlaps (Interactions Tested)">
          After testing 28 pairwise interactions among substantive baseline features. Adding them lowered out-of-sample fit,
          and <b>no synergistic combination of features strengthened predictability</b>.
        </Callout>
      </Stack>

      <Divider />

      <NextSteps followUps={GROWTH_NEXT.followUps} experiments={GROWTH_NEXT.experiments} />
    </Stack>
  );
}
