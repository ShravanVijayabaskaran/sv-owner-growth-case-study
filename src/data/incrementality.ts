// ============================================================
// APP INCREMENTALITY data — ported from the owner-app-incrementality canvas.
// Source: 04_app_incrementality.sql (panels) + python/app_incrementality*.py
// (CEM matched DiD + guest-clustered bootstrap CIs + WLS cross-check).
// ============================================================

export const FEAS = { totalGuests: 693354, webOnly: 603075, appOnly: 59617, both: 30662, webThenApp: 26283, pre2post2: 9814 };

export const NAIVE = {
  adopter: { n: 90279, orders: 4.68, gmv: 191, repeat: 61.3, aov: 45.02 },
  web: { n: 603075, orders: 1.79, gmv: 85, repeat: 25.7, aov: 50.18 },
};
export const NAIVE_ORDERS_LIFT = 161;
export const NAIVE_GMV_LIFT = 125;

export const PEN_CATS = ["None", "Low <15%", "Mid 15-30%", "High 30%+"];
export const PEN_LOCS = [63, 71, 89, 69];
export const PEN_GROWTH = [1.54, 1.62, 1.75, 3.66];

export const BALANCE: [string, string, string][] = [
  ["Order Frequency (Orders / 30D)", "4.01", "3.90"],
  ["Pre-Period GMV (Total $)", "$180.68", "$179.56"],
  ["Velocity (Days to Reach K Orders)", "110.9", "113.0"],
];

export type OutcomeKey = "freq" | "gmv" | "retention";
export const OUTCOME_ORDER: OutcomeKey[] = ["freq", "gmv", "retention"];
export const OUTCOME: Record<OutcomeKey, {
  short: string; chartTitle: string; cats: string[]; sw: number[]; ct: number[];
  prefix: string; suffix: string; effect: string; effectLabel: string; yLabel: string; note: string;
}> = {
  freq: {
    short: "Order Frequency",
    chartTitle: "Orders per Guest in the 6-Month Window",
    cats: ["Orders in 180 Days"],
    sw: [4.68], ct: [3.43], prefix: "", suffix: "",
    effect: "+1.25", effectLabel: "more orders per guest over 6 months post app adoption (+37%)",
    yLabel: "orders in the fixed 180-day app adoption (mean per guest)",
    note: "Switchers place 4.68 orders vs 3.43 for matched controls: +1.25 incremental orders per guest (+37%) with a 95% CI at [+1.13, +1.39].",
  },
  gmv: {
    short: "Total GMV",
    chartTitle: "GMV per Guest in the 6-Month Window",
    cats: ["GMV in 180 Days"],
    sw: [176.04], ct: [140.22], prefix: "$", suffix: "",
    effect: "+$36", effectLabel: "more GMV per guest over 6 months post app adoption (+26%)",
    yLabel: "GMV ($) in the fixed 180-day post app adoption (mean per guest)",
    note: "Switchers spend $176.04 vs $140.22 for matched controls: +$35.82 incremental GMV per guest (+26%) with a 95% CI at [+$31.0, +$40.6].",
  },
  retention: {
    short: "6-Month Retention",
    chartTitle: "Share Still Active Within 6 Months",
    cats: ["Active Within 180 Days"],
    sw: [80.1], ct: [73.0], prefix: "", suffix: "%",
    effect: "+7.2pp", effectLabel: "more likely to still be ordering within 6 months post app adoption",
    yLabel: "% of guest with any repeat orders within the 180 days post app adoption",
    note: "80.1% of switchers place at least one more order within 6 months of app adoption vs 73.0% of matched controls — +7.16pp with a 95% CI [+6.3, +8.1]. This is the mechanism behind the extra orders and dollars as fewer adopters drop to zero and this gap only widens deeper into the window — in months 4–6 switchers lead 57.5% vs 47.3% (+10.2pp, CI [+9.1, +11.3]).",
  },
};

export const LADDER: { rung: string; design: string; reads: string; strength: string; tone?: "info" | "success" | "warning" }[] = [
  { rung: "Q1 naive", design: "App-adopter vs web-only guest", reads: "+161% orders", strength: "Biased ceiling" },
  { rung: "Q2 penetration", design: "Store app-penetration vs growth", reads: "+1.5%→+3.7%", strength: "Confounded / descriptive" },
  { rung: "Q3 guest DiD", design: "Switcher fixed-window + CEM control", reads: "+1.25 orders / +$36", strength: "PRIMARY", tone: "info" },
  { rung: "Q3c retention", design: "Switcher vs control active within 6mo", reads: "+7.2pp", strength: "Primary (mechanism)", tone: "success" },
  { rung: "Q4 store DiD", design: "Enablement pre/post, control matched on size + pre-trend", reads: "+8.7pp GMV", strength: "Corroborating (thin N)", tone: "success" },
  { rung: "Q5 by baseline", design: "Post orders split by prior engagement", reads: "+0.75 → +1.02 orders", strength: "Effect-modifier", tone: "warning" },
  { rung: "Q7 by brand cohort", design: "Post orders matched within segment", reads: "+1.02 → +1.75 orders", strength: "Effect-modifier", tone: "warning" },
];

