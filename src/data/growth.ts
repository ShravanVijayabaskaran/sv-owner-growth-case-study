// ============================================================
// GROWTH analysis data — ported from the owner-ramp-and-repeat canvas.
// Source: 03_north_star_and_growth.sql + python/growth_drivers*.py
// Edit any number/label here; the Growth page reads straight from this.
// ============================================================

export type SegKey = "all" | "single_loc" | "multi_loc" | "top_brand";
export const SEG_ORDER: SegKey[] = ["all", "single_loc", "multi_loc", "top_brand"];

export const SEG: Record<SegKey, {
  label: string; short: string;
  nBrands: number; nLoc: number; pctLoc: number; pctGmv: number;
  yoy: number; yoyMean: number; yoyN: number;
  g30: number; mean30: number; n30: number; pctGrow: number;
  note: string;
}> = {
  all:        { label: "All Locations", short: "All", nBrands: 229, nLoc: 292, pctLoc: 100, pctGmv: 100, yoy: 11.7, yoyMean: 17.2, yoyN: 51, g30: 1.80, mean30: 5.40, n30: 289, pctGrow: 73.0, note: "Blended Book Lifted by the Top Brand" },
  single_loc: { label: "Single-Location Brands", short: "Single-Loc", nBrands: 205, nLoc: 205, pctLoc: 70.2, pctGmv: 51.6, yoy: 9.9, yoyMean: 13.3, yoyN: 42, g30: 1.72, mean30: 1.34, n30: 203, pctGrow: 72.9, note: "The 'Typical' Independent Restaurant" },
  multi_loc:  { label: "Multi-Location Brands", short: "Multi-Loc", nBrands: 23, nLoc: 62, pctLoc: 21.2, pctGmv: 24.0, yoy: 5.4, yoyMean: 4.2, yoyN: 4, g30: 1.19, mean30: 1.72, n30: 62, pctGrow: 67.7, note: "Small Multi-Unit Brands (2-8 locations), excl. the Top Brand" },
  top_brand:  { label: "Top Brand", short: "Top Brand", nBrands: 1, nLoc: 25, pctLoc: 8.6, pctGmv: 24.4, yoy: 53.1, yoyMean: 59.7, yoyN: 5, g30: 5.50, mean30: 52.33, n30: 24, pctGrow: 87.5, note: "Owner's Top Brand w/ 25-Locations" },
};

export const CMP_CATS = ["All", "Single-Loc", "Multi-Loc", "Top Brand"];
export const CMP_YOY = [11.7, 9.9, 5.4, 53.1];
export const CMP_YOY_MEAN = [17.2, 13.3, 4.2, 59.7];
export const CMP_30D = [1.80, 1.72, 1.19, 5.50];
export const CMP_30D_MEAN = [5.40, 1.34, 1.72, 52.33];

// National benchmark (USDA Food Expenditure Series)
export const NAT_YEARS = ["2020", "2021", "2022", "2023", "2024", "2025"];
export const NAT_SPEND_T = [1.20, 1.28, 1.33, 1.39, 1.40, 1.41];
export const NAT_CAGR = 3.3;

// Growth attribution (log-additive contribution shares)
export const ATTRIB: Record<SegKey, { gmv: number; levers: { name: string; share: number; geo: number }[] }> = {
  all: { gmv: 2.46, levers: [{ name: "Unique customers", share: 91.7, geo: 2.26 }, { name: "Orders / customer", share: 14.3, geo: 0.35 }, { name: "AOV", share: -6.0, geo: -0.15 }] },
  single_loc: { gmv: 1.13, levers: [{ name: "Unique customers", share: 88.8, geo: 1.01 }, { name: "Orders / customer", share: 25.8, geo: 0.29 }, { name: "AOV", share: -14.6, geo: -0.16 }] },
  multi_loc: { gmv: 1.59, levers: [{ name: "Unique customers", share: 101.0, geo: 1.61 }, { name: "Orders / customer", share: 27.7, geo: 0.44 }, { name: "AOV", share: -28.6, geo: -0.46 }] },
  top_brand: { gmv: 16.94, levers: [{ name: "Unique customers", share: 91.2, geo: 15.45 }, { name: "Orders / customer", share: 3.9, geo: 0.66 }, { name: "AOV", share: 4.9, geo: 0.83 }] },
};

