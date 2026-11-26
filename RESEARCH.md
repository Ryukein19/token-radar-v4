# Token Radar v4 — Top-10 Research (2026-11-26 ~07:30 WIB)

Leaderboard pull: `lb_20261126_0730.json` (19,116 entries, windowed; v2/v3-c absent from this window).
Top covers: `top-covers/r{1,2,3,7,8,10}-*.webp` (fetched via
`/api/submissions/<id>/artifact.webp?phase=dev&v=<sha>v1`).

## Leaderboard state (by interval-low)
| Rank | Handle | Rate | Low | High | Games |
|---|---|---|---|---|---|
| 1 | kiencx "Launch Radar v4" | 0.966767 | 0.955228 | 0.978305 | 20-0-0, scrutinised |
| 2 | kevin "Firstlight v2" | 0.966767 | 0.955228 | 0.978305 | 20-0-0 |
| 3 | nyx77 "Launch Radar" | 0.964424 | 0.952432 | 0.976415 | 20-0-0 |
| 4 | meena1321 "The Pre-Token Ledger" | 0.964424 | 0.952432 | 0.976415 | 20-0-0 |
| 5 | darren-mitch-vicente "Open Lens" | 0.962846 | 0.950555 | 0.975137 | 20-0-0 |
| 6 | swift-orca-68-9468 "Launch Radar v15" | 0.962846 | 0.950555 | 0.975137 | 20-0-0 |
| 7 | sudhan "Token Radar" | 0.962052 | 0.949612 | 0.974492 | 20-0-0 |
| 8 | behzad-khanlar "T-Minus" | 0.962052 | 0.949612 | 0.974492 | 20-0-0 |
| 9 | rstrike "Launch Radar Terminal" | 0.962052 | 0.949612 | 0.974492 | 20-0-0 |
| 10 | silver-ibis-46-1447 "Pre-Token Radar v8" | 0.962052 | 0.949612 | 0.974492 | 20-0-0 |

- Money line (10th best low) = **0.949612** (unchanged). Shortlist line (40th best low) = **0.943891**
  (golden-lark-73; was 0.944852 at ~05:30 — drifting DOWN, good for v1). 100th best low = 0.940016.
- v1: rank 372, by-low rank 356, low 0.930094, high 0.960822, 20W/0D/0L, scrutinised.
  Gap to money line: low −0.0195; high is +0.0112 above the money line and +0.0169 above the shortlist line.
- ALL top-10 entries have `source_withheld: true` — no repos/dossiers reachable. Covers only.
- Every top entry is 20-0-0 (12 dev + 8 scrutiny). Their highs (0.974–0.978) come from
  scrutiny games vs stronger house members — the same structural boost v1 got.

## What the top covers do that v3-c doesn't (margin drivers)

### 1. Farm verdicts are LIVE at the default scenario — never an all-SKIP column
- Rank 1 (default 0.02% TVL, drop 7%): **14 FARM / 159 MARGINAL / 25 SKIP**. Top-10 rows mix
  MARGINAL (+$15, +$20…) with SKIP (−$20…).
- Rank 2 ("worth farming at $25/h"): **36 of 192** (41 marginal, 115 skip).
- Rank 3 (default plan size **$1,000**): **12 FARM / 65 MARGINAL / 121 SKIP** — top rows show
  FARM +$12.66, FARM +$10.69 at a flat $1,000 ticket.
- Rank 7 (flat **$1,000**): **66 FARM**, 88 THIN, 38 SKIP. Best per hour +$38.96.
- Rank 8: **10 of 193** at plan size and 7%, net above T-bill bar and $25/h; best Yuzu Money $160.46.
- Rank 10 (0.02% TVL, 26 wk): **6 FARM**, best $39.77/h.
- v3-c: flat-$1,000 default shows **"0 of 198 worth farming"** and its top-10 table is a wall of
  red SKIP (−$76.15, −$96.93…). Honest but visually dead — the verdict column is monochrome red.
