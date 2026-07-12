-- =====================================================================
--     (1) Naive App-adopter vs Web-only guest        biased        Q1
--     (2) Store app-penetration vs store growth        confounded    Q2
--     (3) Within-GUEST switcher DiD + matched control  PRIMARY       Python
--     (4) Store-level app-ENABLEMENT DiD               corroborating Python
--     (5) Propensity-stratified / cohort re-estimate   robustness    Python
-- =====================================================================


-- ---------------------------------------------------------------------
-- Q0 — FEASIBILITY CENSUS (does the data support a within-guest design?)
--   Result 0a: guests 693,354 | web_only 603,075 (87.0%) | app_only 59,617
--              (8.6%) | both 30,662 (4.4%). Of "both": web_then_app 26,283;
--              pre>=2&post>=2 9,814.
--   Result 0b: locations 292 | app-enabled 229 | never-app 63 | app>=30d after
--              web start 137 | clean pre90&post90 enablement 49 | median
--              days-to-app 39.
-- ---------------------------------------------------------------------
-- 0a) Guest channel mix & switcher depth
WITH o AS (
  SELECT GUEST_ID, ORDER_SOURCE, ORDER_CREATED_AT_PT AS TS
  FROM demo_db.public.product_analytics_case_v2_CLEAN
  WHERE GMV > 0 AND ORDER_SOURCE IN ('App','Web')
), g AS (
  SELECT GUEST_ID,
    COUNT(*) AS N,
    SUM(IFF(ORDER_SOURCE='App',1,0)) AS N_APP,
    SUM(IFF(ORDER_SOURCE='Web',1,0)) AS N_WEB,
    MIN(IFF(ORDER_SOURCE='App', TS, NULL)) AS FIRST_APP,
    MIN(TS) AS FIRST_ORD
  FROM o GROUP BY 1
), sw AS (
  SELECT g.*,
    (SELECT COUNT(*) FROM o WHERE o.GUEST_ID=g.GUEST_ID AND o.TS <  g.FIRST_APP) AS PRE_ORD,
    (SELECT COUNT(*) FROM o WHERE o.GUEST_ID=g.GUEST_ID AND o.TS >= g.FIRST_APP) AS POST_ORD
  FROM g WHERE g.N_APP>0 AND g.N_WEB>0
)
SELECT
  (SELECT COUNT(*) FROM g)                          AS TOTAL_GUESTS,
  (SELECT SUM(IFF(N_APP>0 AND N_WEB=0,1,0)) FROM g) AS APP_ONLY,
  (SELECT SUM(IFF(N_WEB>0 AND N_APP=0,1,0)) FROM g) AS WEB_ONLY,
  (SELECT SUM(IFF(N_APP>0 AND N_WEB>0,1,0)) FROM g) AS BOTH_CHANNELS,
  SUM(IFF(FIRST_APP>FIRST_ORD,1,0))                 AS WEB_THEN_APP,
  SUM(IFF(PRE_ORD>=2 AND POST_ORD>=2,1,0))          AS PRE2_POST2,
  SUM(IFF(PRE_ORD>=3 AND POST_ORD>=3,1,0))          AS PRE3_POST3
FROM sw;

-- 0b) Store app-enablement feasibility
WITH loc AS (
  SELECT LOCATION_ID, COUNT(*) AS N,
    SUM(IFF(ORDER_SOURCE='App',1,0)) AS N_APP,
    MIN(ORDER_CREATED_AT_PT) AS FIRST_ORD, MAX(ORDER_CREATED_AT_PT) AS LAST_ORD,
    MIN(IFF(ORDER_SOURCE='App',ORDER_CREATED_AT_PT,NULL)) AS FIRST_APP
  FROM demo_db.public.product_analytics_case_v2_CLEAN WHERE GMV>0 GROUP BY 1
)
SELECT
  COUNT(*) AS LOCS,
  SUM(IFF(N_APP>0,1,0)) AS APP_LOCS,
  SUM(IFF(N_APP=0,1,0)) AS NEVER_APP_LOCS,
  SUM(IFF(N_APP>0 AND DATEDIFF('day',FIRST_ORD,FIRST_APP)>=30,1,0)) AS APP_AFTER_30D_WEB,
  SUM(IFF(N_APP>0 AND DATEDIFF('day',FIRST_ORD,FIRST_APP)>=90
              AND DATEDIFF('day',FIRST_APP,LAST_ORD)>=90,1,0))      AS ENABLE_PRE90_POST90,
  ROUND(MEDIAN(IFF(N_APP>0,DATEDIFF('day',FIRST_ORD,FIRST_APP),NULL)),0) AS MED_DAYS_TO_APP
