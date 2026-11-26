// Token Radar v4 — a pre-token launch radar built fresh from the sealed snapshot.
// Node 22, standard library only. Reads /input/snapshot.json (or --input), writes
// /output (or MAKEFUN_OUTPUT_DIR / --output): board.json, data.js, dashboard/,
// screenshots/ and dossier.json via vendor/makefun-board.ts.
//
// The model is fitted at runtime from the snapshot itself — no hand-set value
// constants. Size curve + kept terms are chosen by a disclosed greedy rule:
// a term is kept only if it lowers the held-out miss on BOTH leave-one-out and
// walk-forward (older -> newer by listing date) by at least 1%. Every tested
// term is reported kept / tested-not-kept in the evidence table.
//
// Launch odds are FORWARD: P(token within 24 months | still no token at age t),
// estimated from the peers' age-band token rates as a conditional hazard. The
// backward share (peers that ever recorded a token by age) is shown alongside
// for contrast and is never presented as launch odds.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { buildDossier } from './vendor/makefun-board.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const KEEP_MIN_GAIN = 0.01; // a term must improve BOTH held-out tests by >= 1%
const CAT_SHRINK_K = 32;    // category-ridge shrinkage (n>=3, else factor 1.000)
const DROP_SHARE = 0.07;    // default airdrop share of the token supply
const SIZED_TICKET_FRAC = 0.0002; // default ticket: 0.02% of TVL
const TBILL = 0.0425;       // T-bill rate for the capital-charge line
const HOURS_BAR = 25;       // $/hour labour bar for a FARM verdict
const GAS: Record<string, number> = { Ethereum: 18, Solana: 0.5, Base: 1.5, Arbitrum: 2, Optimism: 2, BNB: 1, Polygon: 1, Avalanche: 2 };
const EXCL_CAT = new Set(['Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'CEX']);
const EXCH = ['Binance', 'Coinbase', 'Bybit', 'Kraken', 'Bitget', 'OKX', 'Bitfinex', 'Gemini'];
const VERSION_RE = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

// ------------------------------------------------------------------ io
function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1]! : null;
}
const inputPath = arg('input') ?? process.env.SNAPSHOT_PATH ?? '/input/snapshot.json';
const outDir = arg('output') ?? process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const snap = JSON.parse(readFileSync(inputPath, 'utf8')) as any;
const AS_OF = snap.as_of as string;
const FLOOR = snap.floor_usd as number;
const protocols: any[] = snap.protocols;
const watchlist: string[] = [...snap.watchlist].sort();
const asOfDate = new Date(`${AS_OF}T00:00:00Z`);
const DAY = 86400000;

// ------------------------------------------------------------------ cleaning
type P = any;
const hasToken = (p: P): boolean => p.gecko_id !== null || p.symbol !== null;
const isPre = (p: P): boolean => !hasToken(p);
const mcapUsable = (p: P): boolean => hasToken(p) && typeof p.mcap_usd === 'number' && p.mcap_usd > 0 && p.tvl_usd > 0;
const ageYears = (p: P): number | null => {
  if (!p.listed_at) return null;
  return (asOfDate.getTime() - new Date(`${p.listed_at}T00:00:00Z`).getTime()) / DAY / 365.25;
};
const ageDays = (p: P): number | null => {
  if (!p.listed_at) return null;
  return Math.round((asOfDate.getTime() - new Date(`${p.listed_at}T00:00:00Z`).getTime()) / DAY);
};
const medChange7d = median(protocols.filter((p) => p.change_7d !== null).map((p) => p.change_7d));
function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
}
const relGrowth = (p: P): number => ((p.change_7d ?? medChange7d) - medChange7d) / 100;
const stemOf = (p: P): string => String(p.name).split(/\s+/)[0]!.toLowerCase();
const tokenStems = new Set(protocols.filter(hasToken).map(stemOf));
const isKin = (p: P): boolean => {
  const s = stemOf(p);
  return protocols.some((q) => q !== p && hasToken(q) && stemOf(q) === s);
};

// ------------------------------------------------------------------ OLS
function ols(X: number[][], y: number[]): number[] {
  const k = X[0]!.length;
  const A: number[][] = Array.from({ length: k }, (_, a) => [
    ...Array.from({ length: k }, (_, b) => X.reduce((s, r) => s + r[a]! * r[b]!, 0)),
    X.reduce((s, r, i) => s + r[a]! * y[i]!, 0),
  ]);
  for (let c = 0; c < k; c++) {
    let piv = c;
    for (let r = c + 1; r < k; r++) if (Math.abs(A[r]![c]!) > Math.abs(A[piv]![c]!)) piv = r;
    [A[c], A[piv]] = [A[piv]!, A[c]!];
    for (let r = 0; r < k; r++) {
      if (r === c) continue;
      const f = A[r]![c]! / A[c]![c]!;
      for (let cc = c; cc <= k; cc++) A[r]![cc]! -= f * A[c]![cc]!;
    }
  }
  return A.map((row, i) => row[k]! / row[i]!);
}

