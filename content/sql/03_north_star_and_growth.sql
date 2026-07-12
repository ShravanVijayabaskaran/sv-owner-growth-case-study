-- =====================================================================
-- Contents (all-location view first, segment cuts second in every section):
--   Q1a  North Star -- per-location tenure YoY (CAGR), ALL locations
--   Q1b  North Star -- per-location rolling 30-day growth (geometric), ALL
--   Q1c  Growth-lever decomposition (customers x orders/cx x AOV), ALL
--   Q3   Segmented robustness: ALL rollup FIRST, then single/multi/top-brand
--   Q3f  AOV DRILL-DOWN by segment: AOV = items/order x price/item (log-additive)
--   Q4   SURVIVORSHIP: YoY + 30-day growth split by CHURNED vs RETAINED (churn
--        defined at BRAND level), sizing, churn by segment, and normalized
--        growth DISTRIBUTIONS (Q4e/Q4f) -- addresses survivor bias in Q1a/Q1b
-- =====================================================================

-- ---------------------------------------------------------------------
-- Q1a — NORTH STAR: Per-location TENURE YoY growth (locations >=760 days).
-- ---------------------------------------------------------------------
WITH base AS (
  SELECT LOCATION_ID, ORDER_CREATED_AT_PT, GMV
  FROM demo_db.public.product_analytics_case_v2_CLEAN WHERE GMV > 0
), loc_span AS (
  SELECT LOCATION_ID, MIN(ORDER_CREATED_AT_PT) AS FIRST_TS,
         DATEDIFF('day', MIN(ORDER_CREATED_AT_PT), MAX(ORDER_CREATED_AT_PT)) AS SPAN_DAYS
  FROM base GROUP BY 1
), tenure_year AS (                          -- GMV per (location, tenure-year); day-30 clock (W0 ramp excluded)
  SELECT b.LOCATION_ID,
         FLOOR((DATEDIFF('day', s.FIRST_TS, b.ORDER_CREATED_AT_PT) - 30)/365) AS TY,
         SUM(b.GMV) AS GMV, s.SPAN_DAYS
  FROM base b JOIN loc_span s USING (LOCATION_ID)
  WHERE s.SPAN_DAYS >= 760                                          -- need 2 full years AFTER the first 30 days
    AND DATEDIFF('day', s.FIRST_TS, b.ORDER_CREATED_AT_PT) >= 30    -- drop the first 30 days (onboarding ramp)
  GROUP BY 1,2, s.SPAN_DAYS
), complete_ty AS (                          -- keep only fully-observed tenure-years (day-30 clock)
  SELECT LOCATION_ID, TY, GMV FROM tenure_year WHERE SPAN_DAYS - 30 >= (TY + 1) * 365
), loc_yoy AS (                              -- per-location COMPOUND (geometric) YoY = CAGR
  SELECT c.LOCATION_ID,
         EXP(AVG(LN(c.GMV / p.GMV))) - 1 AS CAGR_YOY,   -- geometric mean of annual ratios
         COUNT(*) AS N_PAIRS
  FROM complete_ty c
  JOIN complete_ty p ON p.LOCATION_ID = c.LOCATION_ID AND p.TY = c.TY - 1
  GROUP BY 1
)
SELECT
  COUNT(*)                                                              AS N_LOCS,
  SUM(N_PAIRS)                                                          AS N_YOY_OBS,
  ROUND(MEDIAN(CAGR_YOY)*100,1)                                         AS MEDIAN_YOY_PCT,  -- << NORTH STAR (geometric within loc, median across)
  ROUND(AVG(CAGR_YOY)*100,1)                                            AS MEAN_YOY_PCT,    -- equal-weighted avg location (skew-sensitive)
  ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY CAGR_YOY)*100,1)   AS P25_PCT,
  ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY CAGR_YOY)*100,1)   AS P75_PCT,
  ROUND(AVG(IFF(CAGR_YOY>0,1,0))*100,1)                                 AS PCT_LOCS_GROWING
FROM loc_yoy;

-- ---------------------------------------------------------------------
-- Q1b — Per-location ROLLING 30-DAY growth (locations >=60 days).
-- ---------------------------------------------------------------------
WITH base AS (
  SELECT LOCATION_ID, ORDER_CREATED_AT_PT, GMV
  FROM demo_db.public.product_analytics_case_v2_CLEAN WHERE GMV > 0
), loc_span AS (
  SELECT LOCATION_ID, MIN(ORDER_CREATED_AT_PT) AS FIRST_TS,
         DATEDIFF('day', MIN(ORDER_CREATED_AT_PT), MAX(ORDER_CREATED_AT_PT)) AS SPAN_DAYS
  FROM base GROUP BY 1
), win AS (                                   -- GMV per (location, 30-day window)
  SELECT b.LOCATION_ID,
         FLOOR(DATEDIFF('day', s.FIRST_TS, b.ORDER_CREATED_AT_PT)/30) AS W,
         SUM(b.GMV) AS GMV, MIN(s.SPAN_DAYS) AS SPAN_DAYS
  FROM base b JOIN loc_span s USING (LOCATION_ID)
  WHERE s.SPAN_DAYS >= 60
  GROUP BY 1,2
), win_c AS (                                 -- complete windows only
  SELECT LOCATION_ID, W, GMV FROM win WHERE SPAN_DAYS >= (W + 1) * 30
), growth AS (                                -- consecutive-window LOG growth
  SELECT c.LOCATION_ID, c.W, LN(c.GMV / p.GMV) AS L
  FROM win_c c
  JOIN win_c p ON p.LOCATION_ID = c.LOCATION_ID AND p.W = c.W - 1
), loc_growth AS (                            -- per-location GEOMETRIC mean (mean of log)
  SELECT LOCATION_ID,
         AVG(IFF(W >= 2, L, NULL)) AS MEANLOG_POST,
         AVG(L)                    AS MEANLOG_ALL
  FROM growth GROUP BY 1
)
SELECT
  COUNT(*)                                            AS N_LOCS,
  ROUND((EXP(MEDIAN(MEANLOG_POST))-1)*100,2)          AS MEDIAN_30D_POSTRAMP_PCT,   -- << headline (geometric within loc, median across)
  ROUND(AVG(EXP(MEANLOG_POST)-1)*100,2)               AS MEAN_30D_POSTRAMP_PCT,     -- equal-weighted avg of per-location rates (skew-sensitive)
  ROUND((EXP(MEDIAN(MEANLOG_ALL))-1)*100,2)           AS MEDIAN_30D_INCL_RAMP_PCT,
  ROUND(AVG(IFF(MEANLOG_POST>0,1,0))*100,1)           AS PCT_LOCS_GROWING_POSTRAMP
