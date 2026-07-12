-- =====================================================================
-- DATA AUDIT FINDINGS / CONCLUSIONS
-- ---------------------------------------------------------------------
--
-- 1. [EXCLUDE] Non-human / demo accounts                    (Query B1-B3)
--      5 guests place >=10 orders AND >3 orders/day (impossible human
--      cadence) -> 558 orders (0.037%). e.g. 497 orders/112 days; several
--      11-23 orders in a single day at ~$2 AOV (demo sessions). Removed in
--      OWNER_CASE_CLEAN. High single-brand loyalists (588 orders at ONE
--      location; 118 orders across 18 locations of ONE brand) are REAL and
--      RETAINED -- distinct BRANDS, not locations, is the anomaly signal.
--
-- 1b.[EXCLUDE] Dormant-reactivation locations               (Query C)
--      3 locations have a >180-day gap between consecutive active days
--      (max gaps: 1,120 / 234 / 228 days) -> the store churned and later
--      re-onboarded under the SAME LOCATION_ID. All 3 are single_loc
--      (~4.9k orders, ~0.3%). This corrupts the per-location onboarding
--      clock: the re-launch produces tiny-base windows (e.g. a $47 window
--      -> $8,050 the next = 171x) that fabricate enormous MoM "growth" --
--      LOCATIONS ARE REMOVED FROM THE ANALYSIS BASE
--
-- 2. [NOTE] Non-positive GMV                                (Query A)
--      6,486 orders GMV < 0 (min -$5.00) + 12 GMV = 0 (=6,498; 0.43%). Most
--      likely refunds/comps/voids. Given the tiny share, NO special handling:
--      retained and reflected in net GMV. Caveat noted for interpretation.
--
-- 3. [NOTE] Non-positive item counts                        (Query A)
--      13 orders NUMBER_OF_ITEMS <= 0 (0.001%). Negligible; retained as-is.
--
-- 4. [NOTE] Delivery fields incomplete on delivery orders   (Query A)
--      443 delivery orders missing DELIVERY_TYPE; 22,293 delivery orders with
--      NULL/0 DELIVERY_FEE (plausibly free-delivery promos, unverifiable).
--      -> Do NOT treat DELIVERY_FEE=0 as "not a delivery".
--
-- 5. [NOTE] Attribution (UTM) is sparse & biased            (Query A)
--      UTM_SOURCE null on 833,517 (55.0%); UTM_MEDIUM null on 1,476,147 (97.5%).
--      -> UTM supports directional channel MIX only -- not a conversion rate
--         and not a complete attribution model.
--
-- 6. [NOTE] Anonymized / low-frequency categoricals   (01_profiling sec.2)
--      DELIVERY_TYPE = {A,B,C,inhouse} are masked labels (C only 15 orders);
--      ORDER_SOURCE has rare POS (658) & Phone (240); ORDER_TYPE 'store' (275).
--      -> Group rare levels as "Other" in visuals.
--
-- 7. [NOTE] Censoring / coverage limits                     (Query A: MIN/MAX)
--      Window = 2020-05-18 -> 2025-07-29.
--      Left-censoring: first order in data may not be true acquisition
--        (ASSUMPTION: treated as new). Right-censoring: recent cohorts can't
--        complete an N-day reorder window -> restrict reorder cohorts to fully
--        observed periods. Same-store YoY only 61 locations (>=2yrs); show YoY+MoM.
--
-- Clean (no issue): ORDER_ID unique (true order grain); ORDER_SOURCE/ORDER_TYPE
--   never null; HAS_COUPON <-> COUPON_TYPE fully consistent; no pickup carries
--   a delivery fee; MAX date is in the past (no future-dated rows).
-- =====================================================================


-- ---------------------------------------------------------------------
-- QUERY A — Coverage & consistency (verifies findings 2,3,4,5,7 + clean checks)
--   MIN/MAX date replaces a separate future-timestamp check.
-- ---------------------------------------------------------------------
SELECT
  COUNT(*)                                                            AS TOTAL,               -- 1,514,681
  MIN(ORDER_CREATED_AT_PT)                                           AS MIN_TS,               -- 2020-05-18
  MAX(ORDER_CREATED_AT_PT)                                           AS MAX_TS,               -- 2025-07-29 (past)
  SUM(IFF(ORDER_SOURCE IS NULL,1,0))                                 AS SRC_NULL,             -- 0
  SUM(IFF(ORDER_TYPE   IS NULL,1,0))                                 AS TYPE_NULL,            -- 0
  SUM(IFF(HAS_COUPON AND COUPON_TYPE IS NULL,1,0))                   AS COUPON_TRUE_NOTYPE,   -- 0
  SUM(IFF((NOT HAS_COUPON) AND COUPON_TYPE IS NOT NULL,1,0))         AS COUPON_FALSE_HASTYPE, -- 0
  SUM(IFF(ORDER_TYPE='pickup'   AND DELIVERY_FEE>0,1,0))             AS PICKUP_WITH_DELFEE,   -- 0
  SUM(IFF(ORDER_TYPE='delivery' AND DELIVERY_TYPE IS NULL,1,0))      AS DELIVERY_NO_DELTYPE,  -- 443
  SUM(IFF(ORDER_TYPE='delivery' AND COALESCE(DELIVERY_FEE,0)=0,1,0)) AS DELIVERY_NO_FEE,      -- 22,293
  SUM(IFF(GMV<0,1,0))                                                AS GMV_NEG,              -- 6,486
  SUM(IFF(GMV=0,1,0))                                                AS GMV_ZERO,             -- 12
  SUM(IFF(NUMBER_OF_ITEMS<=0,1,0))                                   AS ITEMS_NONPOS,         -- 13
  SUM(IFF(UTM_SOURCE IS NULL,1,0))                                   AS UTM_SRC_NULL,         -- 833,517 (55.0%)
  SUM(IFF(UTM_MEDIUM IS NULL,1,0))                                   AS UTM_MED_NULL          -- 1,476,147 (97.5%)