// K-strata (incremental orders by pre-period order count)
export const K_CATS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11+"];
export const K_DIFF_ORD = [0.95, 1.12, 1.28, 1.12, 0.92, 1.07, 1.19, 0.29, 1.97, 4.13];
export const K_N = [3443, 1761, 1016, 666, 434, 299, 238, 137, 135, 551];

// Baseline pace tertiles
export const PROP_CATS = ["T1 Occasional", "T2 Regular", "T3 Frequent"];
export const PROP_DEFS = ["< 1.0 / 30D", "1.0–2.5 / 30D", "> 2.5 / 30D"];
export const PROP_N = [2601, 2944, 3135];
export const PROP_SW_ORD = [2.87, 4.54, 6.32];
export const PROP_CT_ORD = [2.13, 3.52, 5.30];
export const PROP_DIFF_ORD = [0.75, 1.02, 1.02];
export const PROP_REL = [35, 29, 19];

// Cohort split (matched within segment)
export const COHORT_CATS = ["Single-Location", "Multi-Location", "Top Brand"];
export const COHORT_SW = [3362, 2741, 2576];
export const COHORT_DIFF_ORD = [1.02, 1.22, 1.75];
export const COHORT_DIFF_GMV = [30.09, 39.65, 52.53];
export const COHORT_RET_PP = [5.7, 6.7, 11.5];
export const COHORT_REL_ORD = [30, 33, 61];
export const COHORT_REL_GMV = [21, 26, 53];
export const COHORT_REL_RET = [8, 9, 17];
export const COHORT_ORD_CI: [number, number][] = [[0.81, 1.25], [0.99, 1.46], [1.51, 2.00]];
export const WHALE_VS_SINGLE = { ord: "+0.73 [0.39, 1.04]", gmv: "+$22 [10, 34]", ret: "+5.8pp [3.6, 7.9]" };

// Store enablement DiD
export const STORE_ADOPT_GMV = 15.8;
export const STORE_CTRL_GMV = 10.3;
export const STORE_DID = 4.2;
export const STORE_DID_180 = 8.7;
export const STORE_DID_180_CI = "[+0.9, +17.2]";
export const STORE_DID_90_CI = "[−2.4, +13.5]";
// Numeric CI bounds (pp) for the paired-median DiD interval plot
export const STORE_DID_180_LO = 0.9, STORE_DID_180_HI = 17.2;
export const STORE_DID_90_LO = -2.4, STORE_DID_90_HI = 13.5;
// Relative lift: per-event (1+treated_rate)/(1+control_rate)-1, median across the
// 32 events (paired, same construction as the DiD). Denominator = counterfactual GMV.
export const STORE_DID_180_REL = 8.6;
export const STORE_DID_180_REL_CI = "[+0.8, +15.5]";

// Pre-enablement balance: 32 treated events vs their matched controls (from
// app_incrementality_store.py matching). |SMD| shown raw (pre-match) -> matched.
// Pre-trend is the parallel-trends assumption a DiD rests on and is tightly
// balanced; absolute size runs larger for treated but is differenced out by the
// per-store normalized rate, so it does not bias the DiD.
export const STORE_BALANCE: { feat: string; treated: string; control: string; smd: string; balanced?: boolean }[] = [
  { feat: "Pre-Trend (Late/Early GMV)", treated: "1.04×", control: "1.06×", smd: "0.30 → 0.09", balanced: true },
  { feat: "Pre-Period Orders (Size)", treated: "779", control: "602", smd: "0.46 → 0.40" },
  { feat: "Pre-Period GMV", treated: "$37.8K", control: "$29.4K", smd: "0.39 → 0.37" },
];
export const ES4_CATS = ["−3", "−2", "−1", "+1", "+2", "+3", "+4", "+5", "+6"];
export const ES4_TREATED = [99.7, 99.5, 100.8, 108.8, 111.2, 110.6, 119.0, 121.8, 120.8];
export const ES4_CONTROL = [99.2, 99.9, 103.4, 102.6, 104.1, 113.0, 109.2, 110.2, 114.0];