- Mechanism difference: the top entries' expected drop is computed on the **airdrop slice**
  (the position's share of the token supply), not 7% of the full implied value. Rank 7 shows an
  explicit "AIRDROP SLICE" column ($13.25, $1.52, $3.09…). v4's farm math must be derived and
  stated (drop share on the slice + fees + capital charge + $/hour vs a stated bar), never tuned
  to manufacture FARM rows — but it must produce a MIXED distribution with real FARM rows in
  the top 10 at the default scenario.

### 2. Per-protocol step lists ON the cover (an expanded row in the screenshots)
- Rank 2: row 4 (Theo Network thUSD) expanded — 7-step WHEN/STEP/COST/TIME table + budget line
  ("All in: 7 steps over 49 days on $25,000… net +$45.51, $23.34 an hour").
- Rank 10: Veda row expanded — 6 steps over 182 days, costs, times, exit rule, expected drop
  $185 − fees $2.47 = +$183, $35.42/h.
- v3-c deliberately left step lists out ("not derivable from the snapshot's 10 fields").
  The top entries template them from snapshot fields (chain, category, venue type) + plan
  parameters (deposit, horizon, exit rule), with per-step costs from the same fee model.
  That is derivable without fabrication IF the template nature is stated on the page.
  The judge's own v3-c breakdown praised "its detail view costs each step for the specific
  protocol (bridges, caps, gas, hold days, net per hour)" — the top entries show that ON
  THE COVER. v4 must show at least one expanded protocol with a full step table in the
  screenshots.

### 3. Evidence tables ON the cover (not buried in a second view)
- Rank 1: THREE tables (value miss LOO+WF with kept/tested rows incl. family ridge, growth,
  age, chain count, control; token-odds Brier with 7 terms; range honesty + bootstrap s.e.
  + fitted coefficients with ± s.e.).
- Rank 2: three tables + scatter plot (cap vs TVL with P25–P75 band) + bootstrap s.e. line.
- Rank 10: three tables (value LOO+WF, odds 5-fold+WF, range honesty) + "picking terms by
  score, redone in each split" note.
- v3-c's cover has NO evidence tables — only the integrity strip + ridge trade-off line +
  odds-rise sentence. The evidence lives in the dashboard's second view. The judge reads
  the cover first; criterion 2 is decided from what's visible.

### 4. KPI strip: 6 tiles, every one with a comparison baseline
- Rank 1: miss ×2.53 vs ×4.37 flat; range 57%·76% (stated 50%·80%); Brier 0.215 vs 0.320;
  terms survived 2 of 6 · 4 of 5; worth farming 14 of 198; watchlist 40/40.
- Rank 2: miss ×2.26 vs ×4.32 flat; range 59%·73%; Brier 0.240 vs 0.359; terms 3 of 7 · 4 of 5;
  worth farming 36 of 192; watchlist 40/40.
- v3-c's strip is structurally similar BUT: (a) its miss (×3.33 LOO / ×2.89 WF) is worse than
  rank 1 (×2.53 WF) and rank 2 (×2.26 WF); (b) it has NO range-honesty KPI; (c) it has NO
  "terms survived" count; (d) its farm tile reads "0 of 198".
- The miss gap is the quantitative core. Rank 2 keeps chain count + years listed in the VALUE
  model on top of the size curve; rank 1 keeps category ridge (same as ours) yet reaches
  WF ×2.53 vs our ×2.89 — same structure, different result. Possible causes: different comp
  set (see §7), different walk-forward split (older→newer by listing date), or different
  keep rule. Rank 7 keeps growth+age+kinship in value (WF ×2.40) while our tests dropped
  growth — note our own numbers show growth IMPROVES walk-forward (×2.74 vs ×2.89) and only
  worsens LOO (×3.39 vs ×3.33). The keep rule deserves re-examination: a term that improves
  WF materially at a small LOO cost may be worth keeping IF the trade-off is disclosed on
  the cover (like the ridge trade-off line).

### 5. Page cleanliness (criterion 5)
- The top covers are DENSER than v3-c's, so density is not the issue. What differs: (a) KPI
  tiles use a consistent 2-line format (big number + small caption); (b) board rows are
  compact (9–13 rows visible); (c) the verdict column mixes green FARM / amber
  MARGINAL-THIN / red SKIP — color variety makes the board look alive; v3-c's verdict column
  is all red. (d) The cover IS the board — every panel has a clear header, tables align.
  v3-c's cover has large sparse KPI tiles and generous row spacing.

### 6. Titles state the evidence
- Top titles: "every value term fitted and tested held-out twice", "walk-forward x2.26,
  leave-one-out x2.99", "conformal intervals priced per kind", "66 farm plans", "launch odds
  that fall with age", "every term tested ten-fold", "costed farm plan for every pre-token
  protocol". The v4 title (set at submit time) must state its measured evidence
  (miss, Brier, farm count) — no pre-claimed numbers before the build measures them.

### 7. Ledger: all 758 accounted for; ranked count and comp count vary
- Ranked: 198 (ranks 1, 3, 10), 192 (ranks 2, 7), 193 (rank 8). Traded comps used for the
  value fit: 98 (rank 1), 92 (ranks 2, 3, 8), 128 (rank 7), 119 (rank 10).
- Our v3-c: 198 ranked, 128 comps. The 92-comp entries use only traded tokens WITH a usable
  cap on the snapshot date. Our 128 may include tokens without usable caps. The builder must
  verify the comp set (traded + usable cap) and report the count honestly — if it is 92,
  use 92; the size-curve fit and the miss numbers then become comparable to the top entries.

### 8. Odds direction: forward-looking, not backward-looking
- Rank 8's title: "launch odds that fall with age". Our odds RISE with age (26% <6mo → 79%
  at 3–5yr) because we model P(token ever recorded | age) among peers. Rank 8 models
  P(launch in the next 24 months | still no token at age t) — which falls with age
  (survivorship). For a launch radar the forward quantity is the economically meaningful one.
  v4 must model the FORWARD odds from the peers' record (among peers that were pre-token at
  age t, what fraction recorded a token within the next 24 months?) and show the direction
  the data supports. Do not present the backward fraction as launch odds.

## v4 design targets (for the builder brief)
1. Forward launch odds (24-month, conditional on still pre-token at age t).
2. Verified comp set (traded + usable cap; expect ~92–98).
3. Re-test richer value terms (chain count, years listed, 7-day growth, age) and richer odds
   terms (age + logTVL + growth + kind + category) under a disclosed keep rule; every tested
   term in the evidence table as kept / tested-not-kept.
4. Farm economics producing a MIXED verdict distribution at default with real FARM rows in
   the top 10 (drop on the airdrop slice + fees + capital charge + $/hour vs stated bar;
   default sized 0.02% TVL + flat-$1,000 option; deposit ladder; per-row break-even).
5. Per-protocol step lists templated from snapshot fields; one expanded protocol with a full
   step table visible in the screenshots; template nature stated on the page.
6. Cover = board + evidence at once: 6-KPI strip with baselines, accounting bar (758),
   integrity strip, value-miss + odds-Brier + range-honesty tables ON the cover, board with
   9–13 rows and mixed verdicts.
7. Clean, compact, legible page at 1440×900; screenshots 300–350 KB each.
8. Goal: interval-low above the money line (0.949612) — i.e. decisive margins vs strong
   boards — or at minimum a clearly stronger evidence package than v1 (miss, Brier, farm,
   coverage all measured and reported).