FROM loc_growth;

-- ---------------------------------------------------------------------
-- Q1c — GROWTH LEVER DECOMPOSITION (what drives the Q1b North Star).
-- ---------------------------------------------------------------------
WITH base AS (
  SELECT LOCATION_ID, GUEST_ID, ORDER_CREATED_AT_PT, GMV
  FROM demo_db.public.product_analytics_case_v2_CLEAN WHERE GMV > 0
), loc_span AS (
  SELECT LOCATION_ID, MIN(ORDER_CREATED_AT_PT) AS FIRST_TS,
         DATEDIFF('day', MIN(ORDER_CREATED_AT_PT), MAX(ORDER_CREATED_AT_PT)) AS SPAN_DAYS
  FROM base GROUP BY 1
), win AS (                                   -- per (location, 30-day window)
  SELECT b.LOCATION_ID,
         FLOOR(DATEDIFF('day', s.FIRST_TS, b.ORDER_CREATED_AT_PT)/30) AS W,
         COUNT(DISTINCT b.GUEST_ID) AS CX, COUNT(*) AS ORD, SUM(b.GMV) AS GMV,
         MIN(s.SPAN_DAYS) AS SPAN_DAYS
  FROM base b JOIN loc_span s USING (LOCATION_ID)
  WHERE s.SPAN_DAYS >= 60
  GROUP BY 1,2
), win_c AS (                                 -- complete windows; derive the 3 levers
  SELECT LOCATION_ID, W, CX, ORD/CX AS OPC, GMV/ORD AS AOV, GMV
  FROM win WHERE SPAN_DAYS >= (W + 1) * 30
), growth AS (                                -- consecutive-window log growth per lever
  SELECT c.LOCATION_ID, c.W,
         LN(c.CX / p.CX)   AS L_CX,
         LN(c.OPC / p.OPC) AS L_OPC,
         LN(c.AOV / p.AOV) AS L_AOV,
         LN(c.GMV / p.GMV) AS L_GMV,
         c.CX / p.CX  - 1  AS G_CX,
         c.OPC / p.OPC - 1 AS G_OPC,
         c.AOV / p.AOV - 1 AS G_AOV,
         c.GMV / p.GMV - 1 AS G_GMV
  FROM win_c c
  JOIN win_c p ON p.LOCATION_ID = c.LOCATION_ID AND p.W = c.W - 1
), loc AS (                                   -- per-location mean growth (post-ramp)
  SELECT LOCATION_ID,
         AVG(IFF(W>=2, G_CX, NULL))  AS A_CX,  AVG(IFF(W>=2, G_OPC, NULL)) AS A_OPC,
         AVG(IFF(W>=2, G_AOV, NULL)) AS A_AOV, AVG(IFF(W>=2, G_GMV, NULL)) AS A_GMV,
         AVG(IFF(W>=2, L_CX, NULL))  AS LA_CX, AVG(IFF(W>=2, L_OPC, NULL)) AS LA_OPC,
         AVG(IFF(W>=2, L_AOV, NULL)) AS LA_AOV,AVG(IFF(W>=2, L_GMV, NULL)) AS LA_GMV
  FROM growth GROUP BY 1
), agg AS (
  SELECT COUNT(*) AS N,
         MEDIAN(A_CX) mcx, MEDIAN(A_OPC) mopc, MEDIAN(A_AOV) maov, MEDIAN(A_GMV) mgmv,
         AVG(LA_CX) gcx, AVG(LA_OPC) gopc, AVG(LA_AOV) gaov, AVG(LA_GMV) ggmv
  FROM loc
)
SELECT 'unique_customers'    AS LEVER, ROUND(mcx*100,2)  AS MEDIAN_30D_PCT, ROUND(gcx*100,2)  AS GEO_30D_PCT, ROUND(100*gcx/ggmv,1)  AS CONTRIB_SHARE_PCT FROM agg
UNION ALL SELECT 'orders_per_customer', ROUND(mopc*100,2), ROUND(gopc*100,2), ROUND(100*gopc/ggmv,1) FROM agg
UNION ALL SELECT 'aov',                 ROUND(maov*100,2), ROUND(gaov*100,2), ROUND(100*gaov/ggmv,1) FROM agg
UNION ALL SELECT 'gmv_total (=product)',ROUND(mgmv*100,2), ROUND(ggmv*100,2), 100.0                  FROM agg;

