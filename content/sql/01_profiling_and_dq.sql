-- ---------------------------------------------------------------------
-- 1. Grain & coverage
-- ---------------------------------------------------------------------
-- Findings:
--   TOTAL_ROWS       = 1,514,681
--   DISTINCT_ORDERS  = 1,514,681   (ORDER_ID is unique -> true grain = 1 order)
--   N_BRANDS         = 232
--   N_LOCATIONS      = 295
--   N_GUESTS         = 698,026
--   Date range       = 2020-05-18  ->  2025-07-29
--   GMV              = min -5.00 | max 2,851.42 | avg 45.44
--   GMV <= 0         = 6,498 orders 
--   NUMBER_OF_ITEMS <= 0 = 13 orders 
SELECT
  COUNT(*)                                   AS TOTAL_ROWS,
  COUNT(DISTINCT ORDER_ID)                   AS DISTINCT_ORDERS,
  COUNT(DISTINCT BRAND_ID)                   AS N_BRANDS,
  COUNT(DISTINCT LOCATION_ID)                AS N_LOCATIONS,
  COUNT(DISTINCT GUEST_ID)                   AS N_GUESTS,
  SUM(IFF(ORDER_CREATED_AT_PT IS NULL,1,0))  AS TS_NULL,
  MIN(ORDER_CREATED_AT_PT)                   AS MIN_TS,
  MAX(ORDER_CREATED_AT_PT)                   AS MAX_TS,
  SUM(IFF(GMV IS NULL,1,0))                  AS GMV_NULL,
  SUM(IFF(GMV<=0,1,0))                       AS GMV_NONPOS,
  ROUND(MIN(GMV),2) AS GMV_MIN, ROUND(MAX(GMV),2) AS GMV_MAX, ROUND(AVG(GMV),2) AS GMV_AVG,
  SUM(IFF(NUMBER_OF_ITEMS<=0,1,0))           AS ITEMS_NONPOS
FROM demo_db.public.product_analytics_case_v2;

-- ---------------------------------------------------------------------
-- 2. Categorical distributions (channel, fulfillment, coupon, attribution)
-- ---------------------------------------------------------------------
-- Findings (orders):
--   ORDER_SOURCE : Web 1,179,878 | App 333,905 | POS 658 | Phone 240
--   ORDER_TYPE   : pickup 1,256,760 | delivery 257,646 | store 275
--   DELIVERY_TYPE: <null> 1,257,478 | inhouse 101,517 | B 91,017 | A 64,654 | C 15
--   HAS_COUPON   : false 1,385,657 | true 129,024
--   UTM_SOURCE   : <null> 833,517 | google 615,306 | owner 50,552 | other/ig/fb/direct small
--   UTM_MEDIUM   : <null> 1,476,147 (~97%) | email/other/text/organic/cpc small
SELECT 'ORDER_SOURCE'  AS DIM, COALESCE(ORDER_SOURCE,'<null>')          AS VAL, COUNT(*) AS ORDERS, ROUND(SUM(GMV),0) AS GMV FROM demo_db.public.product_analytics_case_v2 GROUP BY 1,2
UNION ALL SELECT 'ORDER_TYPE',    COALESCE(ORDER_TYPE,'<null>'),          COUNT(*), ROUND(SUM(GMV),0) FROM demo_db.public.product_analytics_case_v2 GROUP BY 1,2
UNION ALL SELECT 'DELIVERY_TYPE', COALESCE(DELIVERY_TYPE,'<null>'),       COUNT(*), ROUND(SUM(GMV),0) FROM demo_db.public.product_analytics_case_v2 GROUP BY 1,2
UNION ALL SELECT 'HAS_COUPON',    COALESCE(TO_VARCHAR(HAS_COUPON),'<null>'),COUNT(*), ROUND(SUM(GMV),0) FROM demo_db.public.product_analytics_case_v2 GROUP BY 1,2
UNION ALL SELECT 'COUPON_TYPE',   COALESCE(COUPON_TYPE,'<null>'),         COUNT(*), ROUND(SUM(GMV),0) FROM demo_db.public.product_analytics_case_v2 GROUP BY 1,2
UNION ALL SELECT 'UTM_SOURCE',    COALESCE(UTM_SOURCE,'<null>'),          COUNT(*), ROUND(SUM(GMV),0) FROM demo_db.public.product_analytics_case_v2 GROUP BY 1,2
UNION ALL SELECT 'UTM_MEDIUM',    COALESCE(UTM_MEDIUM,'<null>'),          COUNT(*), ROUND(SUM(GMV),0) FROM demo_db.public.product_analytics_case_v2 GROUP BY 1,2
ORDER BY DIM, ORDERS DESC;