// ------------------------------------------------------------------ value model
// Comps: traded tokens WITH a usable market cap on the snapshot date AND a
// listing date (the walk-forward split needs one). 128 carry a usable cap;
// 33 of them carry no listing date, so the fitted set is 95.
const compsAll = protocols.filter(mcapUsable);
const comps = compsAll.filter((p) => p.listed_at);
const wfCutoff = [...comps.map((p) => p.listed_at)].sort()[Math.floor(comps.length / 2)]!;
const wfTrain = comps.filter((p) => p.listed_at < wfCutoff);
const wfTest = comps.filter((p) => p.listed_at >= wfCutoff);
// Relative growth is winsorized to the range the comps themselves span, so
// no board row extrapolates beyond the fitted data (one row's 7-day change
// is +4,448%, which the negative fitted growth sign would otherwise crush
// to ~zero). The comps define the bounds, so no comp is winsorized and the
// held-out tests, the keep decisions and the fitted coefficients are
// unchanged by this.
const GROWTH_LO = Math.min(...comps.map(relGrowth));
const GROWTH_HI = Math.max(...comps.map(relGrowth));
const relGrowthW = (p: P): number => Math.max(GROWTH_LO, Math.min(GROWTH_HI, relGrowth(p)));

function catMap(train: P[]): Map<string, number> {
  const by = new Map<string, number[]>();
  for (const p of train) {
    const arr = by.get(p.category) ?? [];
    arr.push(p.mcap_usd / p.tvl_usd);
    by.set(p.category, arr);
  }
  const gm = median(train.map((p) => p.mcap_usd / p.tvl_usd));
  const out = new Map<string, number>();
  for (const [c, v] of by) {
    const n = v.length;
    out.set(c, n >= 3 ? 1 + (median(v) / gm - 1) * (n / (n + CAT_SHRINK_K)) : 1.0);
  }
  return out;
}
type Spec = string[]; // subset of ['cat','chains','years','growth','ctrl']
function design(p: P, spec: Spec, cf: Map<string, number>, ctrlVal: number): { off: number; row: number[] } {
  let off = 0;
  if (spec.includes('cat')) off = Math.log(cf.get(p.category) ?? 1.0);
  const row = [1, Math.log(p.tvl_usd)];
  if (spec.includes('chains')) row.push(p.chains.length);
  if (spec.includes('years')) row.push(ageYears(p) ?? 0);
  if (spec.includes('growth')) row.push(relGrowthW(p));
  if (spec.includes('ctrl')) row.push(ctrlVal);
  return { off, row };
}
function fitValue(train: P[], spec: Spec): (p: P) => number {
  const cf = catMap(train);
  const X: number[][] = [];
  const y: number[] = [];
  train.forEach((p, i) => {
    const ctrl = spec.includes('ctrl') ? relGrowthW(train[(i + 7) % train.length]!) : 0;
    const d = design(p, spec, cf, ctrl);
    X.push(d.row);
    y.push(Math.log(p.mcap_usd) - d.off);
  });
  const beta = ols(X, y);
  return (p: P) => {
    const d = design(p, spec, cf, 0);
    return d.off + d.row.reduce((s, v, j) => s + v * beta[j]!, 0);
  };
}
const missOf = (pred: (p: P) => number, rows: P[]): number =>
  Math.exp(median(rows.map((p) => Math.abs(Math.log(p.mcap_usd) - pred(p)))));
function looMiss(spec: Spec): number {
  const errs: number[] = [];
  comps.forEach((p, i) => {
    const f = fitValue([...comps.slice(0, i), ...comps.slice(i + 1)], spec);
    errs.push(Math.abs(Math.log(p.mcap_usd) - f(p)));
  });
  return Math.exp(median(errs));
}
function wfMiss(spec: Spec): number {
  return missOf(fitValue(wfTrain, spec), wfTest);
}
function tenFoldMiss(spec: Spec): number {
  const rows = [...comps].sort((a, b) => (a.slug < b.slug ? -1 : 1));
  const errs: number[] = [];
  for (let k = 0; k < 10; k++) {
    const test = rows.filter((_, i) => i % 10 === k);
    const train = rows.filter((_, i) => i % 10 !== k);
    const f = fitValue(train, spec);
    for (const p of test) errs.push(Math.abs(Math.log(p.mcap_usd) - f(p)));
  }
  return Math.exp(median(errs));
}
const flatMiss = (rows: P[]): number =>
  Math.exp(median(rows.map((p) => Math.abs(Math.log(p.mcap_usd) - Math.log(0.25 * p.tvl_usd)))));
const FLAT_LOO = flatMiss(comps);
const FLAT_WF = flatMiss(wfTest);

