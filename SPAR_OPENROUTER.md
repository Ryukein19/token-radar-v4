# Token Radar v4 — Sparring Verdict (OpenRouter panel)

- **Panel model:** nvidia/nemotron-3-ultra-550b-a55b:free (OpenRouter, free tier)
- **Date:** 2026-11-26 WIB
- **Method:** brief at `SPAR_BRIEF.md` passed verbatim as the prompt; judged from structured evidence summaries + cover descriptions only (not pixels).
- **Run notes:** first call at max-tokens 4000 returned empty content (reasoning consumed the whole budget, finish_reason `length`); retry at max-tokens 16000 returned a complete verdict (finish `stop`, 7,843 chars content). No model rotation needed — the named model was available.
- **Verdict below is verbatim from the panel.**

---

**1. Pairwise ranking & margins**

| Pair | Winner | Margin (1–5) | Deciding criterion |
|------|--------|--------------|-------------------|
| v4 vs v1 | **v4** | **3 — clearly** | **Criterion 2 (value model)** |
| v4 vs v3-c | **v4** | **3 — clearly** | **Criterion 2 (value model)** |
| v1 vs v3-c | **v1** | **2 — slightly** | **Criterion 3 (farm plans)** |

**Why these calls**

- **v4 beats v1 on Criterion 2**: v4’s forward-looking odds (P(launch within 24m | no token at age t) peaking at 1–2y then falling) are conceptually correct; v1’s odds are backward-looking (P(token ever recorded | age) rising with age). v4’s LOO miss ×2.84 vs v1’s ×3.40; WF miss ×2.51 vs v1’s ×4.31 (v1’s split is harsher, but LOO is comparable and v4 wins there too). Range honesty 52%/81% vs 50%/79.7%. v1’s best Brier (0.1698) comes from a fitted kin flag explicitly flagged as leakage; v4 tested that flag (Brier 0.174) and rejected it. v4’s ≥1%-on-both-tests term selection is disclosed and rigorous. Criterion 2 is the platform judge’s habitual decider — v4 wins it clearly.

- **v4 beats v3-c on Criterion 2**: v4 improves every model metric: LOO ×2.84 vs ×3.33, WF ×2.51 vs ×2.89, P10–P90 honesty 81% vs 77%, Brier 0.203 vs 0.216. v4’s odds are forward-looking; v3-c’s rise with age (backward). v3-c kept a category ridge that helps WF but hurts LOO and by-category; v4 tested and rejected it. v4 also wins Criterion 1 (three evidence tables *on the cover* vs none) and Criterion 4 (mixed verdicts, KPI baselines on every tile, protocol-accounting bar).

- **v1 beats v3-c on Criterion 3**: v1 shows 26 FARM / 145 MARGINAL / 27 SKIP at its default sized ticket with per-row steps, fees, time cost ($25/h) and T-bill hurdle all in the main view. v3-c’s flat $1,000 default yields 0 FARM / 0 MARGINAL / 198 SKIP — a wall of red — and its detail view *defaults to that same flat-ticket economics*, hiding the 25 FARM rows available at a sized ticket. v1’s farm math is complete and visible; v3-c’s is honest but buried.

**Overall rank**: 1st **v4**, 2nd **v1**, 3rd **v3-c**.

---

**2. Winner & v4’s platform prospects**

**Winner: v4.**

**Would v4 plausibly beat v1’s dev rate (0.945458)?**  
**Yes, it is plausible.** v4 dominates Criterion 2 — the criterion the real judge “praised in every call and decided on” for v3-c. v4’s walk-forward miss ×2.51 beats the *field’s rank-1 entry* (×2.53); its LOO ×2.84 beats the field’s rank-2 (×2.99). Its ranges are the best-calibrated of the three. It has no leakage, a disclosed term-selection rule, and forward-looking odds. In dev games (model-focused) it would likely win most pairwise calls.

**What would hold it back in scrutiny games (and thus the overall dev rate):**
- **Top-5 board rows are all SKIP with large negative nets** (−$900, −$325, −$1,015, −$477, −$242) because the 0.25%-of-ticket fee dominates on giant protocols. The first FARM row appears at #6. A scrutiny judge probing “readable at a glance” (Criterion 4) will see a radar whose top slots say “don’t touch.”
- **Only 1 of 17 FARM rows clears the T-bill capital charge** — disclosed, but the farm plan (Criterion 3) effectively says “only one protocol pays for its cost of capital.”
- **Flat $1,000 ticket still yields 0 FARM** — the deposit ladder shows $5,000 gives 24 FARM, but that insight lives in the detail view, not the cover.
- **Odds Brier 0.203** is worse than v1’s leaked 0.1698; a judge who doesn’t catch the leakage may penalise v4 here.

