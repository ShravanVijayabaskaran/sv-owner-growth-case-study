// ============================================================
// DATA EXPLORATION & QUALITY — from 01_profiling_and_dq.sql + 02_data_quality.sql
// ============================================================

export const COVERAGE = {
  totalRows: 1_514_681,
  distinctOrders: 1_514_681,
  brands: 232,
  locations: 295,
  guests: 698_026,
  dateStart: "2020-05-18",
  dateEnd: "2025-07-29",
  gmvMin: -5.0, gmvMax: 2851.42, gmvAvg: 45.44,
};

// Channel / fulfillment mix (orders)
export const ORDER_SOURCE = { cats: ["Web", "App", "POS", "Phone"], orders: [1_179_878, 333_905, 658, 240] };
export const ORDER_TYPE = { cats: ["Pickup", "Delivery", "Store"], orders: [1_256_760, 257_646, 275] };
export const COUPON_MIX = { cats: ["No coupon", "Coupon"], orders: [1_385_657, 129_024] };

// Cross-channel identity (validates the switcher design)
export const IDENTITY = {
  guests: 698_026,
  repeat2plus: 211_889,
  pctRepeat: 30.4,
  bothChannels: 30_833,
  anyApp: 90_657,
};

// Book-of-business concentration (brand cohorts, 292-location clean base) — 03 loc-seg map
export const CONCENTRATION: { seg: string; brands: string; loc: string; pctLoc: string; pctGmv: string; tone?: "warning" }[] = [
  { seg: "Single-Location Brands", brands: "205", loc: "205", pctLoc: "70.2%", pctGmv: "51.6%" },
  { seg: "Multi-Location Brands (excl. top)", brands: "23", loc: "62", pctLoc: "21.2%", pctGmv: "24.0%" },
  { seg: "Top Brand", brands: "1", loc: "25", pctLoc: "8.6%", pctGmv: "24.4%", tone: "warning" },
];

// Location tenure feasibility
export const TENURE = {
  locations: 295,
  yr1plus: 220,
  yr2plus: 61,
  medianDays: 498,
  maxDays: 1_838,
};

// Data-quality findings ledger
export type DQSeverity = "EXCLUDE" | "NOTE" | "CLEAN";
export const DQ_FINDINGS: { severity: DQSeverity; finding: string; detail: string; action: string }[] = [
  { severity: "EXCLUDE", finding: "Non-Human / Demo Accounts", detail: "5 guests with ≥10 orders AND >3 orders/day (e.g. 497 orders in 112 days; 15 orders in one day at ~$2 AOV) - 558 orders (0.037%).", action: "Removed in OWNER_CASE_CLEAN." },
  { severity: "EXCLUDE", finding: "Dormant-Reactivation Locations", detail: "3 single-loc locations went dark >180 days then re-onboarded under the same LOCATION_ID (max gaps 1,120 / 234 / 228 days; ~4.9k orders, 0.3%). The re-launch spawns tiny-base windows (e.g. a $47 window → $8,050 next = 171×) that fabricate MoM growth — one alone lifted the post-ramp 30-day mean from +5.4% to +9.8% - 4,957 orders (0.33%).", action: "Removed in OWNER_CASE_CLEAN (corrupted onboarding clock). Median headline was already robust; the mean was the exposure." },
  { severity: "NOTE", finding: "Non-Positive GMV", detail: "6,486 orders GMV<0 (min −$5.00) + 12 GMV=0 = 6,498 (0.43%). Likely refunds/comps/voids.", action: "Retained (net GMV); caveat noted." },
  { severity: "NOTE", finding: "Non-Positive Item Counts", detail: "13 orders NUMBER_OF_ITEMS ≤ 0 (0.001%).", action: "Negligible; retained as-is." },
  { severity: "NOTE", finding: "Incomplete Delivery Fields", detail: "443 delivery orders missing DELIVERY_TYPE; 22,293 delivery orders with NULL/0 fee (plausibly free-delivery promos).", action: "Don't treat fee=0 as 'not delivery'." },
  { severity: "NOTE", finding: "Sparse / Biased Attribution", detail: "UTM_SOURCE null on 55.0%; UTM_MEDIUM null on 97.5%.", action: "Use UTM for directional mix only, not attribution." },
  { severity: "NOTE", finding: "Censoring / Coverage Limits", detail: "Left-censoring (first order ≠ true acquisition); right-censoring (recent cohorts can't complete reorder windows); YoY thin (61 locs ≥2yr). - Also no observed brand acquistion after 2024-06-28 which suggests the data is not complete.", action: "Restrict measurement cohorts to only those with a qualifying tenure." },
  { severity: "CLEAN", finding: "Calendar-Day Continuity", detail: "1,854 / 1,899 calendar days have orders (97.6%). All 45 zero-order days fall in 2020 — 43 in the Jun–Jul launch stretch when just 1 location was live (5 total in 2020 vs 295 overall), + Thanksgiving & Christmas. Zero gaps from 2021 onward.", action: "Continuous across the dense period every growth/YoY/MoM metric relies on; early pilot gaps precede the measured cohorts. No backfill needed." },
  { severity: "CLEAN", finding: "Referential Integrity", detail: "ORDER_ID unique (true order grain); ORDER_SOURCE/TYPE never null; HAS_COUPON ↔ COUPON_TYPE consistent; no pickup carries a delivery fee; no future-dated rows.", action: "No issue." },
];

// Canonical data model
export const DATA_MODEL: { object: string; where: string; what: string }[] = [
  { object: "product_analytics_case_v2", where: "00", what: "Typed table via TRY_* casts (unparseable → NULL)." },
  { object: "product_analytics_case_v2_CLEAN", where: "02", what: "The analysis base. OWNER_CASE minus 5 bot/demo guests (558 orders) + 3 dormant-reactivation locations (~4.9k orders). 295→292 locations." },
  { object: "product_analytics_case_v2_LOC_SEG", where: "03", what: "Brand→cohort map: single_loc / multi_loc / top_brand." },
];

// Monitoring proposal
export const MONITORING: { check: string; rule: string }[] = [
  { check: "Freshness", rule: "MAX(ORDER_CREATED_AT_PT) within last 24–48h." },
  { check: "Calendar Gaps", rule: "No zero-order days in the trailing window (calendar spine left-join daily counts)." },
  { check: "Volume Anomaly", rule: "Daily order count within ±X% of trailing-28d mean." },
  { check: "Non-Positive GMV", rule: "Share of GMV≤0 orders stable vs baseline." },
  { check: "Null Spikes", rule: "Null-rate of DELIVERY_TYPE / UTM within tolerance." },
  { check: "Bot Watch", rule: "# guests breaching >3 orders/day (new demo/test leaks)." },
  { check: "Dormancy Watch", rule: "Locations reactivating after a >180-day dark gap (churn + re-onboard under same LOCATION_ID)." },
  { check: "Schema Drift", rule: "New unexpected values in ORDER_SOURCE/TYPE/DELIVERY_TYPE." },
  { check: "Referential Integrity", rule: "ORDER_ID is a unique PK." },
];

// Owner revenue proxy (above-and-beyond)
export const REVENUE = {
  dailyBreakeven: 164.38,
  medianDailyGmv: 304,
  meanDailyGmv: 439,
  pctAboveBreakeven: 81.7,
  estMonthlyRev: 144_059,
  arr: "≈$1.73M",
};
