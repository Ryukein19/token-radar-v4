# Token Radar v4 — Build Report (local build only; no submit)

Built 2026-11-26 from the prose brief + design doc + sealed snapshot. Fresh
build: no source from token-radar / v3-a / v3-b / v3-c was opened. `main.ts`
(Node 22, stdlib only) fits everything at runtime from the snapshot and writes
`/output`: `board.json`, `data.js` (`window.RADAR`), `dashboard/` (3 files),
`screenshots/` (3 images) and `dossier.json` via `vendor/makefun-board.ts`.

## Draft title (measured evidence only)

> **Launch Radar: walk-forward ×2.51, leave-one-out ×2.84, forward 24-month
> odds that peak at 1–2y and fall with age — 17 farm plans at the default ticket**

## Measured numbers

| Quantity | Measured |
|---|---|
| Snapshot protocols | 758; watchlist 40 |
| Ledger (sums to 758) | ranked 198 · token, usable cap 128 · token, no usable cap 288 · set aside 144 |
| Board | 198 rows = watchlist 40 + early 138 + off-list 20 |
| Comps for the value fit | **95** — traded tokens with a usable cap **and** a listing date. 128 carry a usable cap; 33 carry no listing date, so the walk-forward split cannot use them. (The 92–98 expectation in the brief is the same set up to definition; 95 is the honest count under this definition.) |
| Size curve (95 comps) | ln(mcap) = 8.536 + 0.426·ln(TVL), slope ± 0.095 (bootstrap s.e., 200 resamples) |
| Value miss, kept model | leave-one-out **×2.84**, walk-forward **×2.51**, ten-fold **×2.93** |
| Flat 0.25× baselines | LOO ×4.11, WF ×4.14 |
| Range honesty (LOO residuals) | **52%** inside printed P25–P75 (stated 50%), **81%** inside P10–P90 (stated 80%) |
| Token-odds Brier (5-fold, n=645 peers) | **0.203** (age + category) vs **0.250** base rate; age alone 0.217 |
| Forward 24-month launch odds | 0–1y 33% (n=161) · 1–2y **65%** (n=184) · 2–3y 56% (n=137) · 3–4y 8% (n=89) · 4–5y 2% (n=66) · 5y+ 2% (n=8). Backward ever-token share for contrast: 32% · 39% · 55% · 79% · 80% · 75% |
| Total implied value | **$907.83M**; top row Steakhouse Financial $34.18M |
| Farm at default (sized 0.02% TVL, 7%, 26 wk) | **17 FARM / 126 MARGINAL / 55 SKIP**; top 10 holds 5 FARM |
| Farm at flat $1,000 | 0 FARM / 93 MARGINAL / 105 SKIP (honest — shown via the deposit ladder, not hidden) |
| Farm at flat $5,000 | 24 FARM / 122 MARGINAL / 52 SKIP |
| FARM rows also clearing the T-bill capital charge | 1 of 17 (disclosed on the page) |
| Dashboard | 3 files, 32,039 bytes; dossier text 32,302 bytes (cap 65,536) |
| Dossier | 1,242,562 bytes (cap 1.5 MiB); rebuilds byte-equal |
| Screenshots (1440×900) | 1-board.png 300,511 B · 2-detail.jpg 303,887 B (JPEG) · 3-filtered.png 302,468 B |

## Value-term evidence table (keep rule: a term joins only if it lowers the
## held-out miss on BOTH leave-one-out and walk-forward by ≥1%)

| Term | LOO | WF | 10-fold | Decision |
|---|---|---|---|---|
| size curve only | ×3.23 | ×3.01 | ×3.17 | base |
| + category ridge (k=32, n≥3) | ×3.36 | ×2.87 | ×3.31 | tested — not kept (helps WF, hurts LOO) |
| + chain count | ×3.38 | ×2.81 | ×3.04 | kept (as part of the final pair) |
| + years listed (= age) | ×3.18 | ×3.02 | ×3.06 | tested — not kept (helps LOO, hurts WF) |
| + 7-day growth (relative) | ×2.94 | ×2.74 | ×2.86 | kept |
| + growth + chains | **×2.84** | **×2.51** | ×2.93 | **KEPT (final model)** |
| + growth + chains + ridge | ×2.74 | ×2.58 | ×3.08 | tested — not kept (LOO gain, WF cost) |
| + growth + chains + years | ×2.72 | ×2.63 | ×2.77 | tested — not kept (LOO gain, WF cost) |
| all value terms | ×2.78 | ×2.58 | ×2.93 | tested — not kept |
| negative control: growth of another row | ×3.22 | ×3.12 | ×3.40 | control — helps neither test, so the tests are not broken |

Final value model: `ln(mcap) = 8.536 + 0.426·ln(TVL) + 0.014·chains − 2.916·relGrowth`,
relative growth winsorized to the comp range [−0.319, +0.349] (see below).
The growth sign is negative — in this down week (median 7d −8.23%) the comps
that fell least were not the priciest. The sign is the data's, not a choice;
the term is kept because it lowers the held-out miss on both tests.