FROM demo_db.public.product_analytics_case_v2;


-- ---------------------------------------------------------------------
-- QUERY B — How we identified the non-human / demo accounts (finding #1)
-- NOTE: OPTED TO ONLY FILTER ON FREQUENCY AS NOT ALL BRAND BREADTH IS INAUTHENTIC (i.e., IF THERE IS A CONCENTRATION OF LOCATIONS IN SF, WE WOULD EXPECT SOME MINORITY OF CX TO HAVE ENGAGED W MANY BRANDS)
-- ---------------------------------------------------------------------
-- B1) Guest base by distinct BRANDS vs LOCATIONS. 99.99% of guests touch <=2
--     brands; multi-BRAND spread (not multi-location) is the true anomaly, so
--     multi-outlet chain loyalists are not mistaken for bots.
--     Findings: brands -> 1:694,255 | 2:3,696 | 3-4:53 | 5-9:10 | 10+:12 
--               locs   -> 1:679,081 | 2:17,423 | 3-4:1,455 | 5-9:54 | 10+:13
SELECT
  SUM(IFF(N_BRANDS=1,1,0)) AS BR1, SUM(IFF(N_BRANDS=2,1,0)) AS BR2,
  SUM(IFF(N_BRANDS BETWEEN 3 AND 4,1,0)) AS BR3_4,
  SUM(IFF(N_BRANDS BETWEEN 5 AND 9,1,0)) AS BR5_9, SUM(IFF(N_BRANDS>=10,1,0)) AS BR10PLUS,
  SUM(IFF(N_LOCS=1,1,0))   AS LOC1, SUM(IFF(N_LOCS=2,1,0))   AS LOC2,
  SUM(IFF(N_LOCS BETWEEN 3 AND 4,1,0)) AS LOC3_4,
  SUM(IFF(N_LOCS BETWEEN 5 AND 9,1,0)) AS LOC5_9, SUM(IFF(N_LOCS>=10,1,0)) AS LOC10PLUS
FROM (
  SELECT GUEST_ID, COUNT(DISTINCT BRAND_ID) AS N_BRANDS, COUNT(DISTINCT LOCATION_ID) AS N_LOCS
  FROM demo_db.public.product_analytics_case_v2 GROUP BY 1
);

-- B2) Order velocity among guests with >=10 orders. Real regulars sit <=1/day;
--     only 5 exceed 3/day -> the unambiguous non-human cadence we exclude.
--     Findings (of 21,035 guests w/ >=10 orders): <=1/day 21,028 | 1-2:2 | 2-3:0 | >3:5
SELECT
  SUM(IFF(OPD<=1,1,0)) AS LE1, SUM(IFF(OPD>1 AND OPD<=2,1,0)) AS B1_2,
  SUM(IFF(OPD>2 AND OPD<=3,1,0)) AS B2_3, SUM(IFF(OPD>3,1,0)) AS GT3,
  COUNT(*) AS GUESTS_10PLUS_ORDERS
FROM (
  SELECT GUEST_ID,
         COUNT(*) AS ORD,
         COUNT(*)/(DATEDIFF('day',MIN(ORDER_CREATED_AT_PT),MAX(ORDER_CREATED_AT_PT))+1) AS OPD
  FROM demo_db.public.product_analytics_case_v2 GROUP BY 1 HAVING ORD >= 10
);

-- B3) The 5 excluded accounts (the exact exclusion rule, itemized).
SELECT GUEST_ID,
       COUNT(*) AS ORDERS,
       COUNT(DISTINCT LOCATION_ID) AS N_LOCS,
       COUNT(DISTINCT BRAND_ID)    AS N_BRANDS,
       DATEDIFF('day',MIN(ORDER_CREATED_AT_PT),MAX(ORDER_CREATED_AT_PT))+1 AS SPAN_DAYS,
       ROUND(COUNT(*)/(DATEDIFF('day',MIN(ORDER_CREATED_AT_PT),MAX(ORDER_CREATED_AT_PT))+1),2) AS ORDERS_PER_DAY,
       ROUND(SUM(GMV),0) AS GMV, ROUND(AVG(GMV),2) AS AOV