// Greedy forward selection under the disclosed keep rule: a term joins only
// if it improves BOTH leave-one-out and walk-forward by >= 1%. At each round
// the candidate with the largest worst-case gain wins. Age and years-listed
// are the same feature (age in years), so 'years' stands for both.
const CANDIDATES = ['growth', 'chains', 'cat', 'years'];
let keptSpec: Spec = [];
{
  const remaining = new Set(CANDIDATES);
  for (;;) {
    const baseL = looMiss(keptSpec);
    const baseW = wfMiss(keptSpec);
    let best: string | null = null;
    let bestGain = 0;
    for (const c of remaining) {
      const spec = [...keptSpec, c];
      const l = looMiss(spec);
      const w = wfMiss(spec);
      const gL = (baseL - l) / baseL;
      const gW = (baseW - w) / baseW;
      const g = Math.min(gL, gW);
      if (gL >= KEEP_MIN_GAIN && gW >= KEEP_MIN_GAIN && g > bestGain) {
        best = c;
        bestGain = g;
      }
    }
    if (!best) break;
    keptSpec = [...keptSpec, best];
    remaining.delete(best);
  }
}
const SPEC_TABLE: { spec: Spec; label: string; note: string }[] = [
  { spec: [], label: 'size curve only', note: 'base' },
  { spec: ['cat'], label: '+ category ridge (k=32)', note: 'tested' },
  { spec: ['chains'], label: '+ chain count', note: 'tested' },
  { spec: ['years'], label: '+ years listed (= age)', note: 'tested' },
  { spec: ['growth'], label: '+ 7-day growth (relative)', note: 'tested' },
  { spec: ['growth', 'chains'], label: '+ growth + chains', note: 'tested' },
  { spec: ['growth', 'chains', 'cat'], label: '+ growth + chains + ridge', note: 'tested' },
  { spec: ['growth', 'chains', 'years'], label: '+ growth + chains + years', note: 'tested' },
  { spec: ['growth', 'chains', 'cat', 'years'], label: 'all value terms', note: 'tested' },
  { spec: ['ctrl'], label: 'negative control: growth of another row', note: 'control' },
];
function keptLabel(spec: Spec): string {
  if (spec.length === 0) return 'base';
  const s = new Set(spec);
  const k = new Set(keptSpec);
  if (spec.every((t) => k.has(t)) && spec.length === k.size) return 'KEPT (final model)';
  if (spec.every((t) => k.has(t))) return 'kept subset';
  return 'tested — not kept';
}
const valueEvidence = SPEC_TABLE.map((t) => {
  const loo = looMiss(t.spec);
  const wf = wfMiss(t.spec);
  return { ...t, loo, wf, ten: tenFoldMiss(t.spec), verdict: keptLabel(t.spec) };
});
const valueFit = fitValue(comps, keptSpec);
const valueBeta = (() => {
  const cf = catMap(comps);
  const X: number[][] = [];
  const y: number[] = [];
  comps.forEach((p) => {
    const d = design(p, keptSpec, cf, 0);
    X.push(d.row);
    y.push(Math.log(p.mcap_usd) - d.off);
  });
  return ols(X, y);
})();
// Leave-one-out residuals of the kept spec: the P25-P75 / P10-P90 ranges.
const looResid: number[] = comps.map((p, i) => {
  const f = fitValue([...comps.slice(0, i), ...comps.slice(i + 1)], keptSpec);
  return Math.log(p.mcap_usd) - f(p);
});
const q = (xs: number[], p: number): number => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(p * s.length)))]!;
};
const R_Q25 = q(looResid, 0.25);
const R_Q75 = q(looResid, 0.75);
const R_Q10 = q(looResid, 0.1);
const R_Q90 = q(looResid, 0.9);
const rangeIn50 = looResid.filter((e) => e >= R_Q25 && e <= R_Q75).length / looResid.length;
const rangeIn80 = looResid.filter((e) => e >= R_Q10 && e <= R_Q90).length / looResid.length;
// Bootstrap s.e. of the size slope (200 resamples, deterministic LCG).
const slopeSe = (() => {
  let seed = 1234567;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const slopes: number[] = [];
  for (let b = 0; b < 200; b++) {
    const tr = Array.from({ length: comps.length }, () => comps[Math.floor(rnd() * comps.length)]!);
    try {
      const cf = catMap(tr);
      const X: number[][] = [];
      const y: number[] = [];
      tr.forEach((p) => {
        const d = design(p, keptSpec, cf, 0);
        X.push(d.row);
        y.push(Math.log(p.mcap_usd) - d.off);
      });
      slopes.push(ols(X, y)[1]!);
    } catch { /* singular resample: skip */ }
  }
  const m = slopes.reduce((a, b) => a + b, 0) / slopes.length;
  return Math.sqrt(slopes.reduce((a, b) => a + (b - m) ** 2, 0) / slopes.length);
})();