## Odds-term evidence table (Brier, 5-fold, peers n=645, base rate 0.507)

| Spec | Brier | Decision |
|---|---|---|
| base rate only | 0.251 | base |
| age | 0.217 | signal — not priced into forward odds |
| age + log TVL | 0.218 | tested — no gain over age |
| age + log TVL + growth | 0.218 | tested — no gain over age |
| age + category rate | 0.203 | signal — not priced (thin bands) |
| age + log TVL + growth + category | 0.203 | signal — not priced (thin bands) |
| joint + fitted kin flag | 0.174 | **TESTED — NOT KEPT: leakage, sign reverses** |
| joint + kin + category | 0.170 | **TESTED — NOT KEPT: leakage, sign reverses** |
| age + log TVL + growth + category + age² | 0.203 | tested — not kept (in-sample gain 0.0001 < 0.002 guard; WF worse by 0.0017) |
| age + log TVL + growth + category + chain count | 0.204 | tested — not kept (in-sample gain 0.0004 < 0.002 guard; WF worse by 0.0006) |
| age + log TVL + growth + category + age×logTVL | 0.204 | tested — not kept (in-sample gain −0.0006 < 0.002 guard; WF worse by 0.0013) |
| age + log TVL + growth + category + age² + chains + age×logTVL | 0.204 | tested — not kept (in-sample gain 0.0000 < 0.002 guard; WF worse by 0.0025) |

