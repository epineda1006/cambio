# Decisions log

Every direction change, why we made it, and (when relevant) which interview caused it.
Newest entries at the top.

---

## 2026-09-27 — Step 4 "Your first switch": reduce, then reuse, then materials

**Before:** the Savings flow ended at Step 3 with numbers, but no concrete first move.

**Now:** Step 4 picks ONE first switch and gives a checklist. For takeout, the order of
priorities is:

1. **Reduce:** don't hand out what nobody asked for (forks and sauce only on request).
2. **Reuse:** reusables for dine-in (Steps 3 and 4), and customers' own containers for takeout.
3. **Better materials:** only once we know what Fresno's compost system accepts (see below).

**How the pick works** (`app/src/lib/firstSwitch.js`, tested):

- The `easy` swap with the highest yearly savings that actually saves money.
- If none: "forks and sauce only when asked", if extras go in every bag today.
- If neither: say so honestly. If they already give extras only on request, say they're ahead.
  A `medium` or `hard` swap is offered as "a bigger step" only if it saves money.

**Hand washing** (new Step 1 question): hand-wash labor = `hand_wash_seconds` (per swap) / 3600 x
one hourly wage (`assumptions.csv`), added to the wash cost before the unchanged calculator runs.
Steps 3 and 4 show the same savings, and "minutes a day" comes from the same seconds, so the two
can't disagree. This can flip the pick: a swap that saves money with a dishwasher may not by hand.

**The two California laws on screen** (checked on the official bill pages on 2026-09-27; the
notes state only what each law requires or allows, with no claims about fines or enforcement):

- **AB 1276 (2021)**, Public Resources Code section 42271:
  <https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202120220AB1276>.
  For **on-premises dining and third-party delivery platform** orders, a food facility gives
  single-use foodware accessories and single-serve condiments only when the customer asks, and on
  delivery platforms the menu lists them so customers choose. It does not name counter takeout,
  so the app presents extras-on-request for takeout as a money saver, not as a legal rule.
- **AB 619 (2019)**, Health and Safety Code section 114121:
  <https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB619>.
  A food facility **may** fill a customer's own clean, reusable container, following
  food-safety steps. It is a permission, not a requirement, and the app says it that way.

**Why materials wait:** the City of Fresno's green cart page lists food-soiled paper plates,
napkins, and paper bags, but does not mention compostable containers, cups, or clamshells at
all (it is also the residential page):
<https://www.fresno.gov/publicutilities/trash-disposal-recycling/what-goes-where-green-gray-blue/>
(checked 2026-09-27). Recommending "compostable" packaging that ends up in the landfill would
cost owners more for nothing, so Step 4 only says we're checking, until we ask the city
(commercial organics) directly.

**Join the pilot:** the text number and form link live in ONE file, `app/src/config/pilot.js`.
The repo is public, so it must hold a team Google Voice number and a team Google Form, never a
personal number. While either value is `PLACEHOLDER`, the buttons are disabled and say
"Coming soon".

**Still to validate in interviews:**

- `effort` levels and `hand_wash_seconds` per swap; the hourly wage; `extras_request_share`
  (share of takeout customers who actually want extras); `sauce_per_order` and
  `sauce_unit_cost`. All are PLACEHOLDER.
- The Spanish word for a bus tub: the checklist says "tina" ("Ponga una tina para juntar los
  trastes sucios"). Confirm the word owners actually use.
- Whether delivery apps give restaurants a setting for utensils and sauce; the checklist only
  says to check the app, until we've seen the settings.

---

## 2026-09-26 — Days open: any number from 1 to 7

**Before:** Step 1 offered only 5, 6, or 7 days a week.

**Now:** 1 through 7, nothing preselected. Food trucks and weekend-only vendors often open
fewer than 5 days, and forcing them to pick 5 would overstate their weekly use.

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