-- =====================================================================
-- Q3 — SEGMENTED VIEWS: brand-concentration robustness
-- ---------------------------------------------------------------------

-- location -> segment map (reused in analysis)
CREATE OR REPLACE VIEW demo_db.public.product_analytics_case_v2_LOC_SEG AS
WITH brand_loc AS (
  SELECT BRAND_ID, COUNT(DISTINCT LOCATION_ID) AS N_LOC
  FROM demo_db.public.product_analytics_case_v2_CLEAN GROUP BY 1
)
SELECT DISTINCT c.LOCATION_ID, c.BRAND_ID,
  CASE WHEN c.BRAND_ID = 'a6d4a2d0afc875796c1a6b51e106fdd8' THEN 'top_brand'
       WHEN bl.N_LOC = 1                                    THEN 'single_loc'
       ELSE 'multi_loc' END                                 AS SEGMENT
FROM demo_db.public.product_analytics_case_v2_CLEAN c
JOIN brand_loc bl USING (BRAND_ID);

-- Q3a — concentration: how lopsided is the book of business?
SELECT
  sg.SEGMENT,
  COUNT(DISTINCT c.BRAND_ID)                                                        AS N_BRANDS,
  COUNT(DISTINCT c.LOCATION_ID)                                                     AS N_LOCATIONS,
  ROUND(100*COUNT(DISTINCT c.LOCATION_ID)/(SELECT COUNT(DISTINCT LOCATION_ID) FROM demo_db.public.product_analytics_case_v2_CLEAN),1) AS PCT_LOCS,
  ROUND(100*SUM(c.GMV)/(SELECT SUM(GMV) FROM demo_db.public.product_analytics_case_v2_CLEAN),1)   AS PCT_GMV,
  ROUND(100*COUNT(*)/(SELECT COUNT(*) FROM demo_db.public.product_analytics_case_v2_CLEAN),1)     AS PCT_ORDERS
FROM demo_db.public.product_analytics_case_v2_CLEAN c
JOIN demo_db.public.product_analytics_case_v2_LOC_SEG sg USING (LOCATION_ID)
GROUP BY 1 ORDER BY 1;

-- Q3b — Q1a (tenure YoY CAGR) by segment + ALL rollup.
WITH base AS (
  SELECT LOCATION_ID, ORDER_CREATED_AT_PT, GMV
  FROM demo_db.public.product_analytics_case_v2_CLEAN WHERE GMV > 0
), loc_span AS (
  SELECT LOCATION_ID, MIN(ORDER_CREATED_AT_PT) AS FIRST_TS,
         DATEDIFF('day', MIN(ORDER_CREATED_AT_PT), MAX(ORDER_CREATED_AT_PT)) AS SPAN_DAYS
  FROM base GROUP BY 1
), tenure_year AS (
  SELECT b.LOCATION_ID, FLOOR((DATEDIFF('day', s.FIRST_TS, b.ORDER_CREATED_AT_PT) - 30)/365) AS TY,
         SUM(b.GMV) AS GMV, s.SPAN_DAYS
  FROM base b JOIN loc_span s USING (LOCATION_ID) WHERE s.SPAN_DAYS >= 760 AND DATEDIFF('day', s.FIRST_TS, b.ORDER_CREATED_AT_PT) >= 30 GROUP BY 1,2, s.SPAN_DAYS
), complete_ty AS (
  SELECT LOCATION_ID, TY, GMV FROM tenure_year WHERE SPAN_DAYS - 30 >= (TY + 1) * 365
), loc_yoy AS (
  SELECT c.LOCATION_ID, EXP(AVG(LN(c.GMV / p.GMV))) - 1 AS CAGR_YOY, COUNT(*) AS N_PAIRS
  FROM complete_ty c JOIN complete_ty p ON p.LOCATION_ID = c.LOCATION_ID AND p.TY = c.TY - 1
  GROUP BY 1
)
SELECT
  COALESCE(sg.SEGMENT,'all')                    AS SEGMENT,
  COUNT(*)                                      AS N_LOCS,
  SUM(y.N_PAIRS)                                AS N_YOY_OBS,
  ROUND(MEDIAN(y.CAGR_YOY)*100,1)               AS MEDIAN_YOY_PCT,   -- << robust headline
  ROUND(AVG(y.CAGR_YOY)*100,1)                  AS MEAN_YOY_PCT,     -- equal-weighted avg location (whale-sensitive)
  ROUND(AVG(IFF(y.CAGR_YOY>0,1,0))*100,1)       AS PCT_LOCS_GROWING
FROM loc_yoy y JOIN demo_db.public.product_analytics_case_v2_LOC_SEG sg USING (LOCATION_ID)
GROUP BY GROUPING SETS ((sg.SEGMENT),()) ORDER BY 1;

