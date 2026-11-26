# Token Radar — Groq sparring verdict (openai/gpt-oss-120b)

Panel: Groq, model openai/gpt-oss-120b, max_tokens 4000. Prompt: the full SPAR_BRIEF.md text (brief only, no pixels). Run 2026-11-26 ~07:51 WIB. Verbatim reply below.

---

**1. PAIRWISE RANKINGS (margin = 1 – 5, deciding criterion = 1 – 5)**  

| Pair (better → worse) | Deciding criterion | Margin (1‑5) | Why the margin is that size |
|-----------------------|--------------------|--------------|-----------------------------|
| **v4 → v3‑c** | **2  Value‑model** | **4  (Strongly)** | v4 posts the lowest LOO miss (2.84 vs 3.33), the lowest walk‑forward miss (2.51 vs 2.89), a forward‑looking token‑launch odds table, and no leakage‑prone kin flag. v3‑c is still backward‑looking and relies on a heuristic kin discount. The gap on the two core error‑metrics is > 0.4 × ‑‑ a clear, quantitative edge. |
| **v3‑c → v1** | **2  Value‑model** | **3  (Clearly)** | v3‑c improves both LOO (3.33 vs 3.40) and walk‑forward (2.89 vs 4.31) errors, and it discards the leakage‑prone kin term that v1 keeps. The improvement on walk‑forward is large, but the LOO gain is modest, so the overall advantage is “clearly” better but not “strongly” overwhelming. |
| **v4 → v1** | **2  Value‑model** | **5  (Overwhelmingly)** | Combining the two previous advantages (v4 beats v3‑c, v3‑c beats v1) gives v4 an overwhelming lead on the single decisive criterion. Its forward‑looking odds, best‑in‑class miss numbers and clean‑no‑leakage model dwarf v1 on every sub‑point of criterion 2. |

*Criterion 1 (working radar) is identical for all three entries, so it never decides a pair.*  

---

**2. WINNER & DEV‑RATE PROSPECT**

- **Winner:** **Entry C (v4)**.  
- **Would v4 plausibly beat v1’s platform dev‑rate of 0.945458?**  
  *Yes, it is plausible but not guaranteed.*  
  - **Why it could win:** v4’s value‑model performance (LOO ×2.84, WF ×2.51) is the best of the three and better than the field’s current rank‑1 (WF ×2.53). Its forward‑looking odds are honest, and it has no leakage‑related term.  
  - **What still holds it back:**  
    1. **Farm economics** – only 1 of the 17 “FARM” rows clears the T‑bill capital‑charge benchmark; the rest are merely “marginal”.  
    2. **Odds Brier** – 0.203 is higher (worse) than v1’s 0.1698, even though v1’s score is tainted by a leakage term.  
    3. **Top‑row SKIP bias** – the fee structure pushes the highest‑TVL protocols into large‑negative‑net SKIP rows, limiting the visible “wins”.  
    4. **Size of the data‑fit** – the size curve is built on only 95 traded comps (vs 128 in v1/v3‑c), which may increase variance in live play.  

  Consequently, while v4 is a strong candidate to surpass v1’s dev‑rate, the above three weaknesses could keep its on‑platform score just below v1’s 0.945 – 0.95 band.

---

**3. IMPROVEMENT SUGGESTIONS**

