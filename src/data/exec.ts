// ============================================================
// EXECUTIVE SUMMARY content — edit copy and headline stats here.
// ============================================================

export const EXEC_INTRO =
  "Owner.com gives independent restaurants their own branded website and app that are optimize to drive growth. This study answers two questions from ~1.5M orders: \n\n(1) are Owner restaurants growing over time and if so, what drives this growth? \n(2) is the Owner app driving incremental value for Owner customers?";

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
    verdict: "YES! The Typical Owner Location Grows ~12% YoY",
    body: "The typical Owner location grows +11.7% YoY (median) over its own tenure, ~3.5× the US restaurant market average over the same time period. This growth is primarily driven by guest acquisition while order/guest and AOV were not as influential. Owner's top brand saw outsized growth many multiples higher than its piers (53.1%) which skewed any mean based calculation. Additionally, ~34% of locations in the sample data churned which we believe to be associated with their subpar growth prior to leaving. EMOB features are unable to reasonably predict a locations liklihood to grow but this model could be improved with more data.",
    tone: "success",
  },
  {
    q: "Is the app incremental?",
    verdict: "YES! Guests Experience a +26% GMV Lift in the 180D Following App Adoption",
    body: "Observationally, app users appear 2.6× more valuable than non-app users but this is almost entirely driven by self-selection bias in the data. When applying a matched control over a fixed 6-month window post app adoption, an app user places +1.25 more orders (+37%), spends +$36 more (+26%), and is +7.2pp (+10%) more likely to still be active in the 6 months post adoption. This impact looks to be sustained over the entirety of the 6 month analysis window. A secondary store-enablement analysis agrees with this story as well (+8.6% GMV) although this was lower powered and should only be interpreted as directionally supportive evidence.",
    tone: "info",
  },
];

export const EXEC_NEXT = [
  "Move app incrementality from directional to causal via designed experiment(s) like a brand-level holdout or a guest-level randomized AB test.",
  "Enrich the data beyond the order log (pre-Owner history, marketing spend, geography, local competition, menu breadth, operator tenure) to sharpen the growth-driver model.",
  "Explore product changes that address identified gaps to improve the product's efficacy - i.e., address adverse AOV impact on multi-location brands via basket analysis tooling.",
];

export const EXEC_CAVEATS = [
  "Since we lack a clean designed experiment all results are directional and we cannot draw any causal conclusions.",
  "Some results are lower powered than others due to differing analysis approaches and sample availability.",
  "A guest's 'first' observed order may not be their true first order due to the limited data visibility.",
];
