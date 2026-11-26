# Token Radar v4

A pre-token launch radar built fresh from a sealed DefiLlama snapshot
(758 protocols, 2026-11-14). One program, `main.ts` (Node 22, stdlib only),
fits the value model, the forward launch odds and the farm economics at
runtime and writes the ranked board, the dashboard and the dossier.

- **Value:** size curve fitted on the 95 traded comps with a usable cap and a
  listing date, plus the two terms that survive the disclosed keep rule
  (relative 7-day growth, chain count). Leave-one-out miss ×2.84,
  walk-forward ×2.51, vs ×4.11 / ×4.14 for a flat 0.25×.
- **Odds:** forward 24-month launch odds — P(token in 24 months | still no
  token at age t) — peak at 1–2 years (65%) and fall with age after that
  (8% at 3y, 2% at 4y+). The fitted kin flag is rejected as leakage; kin
  rows take a stated ×0.50 discount.
- **Farm:** expected drop on the airdrop slice (implied × 7% × ticket/TVL)
  minus gas + 0.25% fees, vs a $25/h bar. 17 FARM / 126 MARGINAL / 55 SKIP
  at the default sized ticket; every row carries a 6-step costed plan
  templated from its own chain, category and venue.

Local build only — see `BUILD.md` for the measured numbers, the keep/drop
decisions and the verification. Research notes live in `RESEARCH.md`.