// AOV drill-down: AOV = items/order × price/item (geo %/30d)
export const AOV_DECOMP: Record<SegKey, { aov: number; items: number; price: number }> = {
  all:        { aov: -0.15, items: -0.49, price: 0.35 },
  single_loc: { aov: -0.16, items: -0.48, price: 0.31 },
  multi_loc:  { aov: -0.46, items: -0.75, price: 0.30 },
  top_brand:  { aov: 0.83,  items: 0.02,  price: 0.81 },
};
export const COUPON: Record<SegKey, { early: number; post: number; aovCpn: number; aovNon: number; itemsCpn: number; itemsNon: number }> = {
  all:        { early: 7.7,  post: 8.6, aovCpn: 46.3, aovNon: 45.5, itemsCpn: 3.11, itemsNon: 2.68 },
  single_loc: { early: 8.9,  post: 9.6, aovCpn: 53.2, aovNon: 50.1, itemsCpn: 3.31, itemsNon: 2.77 },
  multi_loc:  { early: 2.9,  post: 7.6, aovCpn: 42.7, aovNon: 43.0, itemsCpn: 2.96, itemsNon: 2.62 },
  top_brand:  { early: 10.7, post: 7.9, aovCpn: 35.4, aovNon: 40.4, itemsCpn: 2.83, itemsNon: 2.58 },
};

// Survivorship (brand-level churn: brand no order within 14d of latest date)
export const RETN: Record<"retained" | "churned", {
  nLoc: number; pctLoc: number; pctGmv: number; tenureDays: number;
  yoyN: number; momN: number;
  yoyMed: number; yoyMean: number; yoyGrow: number; momMed: number; momGrow: number;
}> = {
  // yoyN < momN: the YoY view requires ≥760d tenure, so far fewer locations qualify.
  retained: { nLoc: 194, pctLoc: 66.4, pctGmv: 77.9, tenureDays: 537, yoyN: 41, momN: 194, yoyMed: 12.0, yoyMean: 22.8, yoyGrow: 75.6, momMed: 2.01, momGrow: 81.2 },
  churned:  { nLoc: 98,  pctLoc: 33.6, pctGmv: 22.1, tenureDays: 287, yoyN: 10, momN: 98,  yoyMed: 8.7,  yoyMean: -5.7, yoyGrow: 70.0, momMed: 1.44, momGrow: 61.5 },
};
export const RETN_SEG_CATS = ["Single-Loc", "Multi-Loc", "Top Brand"];
export const RETN_CHURN_BY_SEG = [38.5, 30.6, 0.0];
export const RETN_YOY_BINS = ["≤−20", "−20…0", "0…20", "20…40", "40…60", "60…100", ">100"];
export const RETN_YOY_DIST: Record<"retained" | "churned", number[]> = {
  retained: [12.2, 12.2, 34.1, 9.8, 14.6, 12.2, 4.9],
  churned:  [30.0, 0, 70.0, 0, 0, 0, 0],
};
export const RETN_MOM_BINS = ["≤−15", "−15…−10", "−10…−5", "−5…0", "0…5", "5…10", "10…15", ">15"];
export const RETN_MOM_DIST: Record<"retained" | "churned", number[]> = {
  retained: [0, 0.5, 0.5, 17.8, 60.7, 13.6, 4.2, 2.6],
  churned:  [3.3, 11.0, 7.7, 16.5, 47.3, 7.7, 4.4, 2.2],
};

// Growth drivers (standardized OLS betas; * = p<0.05)
export const DRV_BASELINE = [
  { name: "Baseline Size (GMV/Day)", value: -2.02, sig: true },
  { name: "Top Brand Flag", value: 1.78, sig: true },
  { name: "% In-House Delivery", value: 1.41, sig: false },
  { name: "UTM Coverage", value: -0.97, sig: true },
  { name: "Repeat-Order Share", value: -0.96, sig: true },
  { name: "Onboarding Vintage", value: 0.95, sig: true },
];
export const DRV_LIFECYCLE = [
  { name: "Top Brand Flag", value: 1.27, sig: true },
  { name: "% App Orders", value: 0.96, sig: true },
  { name: "Repeat-Order Share", value: 0.94, sig: false },
  { name: "Onboarding Vintage", value: 0.69, sig: true },
  { name: "Top-Customer Concentration", value: -0.48, sig: false },
  { name: "Lifetime Size (GMV/Day)", value: -0.21, sig: false },
];
export const DRV_SCALE = 2.4;