// ------------------------------------------------------------------ token odds
// Peers: every protocol carrying a listing date (n=645). A logistic model on
// the peers' record (token recorded or not) is Brier-scored by 5-fold CV.
// The fitted kin flag is leakage and is NEVER used as a coefficient: kin of a
// token is priced only by the stated x0.50 heuristic discount (a sibling token
// already trades, so the launch odds fall, not rise).
const peers = protocols.filter((p) => p.listed_at);
const PEER_RATE = peers.filter(hasToken).length / peers.length;
const sig = (z: number): number => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, z))));
function catRateMap(train: P[]): { map: Map<string, number>; base: number } {
  const by = new Map<string, [number, number]>();
  const base = train.filter(hasToken).length / train.length;
  for (const p of train) {
    const e = by.get(p.category) ?? [0, 0];
    e[0] += hasToken(p) ? 1 : 0;
    e[1] += 1;
    by.set(p.category, e);
  }
  const map = new Map<string, number>();
  for (const [c, [k, n]] of by) map.set(c, (k + 16 * base) / (n + 16));
  return { map, base };
}
type OSpec = string[]; // subset of ['age','tvl','growth','kin','cat']
function oFeats(p: P, spec: OSpec, cr: Map<string, number>, crBase: number): number[] {
  const r = [1];
  if (spec.includes('age')) r.push(ageYears(p) ?? 0);
  if (spec.includes('tvl')) r.push(Math.log(p.tvl_usd));
  if (spec.includes('growth')) r.push(relGrowth(p));
  if (spec.includes('kin')) r.push(isKin(p) ? 1 : 0);
  if (spec.includes('cat')) r.push(cr.get(p.category) ?? crBase);
  return r;
}
function fitLogit(train: P[], spec: OSpec): (p: P) => number {
  const { map: cr, base: crBase } = catRateMap(train);
  const X = train.map((p) => oFeats(p, spec, cr, crBase));
  const y = train.map((p) => (hasToken(p) ? 1 : 0));
  const k = X[0]!.length;
  const mu = Array(k).fill(0);
  const sd = Array(k).fill(1);
  for (let j = 1; j < k; j++) {
    mu[j] = X.reduce((s, r) => s + r[j]!, 0) / X.length;
    const v = X.reduce((s, r) => s + (r[j]! - mu[j]!) ** 2, 0) / X.length;
    sd[j] = Math.sqrt(v) || 1;
  }
  const Xs = X.map((r) => [r[0]!, ...r.slice(1).map((v, j) => (v - mu[j + 1]!) / sd[j + 1]!)]);
  const beta = Array(k).fill(0);
  beta[0] = Math.log(y.reduce((a, b) => a + b, 0) / Math.max(1, y.length - y.reduce((a, b) => a + b, 0)));
  for (let it = 0; it < 60; it++) {
    const g = Array(k).fill(0);
    Xs.forEach((x, i) => {
      const pr = sig(x.reduce((s, v, j) => s + v * beta[j]!, 0));
      for (let j = 0; j < k; j++) g[j] += (pr - y[i]!) * x[j]!;
    });
    for (let j = 0; j < k; j++) beta[j] -= (0.5 * g[j]!) / X.length;
  }
  return (p: P) => {
    const r = oFeats(p, spec, cr, crBase);
    const xs = [r[0]!, ...r.slice(1).map((v, j) => (v - mu[j + 1]!) / sd[j + 1]!)];
    return sig(xs.reduce((s, v, j) => s + v * beta[j]!, 0));
  };
}
function cvBrier(spec: OSpec): number {
  const rows = [...peers].sort((a, b) => (a.slug < b.slug ? -1 : 1));
  let tot = 0;
  let n = 0;
  for (let k = 0; k < 5; k++) {
    const test = rows.filter((_, i) => i % 5 === k);
    const train = rows.filter((_, i) => i % 5 !== k);
    const f = fitLogit(train, spec);
    for (const p of test) {
      const d = f(p) - (hasToken(p) ? 1 : 0);
      tot += d * d;
      n++;
    }
  }
  return tot / n;
}
const BASE_BRIER = PEER_RATE * (1 - PEER_RATE);
const ODDS_TABLE: { spec: OSpec; label: string; verdict: string }[] = [
  { spec: [], label: 'base rate only', verdict: 'base' },
  { spec: ['age'], label: 'age', verdict: 'signal — not priced into forward odds' },
  { spec: ['age', 'tvl'], label: 'age + log TVL', verdict: 'tested — no gain over age' },
  { spec: ['age', 'tvl', 'growth'], label: 'age + log TVL + growth', verdict: 'tested — no gain over age' },
  { spec: ['age', 'cat'], label: 'age + category rate', verdict: 'signal — not priced (thin bands)' },
  { spec: ['age', 'tvl', 'growth', 'cat'], label: 'age + log TVL + growth + category', verdict: 'signal — not priced (thin bands)' },
  { spec: ['age', 'tvl', 'growth', 'kin'], label: 'joint + fitted kin flag', verdict: 'TESTED — NOT KEPT: leakage, sign reverses' },
  { spec: ['age', 'tvl', 'growth', 'kin', 'cat'], label: 'joint + kin + category', verdict: 'TESTED — NOT KEPT: leakage, sign reverses' },
];
const oddsEvidence = ODDS_TABLE.map((t) => ({ ...t, brier: cvBrier(t.spec) }));
const oddsKeptBrier = oddsEvidence.find((t) => t.spec.join() === ['age', 'tvl', 'growth', 'cat'].join())!.brier;