| Entry | Concrete suggestion (tied to evidence) | How it strengthens the entry |
|-------|------------------------------------------|------------------------------|
| **v4 (C)** | 1. **Reduce the per‑ticket fee or introduce a tiered fee** so that the giant‑protocol rows no longer end up with huge negative nets. This would turn several of the current top‑5 SKIP rows into at‑least “MARGINAL” or “FARM” rows, improving the *Farm‑plan* criterion. <br>2. **Add a calibrated “capital‑charge” benchmark** (e.g., compare net‑return to a 3‑month T‑bill) and display it directly on the board. This makes the “FARM” verdict more transparent and raises the *Dashboard‑as‑a‑page* readability. <br>3. **Refine the odds model** by modestly incorporating log‑TVL or 7‑day momentum (the joint spec with kin gave Brier 0.174 but was rejected for leakage; a non‑leaky version could be tested). Even a small Brier improvement (e.g., to ≤ 0.19) would close the gap with v1 on the *Value‑model* Brier sub‑criterion. <br>4. **Show a “what‑if” fee‑scenario toggle** (e.g., 0.1 % vs 0.25 %) on the cover so users can see how fee choice moves rows between SKIP/MARGINAL/FARM. This enhances *Looks* (interactive clarity) and *Dashboard* (filterability). | Improves criteria 3, 4, 5 and tightens criterion 2 (odds Brier). |
| **v1 (A)** | 1. **Remove the fitted kin flag** (the leakage term) and replace it with the disclosed 0.5 × heuristic discount used in v3‑c/v4. This eliminates the dishonest leakage defect that would cost a game. <br>2. **Switch the odds calculation to forward‑looking** (as v4 does) rather than “ever‑token” backward odds. This aligns the model with the competition’s spirit and improves the *Value‑model* honesty. <br>3. **Add evidence tables to the cover page** (currently only on a secondary view) so the *Dashboard‑as‑a‑page* criterion is satisfied at first glance. | Fixes a game‑losing defect, raises criterion 2 honesty and criterion 4 completeness. |
| **v3‑c (B)** | 1. **Place at least one evidence table on the main cover** (e.g., the odds‑Brier table). The current cover shows only the board; adding the table would satisfy criterion 4 more fully. <br>2. **Offer a forward‑looking odds table** (like v4) in addition to the backward‑looking “odds rise with age” sentence. This would remove the backward‑looking drawback in criterion 2. <br>3. **Provide a small “fee‑adjust” toggle** to let users see how lowering the flat‑ticket fee moves rows out of the red SKIP wall. Improves criterion 3 (farm plans) and criterion 5 (looks). | Makes the entry stronger on criteria 2, 3 and 4 without altering its core model. |

---

**4. DEFECTS THAT WOULD COST A GAME**

| Entry | Defect (verified from the brief) | Effect on a game |
|-------|----------------------------------|------------------|
| **v1 (A)** | **Leakage‑prone fitted kin flag** – the kin flag is fitted on the whole data set, reverses sign for pre‑token rows, and artificially improves the Brier score. The brief explicitly calls it “leakage”. | **Game‑losing defect** – the platform penalises any model that contains a leakage term, regardless of other strengths. |
| **v3‑c (B)** | No leakage or dishonest number is reported. The odds are backward‑looking (a known limitation) but not a defect; the evidence tables simply sit on a secondary view, which is a usability shortcoming, not a disqualifying defect. | **No game‑losing defect** (only a minor usability weakness). |
| **v4 (C)** | No leakage, no dishonest numbers. The only “weak spot” is the concentration of SKIP rows at the top because of the fee structure, and the fact that only one FARM row clears the T‑bill charge. These are performance/clarity issues, not rule violations. | **No game‑losing defect**. |

---

**Summary**

- **Rank:** 1️⃣ v4 (C) > 2️⃣ v3‑c (B) > 3️⃣ v1 (A).  
- **Deciding criterion for every pair:** **Criterion 2 – Value‑model**.  
- **Margins:** v4 vs v3‑c = 4 (Strongly); v3‑c vs v1 = 3 (Clearly); v4 vs v1 = 5 (Overwhelmingly).  
- **Winner:** v4. It is strong enough to *potentially* beat v1’s platform dev‑rate, but the farm‑fee structure, modest odds Brier and the heavy SKIP tail keep it from a guaranteed win.  
- **Key improvements** are listed above; fixing v1’s leakage and adding forward‑looking odds will bring it back into contention, while v3‑c mainly needs UI‑level tweaks.  

All statements are derived directly from the data you supplied; no new defects were invented.