// ---- Page framing: summary (top), per-result methodology, next steps (bottom) ----
export const GROWTH_SUMMARY = {
  takeaways: [
    "The typical Owner location grows ~12% per year (median) with 73% of locations observing positive growth, several times the ~3%/Y US restaurant market trend, though channel-shift and survivorship could be inflating the gap.",
    "This growth is primarily driven by guest acquisition while order/guest and AOV were not as influential. Across multi-location brands, AOV actually looks to be a growth headwind.",
    "Owner's top brand saw outsized growth many multiples higher than its piers (53.1% vs 11.7%) which skewed any mean based calculation. Single-location brands grew at a greater rate than multi-location brands across the rolling MoM result.",
    "Roughly 2/3 Owner locations are retained, however, locations that churn observe lower growth rates than those that stick around.",
    "Leveraging EMOB location features we were unable to reasonably predict a locations liklihood to grow however more data could improve model accuracy",
  ],
  approach:
    "Per-location GMV growth on an onboarding-relative clock (each location its own control), compounded geometrically within a location and summarized by the median across locations. Cut by brand cohort, split by brand-level retention to confront survivorship, and probed with a driver regression across both predictive baseline features and retroactive lifecycle descriptors.",
};

// Per-location 30-day GMV growth by onboarding window (W1–W6, cut at W6).
// One obs per (location, W) = LN(GMV_W / GMV_{W-1}), aggregated across locations.
// Source: 03_north_star_and_growth.sql (Q1b engine), OWNER_CASE_CLEAN, GMV>0.
export const STEP_CATS = ["M1", "M2", "M3", "M4", "M5", "M6"];
export const STEP_MEDIAN = [32.19, 5.84, 5.66, 3.05, 4.52, 2.03];
export const STEP_GEO = [65.77, 12.69, 5.14, 0.21, 7.03, -0.24];
export const STEP_N = [287, 280, 279, 273, 266, 260];
export const STEP_POSTRAMP_MEDIAN = 1.8;

export const GROWTH_METHOD = {
  headline: {
    approach:
      "For each location, GMV is bucketed into fixed 30-day windows relative to a locations first order with the first 30 days dropped to allow for onboarding ramp. Growth is then calculated geometrically to account for compounding. The YoY view uses a CAGR over locations with ≥760 days while the rolling view uses post-ramp 30-day rates.",
    caveats:
      "There is no non-Owner or pre-Owner counterfactual so we cannot draw any causal conclusions. The YoY view only includes locations surviving for 760+ days which is likely to artificially inflate some results as well.",
  },
  benchmark: {
    approach:
      "Owner's per-location median tenure-YoY growth is placed against US total restaurant spend from the USDA Food Expenditure Series across the same time horizone. We've summarized the broader market trend as a compound annual growth rate that we can use to check whether Owner locations are growing faster than the broader industry average.",
    caveats:
      "The USDA line is broad national all-restaurant spend which may not be a representative benchmark for Owner's own customer base. Also Owner's growth figure could be inflated by survivorship bias.",
  },
  attribution: {
    approach:
      "GMV growth is split log-additively into unique customers × orders/customer × AOV (the three shares sum to 100%); AOV is then split into items/order × price/item using the same approach.",
    caveats:
      "The results GMV base is the geometric mean across locations which could be susceptible to outliers skewing results.",
  },
  survivorship: {
    approach:
      "Locations are split into retained vs churned by brand-level activity (the brand placed an order within 14 days of the latest date). Growth is measured over each location's own tenure with the same YoY / 30-day approaches while distributions are normalized to % of each cohort so each cohort is directly comparable.",
    caveats:
      "We are assuming churn based off of brand inactivity since we don't have definitive Owner account data. Also the YoY metric is subject to very small sample sizes across certain cohorts when we begin to breakout the results.",
  },
  drivers: {
    approach:
      "OLS of post-ramp 30-day growth on standardized features with brand-clustered SEs and a cross-validated R². Baseline features are measured in the first 60 days while lifecycle features span the enture tenure of a location.",
    caveats:
      "Baseline out-of-sample fit is modest and noisy (CV R² ≈ 0.18) while the lifecycle features are more descriptive as they overlap with the measurement window.",
  },
};

export const GROWTH_NEXT = {
  followUps: [
    "Collect pre-Owner data from customers in order to build a more causal understanding of platform growth.",
    "Deep dive on AOV impact to understand opportunities to improve product impact via basket analytics and optimization.",
    "Enrich the driver model with additional features like cuisine, conversion, geography, local competition, marketing spend, menu breadth, operator tenure, etc. since the order data alone is not very predictive of growth.",
    "Deep-dive cost side of profitability equation to understand opportunities to improve profitability via cost optimization and efficiency gains.",
  ],
  experiments: [
    "Geo or store-level holdout on a specific growth lever (loyalty prompts, re-order nudges, coupons,etc.) to move a result from directional to causal effect.",
    "Structured-onboarding A/B to test whether an improved first-30-day experience lifts the customer-acquisition curve that drives most growth.",
  ],
};
87