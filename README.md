# Cambio (working name)

A bilingual (English/Spanish) tool that helps small Fresno County restaurants, panaderias, and food trucks cut single-use plastic by showing which swaps save them money, paired with a data map that shows which neighborhoods to start in.

Built for the BEAM Circular 2026 Student Design Challenge (Student Track). Video pitch due **October 11, 2026**.

Team: Eric Pineda Ramirez, Ronnie Pabelonio

---

## The idea in one paragraph

Small, family-run food businesses buy thousands of disposable cups, clamshells, and utensils every week. Most sustainability and compliance information is written in English for large chains. Cambio lets an owner enter what disposables they buy, then shows the top swaps (for example, reusable baskets for dine-in orders) with yearly savings, payback time, and plastic avoided. The Refill Map ranks Fresno County neighborhoods by where a program like this would help most, so a pilot starts where it matters.

## How this fits the challenge

- **Category:** business models, "affordable pricing and adoption options for small vendors," plus behavior change
- **Stakeholders:** at least 3 interviews with food ware stakeholders (restaurant owners, a supply distributor, city solid waste staff)
- **One-year pilot:** 5 restaurants in the top-ranked neighborhood switch dine-in to reusable ware for 3 months; measure disposables purchased and cost before vs. after

---

## Repo structure

```
cambio/
├── README.md
├── data/
│   ├── raw/          # downloaded source data (not edited by hand)
│   └── processed/    # cleaned outputs from the pipeline
├── notebooks/        # exploration only (scratch paper)
├── pipeline/         # final Python scripts that produce data/processed
├── app/              # React + Vite frontend
│   └── src/
│       ├── i18n/     # en.json, es.json (all UI text)
│       └── data/     # swaps.csv, map.geojson (what the app reads)
└── docs/             # interview notes, pitch script, decisions
```

**Rule of thumb:** notebooks are for figuring things out. Once a step works, move it into `pipeline/` so anyone can rerun it from scratch.

---

## Owners

- **Eric:** `app/` (Cambio owner tool, bilingual UI, calculator), Spanish-language interviews, narration
- **Ronnie:** `pipeline/` and `notebooks/` (Refill Map data and scoring), English-language interviews, video editing
- **Both:** `app/src/data/swaps.csv` (updated as interviews come in), `docs/`

---

## Calculator math

Prices live in `app/src/data/swaps.csv`; per-customer ratios and item weights live in `app/src/data/items.csv`. Values marked `PLACEHOLDER` must be replaced with real numbers from interviews or distributor quotes before the video.

The owner answers three questions (Step 1 of the Savings tab): customers per day, days open (5, 6, or 7), and "for here or to go" (mostly to go = 20%, half and half = 50%, mostly here = 80% dine-in). For each disposable item:

- `weekly_qty` = customers_per_day x days_open x per_customer (from `items.csv`), rounded; the owner can replace any estimate with their own number (Step 2), and that number is kept even if they change customers per day
- `dine_in_share` = fraction of orders eaten on site (reuse only applies here); the same for every item
- `days_open` = days open per week (one setting for the whole restaurant)
- `annual_disposable_cost` = weekly_qty x unit_cost x 52

For a swap:

- `replaced_per_week` = weekly_qty x dine_in_share
- `upfront_cost` = reusable items needed x reusable unit price
  - `items_needed` = ceil(replaced_per_week / days_open x par_multiplier)
- `annual_ongoing_cost` = washing cost + replacement of lost or broken items
  - washing = wash_cost_per_use x replaced_per_week x 52
  - replacement = items_needed x annual_loss_rate x reusable_unit_price
- `annual_savings` = (replaced_per_week x unit_cost x 52) - annual_ongoing_cost
- `payback_weeks` = upfront_cost / (annual_savings / 52)
- `plastic_avoided_per_year` = replaced_per_week x 52
- `pounds_of_plastic` = plastic_avoided_per_year x grams_each (from `items.csv`) / 453.59237
- monthly savings = annual_savings / 12

If `annual_savings` is zero or negative, the app says so honestly instead of hiding the swap.

`par_multiplier` (stock on hand, in days of use), `wash_cost_per_use`, and `annual_loss_rate` are set per swap in `swaps.csv`. The results (Step 3) total the best swap per item (highest `annual_savings`); an item whose best swap does not save money adds $0, is never labeled BEST, and is reported in red. The takeout share (1 - dine_in_share) is shown with a note that compostable options are coming. See `docs/decisions.md` (2026-09-26). The math lives in `app/src/lib/calculator.js` (tests in `calculator.test.js`); `app/src/lib/results.js` combines it for the results screen.

---

## Refill Map (Fresno County)

Ranks census tracts in Fresno County by launch priority using public data:

- Restaurant density (source to confirm: county food facility permits or business listings)
- U.S. Census ACS: population density, median income, share of Spanish-speaking households
- CalEnviroScreen: disadvantaged community score
- CalRecycle per capita disposal: city-level context only, compared to each city's own history (CalRecycle warns these rates cannot be compared across jurisdictions)

**Version 1:** a transparent weighted score, with a "why this tract" breakdown for each result.
**Future:** once the pilot runs, train a model on which restaurants actually adopted swaps.

---

## Run it locally

**Frontend**
```bash
cd app
npm install
npm run dev
```
Then open the local URL Vite prints (usually http://localhost:5173).

Run the tests (calculator math, CSV loading, EN/ES text) with `npm test`.

**Data pipeline**
```bash
cd pipeline
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python build_map.py
```

## Deploy

Hosted on Vercel. In the Vercel project settings, set **Root Directory** to `app`. Every push to `main` redeploys.

---

## Timeline

- **Sep 27:** kickoff meeting, lock roles
- **Sep 28 to Oct 2:** interviews (3 minimum), repo scaffold, calculator with placeholder data
- **Oct 1 to Oct 6:** real prices in, map built, bilingual polish
- **Oct 6 to Oct 9:** script, interview clips, demo recording
- **Oct 10:** edit
- **Oct 11:** submit

## Decisions log

Record every direction change and which interview caused it in `docs/decisions.md`. Judges want to see how interviews changed the idea.
