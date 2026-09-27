# Decisions log

Every direction change, why we made it, and (when relevant) which interview caused it.
Newest entries at the top.

---

## 2026-09-26 — Savings tab redesigned as a 3-step flow ("clean civic" style)

**Before:** one long page where the owner typed weekly counts for every item and saw every
swap card at once.

**Now:**

1. **Your business:** customers per day, days open (5/6/7), and for here or to go
   (20/50/80% dine-in). Nothing is preselected, and missing answers get an error summary.
2. **What you use each week:** weekly cups, to-go boxes, and forks, *estimated* from
   customers per day x per-customer ratios (`app/src/data/items.csv`, PLACEHOLDER). The owner
   can correct any number, and their number is kept even if they change customers per day.
3. **Your savings:** yearly and monthly savings, each item's best swap (BEST tag),
   pounds of plastic avoided, payback, other options on request, the full math, and "Share
   my plan".

**Why:** owners rarely know their weekly cup count but do know roughly how many customers
they have. Guided steps with big, plain controls work better on a phone, and the plain
"civic" look (inspired by government service design, with Cambio's own colors and logo)
reads as trustworthy rather than salesy.

**Kept honest:** the calculator math did not change (only estimate helpers were added). Money-losing
swaps are shown in red and never labeled BEST. The shared text always carries the "prices
are examples" line while data is PLACEHOLDER.

**Still to validate in interviews:** per-customer ratios, item weights (grams), and the
open question below (orders vs. people per day).

---

## 2026-09-26 — OPEN QUESTION: orders per day or people served per day?

**Status:** open. To be decided after interviews.

**The mismatch:** Step 1 of the Savings flow asks "How many customers a day?", and its help text
says to count each order as one customer. But the per-customer ratios in
`app/src/data/items.csv` (for example 0.8 cups per customer) assume one *person*. A family
order for four people counts as 1 customer but probably uses about 4 forks, so the current
wording could undercount.

**Options:**

- **Orders per day:** easier for owners, who often know it from their register or POS. The
  ratios would then need to be per order (for example forks per order).
- **People served per day:** matches the current per-person ratios, but it's harder for an
  owner to know.

**To ask in interviews:** "Do you know roughly how many orders you do a day? How many
people is a typical order?" Then update the question, the help text (EN/ES), and the
`per_customer` ratios together.

---

## 2026-09-26 — Calculator: how many reusables, and what they cost to run

**Context:** The README defines `upfront_cost = reusable items needed x reusable unit price` and
`annual_ongoing_cost = washing cost + replacement of lost or broken items`, but did not say how to
compute "items needed," washing cost, or replacement.

**Decision:**

- `days_open` is a restaurant-level setting (default 7), entered once on the Owner tool screen.
- `items_needed = ceil(replaced_per_week / days_open x par_multiplier)`
  - "Par" is how much stock you keep on hand. A par of 1.5 means one day's worth in use plus
    half a day's worth in the wash or on the shelf.
- `annual_ongoing_cost = (wash_cost_per_use x replaced_per_week x 52) + (items_needed x annual_loss_rate x reusable_unit_price)`
- `par_multiplier`, `wash_cost_per_use`, and `annual_loss_rate` live per swap in `app/src/data/swaps.csv`.

**Why:** These scale with the size of the business, so a food truck and a busy panaderia get
different answers. Each number is also something we can ask about in interviews
("How many baskets would you keep on hand?", "How many go missing in a year?").

**Still to validate in interviews:** par multiplier, wash cost per use, loss rate. All current
values are PLACEHOLDER.

---

## 2026-09-26 — Owner tool summary uses the best swap per item

**Decision:** The top summary card totals yearly savings and plastic avoided using the single best
swap for each item (highest yearly savings). If even the best swap loses money, that item adds $0
and the card says how many items have no money-saving swap.

**Why:** This is the headline number for the pitch video, so it must not overstate savings.
