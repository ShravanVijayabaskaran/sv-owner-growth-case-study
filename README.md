# Owner.com — Product Analytics Case Study (interactive tool)

An interactive, multi-page write-up of the Owner.com growth & app-incrementality analysis.
Built with **Next.js (App Router) + TypeScript + Tailwind v4 + Recharts**, designed to be
easy to edit and deploy to **Vercel**.

## Pages (top navigation)

1. **Executive summary** (`/`) — the two questions, headline numbers, approach, caveats.
2. **Data & quality** (`/data-quality`) — coverage, distributions, DQ findings ledger, data model, monitoring proposal.
3. **Does Owner drive growth?** (`/growth`) — per-location growth by segment, attribution, AOV drill-down, survivorship, drivers.
4. **Is the app incremental?** (`/app-incrementality`) — the design ladder from naive comparison to matched switcher DiD.
5. **Appendix** (`/appendix`) — all source SQL, rendered from `content/sql/`.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## How to edit (everything is customizable)

- **Numbers & copy** live in plain data modules under `src/data/`:
  - `exec.ts` — executive-summary copy + KPI strip
  - `dataQuality.ts` — profiling facts, DQ findings, monitoring, data model
  - `growth.ts` — segment metrics, attribution, AOV decomposition, survivorship, drivers
  - `incrementality.ts` — the ladder, per-outcome DiD results, cohorts, store DiD
  - `meta.ts` — dataset-level facts
- **Navigation** — edit `src/lib/nav.ts` (labels, order, add/remove pages).
- **Theme / colors** — edit the CSS tokens in `src/app/globals.css` and the mirror in `src/lib/theme.ts` (charts).
- **UI building blocks** — `src/components/ui.tsx` (Card, Callout, Stat, Table…),
  `src/components/charts.tsx` (BarChartX, LineChartX, DivergingBars), `src/components/Toggle.tsx`.
- **Appendix SQL** — drop/replace `.sql` files in `content/sql/`; the appendix reads the folder automatically at build time.

To add a page: create `src/app/<slug>/page.tsx` and add an entry to `NAV` in `src/lib/nav.ts`.

## Deploy to Vercel

Option A — dashboard: push this folder to a Git repo, then "Import Project" at vercel.com
(framework auto-detected as Next.js; no config needed).

Option B — CLI:

```bash
npm i -g vercel
vercel          # preview deploy
vercel --prod   # production
```

## Data provenance

All figures trace to `PRODDB.SHRAVANV.OWNER_CASE_CLEAN` and the SQL in `content/sql/`
(00–05). App-incrementality estimation runs in Python (`python/app_incrementality*.py`);
SQL extracts the panels. This tool is a presentation layer over precomputed results — it does
not query Snowflake at runtime.