FROM loc;


-- ---------------------------------------------------------------------
-- Q1 — RUNG 1 (BIASED BASELINE): naive App-adopter vs Web-only guest.
--   Result: app_adopter n=90,279 | 4.68 orders/guest | $191 GMV/guest | 61.3%
--             repeat | $45.02 AOV.  web_only n=603,075 | 1.79 orders | $85 GMV |
--             25.7% repeat | $50.18 AOV.  Naive read: ~2.6x orders, ~2.2x GMV.
-- ---------------------------------------------------------------------
WITH g AS (
  SELECT GUEST_ID,
    MAX(IFF(ORDER_SOURCE='App',1,0)) AS EVER_APP,
    COUNT(*) AS ORDERS, SUM(GMV) AS GMV
  FROM demo_db.public.product_analytics_case_v2_CLEAN
  WHERE GMV>0 AND ORDER_SOURCE IN ('App','Web') GROUP BY 1
)
SELECT
  IFF(EVER_APP=1,'app_adopter','web_only')   AS GUEST_TYPE,
  COUNT(*)                                    AS GUESTS,
  ROUND(AVG(ORDERS),2)                        AS ORDERS_PER_GUEST,
  ROUND(MEDIAN(ORDERS),0)                     AS MED_ORDERS,
  ROUND(AVG(GMV),0)                           AS GMV_PER_GUEST,
  ROUND(AVG(IFF(ORDERS>=2,1,0))*100,1)        AS REPEAT_RATE_PCT,
  ROUND(AVG(GMV/ORDERS),2)                    AS AOV
FROM g GROUP BY 1 ORDER BY 1;


-- ---------------------------------------------------------------------
-- Q2 — RUNG 2 (DESCRIPTIVE, CONFOUNDED): store app-penetration vs growth.
--   Result (pen bucket -> locs | med monthly GMV | med 30d growth, W>=2):
--     0 none 63 | $6,893 | +1.54% ; 1 low(<15%) 71 | $9,727 | +1.62% ;
--     2 mid(15-30%) 89 | $10,177 | +1.75% ; 3 high(30%+) 69 | $10,052 | +3.66%.
-- ---------------------------------------------------------------------
WITH base AS (
  SELECT LOCATION_ID, ORDER_CREATED_AT_PT AS TS, GMV, ORDER_SOURCE
  FROM demo_db.public.product_analytics_case_v2_CLEAN WHERE GMV>0 AND ORDER_SOURCE IN ('App','Web')
), pen AS (
  SELECT LOCATION_ID,
         SUM(IFF(ORDER_SOURCE='App',1,0))/COUNT(*) AS PENETRATION,
         MIN(TS) AS FIRST_TS,
         DATEDIFF('day',MIN(TS),MAX(TS)) AS SPAN_DAYS
  FROM base GROUP BY 1
), win AS (
  SELECT b.LOCATION_ID, FLOOR(DATEDIFF('day',p.FIRST_TS,b.TS)/30) AS W,
         SUM(b.GMV) AS GMV, MIN(p.SPAN_DAYS) AS SPAN_DAYS
  FROM base b JOIN pen p USING (LOCATION_ID)
  WHERE p.SPAN_DAYS>=60 GROUP BY 1,2
), win_c AS (
  SELECT LOCATION_ID, W, GMV FROM win WHERE SPAN_DAYS >= (W+1)*30
), growth AS (
  SELECT c.LOCATION_ID, AVG(IFF(c.W>=2, LN(c.GMV/p.GMV), NULL)) AS MEANLOG_POST
  FROM win_c c JOIN win_c p ON p.LOCATION_ID=c.LOCATION_ID AND p.W=c.W-1
  GROUP BY 1
), loc_month AS (
  SELECT LOCATION_ID, DATE_TRUNC('month',TS) AS MO, SUM(GMV) AS GMV
  FROM base GROUP BY 1,2
), loc_mgmv AS (
  SELECT LOCATION_ID, MEDIAN(GMV) AS MED_MONTHLY_GMV FROM loc_month GROUP BY 1
)
SELECT
  CASE WHEN p.PENETRATION=0 THEN '0 none'
       WHEN p.PENETRATION<0.15 THEN '1 low (<15%)'
       WHEN p.PENETRATION<0.30 THEN '2 mid (15-30%)'
       ELSE '3 high (30%+)' END                             AS PEN_BUCKET,
  COUNT(*)                                                  AS LOCS,
  ROUND(MEDIAN(m.MED_MONTHLY_GMV),0)                        AS MED_MONTHLY_GMV,
  ROUND((EXP(MEDIAN(gr.MEANLOG_POST))-1)*100,2)             AS MED_30D_GROWTH_PCT