-- ---------------------------------------------------------------------
-- 3. Guest behavior & cross-channel identity 
-- ---------------------------------------------------------------------
-- Findings:
--   GUESTS               = 698,026
--   GUESTS_2PLUS         = 211,889  (30.4% repeat)
--   GUESTS_BOTH_CHANNELS = 30,833   -> GUEST_ID IS shared across App & Web
--   GUESTS_ANY_APP       = 90,657
--   MAX_ORDERS_ONE_GUEST = 588  -> NOT a bot: single location/brand over
--       824 days (~0.7 orders/day) = legitimate super-regular. KEEP.
WITH g AS (
  SELECT GUEST_ID,
         COUNT(*)                                        AS ORDERS,
         COUNT(DISTINCT IFF(ORDER_SOURCE='App',1,NULL))  AS HAS_APP,
         COUNT(DISTINCT IFF(ORDER_SOURCE='Web',1,NULL))  AS HAS_WEB
  FROM demo_db.public.product_analytics_case_v2
  GROUP BY 1
)
SELECT
  COUNT(*)                                  AS GUESTS,
  SUM(IFF(ORDERS>=2,1,0))                    AS GUESTS_2PLUS,
  ROUND(100*AVG(IFF(ORDERS>=2,1,0)),1)       AS PCT_REPEAT,
  SUM(IFF(HAS_APP=1 AND HAS_WEB=1,1,0))      AS GUESTS_BOTH_CHANNELS,
  SUM(IFF(HAS_APP=1,1,0))                    AS GUESTS_ANY_APP,
  MAX(ORDERS)                                AS MAX_ORDERS_ONE_GUEST
FROM g;

-- ---------------------------------------------------------------------
-- 4. Location tenure feasibility (for cohort / same-store analysis)
-- ---------------------------------------------------------------------
-- Use DAY-level tenure (first->last order) rather than month diff, since a
-- month diff mis-measures locations that start/end mid-month.
-- A clean YoY (same-store) requires >= 2 full years of history.
-- Findings (295 locations):
--   >= 1 year (365d): 220     -> supports MoM / tenure-cohort view (inclusive)
--   >= 2 years (730d): 61     -> supports rigorous same-store YoY (thin)
--   median tenure = 498 days | max = 1,838 days (~5 yrs)
WITH loc AS (
  SELECT LOCATION_ID,
         DATEDIFF('day', MIN(ORDER_CREATED_AT_PT), MAX(ORDER_CREATED_AT_PT))+1 AS TENURE_DAYS
  FROM demo_db.public.product_analytics_case_v2 GROUP BY 1
)
SELECT
  COUNT(*)                        AS LOCATIONS,
  SUM(IFF(TENURE_DAYS>=365,1,0))  AS LOC_1YR_PLUS,
  SUM(IFF(TENURE_DAYS>=730,1,0))  AS LOC_2YR_PLUS,
  ROUND(MEDIAN(TENURE_DAYS),0)    AS MEDIAN_TENURE_DAYS,
  MAX(TENURE_DAYS)                AS MAX_TENURE_DAYS
FROM loc;

