// ============================================================
// EXECUTIVE SUMMARY content — edit copy and headline stats here.
// ============================================================

export const EXEC_INTRO =
  "Owner.com gives independent restaurants their own branded website and app that are optimize to drive growth. This study answers two questions from ~1.5M orders: \n\n(1) is restaurant value growing over time and what drives it \n(2) is the Owner app driving incremental value for Owner customers?";

// Top-line KPI strip
export const EXEC_KPIS: { value: string; label: string; tone?: "success" | "info" | "warning" | "neutral" }[] = [
  { value: "+11.7%", label: "typical location YoY growth (median CAGR)", tone: "success" },
  { value: "+1.25", label: "incremental orders / guest in 6-months post app adoption (+37%)", tone: "success" },
  { value: "+7.2pp", label: "6-month retention lift from the app", tone: "success" },
  { value: "33.6%", label: "of brands in the data churned (stopped reporting orders)", tone: "warning" },
];

// The two headline findings
export const EXEC_FINDINGS: { q: string; verdict: string; body: string; tone: "success" | "info" }[] = [
  {
    q: "Does Owner drive growth?",
    verdict: "Yes — and it's a customer-acquisition story",
    body: "The typical Owner location grows +11.7% YoY (median) over its own tenure, ~3.5× the US restaurant market average over the same time period. This growth is overwhelmingly a unique-customer-count story (≈92% of GMV growth), not bigger baskets or more frequent ordering per guest. One top brand (25 locs/24% of GMV) observes anamolous growth (+53% YoY) and distorts every pooled/mean view, so the median is the honest headline. Of the third of locations that churned, these brands had flat-to-declining growth before leaving. EMOB features are unable to reasonably predict a locations liklihood to grow but this model could be improved with more data.",
    tone: "success",
  },
  {
    q: "Is the app incremental?",
    verdict: "Partly — a real, durable retention lift survives",
    body: "Observationally, app users appear 2.6× more valuable than non-app users but this is almost entirely driven by selection bias and circularity. When applying a matched control over a fixed 6-month window post app adoptions, an app user places +1.25 more orders (+37%), spends +$36 more (+26%), and is +7.2pp (+10%) more likely to still be active in the 6 months post adoption. The mechanism driving this trend is the increase in retention (fewer guests drop to zero), not bigger baskets. A secondary store-enablement analysis agrees with this story as well (+8.6% GMV) although this was lower powered and should only be interpreted as directionally supportive evidence.",
    tone: "info",
  },
];

export const EXEC_NEXT = [
  "Move app incrementality from directional to causal via designed experiment(s) — a brand-level holdout or a guest-level randomized AB test to recover a clean ATE free of observational biases.",
  "Enrich the data beyond the order log (pre-Owner history, marketing spend, geography, local competition, menu breadth, operator tenure) to sharpen the growth-driver model and an app-adoption propensity model for tighter matching.",
  "Explore product changes that address identified gaps to improve the product's efficacy - i.e., address adverse AOV impact on multi-location brands via basket analysis tooling.",
];

export const EXEC_CAVEATS = [
  "Since we lack a clean designed experiment all results are directional in contrast to a clean ATE.",
  "Some results are lower powered than others due to differing analysis approaches and sample availability.",
  "A guest's 'first' observed order may not be their true first order due to the limited data visibility.",
];
