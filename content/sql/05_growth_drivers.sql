CREATE OR REPLACE VIEW demo_db.public.product_analytics_case_v2_LOC_FEATURES AS
WITH base AS (
  SELECT LOCATION_ID, GUEST_ID, ORDER_CREATED_AT_PT AS TS, GMV,
         NUMBER_OF_ITEMS AS ITEMS, DELIVERY_FEE,
         ORDER_TYPE, ORDER_SOURCE, DELIVERY_TYPE, HAS_COUPON, UTM_SOURCE
  FROM demo_db.public.product_analytics_case_v2_CLEAN
  WHERE GMV > 0
), span AS (
  SELECT LOCATION_ID, MIN(TS) AS FIRST_TS,
         DATEDIFF('day', MIN(TS), MAX(TS)) AS SPAN_DAYS
  FROM base GROUP BY 1
), b AS (                                  -- day index + within-location customer order rank
  SELECT x.*, s.FIRST_TS, s.SPAN_DAYS,
         DATEDIFF('day', s.FIRST_TS, x.TS) AS DSF,
         ROW_NUMBER() OVER (PARTITION BY x.LOCATION_ID, x.GUEST_ID ORDER BY x.TS) AS CX_ORD_RN
  FROM base x JOIN span s USING (LOCATION_ID)
), bl AS (                                 -- baseline = first 60 days (W0-1; precedes the W>=2 outcome)
  SELECT * FROM b WHERE DSF < 60
), bl_feat AS (
  SELECT LOCATION_ID,
    COUNT(*)                                                              AS BL_ORDERS,
    SUM(GMV)                                                              AS BL_GMV,
    SUM(GMV)/NULLIF(COUNT(*),0)                                           AS BL_AOV,
    AVG(ITEMS)                                                            AS BL_ITEMS,
    COUNT(DISTINCT GUEST_ID)                                              AS BL_UNIQUE_CX,
    COUNT(*)/NULLIF(COUNT(DISTINCT GUEST_ID),0)                           AS BL_OPC,
    SUM(GMV)/60.0                                                         AS BL_GMV_PER_DAY,
    AVG(IFF(ORDER_TYPE='delivery',1,0))                                   AS BL_PCT_DELIVERY,
    AVG(IFF(ORDER_SOURCE='App',1,0))                                      AS BL_PCT_APP,
    AVG(IFF(DELIVERY_TYPE='inhouse',1,0))                                 AS BL_PCT_INHOUSE,
    AVG(IFF(DELIVERY_TYPE IN ('delivery type A','delivery type B','delivery type C'),1,0)) AS BL_PCT_EXT_DELIVERY,
    AVG(IFF(HAS_COUPON,1,0))                                              AS BL_PCT_COUPON,
    AVG(IFF(ORDER_TYPE='delivery', DELIVERY_FEE, NULL))                   AS BL_AVG_DELFEE,
    AVG(IFF(CX_ORD_RN>1,1,0))                                             AS BL_REPEAT_ORDER_SHARE,
    -- UTM (exploratory): coverage = share attributable; shares are OF attributed orders.
    -- UTM_MEDIUM dropped (97.5% null). google ~90% of known source, owner = branded/first-party.
    AVG(IFF(UTM_SOURCE IS NOT NULL,1,0))                                  AS BL_UTM_COVERAGE,
    COUNT_IF(UTM_SOURCE='google')/NULLIF(COUNT_IF(UTM_SOURCE IS NOT NULL),0) AS BL_PCT_UTM_GOOGLE,
    COUNT_IF(UTM_SOURCE='owner') /NULLIF(COUNT_IF(UTM_SOURCE IS NOT NULL),0) AS BL_PCT_UTM_OWNER
  FROM bl GROUP BY 1
), bl_conc AS (                            -- top-customer GMV concentration (whale-diner reliance)
  SELECT LOCATION_ID, MAX(CX_GMV)/NULLIF(SUM(CX_GMV),0) AS BL_TOP_CX_SHARE
  FROM (SELECT LOCATION_ID, GUEST_ID, SUM(GMV) AS CX_GMV FROM bl GROUP BY 1,2)
  GROUP BY 1
), lc_feat AS (                            -- LIFECYCLE aggregates (ALL orders) -- DESCRIPTIVE lens only.
  SELECT LOCATION_ID,                      -- endogenous: overlaps the growth outcome window, so NOT causal.
    SUM(GMV)/NULLIF(COUNT(*),0)                                           AS LC_AOV,
    AVG(ITEMS)                                                            AS LC_ITEMS,
    AVG(IFF(ORDER_TYPE='delivery',1,0))                                   AS LC_PCT_DELIVERY,
    AVG(IFF(ORDER_SOURCE='App',1,0))                                      AS LC_PCT_APP,
    AVG(IFF(DELIVERY_TYPE='inhouse',1,0))                                 AS LC_PCT_INHOUSE,
    AVG(IFF(HAS_COUPON,1,0))                                              AS LC_PCT_COUPON,
    AVG(IFF(ORDER_TYPE='delivery', DELIVERY_FEE, NULL))                   AS LC_AVG_DELFEE,
    AVG(IFF(CX_ORD_RN>1,1,0))                                             AS LC_REPEAT_ORDER_SHARE,
    SUM(GMV)/NULLIF(MAX(SPAN_DAYS),0)                                     AS LC_GMV_PER_DAY
  FROM b GROUP BY 1
), lc_conc AS (
  SELECT LOCATION_ID, MAX(CX_GMV)/NULLIF(SUM(CX_GMV),0) AS LC_TOP_CX_SHARE
  FROM (SELECT LOCATION_ID, GUEST_ID, SUM(GMV) AS CX_GMV FROM b GROUP BY 1,2)
  GROUP BY 1
), win AS (                                -- OUTCOME engine: 30-day windows (Q1b)
  SELECT LOCATION_ID, FLOOR(DSF/30) AS W, SUM(GMV) AS GMV, MIN(SPAN_DAYS) AS SPAN_DAYS
  FROM b WHERE SPAN_DAYS >= 60 GROUP BY 1,2
), win_c AS (
  SELECT LOCATION_ID, W, GMV FROM win WHERE SPAN_DAYS >= (W+1)*30
), g AS (
  SELECT c.LOCATION_ID, c.W, LN(c.GMV/p.GMV) AS L
  FROM win_c c JOIN win_c p ON p.LOCATION_ID=c.LOCATION_ID AND p.W=c.W-1
), out30 AS (
  SELECT LOCATION_ID, EXP(AVG(IFF(W>=2,L,NULL)))-1 AS R30,
         COUNT(IFF(W>=2,1,NULL)) AS N_POST_W
  FROM g GROUP BY 1
), ty AS (                                 -- optional YoY CAGR; day-30 clock (W0 ramp excluded)
  SELECT LOCATION_ID, FLOOR((DSF-30)/365) AS TY, SUM(GMV) AS GMV, MIN(SPAN_DAYS) AS SPAN_DAYS
  FROM b WHERE DSF >= 30 GROUP BY 1,2
), cty AS (
  SELECT LOCATION_ID, TY, GMV FROM ty WHERE SPAN_DAYS - 30 >= (TY+1)*365
), yoy AS (
  SELECT c.LOCATION_ID, EXP(AVG(LN(c.GMV/p.GMV)))-1 AS CAGR
  FROM cty c JOIN cty p ON p.LOCATION_ID=c.LOCATION_ID AND p.TY=c.TY-1
  GROUP BY 1
)
SELECT
  f.LOCATION_ID, sg.BRAND_ID, sg.SEGMENT,
  YEAR(s.FIRST_TS)  AS FIRST_YEAR,
  MONTH(s.FIRST_TS) AS FIRST_MONTH,
  s.SPAN_DAYS,
  f.BL_ORDERS, f.BL_GMV, f.BL_AOV, f.BL_ITEMS, f.BL_UNIQUE_CX, f.BL_OPC, f.BL_GMV_PER_DAY,
  f.BL_PCT_DELIVERY, f.BL_PCT_APP, f.BL_PCT_INHOUSE, f.BL_PCT_EXT_DELIVERY, f.BL_PCT_COUPON,
  f.BL_AVG_DELFEE, f.BL_REPEAT_ORDER_SHARE, c.BL_TOP_CX_SHARE,
  f.BL_UTM_COVERAGE, f.BL_PCT_UTM_GOOGLE, f.BL_PCT_UTM_OWNER,
  lf.LC_AOV, lf.LC_ITEMS, lf.LC_PCT_DELIVERY, lf.LC_PCT_APP, lf.LC_PCT_INHOUSE,
  lf.LC_PCT_COUPON, lf.LC_AVG_DELFEE, lf.LC_REPEAT_ORDER_SHARE, lf.LC_GMV_PER_DAY, lc.LC_TOP_CX_SHARE,
  o.R30, o.N_POST_W, (o.R30 < 0)::INT AS DECLINING, y.CAGR AS CAGR_YOY
FROM bl_feat f
JOIN span s USING (LOCATION_ID)
JOIN demo_db.public.product_analytics_case_v2_LOC_SEG sg USING (LOCATION_ID)
JOIN bl_conc c USING (LOCATION_ID)
JOIN lc_feat lf USING (LOCATION_ID)
JOIN lc_conc lc USING (LOCATION_ID)
JOIN out30 o USING (LOCATION_ID)
LEFT JOIN yoy y USING (LOCATION_ID)
WHERE o.R30 IS NOT NULL;

SELECT * FROM demo_db.public.product_analytics_case_v2_LOC_FEATURES;