-- Q3c — Q1b (rolling 30-day growth, post-ramp) by segment + ALL rollup.
WITH base AS (
  SELECT LOCATION_ID, ORDER_CREATED_AT_PT, GMV
  FROM demo_db.public.product_analytics_case_v2_CLEAN WHERE GMV > 0
), loc_span AS (
  SELECT LOCATION_ID, MIN(ORDER_CREATED_AT_PT) AS FIRST_TS,
         DATEDIFF('day', MIN(ORDER_CREATED_AT_PT), MAX(ORDER_CREATED_AT_PT)) AS SPAN_DAYS
  FROM base GROUP BY 1
), win AS (
  SELECT b.LOCATION_ID, FLOOR(DATEDIFF('day', s.FIRST_TS, b.ORDER_CREATED_AT_PT)/30) AS W,
         SUM(b.GMV) AS GMV, MIN(s.SPAN_DAYS) AS SPAN_DAYS
  FROM base b JOIN loc_span s USING (LOCATION_ID) WHERE s.SPAN_DAYS >= 60 GROUP BY 1,2
), win_c AS (
  SELECT LOCATION_ID, W, GMV FROM win WHERE SPAN_DAYS >= (W + 1) * 30
), growth AS (
  SELECT c.LOCATION_ID, c.W, LN(c.GMV / p.GMV) AS L
  FROM win_c c JOIN win_c p ON p.LOCATION_ID = c.LOCATION_ID AND p.W = c.W - 1
), loc_growth AS (
  SELECT LOCATION_ID, AVG(IFF(W >= 2, L, NULL)) AS MEANLOG_POST FROM growth GROUP BY 1
)
SELECT
  COALESCE(sg.SEGMENT,'all')                          AS SEGMENT,
  COUNT(*)                                            AS N_LOCS,
  ROUND((EXP(MEDIAN(MEANLOG_POST))-1)*100,2)          AS MEDIAN_30D_PCT,   -- << robust headline
  ROUND(AVG(EXP(MEANLOG_POST)-1)*100,2)               AS MEAN_30D_PCT,     -- equal-weighted avg location (whale/outlier-sensitive)
  ROUND(AVG(IFF(MEANLOG_POST>0,1,0))*100,1)           AS PCT_LOCS_GROWING
FROM loc_growth lg JOIN demo_db.public.product_analytics_case_v2_LOC_SEG sg USING (LOCATION_ID)
GROUP BY GROUPING SETS ((sg.SEGMENT),()) ORDER BY 1;

-- Q3e — Q1c (growth-lever decomposition) by segment + ALL rollup.
WITH base AS (
  SELECT LOCATION_ID, GUEST_ID, ORDER_CREATED_AT_PT, GMV
  FROM demo_db.public.product_analytics_case_v2_CLEAN WHERE GMV > 0
), loc_span AS (
  SELECT LOCATION_ID, MIN(ORDER_CREATED_AT_PT) AS FIRST_TS,
         DATEDIFF('day', MIN(ORDER_CREATED_AT_PT), MAX(ORDER_CREATED_AT_PT)) AS SPAN_DAYS
  FROM base GROUP BY 1
), win AS (
  SELECT b.LOCATION_ID, FLOOR(DATEDIFF('day', s.FIRST_TS, b.ORDER_CREATED_AT_PT)/30) AS W,
         COUNT(DISTINCT b.GUEST_ID) AS CX, COUNT(*) AS ORD, SUM(b.GMV) AS GMV, MIN(s.SPAN_DAYS) AS SPAN_DAYS
  FROM base b JOIN loc_span s USING (LOCATION_ID) WHERE s.SPAN_DAYS >= 60 GROUP BY 1,2
), win_c AS (
  SELECT LOCATION_ID, W, CX, ORD/CX AS OPC, GMV/ORD AS AOV, GMV
  FROM win WHERE SPAN_DAYS >= (W + 1) * 30
), growth AS (
  SELECT c.LOCATION_ID, c.W,
         LN(c.CX/p.CX) AS L_CX, LN(c.OPC/p.OPC) AS L_OPC, LN(c.AOV/p.AOV) AS L_AOV, LN(c.GMV/p.GMV) AS L_GMV,
         c.CX/p.CX-1 AS G_CX, c.OPC/p.OPC-1 AS G_OPC, c.AOV/p.AOV-1 AS G_AOV, c.GMV/p.GMV-1 AS G_GMV
  FROM win_c c JOIN win_c p ON p.LOCATION_ID = c.LOCATION_ID AND p.W = c.W - 1
), loc AS (
  SELECT LOCATION_ID,
         AVG(IFF(W>=2,G_CX,NULL)) A_CX,  AVG(IFF(W>=2,G_OPC,NULL)) A_OPC, AVG(IFF(W>=2,G_AOV,NULL)) A_AOV, AVG(IFF(W>=2,G_GMV,NULL)) A_GMV,
         AVG(IFF(W>=2,L_CX,NULL)) LA_CX, AVG(IFF(W>=2,L_OPC,NULL)) LA_OPC,AVG(IFF(W>=2,L_AOV,NULL)) LA_AOV,AVG(IFF(W>=2,L_GMV,NULL)) LA_GMV
  FROM growth GROUP BY 1
), seg_loc AS (
  SELECT l.*, sg.SEGMENT FROM loc l JOIN demo_db.public.product_analytics_case_v2_LOC_SEG sg USING (LOCATION_ID)
), agg AS (
  SELECT COALESCE(SEGMENT,'all') AS SEGMENT, COUNT(*) AS N,
         MEDIAN(A_CX) mcx, MEDIAN(A_OPC) mopc, MEDIAN(A_AOV) maov, MEDIAN(A_GMV) mgmv,
         AVG(LA_CX) gcx, AVG(LA_OPC) gopc, AVG(LA_AOV) gaov, AVG(LA_GMV) ggmv
  FROM seg_loc GROUP BY GROUPING SETS ((SEGMENT),())
)
SELECT SEGMENT, N, 'unique_customers'     AS LEVER, ROUND(mcx*100,2)  AS MEDIAN_30D_PCT, ROUND(gcx*100,2)  AS GEO_30D_PCT, ROUND(100*gcx/ggmv,1)  AS CONTRIB_SHARE_PCT FROM agg
UNION ALL SELECT SEGMENT, N, 'orders_per_customer', ROUND(mopc*100,2), ROUND(gopc*100,2), ROUND(100*gopc/ggmv,1) FROM agg
UNION ALL SELECT SEGMENT, N, 'aov',                 ROUND(maov*100,2), ROUND(gaov*100,2), ROUND(100*gaov/ggmv,1) FROM agg
UNION ALL SELECT SEGMENT, N, 'gmv_total (=product)',ROUND(mgmv*100,2), ROUND(ggmv*100,2), 100.0                  FROM agg
ORDER BY SEGMENT, LEVER;