If the platform’s scrutiny panel weights Criterion 4 (dashboard readability) and Criterion 3 (actionable farm plans) heavily, v4 could drop games it would win on model merit alone.

---

**3. Improvement suggestions**

**For v4 (concrete, tied to evidence)**

1. **Re-sort the cover board by “net profit” or “farm score” by default**, not implied value. The current sort buries the 5 FARM rows at positions 6–9 behind five giant-protocol SKIPs. Add a one-click “Show FARM first” toggle; keep implied-value sort as an option.
2. **Add a “T-bill adjusted” verdict tier** to the board: `FARM✓` (clears capital charge), `FARM` (clears $25/h & $25 net), `MARGINAL`, `SKIP`. The single T-bill-clearing row becomes a beacon, not a footnote.
3. **Surface the deposit ladder on the cover** (not just detail view): a mini sparkline or 3-step ladder (`$1k → 0 FARM | $3k → 12 FARM | $5k → 24 FARM`) so users instantly see ticket-size sensitivity.
4. **Explain the negative relGrowth coefficient (−2.916)** in the evidence table or a tooltip. Higher 7-day growth → lower implied mcap is counter-intuitive; disclose whether winsorisation or comp selection drives it.
5. **Make per-protocol step lists less templated**: the detail screenshot shows a 6-step WHEN/STEP/COST/TIME table for b14g. Replace generic “bridge to chain” with snapshot-specific venue/chain data (e.g., “bridge to Arbitrum via Hop: $15, 10 min”).
6. **Add a per-row “model confidence” badge** (e.g., based on TVL distance to comp centroid, category sample size) in the detail view — turns the “2 of 5 terms kept” transparency into row-level utility.

**For v1**  
**Replace the fitted kin flag with the stated ×0.50 heuristic discount** and re-fit the odds model. The leakage is confirmed; the sign reversal on pre-token rows makes it a scrutiny-time bomb. Also, switch to forward-looking odds (P(launch within 24m | no token at t)) — the backward “odds rise with age” is conceptually wrong for a launch radar.

**For v3-c**  
**Move the evidence tables onto the cover screenshot** (Criterion 1). The ridge trade-off line and formula line are good, but the judge sees the cover first. Also, **change the default ticket from flat $1,000 to the sized 0.02%-of-TVL ticket** so the top-10 board shows mixed verdicts (25 FARM) instead of a monochrome red SKIP wall. The detail view should default to the sized-ticket economics, not the flat-ticket one.

---

**4. Verified defects that would cost a game**

| Entry | Defect | Evidence from brief | Criterion hit |
|-------|--------|---------------------|---------------|
| **v1** | **Leakage term in odds model** — fitted kin flag (parent discount ×0.426 from 1 kin pair) gives Brier ~0.17 but sign reverses for pre-token rows; later analysis flagged as leakage. | “the fitted kin term is leakage-adjacent… a fitted kin flag scores Brier ~0.17 while a stated ×0.50 heuristic discount is the honest treatment” | **2** (value model honesty) — a scrutiny judge will catch this and score it down. |
| **v3-c** | **No evidence tables on the cover** — they live in a second view. | “NO evidence tables on the cover (they live in a second view)” | **1** (working radar — screenshots & code agree, readable at a glance) and **4** (dashboard as a page). |
| **v3-c** | **Monochrome red SKIP verdict column at flat default** — top-10 shows 198 SKIP, hiding the 25 FARM rows available at sized ticket; detail view defaults to flat-ticket economics. | “the cover's verdict column is monochrome red SKIP at the flat default… detail view defaults to flat-ticket economics” | **4** (dashboard readable at a glance — it reads “nothing works” when the opposite is true one click away). |
| **v4** | **Top-5 board rows all SKIP with large negative nets** (−$900, −$325, −$1,015, −$477, −$242) because 0.25%-of-ticket fee dominates on giant protocols; FARM rows start at #6. | “the top 5 board rows are all SKIP with large negative nets… the FARM rows start at #6” | **4** (dashboard readable at a glance — the radar’s “top” signals “avoid,” burying the actionable rows). |

*No other defects are asserted.* v4’s low T-bill clearance (1/17) and flat-ticket 0 FARM are *disclosed weaknesses*, not defects — honesty is not a penalty. v1’s worse LOO/WF misses and backward odds are model choices, not defects. v3-c’s ridge trade-off and rejected joint odds spec are disclosed modelling decisions.
