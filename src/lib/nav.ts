// Ordered navigation for the tool. Edit labels/paths here.
export const NAV = [
  { href: "/", label: "Exec Summary", short: "Summary" },
  { href: "/data-quality", label: "Data & Quality", short: "Data" },
  { href: "/metric-design", label: "Metric Design", short: "Metrics" },
  { href: "/growth", label: "Owner Growth", short: "Growth" },
  { href: "/app-incrementality", label: "App Incrementality", short: "App" },
  { href: "/appendix", label: "Appendix (SQL)", short: "Appendix" },
] as const;

export const SITE = {
  title: "Owner.com — Product Analytics Case Study",
  subtitle: "Shravan Vijayabaskaran",
  source: "PRODDB.SHRAVANV.OWNER_CASE_CLEAN",
};
