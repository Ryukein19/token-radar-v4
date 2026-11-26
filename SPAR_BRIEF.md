# Token Radar v4 — Sparring Brief (panels judge from this text only)

You are judging three entries for make.fun competition token-radar-01 ("Build the best
token launch radar"). The platform judge is an LLM that compares two dashboards pairwise
against FIVE criteria IN ORDER: (1) working radar — full 40-protocol watchlist covered,
pre-token protocols ranked by a stated implied value, screenshots and code agree;
(2) value model — follows from the snapshot's own figures (TVL, 7-day growth, how long it
ran with no token), NOT a hardcoded list of names; separates token-trading from
still-to-come; (3) farm plans — concrete steps with cost and time, not slogans;
(4) dashboard as a page — sortable, filterable, readable at a glance, detail view per
protocol; (5) looks — chosen palette, consistent spacing, readable type.

All three entries read the SAME sealed snapshot: 758 DefiLlama protocols (2026-11-14),
10 fields each. All rank 198 pre-token protocols (40 watchlist + 138 early + 20 off-list)
and account for all 758 in a ledger. All dashboards are dark-themed, 1440×900 screenshots.

## Dev rates on the real platform (for calibration, NOT to copy — judge the evidence)
- v1 ("Token Radar", the current final entry): dev rate **0.945458**, 20W/0D/0L of 20 games
  (12 dev + 8 scrutiny), interval 0.930–0.961.
- v2: 0.915039, 12 games. v3-c: 0.905308, 12W/0D/0L, interval 0.876–0.935.
  v3-c won ALL 12 of its games but by small margins (mostly "clearly" 3/5, some "slightly"
  2/5); the real judge praised its fitted model in every call and decided on criterion 2.
- Money line (10th best interval-low in the field) = 0.949612; shortlist line (40th) = 0.943891.

## ENTRY A — v1 (the incumbent final)
- Model: size curve ln(mcap) = 6.965 + 0.522·ln(TVL) refit at runtime from 128 traded comps
  (R² 0.194); per-category median mcap/TVL factor, shrunk by sample size; token odds from a
  logistic on no-token age + logTVL + relative 7-day momentum + a FITTED kin flag
  (parent discount ×0.426 from 1 kin pair). Implied value = size curve × category × odds.
- Measured: leave-one-out miss **×3.40** vs flat ×4.91; walk-forward miss **×4.31** vs flat
  ×5.18 (NOTE: v1's walk-forward split is harsher than the others — fit before 2025-01-23,
  test all newer tokens; the LOO numbers are the comparable ones); odds Brier **0.1698** vs
  base 0.2473 (CV 0.1732) — the best Brier of the three, BUT it comes from the fitted kin
  term, which later analysis flagged as leakage (the kin flag's sign reverses for
  pre-token rows; a fitted kin flag scores Brier ~0.17 while a stated ×0.50 heuristic
  discount is the honest treatment); range honesty 50% inside P25–P75 (stated 50%),
  79.7% inside P10–P90 (stated 80%).
- Farm (default sized ticket): **26 FARM / 145 MARGINAL / 27 SKIP**. Farm math: airdrop slice =
  implied × drop share × (ticket/TVL); net = slice − fees − time at $25/h; FARM if net > $25
  and net/hour > $25 AND beats the T-bill return. Per-row farm steps with costs.
- Cover: 6-KPI strip with baselines, integrity strip, evidence table on the page, board;
  4 screenshots (board, evidence, detail, farm). Dashboard ~31 KB.
- Weaknesses: LOO miss ×3.40 is the worst of the three; odds are BACKWARD-looking
  (P(token ever recorded | age), which rises with age); the fitted kin term is leakage-adjacent.

## ENTRY B — v3-c (previous challenger, already judged on the platform: 0.905308)
- Model: size curve ln(mcap) = 6.965 + 0.522·ln(TVL) (same 128 comps) × category ridge
  (k=32, n≥3) × token odds from age only (logistic); kin ×0.50 heuristic discount (stated).
  Category ridge disclosed as helping held-out (LOO ×3.40→×3.33, WF ×3.01→×2.89) but
  hurting by-category (×3.78) and by-size (×4.33 vs ×4.21 size-only).
- Measured: LOO **×3.33**, WF **×2.89** vs flat ×4.91/×4.14; odds Brier **0.216** vs 0.250 base;
  range honesty 54% inside P25–P75 (stated 50%), 77% inside P10–P90 (stated 80%).
- Farm: at flat $1,000 default **0 FARM / 0 MARGINAL / 198 SKIP** (honest but a wall of red
  SKIP in the top-10 table); at sized 0.02%-of-TVL ticket 25 FARM / 36 MARGINAL / 137 SKIP.
  Deposit ladder + per-row break-even deposit; detail view defaults to flat-ticket economics.
- Cover: 6-KPI strip, formula line, integrity strip, ridge trade-off line, odds-rise-with-age
  sentence ("26% of protocols listed under 6 months record a token vs 79% at 3–5 years"),
  top-10 board rows. NO evidence tables on the cover (they live in a second view).
