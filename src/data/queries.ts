// Descriptions for each SQL file in content/sql/ (shown in the Appendix).
// `page` is the analysis page each query supports (rendered as the tag chip).
export const QUERY_DESCRIPTIONS: Record<string, { title: string; page: string; blurb: string }> = {
  "01_profiling_and_dq.sql": { title: "Profiling & DQ Scan", page: "Data & Quality", blurb: "Grain, coverage, categorical distributions, cross-channel guest identity, tenure feasibility, and an Owner-revenue proxy." },
  "02_data_quality.sql": { title: "Data Quality & Cleaning", page: "Data & Quality", blurb: "Findings ledger, bot/demo detection, builds OWNER_CASE_CLEAN, and a go-forward monitoring proposal." },
  "03_north_star_and_growth.sql": { title: "North Star & Growth", page: "Owner Growth", blurb: "Per-location growth engine (YoY CAGR + rolling 30-day), growth-lever decomposition, AOV drill-down, cohort segmentation, and the survivorship split." },
  "04_app_incrementality.sql": { title: "App Incrementality (Panels)", page: "App Incrementality", blurb: "Descriptive rungs Q0/Q1/Q2 plus the E1 guest-panel and E2 store-panel extracts that feed the Python DiD estimators." },
  "05_growth_drivers.sql": { title: "Growth Drivers", page: "Owner Growth", blurb: "Feature build for the driver regression: baseline (first-60-day, exogenous) vs lifecycle (whole-history) location features." },
};