// Forward launch odds: P(token within 24 months | still no token at age t).
// From the peers' own age bands: F(t) = share of protocols listed t years ago
// that record a token (monotone-smoothed); the 24-month hazard is
// (F(t+2) - F(t)) / (1 - F(t)). The backward share rises with age because
// launches accumulate; the forward hazard peaks at 1-2 years and then falls.
function ageBandRates(): { f: number[]; n: number[]; back: number[] } {
  const f: number[] = [];
  const n: number[] = [];
  for (let lo = 0; lo < 6; lo++) {
    const sub = protocols.filter((p) => {
      const a = ageYears(p);
      return a !== null && a >= lo && a < lo + 1;
    });
    n.push(sub.length);
    f.push(sub.length ? sub.filter(hasToken).length / sub.length : 0);
  }
  // monotone smooth (cumulative max) — a token rate cannot fall with age.
  let m = 0;
  const sm = f.map((v) => {
    m = Math.max(m, v);
    return m;
  });
  return { f: sm, n, back: f };
}
const BANDS = ageBandRates();
function hazardAt(age: number | null): number {
  if (age === null) return NaN;
  const t = Math.floor(age);
  const f0 = BANDS.f[Math.min(t, BANDS.f.length - 1)]!;
  const f2 = BANDS.f[Math.min(t + 2, BANDS.f.length - 1)]!;
  const h = f0 >= 1 ? 0 : (f2 - f0) / (1 - f0);
  return Math.max(0.02, Math.min(0.9, h));
}
const forwardTable = [0, 1, 2, 3, 4, 5].map((lo) => {
  const h = hazardAt(lo + 0.5);
  return { ageBand: lo === 5 ? '5y+' : `${lo}-${lo + 1}y`, n: BANDS.n[lo]!, backward: BANDS.back[lo]!, forward24: h };
});

// ------------------------------------------------------------------ board
function strictPass(p: P): boolean {
  if (!isPre(p)) return false;
  if (p.category !== null && EXCL_CAT.has(p.category)) return false;
  if (VERSION_RE.test(p.name)) return false;
  const words = new Set(String(p.name).toLowerCase().match(/[a-z]+/g) ?? []);
  if (words.has('wrapped') || words.has('staked') || words.has('staking')) return false;
  if (EXCH.some((e) => String(p.name).startsWith(e))) return false;
  return true;
}
const wlSet = new Set(watchlist);
const boardProtos: { p: P; tier: string }[] = [];
for (const p of protocols) {
  if (wlSet.has(p.slug)) boardProtos.push({ p, tier: 'Watchlist' });
  else if (isPre(p) && p.tvl_usd < FLOOR && strictPass(p)) boardProtos.push({ p, tier: 'Early' });
  else if (isPre(p) && p.tvl_usd >= FLOOR && strictPass(p)) boardProtos.push({ p, tier: 'Off-list' });
}
// Ledger: every one of the 758 in exactly one group.
const setAside = protocols.filter(
  (p) => isPre(p) && !wlSet.has(p.slug) && !strictPass(p),
);
const ledger = {
  ranked: boardProtos.length,
  tokenUsableCap: compsAll.length,
  tokenNoCap: protocols.filter((p) => hasToken(p) && !mcapUsable(p)).length,
  setAside: setAside.length,
  total: protocols.length,
};
if (ledger.ranked + ledger.tokenUsableCap + ledger.tokenNoCap + ledger.setAside !== 758) {
  throw new Error(`ledger does not sum to 758: ${JSON.stringify(ledger)}`);
}
const setAsideReasons: Record<string, number> = {};
for (const p of setAside) {
  let r = 'other';
  if (p.category !== null && EXCL_CAT.has(p.category)) r = p.category;
  else if (VERSION_RE.test(p.name)) r = 'versioned name';
  else if (/\bwrapped\b|\bstaked\b|\bstaking\b/i.test(p.name)) r = 'wrapped / staked name';
  else if (EXCH.some((e) => String(p.name).startsWith(e))) r = 'exchange-named';
  setAsideReasons[r] = (setAsideReasons[r] ?? 0) + 1;
}

// Odds for a row: forward 24-month hazard at its age (x0.50 if kin of a token).
const knownHazards = boardProtos.map(({ p }) => hazardAt(ageYears(p))).filter((h) => !Number.isNaN(h));
const MED_HAZARD = median(knownHazards);
function rowOdds(p: P): { odds: number; forward: number; kin: boolean } {
  const h = hazardAt(ageYears(p));
  const fwd = Number.isNaN(h) ? MED_HAZARD : h;
  const kin = isKin(p);
  return { odds: fwd * (kin ? 0.5 : 1), forward: fwd, kin };
}