FROM pen p
LEFT JOIN growth gr USING (LOCATION_ID)
LEFT JOIN loc_mgmv m USING (LOCATION_ID)
GROUP BY 1 ORDER BY 1;


-- =====================================================================
-- E1 — GUEST-BRAND SWITCHER PANEL (extract -> data/guest_panel.csv)
-- ---------------------------------------------------------------------
--   One row per analysis UNIT, UNTRIMMED and UN-bucketed (Python does the p99
--   trim, CEM quintile cells, weighting, bootstrap, regression). Grain:
--     * treated  = one row per switcher guest-brand (first App order at k+1, k>=2)
--     * control  = one row per (web-only guest-brand, k) it can anchor (needs a
--                  (k+1)th order) -> a web-only guest-brand appears once per k
--                  stratum it supports (this is the matching pool).
--   Kept only if PRE_N>=2, PRE_SPAN>0, and fully observable 180d post the event.
--   Columns:
--     GUEST_ID, BRAND_ID  -> bootstrap CLUSTER key (guest) + brand
--     GRP (treated|control), K, SEG (brand cohort, 1:1 on BRAND_ID)
--     PRE_GMV, PRE_SPAN   -> the two CEM matching features (raw; trim/bucket in Py)
--     PRE_FREQ            -> pre-adoption pace (orders/30d) for baseline tertiles
--     POST_N_180, POST_GMV_180        -> primary outcomes (fixed 180d window, incl 0)
--     POST_N_90_180                   -> orders in months 4-6 (durability lens)
--     POST_N_B0..B5       -> orders in each 30-day post bin (trajectory / event study)
-- ---------------------------------------------------------------------
WITH o AS (
  SELECT GUEST_ID, BRAND_ID, ORDER_SOURCE, ORDER_CREATED_AT_PT AS TS, GMV,
         ROW_NUMBER() OVER (PARTITION BY GUEST_ID, BRAND_ID
                            ORDER BY ORDER_CREATED_AT_PT, ORDER_ID) AS SEQ
  FROM demo_db.public.product_analytics_case_v2_CLEAN
  WHERE GMV>0 AND ORDER_SOURCE IN ('App','Web')
), maxdt AS (SELECT MAX(TS) AS MAXTS FROM o),
gb AS (
  SELECT GUEST_ID, BRAND_ID, COUNT(*) AS N, SUM(IFF(ORDER_SOURCE='App',1,0)) AS N_APP,
         MIN(IFF(ORDER_SOURCE='App',SEQ,NULL)) AS FIRST_APP_SEQ FROM o GROUP BY 1,2
),
bseg AS (SELECT DISTINCT BRAND_ID, SEGMENT FROM demo_db.public.product_analytics_case_v2_LOC_SEG),  -- brand -> cohort (1:1)
klist AS (SELECT COLUMN1 AS K FROM VALUES (2),(3),(4),(5),(6),(7),(8),(9),(10),(11)),
treated AS (
  SELECT GUEST_ID, BRAND_ID, LEAST(FIRST_APP_SEQ-1,11) AS K, FIRST_APP_SEQ AS E, 'treated' AS GRP
  FROM gb WHERE N_APP>0 AND FIRST_APP_SEQ>=3
),
control AS (
  SELECT g.GUEST_ID, g.BRAND_ID, k.K, (k.K+1) AS E, 'control' AS GRP
  FROM gb g JOIN klist k ON g.N >= k.K+1 WHERE g.N_APP=0
),
evt AS (SELECT * FROM treated UNION ALL SELECT * FROM control),
pre AS (
  SELECT e.GUEST_ID, e.BRAND_ID, e.GRP, e.K, e.E,
    COUNT_IF(o.SEQ < e.E)               AS PRE_N,
    SUM(IFF(o.SEQ < e.E, o.GMV, 0))     AS PRE_GMV,
    MIN(o.TS)                           AS TS_FIRST,
    MAX(IFF(o.SEQ = e.E-1, o.TS, NULL)) AS TS_PRE_LAST,
    MAX(IFF(o.SEQ = e.E,   o.TS, NULL)) AS TS_EVT
  FROM evt e JOIN o ON o.GUEST_ID=e.GUEST_ID AND o.BRAND_ID=e.BRAND_ID
  GROUP BY 1,2,3,4,5
),
post AS (
  SELECT p.*,
    COUNT_IF(o.SEQ>p.E AND o.TS<=DATEADD('day',180,p.TS_EVT))              AS POST_N_180,
    SUM(IFF(o.SEQ>p.E AND o.TS<=DATEADD('day',180,p.TS_EVT), o.GMV, 0))    AS POST_GMV_180,
    COUNT_IF(o.SEQ>p.E AND o.TS>DATEADD('day',90,p.TS_EVT) AND o.TS<=DATEADD('day',180,p.TS_EVT)) AS POST_N_90_180,
    COUNT_IF(o.SEQ>p.E AND o.TS>DATEADD('day',  0,p.TS_EVT) AND o.TS<=DATEADD('day', 30,p.TS_EVT)) AS POST_N_B0,
    COUNT_IF(o.SEQ>p.E AND o.TS>DATEADD('day', 30,p.TS_EVT) AND o.TS<=DATEADD('day', 60,p.TS_EVT)) AS POST_N_B1,
    COUNT_IF(o.SEQ>p.E AND o.TS>DATEADD('day', 60,p.TS_EVT) AND o.TS<=DATEADD('day', 90,p.TS_EVT)) AS POST_N_B2,
    COUNT_IF(o.SEQ>p.E AND o.TS>DATEADD('day', 90,p.TS_EVT) AND o.TS<=DATEADD('day',120,p.TS_EVT)) AS POST_N_B3,
    COUNT_IF(o.SEQ>p.E AND o.TS>DATEADD('day',120,p.TS_EVT) AND o.TS<=DATEADD('day',150,p.TS_EVT)) AS POST_N_B4,
    COUNT_IF(o.SEQ>p.E AND o.TS>DATEADD('day',150,p.TS_EVT) AND o.TS<=DATEADD('day',180,p.TS_EVT)) AS POST_N_B5
  FROM pre p JOIN o ON o.GUEST_ID=p.GUEST_ID AND o.BRAND_ID=p.BRAND_ID
  GROUP BY 1,2,3,4,5,6,7,8,9,10
)
SELECT p.GUEST_ID, p.BRAND_ID, p.GRP, p.K, COALESCE(b.SEGMENT,'single_loc') AS SEG,
  p.PRE_GMV,
  DATEDIFF('day',p.TS_FIRST,p.TS_PRE_LAST)                       AS PRE_SPAN,
  p.PRE_N/NULLIF(DATEDIFF('day',p.TS_FIRST,p.TS_PRE_LAST),0)*30  AS PRE_FREQ,
  p.POST_N_180, p.POST_GMV_180, p.POST_N_90_180,
  p.POST_N_B0, p.POST_N_B1, p.POST_N_B2, p.POST_N_B3, p.POST_N_B4, p.POST_N_B5