FROM demo_db.public.product_analytics_case_v2
GROUP BY 1
HAVING COUNT(*) >= 10
   AND COUNT(*)/(DATEDIFF('day',MIN(ORDER_CREATED_AT_PT),MAX(ORDER_CREATED_AT_PT))+1) > 3
ORDER BY ORDERS DESC;
-- Result: 5 guests / 558 orders


-- ---------------------------------------------------------------------
-- QUERY C — How we identified the dormant-reactivation locations (finding #1b)
-- ---------------------------------------------------------------------
-- Max gap between a location's consecutive ACTIVE days (bot guests already
-- removed, GMV>0). A gap > 180 days = the store went dark then re-onboarded
-- under the same LOCATION_ID -> onboarding-clock growth is untrustworthy.
-- Findings (of 295 locations): only 3 exceed 180 days; all single_loc.
--   1764505d... gap 1,120d | 813c1411... 234d | 542421b3... 228d
--   (next-longest is <180d, so 180 is a clean, non-arbitrary cut.)
WITH excluded_guests AS (
  SELECT GUEST_ID FROM demo_db.public.product_analytics_case_v2 GROUP BY 1
  HAVING COUNT(*) >= 10
     AND COUNT(*) / (DATEDIFF('day', MIN(ORDER_CREATED_AT_PT), MAX(ORDER_CREATED_AT_PT)) + 1) > 3
), active_days AS (
  SELECT DISTINCT LOCATION_ID, ORDER_CREATED_AT_PT::DATE AS DT
  FROM demo_db.public.product_analytics_case_v2
  WHERE GMV > 0 AND GUEST_ID NOT IN (SELECT GUEST_ID FROM excluded_guests)
), gaps AS (
  SELECT LOCATION_ID,
         DATEDIFF('day', LAG(DT) OVER (PARTITION BY LOCATION_ID ORDER BY DT), DT) AS GAP
  FROM active_days
)
SELECT LOCATION_ID, MAX(GAP) AS MAX_GAP_DAYS
FROM gaps GROUP BY 1
HAVING MAX(GAP) > 180
ORDER BY MAX_GAP_DAYS DESC;


-- ---------------------------------------------------------------------
-- CANONICAL ANALYSIS BASE  ->  every downstream query reads this view.
-- Two interventions (both EXCLUDE-severity, both itemized above):
--   (1) remove 5 non-human/demo guests           (finding #1  -> 558 orders)
--   (2) remove 3 dormant-reactivation locations  (finding #1b -> ~4.9k orders)
-- All other findings are notes; no other rows dropped, no flags added.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW demo_db.public.product_analytics_case_v2_CLEAN AS
WITH excluded_guests AS (
  SELECT GUEST_ID
  FROM demo_db.public.product_analytics_case_v2
  GROUP BY 1
  HAVING COUNT(*) >= 10
     AND COUNT(*) / (DATEDIFF('day', MIN(ORDER_CREATED_AT_PT), MAX(ORDER_CREATED_AT_PT)) + 1) > 3
), active_days AS (                          -- location activity, bots removed
  SELECT DISTINCT LOCATION_ID, ORDER_CREATED_AT_PT::DATE AS DT
  FROM demo_db.public.product_analytics_case_v2
  WHERE GMV > 0 AND GUEST_ID NOT IN (SELECT GUEST_ID FROM excluded_guests)
), loc_gaps AS (                             -- gap between consecutive active days
  SELECT LOCATION_ID,
         DATEDIFF('day', LAG(DT) OVER (PARTITION BY LOCATION_ID ORDER BY DT), DT) AS GAP
  FROM active_days
), excluded_locs AS (                        -- >180-day dark gap = churn + re-onboard
  SELECT LOCATION_ID FROM loc_gaps GROUP BY 1 HAVING MAX(GAP) > 180
)
SELECT c.*
FROM demo_db.public.product_analytics_case_v2 c
WHERE c.GUEST_ID   NOT IN (SELECT GUEST_ID    FROM excluded_guests)
  AND c.LOCATION_ID NOT IN (SELECT LOCATION_ID FROM excluded_locs);

-- Validate: 5,515 rows removed = 558 bot orders + 4,957 dormant-location rows.
--   RAW 1,514,681 -> CLEAN 1,509,166 | locations 295 -> 292.
SELECT
  (SELECT COUNT(*) FROM demo_db.public.product_analytics_case_v2)                    AS RAW_ROWS,
  (SELECT COUNT(*) FROM demo_db.public.product_analytics_case_v2_CLEAN)              AS CLEAN_ROWS,
  (SELECT COUNT(*) FROM demo_db.public.product_analytics_case_v2)
    - (SELECT COUNT(*) FROM demo_db.public.product_analytics_case_v2_CLEAN)          AS EXCLUDED_ROWS,
  (SELECT COUNT(DISTINCT LOCATION_ID) FROM demo_db.public.product_analytics_case_v2) AS RAW_LOCS,
  (SELECT COUNT(DISTINCT LOCATION_ID) FROM demo_db.public.product_analytics_case_v2_CLEAN) AS CLEAN_LOCS;