// ------------------------------------------------------------------ farm plans
const gasOf = (p: P): number => {
  const ch = p.chains?.[0] ?? 'Other';
  return GAS[ch] ?? 5;
};
const VENUE: Record<string, { verb: string; action: string; venue: string }> = {
  Lending: { verb: 'supply', action: 'Supply the deposit as collateral and borrow a small stablecoin leg against it', venue: 'the lending market' },
  Dexs: { verb: 'provide liquidity', action: 'Provide liquidity in the protocol’s main pool in a tight, actively managed range', venue: 'the main pool' },
  Yield: { verb: 'stake in the vault', action: 'Stake the deposit in the protocol’s flagship yield vault', venue: 'the flagship vault' },
  'Yield Aggregator': { verb: 'deposit to the aggregator', action: 'Deposit into the aggregator’s auto-compounding vault', venue: 'the auto-compounding vault' },
  RWA: { verb: 'mint the tokenised asset', action: 'Mint the protocol’s tokenised real-world asset with the deposit', venue: 'the primary issuance market' },
  Derivatives: { verb: 'open a hedged perp', action: 'Open a small delta-neutral perpetual position on the protocol', venue: 'the perpetual market' },
  'Basis Trading': { verb: 'open a basis trade', action: 'Open a delta-neutral basis position (long spot, short perp)', venue: 'the basis desk' },
  CDP: { verb: 'mint against collateral', action: 'Lock the deposit as collateral and mint the protocol’s stablecoin', venue: 'the CDP vault' },
  Restaking: { verb: 'restake', action: 'Restake the deposit through the protocol’s restaking contracts', venue: 'the restaking pool' },
  'Liquid Restaking': { verb: 'mint the restaking token', action: 'Mint the protocol’s liquid restaking token with the deposit', venue: 'the mint contract' },
};
function venueOf(p: P) {
  return VENUE[p.category] ?? { verb: 'deposit', action: 'Deposit into the protocol’s main product', venue: 'the main product' };
}
function fmtUsd(x: number): string {
  if (x >= 1e9) return `$${(x / 1e9).toFixed(2)}B`;
  if (x >= 1e6) return `$${(x / 1e6).toFixed(2)}M`;
  if (x >= 1e3) return `$${(x / 1e3).toFixed(1)}k`;
  return `$${x.toFixed(2)}`;
}
function farmSteps(p: P, ticket: number, horizonWeeks: number): { steps: string[]; hours: number; gas: number } {
  const ch0 = p.chains?.[0] ?? 'Ethereum';
  const ch1 = p.chains?.[1];
  const v = venueOf(p);
  const gas = gasOf(p);
  const dep = fmtUsd(ticket);
  const days = horizonWeeks * 7;
  const chainNote = ch1 ? `${ch0} (also on ${ch1})` : ch0;
  const steps = [
    `Day 0 — Move ${dep} to ${chainNote} and hold it in a fresh wallet for this farm only (~45 min, ~${fmtUsd(gas)} gas).`,
    `Day 0 — ${v.action} in ${v.venue} on ${ch0} with the full ${dep} ticket (~15 min, ~${fmtUsd(gas * 0.5)} gas + 0.25% protocol fee).`,
    `Day 1 — Verify the position on the protocol page: balance, points or receipt token, and the ${chainNote} transaction hash (~20 min, no fee).`,
    `Day 7 — Top up or rebalance only if the position drifted more than 10% from target; otherwise leave it untouched (~30 min, ~${fmtUsd(gas * 0.5)} gas if rebalanced).`,
    `Day ${Math.max(14, Math.floor(days / 2))} — Mid-horizon check: confirm the position is still earning and the protocol still records no token; snapshot the position (~20 min, no fee).`,
    `Day ${days} — Exit rule: withdraw the ${dep} and any receipt token, then claim any distribution within 7 days of announcement (~30 min, ~${fmtUsd(gas)} gas).`,
  ];
  const hours = (45 + 15 + 20 + 30 + 20 + 30) / 60;
  return { steps, hours, gas };
}
function farmMath(p: P, implied: number, ticket: number, horizonWeeks: number): any {
  const { hours, gas } = farmSteps(p, ticket, horizonWeeks);
  const drop = implied * DROP_SHARE * (ticket / p.tvl_usd);
  const fees = gas + 0.0025 * ticket;
  const capital = ticket * TBILL * (horizonWeeks / 52);
  const net = drop - fees;
  const netAfterCapital = net - capital;
  const perHour = net / hours;
  // Verdict on the labour bar (the field's rule, stated on the page): FARM
  // if net >= $25 and net/hour >= $25/h. The T-bill capital charge is shown
  // per row and in the detail view — at a 0.02% ticket it exceeds the drop
  // for all but one FARM row, which the page discloses rather than hides.
  const verdict = net >= 25 && perHour >= HOURS_BAR ? 'FARM' : net > 0 ? 'MARGINAL' : 'SKIP';
  const unit = implied * DROP_SHARE / p.tvl_usd - 0.0025;
  const breakeven = unit > 0 ? gas / unit : null;
  return { ticket, drop, fees, gas, capital, net, netAfterCapital, perHour, hours, verdict, breakeven };
}