-- ---------------------------------------------------------------------
-- 5. Owner subscription revenue proxy (pricing model)
-- ---------------------------------------------------------------------
-- Plans: Flat $499/mo  OR  $249/mo + 5% of GMV. Breakeven = $5,000 GMV/mo.
-- We estimate on a DAILY-rate basis to avoid partial first/last months
-- deflating a location's volume: avg_daily_gmv = total_gmv / tenure_days,
-- and compare to the daily breakeven = 5000 * 12 / 365 = $164.38/day.
-- Assumptions (logged): (a) each location sits on the cheaper plan = revenue
-- FLOOR; (b) one plan per location (a subscription is not re-chosen monthly);
-- (c) the 5% fee applies to GMV only (delivery fee excluded).
-- Findings: 295 locs | daily breakeven $164.38 | median $304/day | mean $439/day
--           81.7% (241) above breakeven -> flat plan
--           Est. Owner revenue ~= $144,059/mo (~$1.73M ARR on sample)
--           (only 1 location has <30-day tenure -> thin-tenure not a concern)
WITH loc AS (
  SELECT LOCATION_ID,
         SUM(GMV)                                                          AS TOTAL_GMV,
         DATEDIFF('day', MIN(ORDER_CREATED_AT_PT), MAX(ORDER_CREATED_AT_PT))+1 AS TENURE_DAYS
  FROM demo_db.public.product_analytics_case_v2 WHERE GMV > 0 GROUP BY 1
), d AS (
  SELECT LOCATION_ID, TOTAL_GMV, TENURE_DAYS, TOTAL_GMV/TENURE_DAYS AS AVG_DAILY_GMV
  FROM loc
)
SELECT
  COUNT(*)                                                    AS LOCATIONS,
  SUM(IFF(TENURE_DAYS<30,1,0))                                AS LOCS_UNDER_30D_TENURE,
  ROUND(5000.0*12/365,2)                                      AS DAILY_BREAKEVEN,
  ROUND(MEDIAN(AVG_DAILY_GMV),2)                              AS MEDIAN_DAILY_GMV,
  ROUND(AVG(AVG_DAILY_GMV),2)                                 AS MEAN_DAILY_GMV,
  SUM(IFF(AVG_DAILY_GMV >= 5000.0*12/365,1,0))                AS LOCS_ABOVE_BE,
  ROUND(100*AVG(IFF(AVG_DAILY_GMV >= 5000.0*12/365,1,0)),1)   AS PCT_ABOVE_BE,
  -- monthly GMV implied by daily rate = avg_daily * 365/12
  ROUND(SUM(LEAST(499, 249 + 0.05*(AVG_DAILY_GMV*365/12))),0) AS EST_MONTHLY_OWNER_REV
FROM d;

-- ---------------------------------------------------------------------
-- 6. Calendar-day continuity
-- ---------------------------------------------------------------------
--   Date range        = 2020-05-18 -> 2025-07-29  (1,899 calendar days)
--   DAYS_WITH_ORDERS  = 1,854      (97.63% of calendar covered)
--   DAYS_ZERO_ORDERS  = 45         -> ALL fall in 2020, none in 2021+
--   First gap 2020-06-01 | last gap 2020-12-25
--   43 of 45 gaps are the Jun 1 + Jun 6->Jul 16 2020 stretch, when only 1 location was live
--   Remaining 2 gaps are isolated holidays: Thanksgiving (2020-11-26) and
--     Christmas (2020-12-25). No gaps once the sample scales (2021 onward).

WITH b AS (
  SELECT MIN(ORDER_CREATED_AT_PT::DATE) AS D0, MAX(ORDER_CREATED_AT_PT::DATE) AS D1
  FROM demo_db.public.product_analytics_case_v2
), spine AS (
  -- one row per calendar day in [D0, D1]
  SELECT D FROM (
    SELECT DATEADD('day', SEQ4(), (SELECT D0 FROM b)) AS D
    FROM TABLE(GENERATOR(ROWCOUNT => 100000))
  ) WHERE D <= (SELECT D1 FROM b)
), daily AS (
  SELECT ORDER_CREATED_AT_PT::DATE AS D, COUNT(*) AS ORDERS
  FROM demo_db.public.product_analytics_case_v2 GROUP BY 1
)
SELECT
  (SELECT D0 FROM b)                                    AS MIN_DATE,
  (SELECT D1 FROM b)                                    AS MAX_DATE,
  COUNT(*)                                              AS CALENDAR_DAYS,
  COUNT(daily.ORDERS)                                   AS DAYS_WITH_ORDERS,
  SUM(IFF(daily.ORDERS IS NULL,1,0))                    AS DAYS_ZERO_ORDERS,
  ROUND(100.0*COUNT(daily.ORDERS)/COUNT(*),2)           AS PCT_DAYS_COVERED,
  SUM(IFF(daily.ORDERS IS NULL AND spine.D <  '2021-01-01',1,0)) AS GAPS_2020,
  SUM(IFF(daily.ORDERS IS NULL AND spine.D >= '2021-01-01',1,0)) AS GAPS_2021_PLUS,
  ROUND(AVG(daily.ORDERS),0)                            AS AVG_ORDERS_ACTIVE_DAY
FROM spine LEFT JOIN daily ON spine.D = daily.D;
