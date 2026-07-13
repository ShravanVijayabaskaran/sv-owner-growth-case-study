// ============================================================
// METRIC DESIGN — the framework linking Owner's product to restaurant
// profitability, what the order-grain data does/doesn't expose, and the
// KPIs we settled on for the growth & incrementality analyses.
// Edit freely; this page is pure content.
// ============================================================

export const MD_INTRO =
  "Before measuring whether Owner works, we must define what 'working' looks like. Owner's goal is to allow independent restaurants to increase their profits by providing them with tools that works. This section walks through how I break down Owner's mission into a series of measureable metrics that provide clarity on whether the product is delivering on this promise.";
export type Visibility = "full" | "partial" | "none";

// The profit model, as a nested decomposition tree. Each node breaks into
// `children` joined by `op`. `vis` flags whether the data lets us see the node.
// Edit labels / operators / visibility / structure freely — the page renders
// the tree diagram straight from this.
export type MetricNode = { label: string; vis: Visibility; op?: string; children?: MetricNode[] };
export const PROFIT_ROOT: MetricNode = {
  label: "Restaurant Profitability",
  vis: "none",
  op: "−",
  children: [
    {
      label: "Gross Merchandise Value (GMV)",
      vis: "full",
      op: "×",
      children: [
        {
          label: "Average Order Value (AOV)",
          vis: "full",
          op: "x",
          children: [
            { label: "Basket Size", vis: "full" },
            { label: "Price per Item", vis: "full" },
          ],
        },
        {
          label: "Number of Orders",
          vis: "full",
          op: "×",
          children: [
            {
              label: "Number of Customers",
              vis: "full",
              op: "×",
              children: [
                { label: "Customer Reach", vis: "none" },
                { label: "Customer Conversion Rate (CVR)", vis: "none" },
              ],
            },
            { label: "Order Frequency", vis: "full" },
          ],
        },
      ],
    },
    {
      label: "Cost of Goods Sold (COGS)",
      vis: "none",
      op: "=",
      children: [
        {
          label: "Simple Food Costs",
          vis: "none",
          op: "+",
          children: [
            { label: "Ingredients Used", vis: "none" },
            { label: "Ingredients Wasted", vis: "none" },
          ],
        },
      ],
    },
  ],
};
export const PROFIT_MODEL_NOTE =
"Profitability is made up of two main components; the revenue a business earns minus the costs incurred to generate this revenue. Above we have decomposed this relationship further to gain a better understanding of: \n \n (1) All the Levers in Which Owner Can Influence Restaurant Profitability \n (2) What Perspectives We Can Provide Given the Data Provided \n \n Through this exercise, we quickly learn that our data set only has visibility into the revenue side of the equation so we cannot make any claims about costs. We're also lacking any data on top of funnel customer acquisition and without it we won't be able to understand how locations convert prospective customers into real dollars.";  

export const VIS_LABEL: Record<Visibility, string> = { full: "Observed", partial: "Partial / Proxy", none: "Not Observed" };
export const VIS_TONE: Record<Visibility, "success" | "warning" | "danger"> = { full: "success", partial: "warning", none: "danger" };

// ---- The driver framework: how Owner can lift restaurant profitability ----
export type Lever = { name: string; detail: string; visibility: Visibility; note?: string };
export const PROFIT_TREE: { branch: string; tone: "success" | "info" | "warning"; ownerLever: string; levers: Lever[] }[] = [
  {
    branch: "1. Grow Revenue (GMV)",
    tone: "success",
    ownerLever: "A branded site, app, and loyalty program that's been optimized for growth will bring more diners and more orders through the restaurant's own channel.",
    levers: [
      { name: "Acquire New Customers", detail: "Increase guest volume at every level of the acquisition funnel from awareness to conversion", visibility: "partial", note: "" },
      { name: "Retain & Reorder", detail: "Increase a guest's liklihood to return or develop habituation to build a consistent revenue base", visibility: "full", note: "" },
      { name: "Bigger Baskets (AOV)", detail: "Encourage guests to order more or higher value items across every order placed", visibility: "full", note: "" },
    ],
  },
  {
    branch: "2. Capture Margin per Order",
    tone: "info",
    ownerLever: "Restaurants can improve the economics of each order by pulling volume off high-commission marketplaces and encouraging spend in high value items.",
    levers: [
      { name: "Channel Shift Off 3P Platforms", detail: "Shift volume away from 3P platforms like DoorDash and Uber Eats to avoid large fees", visibility: "none", note: "" },
      { name: "Basket Composition", detail: "Shift customer preferences towards higher margin menu offerings to inrease profits", visibility: "none", note: "" },
      { name: "Discount Leakage", detail: "Better understand whether Promos/Coupons are driving revenue or simply eroding margin", visibility: "partial", note: "" },
    ],
  },
  {
    branch: "3. Lower Simple Food Costs",
    tone: "warning",
    ownerLever: "Improved inventory management and menu engineering can minimize costs to drive profitability without impacting topline revenue.",
    levers: [
      { name: "Reduce Food Waste", detail: "Improve invenotry awareness and provide data driven recommendations that reduce spoilage", visibility: "none", note: "" },
      { name: "Optimize Menu Offerings", detail: "Suggest changes to menu items that lower costs, increase margin, or minimize wastage", visibility: "none", note: "" },
    ],
  },
];