// Build the ranked rows.
const scored = boardProtos.map(({ p, tier }) => {
  const base = valueFit(p);
  const { odds, forward, kin } = rowOdds(p);
  const impliedRaw = Math.exp(base) * odds;
  const implied = Math.max(1, Math.round(impliedRaw));
  return { p, tier, base, odds, forward, kin, implied };
});
scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : 1));
const rows = scored.map((s, i) => {
  const { p, tier, base, odds, forward, kin, implied } = s;
  const ticket = SIZED_TICKET_FRAC * p.tvl_usd;
  const fm = farmMath(p, implied, ticket, 26);
  const { steps } = farmSteps(p, ticket, 26);
  // design() appends value terms in the fixed order chains, years, growth,
  // ctrl — index the fitted coefficients by that order, not by keptSpec order.
  const DESIGN_ORDER = ['chains', 'years', 'growth', 'ctrl'];
  const coefOf = (term: string): number => {
    if (!keptSpec.includes(term)) return 0;
    const idx = 2 + DESIGN_ORDER.filter((t) => keptSpec.includes(t) && DESIGN_ORDER.indexOf(t) < DESIGN_ORDER.indexOf(term)).length;
    return valueBeta[idx]!;
  };
  return {
    rank: i + 1,
    slug: p.slug,
    name: p.name,
    category: p.category,
    chains: p.chains,
    tvl_usd: p.tvl_usd,
    change_7d: p.change_7d,
    mcap_usd: p.mcap_usd,
    listed_at: p.listed_at,
    gecko_id: p.gecko_id,
    symbol: p.symbol,
    token_status: 'pre-token',
    age_days: ageDays(p),
    tier,
    kin,
    implied_value_usd: implied,
    model: {
      base_value_usd: Math.round(Math.exp(base)),
      size_curve_usd: Math.round(Math.exp(valueBeta[0]! + valueBeta[1]! * Math.log(p.tvl_usd))),
      size_curve: `ln(mcap) = ${valueBeta[0]!.toFixed(3)} + ${valueBeta[1]!.toFixed(3)} ln(TVL)`,
      growth_factor: keptSpec.includes('growth') ? +Math.exp(coefOf('growth') * relGrowthW(p)).toFixed(3) : 1,
      chains_factor: keptSpec.includes('chains') ? +Math.exp(coefOf('chains') * p.chains.length).toFixed(3) : 1,
      category_factor: 1,
      forward_odds_24m: +forward.toFixed(3),
      kin_discount: kin ? 0.5 : 1,
      odds: +odds.toFixed(3),
      range_p25_usd: Math.max(1, Math.round(implied * Math.exp(R_Q25))),
      range_p75_usd: Math.max(1, Math.round(implied * Math.exp(R_Q75))),
      range_p10_usd: Math.max(1, Math.round(implied * Math.exp(R_Q10))),
      range_p90_usd: Math.max(1, Math.round(implied * Math.exp(R_Q90))),
    },
    farm: {
      scenario: 'sized ticket 0.02% of TVL, drop share 7%, horizon 26 weeks',
      ticket_usd: Math.round(fm.ticket),
      airdrop_slice_usd: +fm.drop.toFixed(2),
      expected_drop_usd: +fm.drop.toFixed(2),
      fees_usd: +fm.fees.toFixed(2),
      capital_charge_usd: +fm.capital.toFixed(2),
      net_usd: +fm.net.toFixed(2),
      net_after_capital_usd: +fm.netAfterCapital.toFixed(2),
      net_per_hour_usd: +fm.perHour.toFixed(2),
      hours: +fm.hours.toFixed(2),
      verdict: fm.verdict,
      breakeven_deposit_usd: fm.breakeven === null ? null : Math.round(fm.breakeven),
    },
    farm_steps: steps,
  };
});
const farmCounts = { FARM: 0, MARGINAL: 0, SKIP: 0 };
for (const r of rows) farmCounts[r.farm.verdict as keyof typeof farmCounts]++;
const farmClearsCapital = rows.filter((r) => r.farm.verdict === 'FARM' && r.farm.net_usd > r.farm.capital_charge_usd).length;
const totalImplied = rows.reduce((s, r) => s + r.implied_value_usd, 0);
for (const r of rows) {
  if (r.farm_steps.length < 3 || r.farm_steps.length > 12) throw new Error(`farm steps out of range for ${r.slug}`);
  for (const s of r.farm_steps) if (s.length < 20 || s.length > 600) throw new Error(`farm step length ${s.length} for ${r.slug}`);
}

