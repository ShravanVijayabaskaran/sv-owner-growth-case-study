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
  { severity: "EXCLUDE", finding: "Non-Human / Demo Accounts", detail: "5 guests with inauthentic behaviour (defined as ≥10 orders AND >3 orders/day) accounting for 558 orders (0.037%).", action: "Removed from Analysis" },
  { severity: "EXCLUDE", finding: "Dormant-Reactivation Locations", detail: "3 locations went dark ()>180 days w/ no activity) and then reappeared accounting for ~4.9k orders (0.3%).", action: "Removed from Analysis to Avoid Noise in Growth Measurement" },
  { severity: "NOTE", finding: "Non-Positive GMV", detail: "6,498 orders (0.43%) with GMV≤0 which likely represents refunds/comps/voids.", action: "Retained (Interpreted as Negative GMV)" },
  { severity: "NOTE", finding: "Non-Positive Item Counts", detail: "13 orders (0.001%) with NUMBER_OF_ITEMS ≤ 0.", action: "N/A" },
  { severity: "NOTE", finding: "Incomplete Delivery Fields", detail: "443 delivery orders missing DELIVERY_TYPE and 22,293 delivery orders with NULL/0 delivery fee (likely free delivery orders).", action: "N/A" },
  { severity: "NOTE", finding: "Sparse / Biased Attribution", detail: "UTM_SOURCE null on 55.0%; UTM_MEDIUM null on 97.5%.", action: "N/A" },
  { severity: "NOTE", finding: "Censoring / Coverage Limits", detail: "We must assume a guests 'first order' is their aqcuisition event since we don't have pre Owner data while data drops off abruptly in JUL25 while all new location onboarding stops after JUN24.", action: "Restrict Measurement Cohorts via Min Tenure Thresholds" },
  { severity: "CLEAN", finding: "Calendar-Day Continuity", detail: "45 days between the first and last observed order are missing data however they're all in 2020 and either in JUN/JUL when there was only one location active, or during holidays (Thanksgiving/Christmas).", action: "No Action Needed as Impacted Location is Excluded for Different Constraint" },
  { severity: "CLEAN", finding: "Referential Integrity", detail: "ORDER_ID is a unique PK whil ORDER_SOURCE/TYPE are never null.", action: "N/A" },
];

// Canonical data model
export const DATA_MODEL: { object: string; where: string; what: string }[] = [
  { object: "product_analytics_case_v2", where: "00", what: "Raw table provided in Case PDF" },
  { object: "product_analytics_case_v2_CLEAN", where: "02", what: "The original table minus 5 bot/demo guests + 3 dormant-reactivation locations" },
  { object: "product_analytics_case_v2_LOC_SEG", where: "03", what: "Mapping table for segment analysis (single_loc / multi_loc / top_brand)" },
];

// Monitoring proposal
export const MONITORING: { check: string; rule: string }[] = [
  { check: "Freshness", rule: "MAX(ORDER_CREATED_AT_PT) within last 24–48H." },
  { check: "Calendar Gaps", rule: "No zero-order days in the trailing 14D window." },
  { check: "Volume Anomaly", rule: "Daily order count within ±X% of trailing 28D baseline." },
  { check: "Non-Positive GMV", rule: "Share of GMV≤0 orders stable vs trailing 28D baseline." },
  { check: "Null Spikes", rule: "Null-rate of DELIVERY_TYPE / UTM within some X% tolerance threshold." },
  { check: "Dormancy Watch", rule: "Flag any locations going inactive or reactivating after an X Days threshold." },
  { check: "Schema Drift", rule: "Flag any new unexpected values in ORDER_SOURCE/TYPE/DELIVERY_TYPE." },
  { check: "Prevent Duplicates", rule: "ORDER_ID is a unique PK." },
];