-- ---------------------------------------------------------------------
-- Q3f — AOV DRILL-DOWN: decompose the Q3e AOV lever into its two factors.
WITH base AS (
  SELECT LOCATION_ID, ORDER_CREATED_AT_PT, GMV, NUMBER_OF_ITEMS AS ITEMS
  FROM demo_db.public.product_analytics_case_v2_CLEAN WHERE GMV > 0 AND NUMBER_OF_ITEMS > 0
), loc_span AS (
  SELECT LOCATION_ID, MIN(ORDER_CREATED_AT_PT) AS FIRST_TS,
         DATEDIFF('day', MIN(ORDER_CREATED_AT_PT), MAX(ORDER_CREATED_AT_PT)) AS SPAN_DAYS
  FROM base GROUP BY 1
), win AS (
  SELECT b.LOCATION_ID, FLOOR(DATEDIFF('day', s.FIRST_TS, b.ORDER_CREATED_AT_PT)/30) AS W,
         COUNT(*) AS ORD, SUM(b.GMV) AS GMV, SUM(b.ITEMS) AS ITEMS, MIN(s.SPAN_DAYS) AS SPAN_DAYS
  FROM base b JOIN loc_span s USING (LOCATION_ID) WHERE s.SPAN_DAYS >= 60 GROUP BY 1,2
), win_c AS (
  SELECT LOCATION_ID, W, GMV/ORD AS AOV, ITEMS/ORD AS IPO, GMV/ITEMS AS PPI
  FROM win WHERE SPAN_DAYS >= (W + 1) * 30
), growth AS (
  SELECT c.LOCATION_ID, c.W,
         LN(c.AOV/p.AOV) AS L_AOV, LN(c.IPO/p.IPO) AS L_IPO, LN(c.PPI/p.PPI) AS L_PPI
  FROM win_c c JOIN win_c p ON p.LOCATION_ID = c.LOCATION_ID AND p.W = c.W - 1
), loc AS (
  SELECT LOCATION_ID,
         AVG(IFF(W>=2, L_AOV, NULL)) LA_AOV, AVG(IFF(W>=2, L_IPO, NULL)) LA_IPO, AVG(IFF(W>=2, L_PPI, NULL)) LA_PPI
  FROM growth GROUP BY 1
), seg_loc AS (
  SELECT l.*, sg.SEGMENT FROM loc l JOIN demo_db.public.product_analytics_case_v2_LOC_SEG sg USING (LOCATION_ID)
  WHERE LA_AOV IS NOT NULL
), agg AS (
  SELECT COALESCE(SEGMENT,'all') AS SEGMENT, COUNT(*) AS N,
         AVG(LA_AOV) gaov, AVG(LA_IPO) gipo, AVG(LA_PPI) gppi,
         MEDIAN(LA_AOV) maov, MEDIAN(LA_IPO) mipo, MEDIAN(LA_PPI) mppi
  FROM seg_loc GROUP BY GROUPING SETS ((SEGMENT),())
)
SELECT SEGMENT, N,
  ROUND((EXP(gaov)-1)*100,3) AS AOV_GEO_PCT,           -- per-30d geometric AOV growth
  ROUND((EXP(gipo)-1)*100,3) AS ITEMS_PER_ORDER_GEO_PCT,
  ROUND((EXP(gppi)-1)*100,3) AS PRICE_PER_ITEM_GEO_PCT,
  ROUND(100*gipo/NULLIF(gaov,0),1) AS ITEMS_SHARE_OF_AOV,  -- signed; +/- sum to 100
  ROUND(100*gppi/NULLIF(gaov,0),1) AS PRICE_SHARE_OF_AOV,
  ROUND((EXP(maov)-1)*100,3) AS AOV_MED_PCT,
  ROUND((EXP(mipo)-1)*100,3) AS ITEMS_MED_PCT,
  ROUND((EXP(mppi)-1)*100,3) AS PRICE_MED_PCT
FROM agg ORDER BY SEGMENT;

-- =====================================================================
-- Q4 — SURVIVORSHIP: growth split by CHURNED vs RETAINED locations.
-- ---------------------------------------------------------------------