// Rung-3 trajectory (ordering pace from the K-th order)
export const R3_ANCHOR = 1.0;
export const R3_PRE_ORDERS = 4.4;
export const ES3_CATS = ["K-th order", "0–30d", "30–60d", "60–90d", "90–120d", "120–150d", "150–180d"];
export const ES3_TREATED = [R3_ANCHOR, 1.023, 0.907, 0.791, 0.730, 0.645, 0.585];
export const ES3_CONTROL = [R3_ANCHOR, 0.805, 0.677, 0.575, 0.516, 0.448, 0.406];
export const R3_180 = { swOrd: 4.68, ctOrd: 3.43, swGmv: 176.04, ctGmv: 140.22, swRet: 57.5, ctRet: 47.3 };

// ---- Page framing: summary (top), per-approach methodology, next steps (bottom) ----
export const INCR_SUMMARY = {
  takeaways: [
    "Guests that adopt the app spend 26% more in the 6 months folllowing when compared against a matched control.",
    "The mechanism driving this result is retention, where adopters are 9.69% less likely to churn away from the brand in the analysis window.",
    "App adoption drives growth across all guest cohorts, irrespective of their pre adoption behavior however we observe the largest lift for lower volume occasional diners.",
    "The lift grows with brand sophistication where the top brand again materially outperforms counterparts; an independent store-enablement DiD agrees (+8.7pp GMV) but is thin (32 events).",
  ],
  approach:
    "We separate observational reads (biased by who self-selects into the app) from designed measurement. The primary design is a within-guest 'switcher' difference-in-differences with coarsened-exact-matched controls over a fixed 6-month window; a store-enablement DiD corroborates. Every outcome is TOTAL value across channels, and every headline carries a guest-clustered bootstrap CI plus a regression cross-check.",
};

export const INCR_METHOD = {
  observational: {
    approach:
      "The naive read compares lifetime per-guest orders / GMV / repeat rate for app adopters vs web-only guests. The penetration read buckets stores by lifetime app-penetration and compares their median 30-day GMV growth.",
    caveats:
      "Both are confounded by selection — motivated, loyal, larger, savvier guests and stores adopt the app. The naive read also has circularity: an app order is itself an extra order, and it counts app-channel volume. Treat as a biased ceiling, not impact.",
  },
  guestDiD: {
    approach:
      "A 'switcher' has a web-only pre-period that consists of at least two orders then adopts the app; controls are never-adopting web-only guests, matched via coarsened exact matching on k × pre-GMV quintile × pre-velocity quintile (after a within-k p99 trim). Because the arms are balanced pre-period, the mean post-period gap over a fixed 180-day window is the effect, reported in real orders and dollars. Inference is a guest-clustered bootstrap 95% CI (2,000 draws) plus a CEM-weighted WLS with cluster-robust SEs.",
    caveats:
      "No randomization, so unobserved selection bias could remain — result should be interpreted asdirectional and not a clean ATE. The fixed window deliberately keeps churners (0 post-orders allowed). It structurally excludes the ~60K app-only diners with no web pre-period (the store design captures those).",
  },
  store: {
    approach:
      "Enablement events (a store's first app order after ≥90d web-only) are matched to never-app control stores on pre-period size AND pre-trend (slope). We take a paired-median difference-in-differences on the per-30-day GMV rate over 6 months, with event-clustered bootstrap CIs, and index each store to its own pre-period (=100) for the event study.",
    caveats:
      "Thin — 32 events. The 6-month CI barely excludes zero and the 90-day version includes zero. Corroborating weight only; the real strength is two independent designs agreeing.",
  },
};

export const INCR_NEXT = {
  followUps: [
    "Observe impact of adoption over longer time horizon to understand lifetime impact on guest engagement.",
    "Explore different definitions of retention that are aligned with customer goals (active-within-6mo vs still-active in months 4–6).",
    "Enrich guest data and build app adoption propensity model to support matching in order to draw closer towards a causal estimate.",
    "Grow the store level measurement with greater sample as more enablement events mature past 6 months, to tighten the currently-wide CI.",
  ],
  experiments: [
    "Build a randomized Brand AB with a~10% holdout (pending power analysis) of locations we don't offer the app towards and measure all the other stores against this baseline.", 
    "Approach is lower powered than a guest level experiment but avoids the poor customer experience where not all guests are able to access their app.",
    "A small holdout group would allow us to measure the impact of the app without stunting growth for the entire customer base.",
    "Additional Guest ABs across within app levers (i.e. loyalty, notifications, etc.) to understand what aspects of the app are most impactful and how we can optimize the experiene for future growth.",
  ],
};
