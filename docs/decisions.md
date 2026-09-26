# Decisions log

Every direction change, why we made it, and (when relevant) which interview caused it.
Newest entries at the top.

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