-- Q4a — YoY (Q1a engine) split by BRAND-level retention
WITH base AS (
  SELECT LOCATION_ID, BRAND_ID, ORDER_CREATED_AT_PT, GMV FROM demo_db.public.product_analytics_case_v2_CLEAN WHERE GMV > 0
), bound AS (SELECT MAX(ORDER_CREATED_AT_PT) AS DMAX FROM base
), brand_last AS (SELECT BRAND_ID, MAX(ORDER_CREATED_AT_PT) AS BLAST FROM base GROUP BY 1
), loc_brand AS (SELECT DISTINCT LOCATION_ID, BRAND_ID FROM base
), retn AS (
  SELECT lb.LOCATION_ID, IFF(DATEDIFF('day', br.BLAST, d.DMAX) <= 14,'retained','churned') AS RET
  FROM loc_brand lb JOIN brand_last br USING (BRAND_ID) CROSS JOIN bound d
), loc_span AS (
  SELECT LOCATION_ID, MIN(ORDER_CREATED_AT_PT) AS FIRST_TS,
         DATEDIFF('day', MIN(ORDER_CREATED_AT_PT), MAX(ORDER_CREATED_AT_PT)) AS SPAN_DAYS
  FROM base GROUP BY 1
), tenure_year AS (
  SELECT b.LOCATION_ID, FLOOR((DATEDIFF('day', s.FIRST_TS, b.ORDER_CREATED_AT_PT) - 30)/365) AS TY,
         SUM(b.GMV) AS GMV, s.SPAN_DAYS
  FROM base b JOIN loc_span s USING (LOCATION_ID) WHERE s.SPAN_DAYS >= 760 AND DATEDIFF('day', s.FIRST_TS, b.ORDER_CREATED_AT_PT) >= 30 GROUP BY 1,2,s.SPAN_DAYS
), complete_ty AS (SELECT LOCATION_ID, TY, GMV FROM tenure_year WHERE SPAN_DAYS - 30 >= (TY+1)*365
), loc_yoy AS (
  SELECT c.LOCATION_ID, EXP(AVG(LN(c.GMV/p.GMV)))-1 AS CAGR_YOY
  FROM complete_ty c JOIN complete_ty p ON p.LOCATION_ID=c.LOCATION_ID AND p.TY=c.TY-1 GROUP BY 1
)
SELECT COALESCE(r.RET,'all') AS RETENTION, COUNT(*) AS N_LOCS,
  ROUND(MEDIAN(y.CAGR_YOY)*100,1) AS MEDIAN_YOY_PCT,
  ROUND(AVG(y.CAGR_YOY)*100,1)    AS MEAN_YOY_PCT,
  ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY y.CAGR_YOY)*100,1) AS P25_PCT,
  ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY y.CAGR_YOY)*100,1) AS P75_PCT,
  ROUND(AVG(IFF(y.CAGR_YOY>0,1,0))*100,1) AS PCT_GROWING
FROM loc_yoy y JOIN retn r USING (LOCATION_ID)
GROUP BY GROUPING SETS ((r.RET),()) ORDER BY 1;

-- Q4b — Rolling 30-day (Q1b engine) split by BRAND-level retention
WITH base AS (
  SELECT LOCATION_ID, BRAND_ID, ORDER_CREATED_AT_PT, GMV FROM demo_db.public.product_analytics_case_v2_CLEAN WHERE GMV > 0
), bound AS (SELECT MAX(ORDER_CREATED_AT_PT) AS DMAX FROM base
), brand_last AS (SELECT BRAND_ID, MAX(ORDER_CREATED_AT_PT) AS BLAST FROM base GROUP BY 1
), loc_brand AS (SELECT DISTINCT LOCATION_ID, BRAND_ID FROM base
), retn AS (
  SELECT lb.LOCATION_ID, IFF(DATEDIFF('day', br.BLAST, d.DMAX) <= 14,'retained','churned') AS RET
  FROM loc_brand lb JOIN brand_last br USING (BRAND_ID) CROSS JOIN bound d
), loc_span AS (
  SELECT LOCATION_ID, MIN(ORDER_CREATED_AT_PT) AS FIRST_TS,
         DATEDIFF('day', MIN(ORDER_CREATED_AT_PT), MAX(ORDER_CREATED_AT_PT)) AS SPAN_DAYS
  FROM base GROUP BY 1
), win AS (
  SELECT b.LOCATION_ID, FLOOR(DATEDIFF('day', s.FIRST_TS, b.ORDER_CREATED_AT_PT)/30) AS W,
         SUM(b.GMV) AS GMV, MIN(s.SPAN_DAYS) AS SPAN_DAYS
  FROM base b JOIN loc_span s USING (LOCATION_ID) WHERE s.SPAN_DAYS >= 60 GROUP BY 1,2
), win_c AS (SELECT LOCATION_ID, W, GMV FROM win WHERE SPAN_DAYS >= (W+1)*30
), growth AS (
  SELECT c.LOCATION_ID, c.W, LN(c.GMV/p.GMV) AS L
  FROM win_c c JOIN win_c p ON p.LOCATION_ID=c.LOCATION_ID AND p.W=c.W-1
), loc_growth AS (
  SELECT LOCATION_ID, AVG(IFF(W>=2,L,NULL)) AS MEANLOG_POST FROM growth GROUP BY 1
)
SELECT COALESCE(r.RET,'all') AS RETENTION, COUNT(*) AS N_LOCS,
  ROUND((EXP(MEDIAN(g.MEANLOG_POST))-1)*100,2) AS MEDIAN_30D_POSTRAMP_PCT,   -- headline (robust)
  ROUND(AVG(EXP(g.MEANLOG_POST)-1)*100,2)      AS MEAN_30D_POSTRAMP_PCT,     -- skew/outlier-sensitive
  ROUND(AVG(IFF(g.MEANLOG_POST>0,1,0))*100,1)  AS PCT_GROWING