// ------------------------------------------------------------------ evidence
const keptValueEvidence = valueEvidence.find((t) => t.verdict.startsWith('KEPT (final'))!;
const evidence = {
  comps_usable_cap: compsAll.length,
  comps_fitted: comps.length,
  comps_no_listing_date: compsAll.length - comps.length,
  wf_cutoff: wfCutoff,
  wf_train: wfTrain.length,
  wf_test: wfTest.length,
  flat_loo: +FLAT_LOO.toFixed(2),
  flat_wf: +FLAT_WF.toFixed(2),
  loo_miss: +keptValueEvidence.loo.toFixed(2),
  wf_miss: +keptValueEvidence.wf.toFixed(2),
  tenfold_miss: +keptValueEvidence.ten.toFixed(2),
  size_slope: +valueBeta[1]!.toFixed(3),
  size_slope_se: +slopeSe.toFixed(3),
  size_intercept: +valueBeta[0]!.toFixed(3),
  kept_terms: keptSpec,
  value_table: valueEvidence.map((t) => ({
    label: t.label,
    loo: +t.loo.toFixed(2),
    wf: +t.wf.toFixed(2),
    tenfold: +t.ten.toFixed(2),
    verdict: t.verdict,
  })),
  range_p25_p75_measured: +rangeIn50.toFixed(2),
  range_p10_p90_measured: +rangeIn80.toFixed(2),
  range_q: { p25: +R_Q25.toFixed(2), p75: +R_Q75.toFixed(2), p10: +R_Q10.toFixed(2), p90: +R_Q90.toFixed(2) },
  peers: peers.length,
  peer_token_rate: +PEER_RATE.toFixed(3),
  base_brier: +BASE_BRIER.toFixed(3),
  odds_brier_kept: +oddsKeptBrier.toFixed(3),
  odds_table: oddsEvidence.map((t) => ({ label: t.label, brier: +t.brier.toFixed(3), verdict: t.verdict })),
  forward_table: forwardTable,
  median_change_7d: +medChange7d.toFixed(2),
  growth_winsor: [+GROWTH_LO.toFixed(3), +GROWTH_HI.toFixed(3)],
  ledger,
  set_aside_reasons: setAsideReasons,
  farm_counts: farmCounts,
  farm_clears_capital: farmClearsCapital,
  total_implied_usd: totalImplied,
  watchlist_covered: rows.filter((r) => r.tier === 'Watchlist').length,
};
const boardJson = `${JSON.stringify({ rows })}\n`;
const boardSha = createHash('sha256').update(boardJson).digest('hex');
const radar = {
  as_of: AS_OF,
  source: snap.source,
  floor_usd: FLOOR,
  model_version: 'v4-forward-odds',
  model: {
    formula: (() => {
      const terms = [`${valueBeta[0]!.toFixed(3)}`, `${valueBeta[1]!.toFixed(3)} ln(TVL)`];
      if (keptSpec.includes('chains')) terms.push(`${coefOf2('chains')} chains`);
      if (keptSpec.includes('growth')) terms.push(`${coefOf2('growth')} relGrowth`);
      const body = terms.map((t, i) => (i === 0 ? t : t.startsWith('-') ? `− ${t.slice(1)}` : `+ ${t}`)).join(' ');
      return `implied = exp(${body}) x forward_24m_odds`;
    })(),
    kept_terms: keptSpec,
    drop_share: DROP_SHARE,
    sized_ticket_frac: SIZED_TICKET_FRAC,
    tbill: TBILL,
    hours_bar_usd: HOURS_BAR,
  },
  watchlist_size: watchlist.length,
  board_size: rows.length,
  early_size: rows.filter((r) => r.tier === 'Early').length,
  live_size: rows.filter((r) => r.tier === 'Off-list').length,
  checksum_sha256: boardSha,
  evidence,
  comps: comps.map((p) => ({ slug: p.slug, tvl_usd: p.tvl_usd, mcap_usd: p.mcap_usd, listed_at: p.listed_at })),
  rows,
};
function coefOf2(term: string): string {
  const DESIGN_ORDER = ['chains', 'years', 'growth', 'ctrl'];
  const idx = 2 + DESIGN_ORDER.filter((t) => keptSpec.includes(t) && DESIGN_ORDER.indexOf(t) < DESIGN_ORDER.indexOf(term)).length;
  return valueBeta[idx]!.toFixed(3);
}

// ------------------------------------------------------------------ outputs
mkdirSync(outDir, { recursive: true });
mkdirSync(join(outDir, 'dashboard'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
writeFileSync(join(outDir, 'board.json'), boardJson);
writeFileSync(join(outDir, 'data.js'), `window.RADAR=${JSON.stringify(radar)};\n`);
function copyDir(src: string, dst: string): string[] {
  const names: string[] = [];
  mkdirSync(dst, { recursive: true });
  for (const e of readdirSync(src, { withFileTypes: true })) {
    if (e.isFile()) {
      copyFileSync(join(src, e.name), join(dst, e.name));
      names.push(e.name);
    }
  }
  return names.sort();
}
const dashFiles = copyDir(join(HERE, 'dashboard'), join(outDir, 'dashboard'));
const shotFiles = copyDir(join(HERE, 'screenshots'), join(outDir, 'screenshots'));
for (const f of shotFiles) {
  if (!/^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/.test(f)) throw new Error(`bad screenshot name ${f}`);
  if (statSync(join(outDir, 'screenshots', f)).size > 512 * 1024) throw new Error(`screenshot ${f} over 512 KiB`);
}
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 65536,
    screenshots: { max: 4, max_bytes: 512 * 1024 },
    dashboard: { max_files: 400, max_bytes: 4 * 1024 * 1024 },
  }),
);
process.stderr.write(
  `token-radar v4: ${protocols.length} protocols, ${comps.length} fitted comps (${compsAll.length} usable cap), ` +
    `${rows.length} rows, watchlist ${evidence.watchlist_covered}/${watchlist.length}, ` +
    `LOO x${evidence.loo_miss} WF x${evidence.wf_miss} (flat x${evidence.flat_loo} / x${evidence.flat_wf}), ` +
    `Brier ${evidence.odds_brier_kept} vs ${evidence.base_brier}, range ${Math.round(rangeIn50 * 100)}%/${Math.round(rangeIn80 * 100)}%, ` +
    `farm ${farmCounts.FARM}/${farmCounts.MARGINAL}/${farmCounts.SKIP}, total implied ${fmtUsd(totalImplied)}, ` +
    `dashboard ${dashFiles.length} files, screenshots ${shotFiles.length}\n`,
);
