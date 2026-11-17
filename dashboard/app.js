/* Token Radar dashboard: renders window.RADAR with no network and no framework.
   The board, the detail view and the live table all come from the same data.js
   the entry program wrote, so the page and the board can never disagree. */
(function () {
  'use strict';
  var D = window.RADAR;
  if (!D) { document.body.textContent = 'Token Radar: no data loaded.'; return; }
  var rows = D.rows, live = D.live;

  function $(id) { return document.getElementById(id); }
  function money(n) {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + n;
  }
  function pct(v) {
    if (v === null || v === undefined) return '—';
    var s = (v > 0 ? '+' : '') + v.toFixed(1) + '%';
    return '<span class="' + (v >= 0 ? 'up' : 'down') + '">' + s + '</span>';
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function ageText(d) {
    if (d === null || d === undefined) return '—';
    if (d < 30) return d + 'd';
    if (d < 365) return Math.round(d / 30) + 'mo';
    return (d / 365).toFixed(1) + 'y';
  }

  /* ---- header stats ---- */
  var top = rows[0];
  $('stats').innerHTML =
    '<div class="stat"><b>' + D.board_size + '</b><span>protocols ranked</span></div>' +
    '<div class="stat"><b>' + D.watchlist_size + '</b><span>on the watchlist</span></div>' +
    '<div class="stat"><b>' + D.early_size + '</b><span>early finds below the floor</span></div>' +
    '<div class="stat"><b>' + money(top ? top.implied_value_usd : 0) + '</b><span>top implied value</span></div>';
  $('model-ver').textContent = 'model ' + D.model_version;
  $('src').textContent = 'Snapshot ' + D.as_of + ' · ' + D.source +
    ' · floor ' + money(D.floor_usd) + ' TVL · ' + D.rows.length + ' ranked rows, ' +
    D.live.length + ' live-token protocols set aside.';

  /* ---- filter controls ---- */
  var cats = {}, chains = {};
  rows.forEach(function (r) {
    if (r.category) cats[r.category] = 1;
    r.chains.forEach(function (c) { chains[c] = 1; });
  });
  Object.keys(cats).sort().forEach(function (c) {
    $('cat').appendChild(new Option(c, c));
  });
  Object.keys(chains).sort().forEach(function (c) {
    $('chain').appendChild(new Option(c, c));
  });
  // The watchlist slugs ride in data.js; the toggle and the WATCH badge read them.
  var watchSet = null;
  function isWatch(r) { return watchSet ? watchSet.has(r.slug) : false; }

  /* ---- farm plans, generated in the page from the row itself ---- */
  function capitalFor(tvl) {
    if (tvl >= 5e9) return 250;
    if (tvl >= 1e9) return 150;
    if (tvl >= 1e8) return 100;
    return 50;
  }
  function holdFor(age) {
    if (age === null || age === undefined) return 45;
    if (age < 180) return 60;
    if (age < 365) return 45;
    return 30;
  }
  function actionFor(r, capital, chain) {
    var c = (r.category || '').toLowerCase(), n = r.name;
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0)
      return 'Lend $' + capital + ' of USDC on ' + n + ' (' + chain + ') and leave the loan open so the position accrues.';
    if (c.indexOf('dex') >= 0 || c.indexOf('yield') >= 0 || c.indexOf('leveraged farm') >= 0)
      return 'Add $' + capital + ' of liquidity to ' + n + '\'s deepest pool on ' + chain + ' and leave it in range.';
    if (c.indexOf('bridge') >= 0)
      return 'Bridge $' + capital + ' of USDC into ' + chain + ' with ' + n + ', then put the bridged funds to work in its app.';
    if (c.indexOf('staking') >= 0 || c.indexOf('restak') >= 0)
      return 'Stake $' + capital + ' through ' + n + ' on ' + chain + ' and hold the receipt token it issues.';
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0)
      return 'Post $' + capital + ' of USDC as margin on ' + n + ' and open one small hedged trade.';
    if (c.indexOf('prediction') >= 0)
      return 'Back one outcome with $' + capital + ' on ' + n + ' and let the market settle.';
    if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0 || c.indexOf('vault') >= 0)
      return 'Deposit $' + capital + ' into a ' + n + ' vault on ' + chain + ' and hold the vault shares.';
    if (c.indexOf('stable') >= 0)
      return 'Mint or hold $' + capital + ' of the stable asset ' + n + ' issues on ' + chain + '.';
    if (c.indexOf('rwa') >= 0)
      return 'Mint $' + capital + ' of ' + n + '\'s yield-bearing asset on ' + chain + ' and hold it.';
    if (c.indexOf('insurance') >= 0)
      return 'Buy $' + capital + ' of cover from ' + n + ' on ' + chain + ' and keep the policy active.';
    return 'Deposit $' + capital + ' of USDC into ' + n + ' on ' + chain + ' and keep the position open.';
  }
  function farmSteps(r) {
    var chain = r.chains.length ? r.chains[0] : 'its main chain';
    var capital = capitalFor(r.tvl_usd), hold = holdFor(r.age_days);
    var gas = capital >= 150 ? 8 : 4;
    return [
      { t: 'Open a fresh wallet for this farm only, fund it with exactly what you plan to use, and keep its seed phrase offline on paper.', c: 'under $3 of gas for the first transfer', tm: '5 minutes' },
      { t: actionFor(r, capital, chain), c: '$' + capital + ' of capital and about $' + gas + ' of gas', tm: '15 minutes to set up' },
      { t: 'Do one real on-chain action every week: a deposit, a borrow, a swap, a vote, or a claim on the protocol itself.', c: 'about $2 of gas a week', tm: '10 minutes a week' },
      { t: 'Once a week, open the protocol\'s own points, quests or rewards page and finish any task it lists for your wallet.', c: 'free to check; only gas for on-chain tasks', tm: '10 minutes a week' },
      { t: 'Hold the position for at least ' + hold + ' days, so your activity shows up in more than one snapshot window.', c: 'the $' + capital + ' stays locked in the position', tm: hold + ' days' },
      { t: 'When a token is announced, claim only from the link the protocol publishes on its own site or docs, and never pay anyone to claim for you.', c: 'no fee to check; gas only to claim', tm: '10 minutes' }
    ];
  }

  /* ---- board ---- */
  var maxImplied = rows.length ? rows[0].implied_value_usd : 1;
  function filtered() {
    var q = $('q').value.trim().toLowerCase();
    var cat = $('cat').value, ch = $('chain').value, w = $('watch').checked;
    var list = rows.filter(function (r) {
      if (q && r.name.toLowerCase().indexOf(q) < 0 && r.slug.indexOf(q) < 0) return false;
      if (cat && r.category !== cat) return false;
      if (ch && r.chains.indexOf(ch) < 0) return false;
      if (w && !isWatch(r)) return false;
      return true;
    });
    var s = $('sort').value;
    if (s === 'tvl') list.sort(function (a, b) { return b.tvl_usd - a.tvl_usd; });
    else if (s === 'growth') list.sort(function (a, b) { return (b.change_7d || 0) - (a.change_7d || 0); });
    else if (s === 'age') list.sort(function (a, b) { return (b.age_days || 0) - (a.age_days || 0); });
    else list.sort(function (a, b) { return a.rank - b.rank; });
    return list;
  }
  function render() {
    var list = filtered();
    $('count').textContent = list.length + ' of ' + rows.length + ' rows';
    var html = '';
    if (!list.length) {
      $('rows').innerHTML = '<tr><td colspan="9" class="empty">No protocol matches these filters.</td></tr>';
      return;
    }
    list.forEach(function (r) {
      var w = Math.max(2, Math.round(r.implied_value_usd / maxImplied * 100));
      html += '<tr data-slug="' + esc(r.slug) + '">' +
        '<td>' + r.rank + '</td>' +
        '<td><b>' + esc(r.name) + '</b>' + (isWatch(r) ? '<span class="badge">WATCH</span>' : '') + '<br><span style="color:var(--faint);font-size:12px">' + esc(r.slug) + '</span></td>' +
        '<td>' + esc(r.category || '—') + '</td>' +
        '<td>' + esc(r.chains.slice(0, 2).join(', ')) + (r.chains.length > 2 ? ' +' + (r.chains.length - 2) : '') + '</td>' +
        '<td class="num">' + money(r.tvl_usd) + '</td>' +
        '<td class="num">' + pct(r.change_7d) + '</td>' +
        '<td class="num">' + ageText(r.age_days) + '</td>' +
        '<td class="num"><b>' + money(r.implied_value_usd) + '</b></td>' +
        '<td><div class="bar"><i style="width:' + w + '%"></i></div></td></tr>';
    });
    $('rows').innerHTML = html;
  }
  $('rows').addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-slug]');
    if (tr) openDetail(tr.getAttribute('data-slug'));
  });
  ['q', 'cat', 'chain', 'watch', 'sort'].forEach(function (id) {
    $(id).addEventListener('input', render);
    $(id).addEventListener('change', render);
  });

  /* ---- detail view ---- */
  function meter(label, mult, max) {
    var w = Math.max(2, Math.round(mult / max * 100));
    return '<div class="meter"><span>' + label + '</span><div class="bar"><i style="width:' + w + '%"></i></div><span class="val">×' + mult.toFixed(2) + '</span></div>';
  }
  function openDetail(slug) {
    var r = null;
    rows.forEach(function (x) { if (x.slug === slug) r = x; });
    if (!r) return;
    var base = Math.round(r.tvl_usd * D.model.base_multiple);
    var steps = farmSteps(r).map(function (s) {
      return '<li>' + esc(s.t) + '<br><span class="cost">Cost: ' + esc(s.c) + ' · Time: ' + esc(s.tm) + '</span></li>';
    }).join('');
    var d = $('detail');
    d.hidden = false;
    var chainList = r.chains.slice(0, 3).join(', ') + (r.chains.length > 3 ? ' +' + (r.chains.length - 3) : '');
    d.innerHTML =
      '<h2>#' + r.rank + ' ' + esc(r.name) + '</h2>' +
      '<p class="meta">' + esc(r.category || 'Uncategorised') + ' · ' + esc(chainList) +
      ' · TVL ' + money(r.tvl_usd) + ' · 7d ' + (r.change_7d === null ? '—' : (r.change_7d > 0 ? '+' : '') + r.change_7d.toFixed(1) + '%') +
      ' · tracked since ' + esc(r.listed_at || 'unknown') + ' · implied value <b style="color:var(--amber)">' + money(r.implied_value_usd) + '</b></p>' +
      '<p style="margin:0 0 6px;color:var(--dim)">The model, step by step — base ' + money(base) + ' from TVL, then each multiplier:</p>' +
      meter('Growth', r.growth_multiplier, 1.8) +
      meter('Maturity', r.maturity_multiplier, 1.0) +
      meter('Chain reach', r.chain_multiplier, 1.12) +
      '<h3 style="margin:16px 0 4px">How to farm it</h3>' +
      '<ol class="steps">' + steps + '</ol>' +
      '<p style="color:var(--faint);font-size:13px">This protocol records no token in the snapshot. That is not proof it has none — farm the position, not the rumour.</p>';
    document.querySelectorAll('#rows tr').forEach(function (tr) {
      tr.classList.toggle('sel', tr.getAttribute('data-slug') === slug);
    });
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
    d.scrollIntoView({ block: 'nearest' });
  }

  /* ---- live table ---- */
  $('live-rows').innerHTML = live.map(function (p) {
    return '<tr><td><b>' + esc(p.name) + '</b></td><td>' + esc(p.category || '—') + '</td>' +
      '<td class="num">' + money(p.tvl_usd) + '</td>' +
      '<td class="num">' + (p.mcap_usd === null ? '—' : money(p.mcap_usd)) + '</td>' +
      '<td class="num">' + pct(p.change_7d) + '</td></tr>';
  }).join('');

  /* ---- watchlist set, from the snapshot's watchlist embedded in data.js ---- */
  watchSet = new Set(D.watchlist_slugs || []);
  render();

  /* ---- deep links and screenshot presets ---- */
  var params = new URLSearchParams(location.search);
  var shot = params.get('shot');
  if (shot === 'filtered') {
    $('cat').value = 'Lending';
    $('sort').value = 'growth';
    render();
  } else if (shot === 'detail') {
    var slug = params.get('slug') || (rows[0] && rows[0].slug);
    if (slug) openDetail(slug);
  }
  if (location.hash.length > 1) {
    var h = decodeURIComponent(location.hash.slice(1));
    if (rows.some(function (r) { return r.slug === h; })) openDetail(h);
  }
})();