Guarded odds test (fix pass, 2026-11-26): the four non-leaky logTVL/momentum
terms were tested against the kept spec (age + log TVL + growth + category,
in-sample Brier 0.1883, walk-forward Brier 0.2156, WF cutoff 2025-01-06, the
peers' median listing date). Keep rule: in-sample gain ≥ 0.002 AND
walk-forward not worse. **None passed** — the best in-sample gain was 0.0004
(chain count) and every candidate was worse walk-forward. The odds model is
unchanged (Brier 0.203). The gap to v1's 0.1698 is not closable without the
leakage term, so it is not chased.

The board prices **forward** odds (the age-band 24-month hazard), not the
logistic. The fitted kin flag scores best but is leakage: it is a family
proxy whose sign reverses for pre-token rows — a sibling token already
trading lowers launch odds, so kin rows (7 on the board) take a stated
×0.50 heuristic discount instead, never a fitted coefficient.

## Farm economics (stated on the page)

Expected drop = implied value × drop share × (ticket / TVL) — the position's
share of the airdrop slice. Fees = gas on the protocol's first chain
(Ethereum $18, Solana $0.50, Base $1.50, Arbitrum/Optimism $2, BNB/Polygon
$1, Avalanche $2, other $5) + 0.25% of the ticket. Capital charge = ticket ×
4.25% (T-bill) × horizon, shown per row. Verdict: FARM if net ≥ $25 and
net/hour ≥ $25/h; MARGINAL if net > 0; else SKIP. The capital charge is shown
per row and net-after-capital in the detail view; only 1 of the 17 FARM rows
also clears it at the sized ticket, and the page says so. Steps: 6 per row,
generated from a template filled with the protocol's own chain, category and
venue type + plan parameters (deposit, horizon, exit rule); per-step costs
and times come from the same fee model. Active time 2.67h per plan.

## Deliberately left out (with reasons)

- **Category ridge in the value model** — tested, not kept: it helps
  walk-forward but hurts leave-one-out, so it fails the disclosed keep rule.
  The ridge is still computed and shown in the evidence table.
- **Years listed / age in the value model** — tested, not kept: improves LOO
  on top of the kept pair but worsens walk-forward. Age enters the odds
  instead (forward hazard + peer Brier).
- **Category adjustment to the forward odds** — the peer logistic shows
  category carries signal (Brier 0.203 vs 0.217), but it is not folded into
  the hazard: the hazard bands are a direct age-band estimate on the same
  peers and the category split of the thin bands would overfit.
- **Fitted kin coefficient** — rejected as leakage (Brier 0.174); replaced by
  the stated ×0.50 heuristic discount.
- **Flat-$1,000 as the default scenario** — the default is the sized ticket
  (0.02% of TVL); the flat ticket is offered as a control and the deposit
  ladder shows its economics. At flat $1,000 the honest count is 0 FARM.
- **Winsorization of relative growth** — relative growth is clamped to the
  range the comps span ([−0.319, +0.349]) so no board row extrapolates beyond
  the fitted data (one row's 7-day change is +4,448%, which the negative
  fitted sign would otherwise crush to ~zero; another is −72.7%, which it
  would otherwise boost 6.6×). The comps define the bounds, so no comp is
  winsorized and the held-out tests, keep decisions and coefficients are
  unchanged. Stated on the page.

## Verification (replicated locally)

- Two runs into separate directories: **byte-identical** (`diff -r` clean).
- All 7 gate rows replicated and passing (see `verify.py`): dashboard 3 files /
  32,039 B, no `http(s)` strings; board 198 rows, ranks 1..198, implied positive
  whole ≤1e14, non-rising, not all equal; watchlist 40/40; farm steps 3–12 ×
  20–600 chars; screenshots 3 × 1440×900, ≤512 KiB (300,511 / 303,887 /
  302,468 B); dossier 1,242,562 B, text 32,302 B; `buildDossier` rebuild from
  the output is byte-equal.
- `data.js` checksum equals sha256 of `board.json`; `data.js` rows equal
  `board.json` rows.
- Screenshots re-rendered from the real dashboard in headless Chromium
  (1440×900, `shoot.py`): (1) board cover — farm-first sort, first row b14g
  (#6, top FARM row by net), second visible row Anemoy Capital (#10, the
  FARM★ beacon); (2) detail view with b14g expanded — full WHEN/STEP/COST/TIME
  table + budget line + deposit ladder; (3) filtered view (tier Early, sorted
  by $/h).
- NOT done (submit-time steps, per the brief): no GitHub repo, no submit, no
  `makefun final`, no bundle/check.

## FIXES — cover-only fix pass (on top of b7890f5)

Driven by the Groq + OpenRouter sparring verdicts (`SPAR_GROQ.md`,
`SPAR_OPENROUTER.md`). Cover-only: the fitted value model is untouched
(LOO ×2.84, WF ×2.51, Brier 0.203 — all unchanged). What changed:

1. **Farm-first board sort.** The cover board now defaults to sorting by farm
   score (FARM, then MARGINAL, then SKIP, each by net desc) instead of implied
   value. The first board row on first paint is b14g (#6, top FARM row by net,
   $193.08), not a giant-protocol SKIP. A Sort control (`Farm first` /
   `Implied value (rank)` / `Net` / `$/h` / `TVL` / `Odds`) switches back; `#`
   stays the implied-value rank. The integrity strip now reads "board.json
   self-check" so its rank/value claims are visibly about the data, not the
   display order.
2. **T-bill-adjusted verdict tier (FARM★).** A FARM row that also clears the
   T-bill capital charge is shown as **FARM★** (gold) on the board, in the
   counts line, in the KPI tile, and in the detail view — with the sentence
   "the only FARM row that does so at this scenario" when the count is 1.
   Exactly one row qualifies at the default scenario: **Anemoy Capital (#10,
   net $151.18 vs capital charge $118.69)** — verified from the program
   (`farm.clears_capital_charge`, 1 of 17 FARM rows). The verdict in the data
   stays FARM; ★ is a live display tier recomputed from the same farm formula
   when the scenario controls change.
3. **Deposit ladder on the cover (sparkline).** A strip under the KPIs shows
   FARM rows by flat ticket, counted by the program (`evidence.deposit_ladder`):
   $250 → 0 · $1,000 → 0 · $2,500 → 3 · $5,000 → 24 · $10,000 → 83 FARM
   (with 36/93/121/122/71 MARGINAL and 162/105/74/52/44 SKIP respectively).
   The strip states the honest reading: flat $1,000 → 0 FARM, $5,000 → 24
   FARM — the sized 0.02%-of-TVL ticket (default) is what makes 17 rows farm.
   The strip is hidden in the detail view so the expanded row keeps its layout.
4. **relGrowth coefficient explained on the cover.** The value-miss evidence
   table now carries the sentence: the kept growth term is −2.916, so 1 point
   above the median 7d (−8.23%) prices exp(−2.916 × 0.01) ≈ 0.97× — about
   2.9% lower per point. The sign is negative because in this down week the
   comps that fell least were not the priciest; the sign is the data's, not a
   choice. Coefficient, median and winsor bounds all come from
   `evidence.growth_coef` / `median_change_7d` / `growth_winsor` — nothing
   hand-typed.
5. **Guarded odds test — FAILED, model unchanged.** Four non-leaky
   logTVL/momentum terms (quadratic age, chain count, age×logTVL, all three)
   tested against the kept spec (in-sample 0.1883, WF 0.2156). Best in-sample
   gain 0.0004 (chain count, under the 0.002 guard); every candidate was worse
   walk-forward (+0.0006 to +0.0025). Full numbers in the odds table above and
   in `evidence.odds_guard`. The odds model, the board odds (forward hazard)
   and the 0.203 Brier are exactly as before. Brier ≤ 0.19 is not reachable
   with non-leaky terms on this snapshot.

Also tightened (layout, no numbers changed): KPI sub-lines shortened to one
line, ledger legend to one line, evidence paragraphs trimmed — so the board's
first rows stay visible in the 1440×900 cover screenshot after the ladder and
the four new odds rows were added. Re-verified after the fix: two runs
byte-identical, all 7 gate rows passing (`verify.py`), screenshots re-rendered
from the real dashboard (300,511 / 303,887 / 302,468 B — all in the 300–350 KB
band), dashboard 32,039 B, dossier 1,242,562 B, text 32,302 B.

## How to reproduce

```bash
MAKEFUN_OUTPUT_DIR=out node main.ts --input <path to snapshot.json>
# renders screenshots from out/dashboard with headless Chromium at 1440x900,
# places them in screenshots/, re-run to build the dossier.
```