// ---- What the data lets us see (and what it doesn't) ----
export const VISIBILITY_ROWS: { component: string; visibility: Visibility; observe: string }[] = [
  { component: "Direct-Channel GMV", visibility: "full", observe: "GMV" },
  { component: "Orders, Unique Guests, Frequency", visibility: "full", observe: "ORDER_ID · GUEST_ID · ORDER_CREATED_AT_PT" },
  { component: "Channel (App / Web / POS / Phone)", visibility: "full", observe: "ORDER_SOURCE" },
  { component: "Fulfillment (Pickup/Delivery, In-House/3P)", visibility: "full", observe: "ORDER_TYPE · DELIVERY_TYPE" },
  { component: "Basket Size & Unit Price", visibility: "full", observe: "NUMBER_OF_ITEMS · Price/Item = GMV ÷ NUMBER_OF_ITEMS" },
  { component: "Cross-Channel Guest Identity", visibility: "full", observe: "GUEST_ID Shared Across Channels" },
  { component: "Coupon Usage", visibility: "partial", observe: "HAS_COUPON / COUPON_TYPE  - Missing Discount Amount Column" },
  { component: "Attribution / Marketing Channel", visibility: "partial", observe: "UTM_SOURCE/MEDIUM - Poor Data Population w/ No Supporting Promo Campaign Info" },
  { component: "Refunds / Voids", visibility: "partial", observe: "Assuming Order is Refund/Void if GMV ≤ 0 (n = 6,498)" },
  { component: "Food & Labor Cost", visibility: "none", observe: "No Cost Based Data Available" },
  { component: "Marketplace Commissions & 3P Order Volume", visibility: "none", observe: "Only Owner Platform Data Available" },
  { component: "Marketing Spend / CAC", visibility: "none", observe: "No Marketing Spend Data Available" },
  { component: "Restaurant Actual Profit", visibility: "none", observe: "No Cost Data Available so Using GMV as a Proxy for Profit" },
  { component: "Pre-Owner Baseline & Competitor Context", visibility: "none", observe: "No Pre-Owner or Comparitive Market Data Available" },
];

// ---- KPIs we defined for the downstream analyses ----
export type KpiCategory = "North Star" | "Primary" | "Secondary" | "Guardrail";
export const CAT_TONE: Record<KpiCategory, "info" | "success" | "neutral" | "warning"> = {
  "North Star": "info",
  Primary: "success",
  Secondary: "neutral",
  Guardrail: "warning",
};

export const KPIS: { name: string; category: KpiCategory; definition: string; why: string; used: string }[] = [
  { name: "Per-Location GMV Growth", category: "North Star", definition: "Geometric mean of a location's GMV growth over its own lifeycle/tenure. \n\nWe're using a geometric mean as its a more accurate measure of steady compound growth than a traditional arithmetic mean. \n\n Example: \n Y0 = $100\nY1 = $110 (+10%)\nY2 = $99 (-10%)\n\nArithmetic Mean = 0% (Inaccurate)\nGeometric Mean = -0.5% (Accurate)", why: "Isolates whether the product is driving a real sustained growth over a given time horizon with each location as its own control.", used: "Growth" },
  { name: "Guest Re-Order Rate", category: "Primary", definition: "Percent share of guests with ≥2 orders with the same brand within a fixed window.", why: "Building repeat order behavior is a core goal of the Owner platform to drive long term revenue.", used: "Growth · App" },
  { name: "Unique Guest Count", category: "Secondary", definition: "Distinct guests (COUNT DISTINCT GUEST_ID) transacting at a location over a set period.", why: "Guest acquisition is the core top of funnel growth engine, so we track it directly.", used: "Growth" },
  { name: "Guest Order Frequency", category: "Secondary", definition: "Average number of orders per unique guest over a set period.", why: "The frequency lever of GMV growth; complements the re-order rate by measuring depth of repeat behavior.", used: "Growth" },
  { name: "Average Order Value (AOV)", category: "Secondary", definition: "GMV per order, which can bedecomposed into items/order × price/item.", why: "The basket lever of GMV growth; this allows us to understand the quality of the orders being placed.", used: "Growth" },
  { name: "App Penetration Volume", category: "Secondary", definition: "Percent share of an entity's orders placed via the App vs Web.", why: "Adoption context that frames the incrementality question - defined as the proportion of order volume driven through the app.", used: "App" },
  { name: "Brand Level Churn", category: "Guardrail", definition: "A location is treated as churned if its brand placed no order within 14 days of the latest date available in the data.", why: "Best metric to understand customer satisfaction with the product and captures unmeasurable contributing factors like ease of use, customer support, etc. while also providing us with a guardrail against survivorship bias within our analyses.", used: "Growth" },
];

// ---- Design principles that govern every metric above ----
export const MD_PRINCIPLES: { title: string; detail: string }[] = [
  {
    title: "Total Value, Not Channel Value",
    detail: "Every metric measures an entity's behavior in totality and never by a selective channel(s) alone to avoid rewarding cannibalization or mix-shift.",
  },
  {
    title: "Each Location is its Own Control",
    detail: "Growth is measured relative to a location's own lifeycle to compare its performance against itself rather than to peers that launched in different years or market conditions. This hopes to netting out seasonality and structural brand differences since there is no external control group or counterfactual.",
  },
  {
    title: "Geometric Within Location, Median Across Locations",
    detail: "Within a location we compound growth rates geometrically to accurately measure period-over-period changes over time while when aggregating results across locations we interpret results via the median to avoid a few anomalous brands from skewing results.",
  },
];
