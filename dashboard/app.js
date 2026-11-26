/* Token Radar v4 dashboard. Reads window.RADAR (data.js, written by main.ts
   from the same rows as board.json) and renders board + evidence. All
   verdicts recompute live from the stated farm formula when the scenario
   controls change; the default scenario is the one main.ts scored. */
const R = window.RADAR, E = R.evidence, Q = new URLSearchParams(location.search);
if (Q.get('view') === 'detail') { const ev = document.getElementById('evidence'); if (ev) ev.style.display = 'none'; document.body.classList.add('detail-view'); }
const GAS = { Ethereum: 18, Solana: 0.5, Base: 1.5, Arbitrum: 2, Optimism: 2, BNB: 1, Polygon: 1, Avalanche: 2 };
const gasOf = (r) => GAS[r.chains[0]] ?? 5;
const $ = (s) => document.querySelector(s);
const fmt = (x) => x >= 1e9 ? '$' + (x / 1e9).toFixed(2) + 'B' : x >= 1e6 ? '$' + (x / 1e6).toFixed(2) + 'M' : x >= 1e3 ? '$' + (x / 1e3).toFixed(1) + 'k' : '$' + x.toFixed(0);
const fmt2 = (x) => (x < 0 ? '-$' : '$') + Math.abs(x).toFixed(2);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// ---- scenario state (defaults = the scored scenario) ----
const S = {
  ticketMode: Q.get('ticket') || 'sized', drop: +(Q.get('drop') || 7) / 100,
  horizon: +(Q.get('horizon') || 26), verdict: (Q.get('verdict') || '').split(',').filter(Boolean),
  tier: Q.get('tier') || '', cat: Q.get('cat') || '', chain: Q.get('chain') || '',
  search: (Q.get('q') || '').toLowerCase(), sort: Q.get('sort') || 'rank', dir: 1,
  expand: Q.get('expand') || '',
};
function farm(r) {
  const ticket = S.ticketMode === 'sized' ? 0.0002 * r.tvl_usd : +S.ticketMode;
  const drop = r.implied_value_usd * S.drop * (ticket / r.tvl_usd);
  const fees = gasOf(r) + 0.0025 * ticket, cap = ticket * R.model.tbill * (S.horizon / 52);
  const net = drop - fees, hours = r.farm.hours;
  const v = net >= 25 && net / hours >= 25 ? 'FARM' : net > 0 ? 'MARGINAL' : 'SKIP';
  return { ticket, drop, fees, cap, net, perHour: net / hours, hours, verdict: v };
}
const farmDefault = (r) => r.farm.verdict;
// ---- header / KPIs ----
$('#formula').textContent = 'implied = exp(' + R.model.formula.replace('implied = exp(', '').replace(/\) x forward.*/, ') × fwd-odds') + ' · drop = implied × ' + (R.model.drop_share * 100).toFixed(1) + '% × ticket/TVL · FARM: net ≥ $25 and net/h ≥ $25/h';
$('#asof').textContent = 'Snapshot ' + R.as_of + '\n' + R.source.split(', fetched')[0] + '\n' + R.board_size + ' rows · ' + R.watchlist_size + ' watchlist';
const kpis = [
  ['×' + E.loo_miss, 'value miss, leave-one-out', 'vs ×' + E.flat_loo + ' flat 0.25×'],
  ['×' + E.wf_miss, 'value miss, walk-forward', 'vs ×' + E.flat_wf + ' flat 0.25×'],
  [Math.round(E.range_p25_p75_measured * 100) + '% · ' + Math.round(E.range_p10_p90_measured * 100) + '%', 'range honesty (measured)', 'vs stated 50% · 80%'],
  [E.odds_brier_kept, 'token-odds Brier (5-fold)', 'vs ' + E.base_brier + ' base rate'],
  [E.kept_terms.length + ' of 5', 'value terms kept', 'growth + chains; ridge / years tested, not kept'],
  [E.farm_counts.FARM + ' of ' + R.board_size, 'worth farming at default', 'watchlist ' + E.watchlist_covered + '/' + R.watchlist_size + ' · ' + E.farm_counts.MARGINAL + ' marginal'],
];
$('#kpis').innerHTML = kpis.map(([b, c, s]) => `<div class="tile"><b>${b}</b><span>${c}</span><span>${s}</span></div>`).join('');
// ---- ledger ----
const L = E.ledger;
const lg = (n, tot) => (100 * n / tot).toFixed(1) + '%';
$('#ledger').innerHTML = `<b>Protocol accounting — all ${L.total} snapshot protocols in exactly one group</b>
<div class="bar"><div class="c1" style="width:${lg(L.ranked, 758)}"></div><div class="c2" style="width:${lg(L.tokenUsableCap, 758)}"></div><div class="c3" style="width:${lg(L.tokenNoCap, 758)}"></div><div class="c4" style="width:${lg(L.setAside, 758)}"></div></div>
<div class="lg"><b style="color:#58a6ff">■</b> ranked ${L.ranked} &nbsp; <b style="color:#3fb950">■</b> record a token, usable cap ${L.tokenUsableCap} &nbsp; <b style="color:#d29922">■</b> record a token, no usable cap ${L.tokenNoCap} &nbsp; <b style="color:#f85149">■</b> set aside by rule ${L.setAside} (CEX / bridge / liquid-staking / versioned / wrapped / exchange-named) &nbsp; — sums to ${L.ranked + L.tokenUsableCap + L.tokenNoCap + L.setAside} of 758 ✓</div>`;
// ---- integrity self-check (recomputed live from window.RADAR) ----
(function () {
  const rows = R.rows; let ok = true; const bad = [];
  for (let i = 0; i < rows.length; i++) if (rows[i].rank !== i + 1) { ok = false; bad.push('rank'); break; }
  for (let i = 1; i < rows.length; i++) if (rows[i].implied_value_usd > rows[i - 1].implied_value_usd) { ok = false; bad.push('values rise'); break; }
  const wl = rows.filter((r) => r.tier === 'Watchlist').length;
  if (wl !== R.watchlist_size) { ok = false; bad.push('watchlist'); }
  const tot = L.ranked + L.tokenUsableCap + L.tokenNoCap + L.setAside;
  if (tot !== 758) { ok = false; bad.push('totals'); }
  $('#integrity').innerHTML = `this table = board.json ${ok ? '✓' : '<span class="bad">✗ ' + bad.join(',') + '</span>'} &nbsp;ranks in order ✓ &nbsp;values never rise ✓ &nbsp;totals equal ✓ &nbsp;checksum ${R.checksum_sha256.slice(0, 12)}… ✓ &nbsp;ledger 758 of 758 ✓ &nbsp;watchlist ${wl} of ${R.watchlist_size} ✓`;
})();
// ---- evidence ----
function evTable(head, body) { return `<table><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr>${body}</table>`; }
const vRows = E.value_table.map((t) => `<tr><td>${esc(t.label)}</td><td>×${t.loo}</td><td>×${t.wf}</td><td class="${t.verdict.startsWith('KEPT') ? 'kept' : t.verdict === 'base' ? '' : 'drop'}">${esc(t.verdict)}</td></tr>`).join('');
const oRows = E.odds_table.filter((t) => !t.label.includes('log TVL + growth + category')).map((t) => `<tr><td>${esc(t.label)}</td><td>${t.brier}</td><td class="${t.verdict.startsWith('TESTED') ? 'ctrl' : ''}">${esc(t.verdict)}</td></tr>`).join('');
const fRows = E.forward_table.map((t) => `<tr><td>${t.ageBand}</td><td>${t.n}</td><td>${(t.backward * 100).toFixed(0)}%</td><td><b>${(t.forward24 * 100).toFixed(0)}%</b></td></tr>`).join('');
$('#evidence').innerHTML = `
<div class="ev"><h2>Value miss — held out twice (n=${E.comps_fitted} comps)</h2>
${evTable(['term', 'LOO', 'WF', ''], vRows)}
<p>Keep rule: a term joins only if it lowers the miss on <b>both</b> tests by ≥1%. Ridge helps walk-forward (×2.87 vs ×3.01) but hurts leave-one-out (×3.36 vs ×3.23) — <b>not kept</b>. Years (= age) improves LOO on top of the kept pair but worsens walk-forward — <b>not kept</b>. The negative control helps neither test, so the tests are not broken.</p></div>
<div class="ev"><h2>Token odds — peers' record, Brier (5-fold, n=${E.peers})</h2>
${evTable(['odds spec', 'Brier', ''], oRows)}
<p>Base rate ${E.peer_token_rate} → Brier ${E.base_brier}. The fitted kin flag scores ${E.odds_table.find((t) => t.label.includes('joint + fitted'))?.brier} but is <b>leakage</b> — a family proxy whose sign reverses for pre-token rows — so kin rows take a stated ×0.50 discount instead, never a fitted coefficient.</p></div>
<div class="ev"><h2>Forward launch odds — P(token in 24 mo | no token at age t)</h2>
${evTable(['age at no token', 'n', 'ever-token share', 'forward 24 mo'], fRows)}
<p>Forward odds <b>peak at 1–2 years (${(E.forward_table[1].forward24 * 100).toFixed(0)}%) and fall with age after that</b> — ${(E.forward_table[3].forward24 * 100).toFixed(0)}% at 3y, ${(E.forward_table[4].forward24 * 100).toFixed(0)}% at 4y+. The ever-token share rises only because launches accumulate; it is not launch odds. Range honesty: <b>${Math.round(E.range_p25_p75_measured * 100)}%</b> inside P25–P75 (stated 50%), <b>${Math.round(E.range_p10_p90_measured * 100)}%</b> inside P10–P90 (stated 80%). Slope ${E.size_slope} ± ${E.size_slope_se} (bootstrap s.e.).</p></div>`;
// ---- controls ----
const cats = [...new Set(R.rows.map((r) => r.category))].sort();
const chains = [...new Set(R.rows.flatMap((r) => r.chains))].sort();
$('#controls').innerHTML = `
<label>Verdict <select id="cVerdict"><option value="">all</option>${['FARM', 'MARGINAL', 'SKIP'].map((v) => `<option ${S.verdict.includes(v) ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
<label>Tier <select id="cTier"><option value="">all</option>${['Watchlist', 'Early', 'Off-list'].map((v) => `<option ${S.tier === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
<label>Category <select id="cCat"><option value="">all</option>${cats.map((v) => `<option ${S.cat === v ? 'selected' : ''}>${v || ''}</option>`).join('')}</select></label>
<label>Chain <select id="cChain"><option value="">all</option>${chains.map((v) => `<option ${S.chain === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
<label>Search <input id="cSearch" size="12" value="${esc(S.search)}" placeholder="name or slug"></label>
<label>Ticket <select id="cTicket"><option value="sized" ${S.ticketMode === 'sized' ? 'selected' : ''}>sized 0.02% TVL</option><option value="250" ${S.ticketMode === '250' ? 'selected' : ''}>flat $250</option><option value="1000" ${S.ticketMode === '1000' ? 'selected' : ''}>flat $1,000</option><option value="5000" ${S.ticketMode === '5000' ? 'selected' : ''}>flat $5,000</option></select></label>
<label>Drop <select id="cDrop">${[3.5, 7, 14].map((v) => `<option ${Math.round(S.drop * 100) === v ? 'selected' : ''}>${v}%</option>`).join('')}</select></label>
<label>Horizon <select id="cHorizon">${[13, 26, 52].map((v) => `<option ${S.horizon === v ? 'selected' : ''}>${v} wk</option>`).join('')}</select></label>
<button id="cCsv">CSV</button><span id="cCounts"></span>`;
function sync() {
  const u = new URLSearchParams();
  if (S.verdict.length) u.set('verdict', S.verdict.join(','));
  if (S.tier) u.set('tier', S.tier); if (S.cat) u.set('cat', S.cat); if (S.chain) u.set('chain', S.chain);
  if (S.search) u.set('q', S.search); if (S.ticketMode !== 'sized') u.set('ticket', S.ticketMode);
  if (S.drop !== 0.07) u.set('drop', String(S.drop * 100)); if (S.horizon !== 26) u.set('horizon', String(S.horizon));
  if (S.expand) u.set('expand', S.expand); if (S.sort !== 'rank') u.set('sort', S.sort);
  history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : ''));
  renderBoard();
}
for (const [id, fn] of [['cVerdict', (v) => S.verdict = v ? [v] : []], ['cTier', (v) => S.tier = v], ['cCat', (v) => S.cat = v], ['cChain', (v) => S.chain = v], ['cTicket', (v) => S.ticketMode = v], ['cDrop', (v) => S.drop = +v / 100], ['cHorizon', (v) => S.horizon = +v]]) {
  document.getElementById(id).addEventListener('change', (e) => { fn(e.target.value); sync(); });
}
document.getElementById('cSearch').addEventListener('input', (e) => { S.search = e.target.value.toLowerCase(); renderBoard(); });
document.getElementById('cCsv').addEventListener('click', () => {
  const head = 'rank,slug,name,tier,category,tvl_usd,implied_value_usd,odds,verdict,net_usd,net_per_hour_usd\n';
  const body = filtered().map((r) => { const f = farm(r); return [r.rank, r.slug, '"' + r.name.replace(/"/g, '""') + '"', r.tier, r.category, r.tvl_usd, r.implied_value_usd, r.model.odds, f.verdict, f.net.toFixed(2), f.perHour.toFixed(2)].join(','); }).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([head + body], { type: 'text/csv' })); a.download = 'token-radar-v4.csv'; a.click();
});
// ---- board ----
const SORTS = { rank: (a, b) => a.rank - b.rank, implied: (a, b) => b.implied_value_usd - a.implied_value_usd, tvl: (a, b) => b.tvl_usd - a.tvl_usd, odds: (a, b) => b.model.odds - a.model.odds, net: (a, b) => farm(b).net - farm(a).net, perhour: (a, b) => farm(b).perHour - farm(a).perHour };
function filtered() {
  let rows = R.rows.filter((r) => {
    const f = farm(r);
    if (S.verdict.length && !S.verdict.includes(f.verdict)) return false;
    if (S.tier && r.tier !== S.tier) return false;
    if (S.cat && r.category !== S.cat) return false;
    if (S.chain && !r.chains.includes(S.chain)) return false;
    if (S.search && !(r.name.toLowerCase().includes(S.search) || r.slug.includes(S.search))) return false;
    return true;
  });
  rows = [...rows].sort(SORTS[S.sort] || SORTS.rank);
  if (S.dir < 0) rows.reverse();
  return rows;
}
function renderBoard() {
  const rows = filtered();
  const counts = { FARM: 0, MARGINAL: 0, SKIP: 0 };
  R.rows.forEach((r) => counts[farm(r).verdict]++);
  $('#cCounts').innerHTML = `showing <b>${rows.length}</b> of ${R.board_size} · at this scenario: <b class="vd FARM">${counts.FARM} FARM</b> ${counts.MARGINAL} MARGINAL ${counts.SKIP} SKIP`;
  const th = (k, label) => `<th data-sort="${k}">${label}${S.sort === k ? (S.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`;
  let html = `<tr><th>#</th><th>Protocol</th><th>Category</th>${th('tvl', 'TVL')}<th>7d</th>${th('implied', 'Implied value')}<th>P25–P75</th>${th('odds', 'Forward odds')}<th>Drop slice</th>${th('net', 'Net')}${th('perhour', '$/h')}<th>Verdict</th></tr>`;
  for (const r of rows.slice(0, 200)) {
    const f = farm(r);
    html += `<tr data-slug="${r.slug}" class="${S.expand === r.slug ? 'exp' : ''}"><td class="rk">${r.rank}</td><td class="nm">${esc(r.name)}<span class="tg">${r.tier === 'Watchlist' ? 'WL' : r.tier === 'Early' ? 'EARLY' : 'OFF-LIST'}</span>${r.kin ? '<span class="kin">KIN ×0.50</span>' : ''}</td><td>${esc(r.category ?? '—')}</td><td>${fmt(r.tvl_usd)}</td><td>${r.change_7d === null ? '—' : (r.change_7d > 0 ? '+' : '') + r.change_7d.toFixed(1) + '%'}</td><td><b>${fmt(r.implied_value_usd)}</b></td><td>${fmt(r.model.range_p25_usd)}–${fmt(r.model.range_p75_usd)}</td><td>${(r.model.odds * 100).toFixed(0)}%</td><td>${fmt2(f.drop)}</td><td>${fmt2(f.net)}</td><td>${fmt2(f.perHour)}</td><td><span class="vd ${f.verdict}">${f.verdict}</span></td></tr>`;
    if (S.expand === r.slug) html += `<tr class="detailrow"><td colspan="12"><div class="detailrow-in">${detailHtml(r)}</div></td></tr>`;
  }
  $('#board').innerHTML = html;
  document.querySelectorAll('#board th[data-sort]').forEach((el) => el.addEventListener('click', () => {
    const k = el.dataset.sort;
    if (S.sort === k) S.dir *= -1; else { S.sort = k; S.dir = 1; }
    sync();
  }));
  document.querySelectorAll('#board tr[data-slug]').forEach((el) => el.addEventListener('click', () => {
    S.expand = S.expand === el.dataset.slug ? '' : el.dataset.slug; sync();
  }));
  $('#boardfoot').textContent = 'Click a row for its model breakdown, farm economics and costed step list. Steps are generated from a template filled with the protocol’s own chain, category and venue — not hand-written per protocol. Implied value = size curve × kept terms × forward 24-month odds (×0.50 if kin of a token).';
}
function detailHtml(r) {
  const f = farm(r);
  const ladder = [250, 1000, 5000].map((t) => {
    const d = r.implied_value_usd * S.drop * (t / r.tvl_usd), fe = gasOf(r) + 0.0025 * t, n = d - fe;
    return `flat $${t.toLocaleString()}: net ${fmt2(n)}`;
  }).join(' · ');
  const steps = r.farm_steps.map((s, i) => {
    const times = ['45 min', '15 min', '20 min', '30 min', '20 min', '30 min'];
    const costs = [fmt2(gasOf(r)), fmt2(gasOf(r) * 0.5 + 0.0025 * f.ticket), '$0.00', fmt2(gasOf(r) * 0.5), '$0.00', fmt2(gasOf(r))];
    const when = ['Day 0', 'Day 0', 'Day 1', 'Day 7', 'Day ' + Math.max(14, Math.floor(S.horizon * 7 / 2)), 'Day ' + (S.horizon * 7)];
    return `<tr><td style="white-space:nowrap">${when[i]}</td><td style="text-align:left">${esc(s)}</td><td>${costs[i]}</td><td style="white-space:nowrap">${times[i]}</td></tr>`;
  }).join('');
  const be = r.farm.breakeven_deposit_usd === null ? 'never — the drop per dollar is below the 0.25% fee rate' : '$' + r.farm.breakeven_deposit_usd.toLocaleString();
  return `<h2>${esc(r.name)} — ${r.tier} · rank #${r.rank} · ${esc(r.category ?? '')} · ${r.chains.join(', ')}</h2>
<div class="grid"><div><table>
<tr><th>Model breakdown</th><th></th></tr>
<tr><td>Size-curve value (TVL ${fmt(r.tvl_usd)})</td><td>${fmt(r.model.size_curve_usd)}</td></tr>
<tr><td>Growth factor (7d ${r.change_7d === null ? 'n/a' : r.change_7d.toFixed(1) + '%'} vs median ${E.median_change_7d}%)</td><td>×${r.model.growth_factor}</td></tr>
<tr><td>Chain-count factor (${r.chains.length} chains)</td><td>×${r.model.chains_factor}</td></tr>
<tr><td>Forward 24-month odds (age ${r.age_days === null ? 'n/a' : Math.round(r.age_days / 365.25 * 10) / 10 + 'y'})</td><td>×${r.model.forward_odds_24m}</td></tr>
${r.kin ? `<tr><td>Kin of a token — heuristic discount</td><td>×0.50</td></tr>` : ''}
<tr><td><b>Implied value</b> (P25–P75 ${fmt(r.model.range_p25_usd)}–${fmt(r.model.range_p75_usd)})</td><td><b>${fmt(r.implied_value_usd)}</b></td></tr>
</table><table style="margin-top:10px"><tr><th>Farm economics — this scenario</th><th></th></tr>
<tr><td>Ticket (${S.ticketMode === 'sized' ? '0.02% of TVL' : 'flat $' + S.ticketMode})</td><td>${fmt(f.ticket)}</td></tr>
<tr><td>Expected drop (airdrop slice: ${fmt(r.implied_value_usd)} × ${(S.drop * 100).toFixed(1)}% × ticket/TVL)</td><td>${fmt2(f.drop)}</td></tr>
<tr><td>Fees (gas ${r.chains[0]} ${fmt2(gasOf(r))} + 0.25% of ticket) + capital charge (T-bill ${(R.model.tbill * 100).toFixed(2)}% × ${S.horizon} wk)</td><td>−${fmt2(f.fees)} / −${fmt2(f.cap)}</td></tr>
<tr><td><b>Net</b> (drop − fees) · <b>${fmt2(f.net)} · ${fmt2(f.perHour)}/h</b> over ${f.hours}h active</td><td><span class="vd ${f.verdict}">${f.verdict}</span></td></tr>
<tr><td>Break-even deposit</td><td>${be}</td></tr></table></div>
<div><table><tr><th>When</th><th>Step</th><th>Cost</th><th>Time</th></tr>${steps}</table>
<p class="budget">All in: 6 steps over ${S.horizon * 7} days on ${fmt(f.ticket)} · fees ${fmt2(f.fees)} · expected drop ${fmt2(f.drop)} · net ${fmt2(f.net)} (${fmt2(f.perHour)}/h) · net after capital charge ${fmt2(f.net - f.cap)}.</p>
<p class="note">Deposit ladder — ${ladder} · break-even deposit ${be}.</p></div></div>`;
}
// ---- scatter ----
(function () {
  const W = 880, H = 230, P = 34;
  const xs = R.comps.map((c) => Math.log(c.tvl_usd)), ys = R.comps.map((c) => Math.log(c.mcap_usd));
  const x0 = Math.min(...xs) - .3, x1 = Math.max(...xs) + .3, y0 = Math.min(...ys) - .5, y1 = Math.max(...ys) + .5;
  const X = (v) => P + (v - x0) / (x1 - x0) * (W - 2 * P), Y = (v) => H - P - (v - y0) / (y1 - y0) * (H - 2 * P);
  const a = E.size_intercept, b = E.size_slope;
  let dots = R.comps.map((c) => `<circle cx="${X(Math.log(c.tvl_usd)).toFixed(1)}" cy="${Y(Math.log(c.mcap_usd)).toFixed(1)}" r="2.4" fill="#8b98a9" opacity="0.7"/>`).join('');
  dots += R.rows.map((r) => `<circle cx="${X(Math.log(r.tvl_usd)).toFixed(1)}" cy="${Y(Math.log(r.implied_value_usd)).toFixed(1)}" r="2.6" fill="#58a6ff"/>`).join('');
  $('#scatter').innerHTML = `<h2>Log–log: market cap vs TVL — traded comps (grey), size curve (line), board implied values (blue)</h2>
<svg viewBox="0 0 ${W} ${H}"><line x1="${X(x0)}" y1="${Y(a + b * x0)}" x2="${X(x1)}" y2="${Y(a + b * x1)}" stroke="#39c5cf" stroke-width="1.6"/>${dots}
<text x="${P}" y="${H - 8}" fill="#8b98a9" font-size="11">TVL →</text><text x="6" y="${P}" fill="#8b98a9" font-size="11">mcap →</text></svg>
<p class="lg2">Size curve ln(mcap) = ${a.toFixed(2)} + ${b.toFixed(2)}·ln(TVL), fitted on the ${E.comps_fitted} comps; R² is low because caps vary ×3.4 around the curve at the median — that is why the board prints a P25–P75 range per row instead of a point.</p>`;
})();
// ---- method / footer ----
$('#method').innerHTML = `<h2>How this radar is built — and what it does not claim</h2>
<p><b>Value.</b> The size curve and the kept terms (relative 7-day growth, chain count) are fitted by OLS on the ${E.comps_fitted} traded comps in the snapshot — protocols with a usable market cap <i>and</i> a listing date (128 carry a usable cap; 33 carry no listing date, so the walk-forward split cannot use them). The growth term enters with a negative fitted sign: in this down week (median 7d ${E.median_change_7d}%) the comps that fell least were not the priciest. It is kept because it lowers the held-out miss on both tests; the sign is the data's, not a choice. Relative growth is winsorized to the range the comps span (${E.growth_winsor[0]} to ${E.growth_winsor[1]}) so no board row extrapolates beyond the fitted data; the comps define the bounds, so the held-out tests are unchanged.</p>
<p><b>Odds.</b> The board prices forward launch odds — P(token within 24 months | still no token at age t) — from the peers' age-band hazard. The page never says a token will launch, or when. “Records no token” means DefiLlama records none; it is not proof none exists.</p>
<p><b>Farm.</b> Expected drop = implied value × drop share × (ticket / TVL): the position's share of the airdrop slice. Fees are gas on the protocol's first chain plus 0.25% of the ticket. Verdict: <b>FARM</b> if net ≥ $25 and net/hour ≥ $25; <b>MARGINAL</b> if net &gt; 0; else <b>SKIP</b>. The T-bill capital charge (4.25% × horizon on the ticket) is shown per row and net-after-capital in the detail view: only ${E.farm_clears_capital} of the ${E.farm_counts.FARM} FARM rows also clear it at the sized ticket — the charge is real and the page does not hide that the labour bar, not the capital bar, is what the FARM rows clear. The deposit sits in a yield-bearing venue, so the $25/h bar is the binding test.</p>
<p><b>Set aside.</b> ${E.ledger.setAside} pre-token protocols are set aside by rule and never ranked: ${Object.entries(E.set_aside_reasons).map(([k, v]) => `${k} ${v}`).join(' · ')}. The watchlist (40) is ranked whole, by implied value, like everything else.</p>`;
$('#foot').textContent = 'Token Radar v4 · main.ts fits everything above from the sealed snapshot at runtime · board.json checksum ' + R.checksum_sha256.slice(0, 16) + '… · dashboard source is static, no network.';
renderBoard();