FROM post p JOIN bseg b ON b.BRAND_ID=p.BRAND_ID, maxdt
WHERE p.PRE_N>=2 AND DATEDIFF('day',p.TS_FIRST,p.TS_PRE_LAST)>0
  AND MAXTS >= DATEADD('day',180,p.TS_EVT);


-- =====================================================================
-- E2 — STORE APP-ENABLEMENT PANEL (extract -> data/store_panel.csv)
-- ---------------------------------------------------------------------
--   One row per (treated enablement event, store) -- the treated store itself
--   plus every never-app control observable over that event's [-90, +180] window.
--   Treated = never-app-then-enabled locations with >=90d Web-only pre AND >=180d
--   post (durability sample). Columns:
--     ROLE (treated|control), EVENT_LOC, EVT (enablement date), LOC
--     PE  = GMV in [-90,-45)  (early pre half; slope denominator)
--     PL  = GMV in [-45,  0)  (late  pre half; slope numerator)
--     PRE_GMV  = GMV in [-90, 0)         PRE_ORD = orders in [-90,0)
--     POST_GMV_90  = GMV in [0, 90)      POST_GMV_180 = GMV in [0,180)
--     M_m3..M_p6   = GMV in each 30-day bin (months -3..-1, +1..+6) for the
--                    event study, indexed in Python to each store's pre mean.
-- ---------------------------------------------------------------------
WITH base AS (
  SELECT LOCATION_ID, ORDER_CREATED_AT_PT AS TS, GMV, ORDER_SOURCE
  FROM demo_db.public.product_analytics_case_v2_CLEAN WHERE GMV>0 AND ORDER_SOURCE IN ('App','Web')
), loc AS (
  SELECT LOCATION_ID, SUM(IFF(ORDER_SOURCE='App',1,0)) AS N_APP,
         MIN(TS) AS FIRST_ORD, MAX(TS) AS LAST_ORD,
         MIN(IFF(ORDER_SOURCE='App',TS,NULL)) AS FIRST_APP
  FROM base GROUP BY 1
), adopters AS (   -- clean enablement, >=90d Web pre AND >=180d post observable
  SELECT LOCATION_ID, FIRST_APP AS EVT FROM loc
  WHERE N_APP>0 AND DATEDIFF('day',FIRST_ORD,FIRST_APP)>=90
                AND DATEDIFF('day',FIRST_APP,LAST_ORD)>=180
), ctrl_loc AS (SELECT LOCATION_ID, FIRST_ORD, LAST_ORD FROM loc WHERE N_APP=0),
-- treated rows (store measured over its OWN event window)
trows AS (
  SELECT 'treated' AS ROLE, a.LOCATION_ID AS EVENT_LOC, a.EVT, a.LOCATION_ID AS LOC,
    SUM(IFF(b.TS>=DATEADD('day',-90,a.EVT) AND b.TS<DATEADD('day',-45,a.EVT), b.GMV,0)) AS PE,
    SUM(IFF(b.TS>=DATEADD('day',-45,a.EVT) AND b.TS<a.EVT,                    b.GMV,0)) AS PL,
    SUM(IFF(b.TS<a.EVT  AND b.TS>=DATEADD('day',-90,a.EVT), b.GMV,0)) AS PRE_GMV,
    COUNT_IF(b.TS<a.EVT AND b.TS>=DATEADD('day',-90,a.EVT))          AS PRE_ORD,
    SUM(IFF(b.TS>=a.EVT AND b.TS<DATEADD('day', 90,a.EVT), b.GMV,0)) AS POST_GMV_90,
    SUM(IFF(b.TS>=a.EVT AND b.TS<DATEADD('day',180,a.EVT), b.GMV,0)) AS POST_GMV_180,
    SUM(IFF(b.TS>=DATEADD('day',-90,a.EVT) AND b.TS<DATEADD('day',-60,a.EVT), b.GMV,0)) AS M_M3,
    SUM(IFF(b.TS>=DATEADD('day',-60,a.EVT) AND b.TS<DATEADD('day',-30,a.EVT), b.GMV,0)) AS M_M2,
    SUM(IFF(b.TS>=DATEADD('day',-30,a.EVT) AND b.TS<a.EVT,                    b.GMV,0)) AS M_M1,
    SUM(IFF(b.TS>=a.EVT                    AND b.TS<DATEADD('day', 30,a.EVT), b.GMV,0)) AS M_P1,
    SUM(IFF(b.TS>=DATEADD('day', 30,a.EVT) AND b.TS<DATEADD('day', 60,a.EVT), b.GMV,0)) AS M_P2,
    SUM(IFF(b.TS>=DATEADD('day', 60,a.EVT) AND b.TS<DATEADD('day', 90,a.EVT), b.GMV,0)) AS M_P3,
    SUM(IFF(b.TS>=DATEADD('day', 90,a.EVT) AND b.TS<DATEADD('day',120,a.EVT), b.GMV,0)) AS M_P4,
    SUM(IFF(b.TS>=DATEADD('day',120,a.EVT) AND b.TS<DATEADD('day',150,a.EVT), b.GMV,0)) AS M_P5,
    SUM(IFF(b.TS>=DATEADD('day',150,a.EVT) AND b.TS<DATEADD('day',180,a.EVT), b.GMV,0)) AS M_P6
  FROM adopters a JOIN base b ON b.LOCATION_ID=a.LOCATION_ID GROUP BY 1,2,3,4
),
-- control rows (each never-app store measured over EACH adopter's window)
crows AS (
  SELECT 'control' AS ROLE, a.LOCATION_ID AS EVENT_LOC, a.EVT, c.LOCATION_ID AS LOC,
    SUM(IFF(b.TS>=DATEADD('day',-90,a.EVT) AND b.TS<DATEADD('day',-45,a.EVT), b.GMV,0)) AS PE,
    SUM(IFF(b.TS>=DATEADD('day',-45,a.EVT) AND b.TS<a.EVT,                    b.GMV,0)) AS PL,
    SUM(IFF(b.TS<a.EVT  AND b.TS>=DATEADD('day',-90,a.EVT), b.GMV,0)) AS PRE_GMV,
    COUNT_IF(b.TS<a.EVT AND b.TS>=DATEADD('day',-90,a.EVT))          AS PRE_ORD,
    SUM(IFF(b.TS>=a.EVT AND b.TS<DATEADD('day', 90,a.EVT), b.GMV,0)) AS POST_GMV_90,
    SUM(IFF(b.TS>=a.EVT AND b.TS<DATEADD('day',180,a.EVT), b.GMV,0)) AS POST_GMV_180,
    SUM(IFF(b.TS>=DATEADD('day',-90,a.EVT) AND b.TS<DATEADD('day',-60,a.EVT), b.GMV,0)) AS M_M3,
    SUM(IFF(b.TS>=DATEADD('day',-60,a.EVT) AND b.TS<DATEADD('day',-30,a.EVT), b.GMV,0)) AS M_M2,
    SUM(IFF(b.TS>=DATEADD('day',-30,a.EVT) AND b.TS<a.EVT,                    b.GMV,0)) AS M_M1,
    SUM(IFF(b.TS>=a.EVT                    AND b.TS<DATEADD('day', 30,a.EVT), b.GMV,0)) AS M_P1,
    SUM(IFF(b.TS>=DATEADD('day', 30,a.EVT) AND b.TS<DATEADD('day', 60,a.EVT), b.GMV,0)) AS M_P2,
    SUM(IFF(b.TS>=DATEADD('day', 60,a.EVT) AND b.TS<DATEADD('day', 90,a.EVT), b.GMV,0)) AS M_P3,
    SUM(IFF(b.TS>=DATEADD('day', 90,a.EVT) AND b.TS<DATEADD('day',120,a.EVT), b.GMV,0)) AS M_P4,
    SUM(IFF(b.TS>=DATEADD('day',120,a.EVT) AND b.TS<DATEADD('day',150,a.EVT), b.GMV,0)) AS M_P5,
    SUM(IFF(b.TS>=DATEADD('day',150,a.EVT) AND b.TS<DATEADD('day',180,a.EVT), b.GMV,0)) AS M_P6
  FROM adopters a
  JOIN ctrl_loc c ON c.FIRST_ORD<=DATEADD('day',-90,a.EVT) AND c.LAST_ORD>=DATEADD('day',180,a.EVT)
  JOIN base b ON b.LOCATION_ID=c.LOCATION_ID AND b.TS>=DATEADD('day',-90,a.EVT) AND b.TS<DATEADD('day',180,a.EVT)
  GROUP BY 1,2,3,4
)
SELECT * FROM trows
UNION ALL
SELECT * FROM crows
ORDER BY EVENT_LOC, ROLE DESC, LOC;