- Weaknesses: the cover's verdict column is monochrome red SKIP at the flat default; no
  evidence tables on the cover; odds are backward-looking (rise with age); a richer joint
  odds spec (age+logTVL+momentum) was tested and NOT kept (in-sample gain 0.0007, WF worse).

## ENTRY C — v4 (the new challenger, NOT yet judged on the platform)
- Model: size curve refit at runtime from **95** traded comps (traded + usable cap + listing
  date; 128 carry a usable cap, 33 carry no listing date so walk-forward cannot use them):
  ln(mcap) = **8.536 + 0.426·ln(TVL)**, slope ±0.095 bootstrap s.e. Final model adds two
  terms kept under a disclosed ≥1%-on-BOTH-tests rule: relative 7-day growth (winsorized to
  the comp range) and chain count. Final formula:
  ln(mcap) = 8.536 + 0.426·ln(TVL) + 0.014·chains − 2.916·relGrowth. Category ridge was
  TESTED and NOT kept (helps WF, hurts LOO); years listed tested, not kept. Negative control
  (another row's growth) helps neither test. Kin: fitted flag tested (Brier 0.174) and
  REJECTED as leakage; stated ×0.50 heuristic discount instead (7 kin rows).
- Measured: LOO **×2.84**, WF **×2.51**, ten-fold ×2.93 vs flat ×4.11/×4.14 — the best miss
  numbers of the three (WF ×2.51 beats the field's rank-1 entry's ×2.53; LOO ×2.84 beats
  rank-2's ×2.99). Range honesty **52%** inside P25–P75 (stated 50%), **81%** inside P10–P90
  (stated 80%) — the best-calibrated ranges of the three. Odds Brier **0.203** (5-fold,
  age+category) vs 0.250 base; age alone 0.217; joint spec with fitted kin 0.174 (rejected).
- Odds are FORWARD-looking: P(launch within 24 months | still no token at age t), from the
  peers' record: 0–1y 33% (n=161), 1–2y 65% (n=184), 2–3y 56% (n=137), 3–4y 8% (n=89),
  4–5y 2% (n=66), 5y+ 2% (n=8). Peaks at 1–2y and FALLS with age after that. The backward
  ever-token share (32%→80%) is shown alongside for contrast, never presented as odds.
- Farm (default sized 0.02% TVL, drop 7%, 26 wk): **17 FARM / 126 MARGINAL / 55 SKIP**,
  top 10 holds 5 FARM rows. Farm math: expected drop = implied × drop share × (ticket/TVL)
  (the position's airdrop slice) − fees − capital charge; FARM if net ≥ $25 and net/h ≥ $25.
  Only 1 of the 17 FARM rows also clears the T-bill capital charge — disclosed on the page.
  Flat $1,000: 0 FARM / 93 MARGINAL / 105 SKIP (honest, shown via the deposit ladder, not
  hidden); flat $5,000: 24 FARM. Deposit ladder + per-row break-even deposit.
- Per-protocol step lists: templated from snapshot fields (chain, category, venue) + plan
  parameters, with per-step costs and times; template nature stated on the page. The detail
  screenshot shows row #6 (b14g) expanded with a model breakdown, farm economics, and a
  6-step WHEN/STEP/COST/TIME table + budget line + deposit ladder.
- Cover (first screenshot): 6-tile KPI strip with a baseline on EVERY tile (×2.84 LOO vs
  ×4.11 flat; ×2.51 WF vs ×4.14 flat; 52%·81% range vs stated 50%·80%; Brier 0.203 vs 0.25;
  "2 of 5 value terms kept"; 17 of 198 worth farming); protocol-accounting bar (all 758 in
  exactly one group); integrity strip; THREE evidence tables ON the cover (value miss
  LOO+WF with kept/tested rows, token-odds Brier with 7 specs, forward-odds table by age
  band); board with 9 rows and MIXED verdicts (top 5 rows SKIP with large negative nets,
  rows 6–9 FARM green). Dashboard 28,432 B; dossier 1,285,229 B.
- Known weak spots (do not invent others): the top 5 board rows are all SKIP with large
  negative nets (−$900, −$325, −$1015, −$477, −$242) because the 0.25%-of-ticket fee
  dominates on giant protocols — the FARM rows start at #6; only 1 of 17 FARM rows clears
  the T-bill charge; flat $1,000 still yields 0 FARM; the odds Brier (0.203) is worse than
  v1's (0.1698), though v1's comes from the leakage-flagged fitted kin term.

## What to return
1. Rank the three entries (1st/2nd/3rd) with the margin between each pair (use the
   platform's 1–5 margin scale: 1 barely, 2 slightly, 3 clearly, 4 strongly,
   5 overwhelmingly) and name the deciding criterion (1–5) for each pairwise call.
2. A winner, and whether v4 is strong enough that it would plausibly beat v1's dev rate
   (0.945458) on the real platform — and what would still hold it back.
3. IMPROVEMENT SUGGESTIONS for v4 specifically (concrete, tied to the evidence above) and
   ADDITIONS that would make it stronger. Also one suggestion each for v1 and v3-c if
   anything stands out.
4. Say plainly if any of the three has a defect that would cost it a game (e.g. a
   leakage term, a dishonest number, a missing coverage) — verify each claimed defect
   against the evidence above before asserting it; do not invent defects.