FROM loc_growth g JOIN retn r USING (LOCATION_ID)
WHERE g.MEANLOG_POST IS NOT NULL
GROUP BY GROUPING SETS ((r.RET),()) ORDER BY 1;

-- Q4c — sizing: location & GMV share, median tenure by BRAND-level retention
--   (clean shares, no rollup-doubling: totals via a separate scalar CTE)
WITH base AS (
  SELECT LOCATION_ID, BRAND_ID, ORDER_CREATED_AT_PT, GMV FROM demo_db.public.product_analytics_case_v2_CLEAN WHERE GMV > 0
), bound AS (SELECT MAX(ORDER_CREATED_AT_PT) AS DMAX FROM base
), brand_last AS (SELECT BRAND_ID, MAX(ORDER_CREATED_AT_PT) AS BLAST FROM base GROUP BY 1
), loc_agg AS (
  SELECT LOCATION_ID, ANY_VALUE(BRAND_ID) AS BRAND_ID, SUM(GMV) AS LOC_GMV,
         DATEDIFF('day', MIN(ORDER_CREATED_AT_PT), MAX(ORDER_CREATED_AT_PT)) AS SPAN_DAYS FROM base GROUP BY 1
), retn AS (
  SELECT la.LOCATION_ID, la.LOC_GMV, la.SPAN_DAYS,
         IFF(DATEDIFF('day', br.BLAST, d.DMAX) <= 14,'retained','churned') AS RET
  FROM loc_agg la JOIN brand_last br USING (BRAND_ID) CROSS JOIN bound d
), tot AS (SELECT COUNT(*) AS TN, SUM(LOC_GMV) AS TGMV FROM retn)
SELECT r.RET AS RETENTION, COUNT(*) AS N_LOCS,
  ROUND(100.0*COUNT(*)/MAX(t.TN),1)          AS PCT_OF_LOCS,
  ROUND(100.0*SUM(r.LOC_GMV)/MAX(t.TGMV),1)  AS PCT_OF_GMV,
  ROUND(MEDIAN(r.SPAN_DAYS))                 AS MEDIAN_TENURE_DAYS
FROM retn r CROSS JOIN tot t GROUP BY r.RET ORDER BY 1;

-- Q4d — churn rate by brand segment (BRAND-level retention x segment)
WITH base AS (
  SELECT LOCATION_ID, BRAND_ID, ORDER_CREATED_AT_PT, GMV FROM demo_db.public.product_analytics_case_v2_CLEAN WHERE GMV > 0
), bound AS (SELECT MAX(ORDER_CREATED_AT_PT) AS DMAX FROM base
), brand_last AS (SELECT BRAND_ID, MAX(ORDER_CREATED_AT_PT) AS BLAST FROM base GROUP BY 1
), loc_brand AS (SELECT DISTINCT LOCATION_ID, BRAND_ID FROM base
), retn AS (
  SELECT lb.LOCATION_ID, IFF(DATEDIFF('day', br.BLAST, d.DMAX) <= 14,1,0) AS IS_RET
  FROM loc_brand lb JOIN brand_last br USING (BRAND_ID) CROSS JOIN bound d
)
SELECT COALESCE(sg.SEGMENT,'all') AS SEGMENT, COUNT(*) AS N_LOCS,
  ROUND(AVG(r.IS_RET)*100,1)     AS RETAINED_PCT,
  ROUND((1-AVG(r.IS_RET))*100,1) AS CHURNED_PCT
FROM retn r JOIN demo_db.public.product_analytics_case_v2_LOC_SEG sg USING (LOCATION_ID)
GROUP BY GROUPING SETS ((sg.SEGMENT),()) ORDER BY 1;

-- Q4e — YoY CAGR DISTRIBUTION by retention, as % OF EACH COHORT (normalized so
--   churned n=10 and retained n=41 are directly comparable). Bins in pp.
WITH base AS (
  SELECT LOCATION_ID, BRAND_ID, ORDER_CREATED_AT_PT, GMV FROM demo_db.public.product_analytics_case_v2_CLEAN WHERE GMV > 0
), bound AS (SELECT MAX(ORDER_CREATED_AT_PT) AS DMAX FROM base
), brand_last AS (SELECT BRAND_ID, MAX(ORDER_CREATED_AT_PT) AS BLAST FROM base GROUP BY 1
), loc_brand AS (SELECT DISTINCT LOCATION_ID, BRAND_ID FROM base
), retn AS (
  SELECT lb.LOCATION_ID, IFF(DATEDIFF('day', br.BLAST, d.DMAX) <= 14,'retained','churned') AS RET
  FROM loc_brand lb JOIN brand_last br USING (BRAND_ID) CROSS JOIN bound d
), loc_span AS (
  SELECT LOCATION_ID, MIN(ORDER_CREATED_AT_PT) AS FIRST_TS,
         DATEDIFF('day', MIN(ORDER_CREATED_AT_PT), MAX(ORDER_CREATED_AT_PT)) AS SPAN_DAYS FROM base GROUP BY 1
), tenure_year AS (
  SELECT b.LOCATION_ID, FLOOR((DATEDIFF('day', s.FIRST_TS, b.ORDER_CREATED_AT_PT) - 30)/365) AS TY, SUM(b.GMV) AS GMV, s.SPAN_DAYS
  FROM base b JOIN loc_span s USING (LOCATION_ID) WHERE s.SPAN_DAYS >= 760 AND DATEDIFF('day', s.FIRST_TS, b.ORDER_CREATED_AT_PT) >= 30 GROUP BY 1,2,s.SPAN_DAYS
), complete_ty AS (SELECT LOCATION_ID, TY, GMV FROM tenure_year WHERE SPAN_DAYS - 30 >= (TY+1)*365
), loc_yoy AS (
  SELECT c.LOCATION_ID, (EXP(AVG(LN(c.GMV/p.GMV)))-1)*100 AS P
  FROM complete_ty c JOIN complete_ty p ON p.LOCATION_ID=c.LOCATION_ID AND p.TY=c.TY-1 GROUP BY 1
), binned AS (
  SELECT r.RET,
    CASE WHEN P<=-20 THEN 1 WHEN P<=0 THEN 2 WHEN P<=20 THEN 3 WHEN P<=40 THEN 4 WHEN P<=60 THEN 5 WHEN P<=100 THEN 6 ELSE 7 END AS BO
  FROM loc_yoy y JOIN retn r USING (LOCATION_ID)
), cnt AS (SELECT RET, BO, COUNT(*) AS N FROM binned GROUP BY 1,2)
SELECT RET, BO,
  CASE BO WHEN 1 THEN '<=-20' WHEN 2 THEN '-20..0' WHEN 3 THEN '0..20' WHEN 4 THEN '20..40' WHEN 5 THEN '40..60' WHEN 6 THEN '60..100' ELSE '>100' END AS BIN,
  N, ROUND(100.0*N/SUM(N) OVER (PARTITION BY RET),1) AS PCT_OF_COHORT
FROM cnt ORDER BY RET, BO;

-- Q4f — 30-day post-ramp rate DISTRIBUTION by retention, as % OF EACH COHORT.
--   Per-location rate = EXP(mean-log post-ramp growth)-1. Bins in pp per 30 days.
WITH base AS (
  SELECT LOCATION_ID, BRAND_ID, ORDER_CREATED_AT_PT, GMV FROM demo_db.public.product_analytics_case_v2_CLEAN WHERE GMV > 0
), bound AS (SELECT MAX(ORDER_CREATED_AT_PT) AS DMAX FROM base
), brand_last AS (SELECT BRAND_ID, MAX(ORDER_CREATED_AT_PT) AS BLAST FROM base GROUP BY 1
), loc_brand AS (SELECT DISTINCT LOCATION_ID, BRAND_ID FROM base
), retn AS (
  SELECT lb.LOCATION_ID, IFF(DATEDIFF('day', br.BLAST, d.DMAX) <= 14,'retained','churned') AS RET
  FROM loc_brand lb JOIN brand_last br USING (BRAND_ID) CROSS JOIN bound d
), loc_span AS (
  SELECT LOCATION_ID, MIN(ORDER_CREATED_AT_PT) AS FIRST_TS,
         DATEDIFF('day', MIN(ORDER_CREATED_AT_PT), MAX(ORDER_CREATED_AT_PT)) AS SPAN_DAYS FROM base GROUP BY 1
), win AS (
  SELECT b.LOCATION_ID, FLOOR(DATEDIFF('day', s.FIRST_TS, b.ORDER_CREATED_AT_PT)/30) AS W, SUM(b.GMV) AS GMV, MIN(s.SPAN_DAYS) AS SPAN_DAYS
  FROM base b JOIN loc_span s USING (LOCATION_ID) WHERE s.SPAN_DAYS >= 60 GROUP BY 1,2
), win_c AS (SELECT LOCATION_ID, W, GMV FROM win WHERE SPAN_DAYS >= (W+1)*30
), growth AS (SELECT c.LOCATION_ID, c.W, LN(c.GMV/p.GMV) AS L FROM win_c c JOIN win_c p ON p.LOCATION_ID=c.LOCATION_ID AND p.W=c.W-1
), loc_growth AS (SELECT LOCATION_ID, (EXP(AVG(IFF(W>=2,L,NULL)))-1)*100 AS P FROM growth GROUP BY 1
), binned AS (
  SELECT r.RET,
    CASE WHEN P<=-15 THEN 1 WHEN P<=-10 THEN 2 WHEN P<=-5 THEN 3 WHEN P<=0 THEN 4 WHEN P<=5 THEN 5 WHEN P<=10 THEN 6 WHEN P<=15 THEN 7 ELSE 8 END AS BO
  FROM loc_growth g JOIN retn r USING (LOCATION_ID) WHERE g.P IS NOT NULL
), cnt AS (SELECT RET, BO, COUNT(*) AS N FROM binned GROUP BY 1,2)
SELECT RET, BO,
  CASE BO WHEN 1 THEN '<=-15' WHEN 2 THEN '-15..-10' WHEN 3 THEN '-10..-5' WHEN 4 THEN '-5..0' WHEN 5 THEN '0..5' WHEN 6 THEN '5..10' WHEN 7 THEN '10..15' ELSE '>15' END AS BIN,
  N, ROUND(100.0*N/SUM(N) OVER (PARTITION BY RET),1) AS PCT_OF_COHORT
FROM cnt ORDER BY RET, BO;
