(() => {
const S = window.STORE, C = window.CATEGORIES, P = window.PRODUCTS;
const $ = (s, el = document) => el.querySelector(s);
const app = $('#app');
const fmt = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = n => '$' + Math.round(n).toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const catOf = id => C.find(c => c.id === id);
const prod = id => P.find(p => p.id === id);

// ---------- state (in memory) ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
let mode = store.get('ts_mode', 'retail');
let cart = store.get('ts_cart', {});

// ---------- pricing ----------
// Trade: 15% off retail; extra 5% at 10+ units, 8% at 25+ units of the same SKU.
// Homeowner: 3% off at 5+ units, 5% at 10+ units.
function tiers(p) {
  if (mode === 'trade') {
    const b = p.price * (1 - S.tradeDiscount);
    return [{ q: 1, l: '1–9', u: b }, { q: 10, l: '10–24', u: b * .95 }, { q: 25, l: '25+', u: b * .92 }];
  }
  return [{ q: 1, l: '1–4', u: p.price }, { q: 5, l: '5–9', u: p.price * .97 }, { q: 10, l: '10+', u: p.price * .95 }];
}
const unit = (p, q = 1) => { const t = tiers(p); let u = t[0].u; t.forEach(x => { if (q >= x.q) u = x.u; }); return Math.round(u * 100) / 100; };
function totals() {
  let sub = 0, n = 0, hasBatt = false;
  for (const [id, q] of Object.entries(cart)) { const p = prod(id); if (!p) continue; sub += unit(p, q) * q; n += q; if (p.cat === 'batteries' || p.cat === 'kits' || p.cat === 'portable') hasBatt = true; }
  const ship = n === 0 ? 0 : sub >= S.freeShipOver ? 0 : S.shipFlat;
  return { sub, ship, total: sub + ship, n, hasBatt };
}

// ---------- shared UI ----------
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2200); }
function prepareRequest(subject, body, status) {
  if (S.email) {
    location.href = `mailto:${S.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Your email app should open with the request ready to send. If it does not open, call us directly.';
  } else {
    status.textContent = `Copy the details below, then call ${S.phone} to submit your request.`;
    status.parentElement.querySelector('.request-details')?.remove();
    const details = document.createElement('textarea');
    details.className = 'field request-details';
    details.value = `${subject}\n\n${body}`;
    details.readOnly = true;
    details.setAttribute('aria-label', 'Request details to copy');
    status.insertAdjacentElement('afterend', details);
    details.focus(); details.select();
  }
  status.style.color = '#1E6B4F';
}
function save() { store.set('ts_cart', cart); renderCart(); }
function add(id, q = 1) { cart[id] = (cart[id] || 0) + q; save(); toast(`Added to cart — ${prod(id).name}`); }
function setMode(m) {
  mode = m; store.set('ts_mode', m);
  document.querySelectorAll('.mode button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  renderCart(); route();
}
function renderCart() {
  const t = totals();
  $('#cartN').textContent = t.n;
  const items = Object.entries(cart).filter(([id]) => prod(id));
  $('#cartItems').innerHTML = items.length ? items.map(([id, q]) => {
    const p = prod(id);
    return `<div class="li"><img src="${catOf(p.cat).img}" alt="" width="64" height="48"><div><div class="t">${esc(p.name)}</div><div class="s">${fmt(unit(p, q))} each · ${p.id}</div>
      <div class="row" style="margin-top:6px"><div class="qty"><button data-dq="${id}" data-d="-1" aria-label="Decrease">−</button><input value="${q}" data-qi="${id}" inputmode="numeric" aria-label="Quantity"><button data-dq="${id}" data-d="1" aria-label="Increase">+</button></div><button class="link" data-rm="${id}">Remove</button></div></div>
      <b style="font-size:var(--text-sm)">${fmt(unit(p, q) * q)}</b></div>`;
  }).join('') : `<div class="empty"><p class="muted">Your cart is empty.</p><a href="#/shop" class="btn d" style="margin-top:12px" data-close>Browse equipment</a></div>`;
  $('#cartFoot').innerHTML = items.length ? `
    <div class="sum"><span>Subtotal (${mode === 'trade' ? 'trade pricing' : 'retail pricing'})</span><span>${fmt(t.sub)}</span></div>
    <div class="sum"><span>Shipping</span><span>${t.ship ? fmt(t.ship) : 'Free'}</span></div>
    <div class="sum muted"><span>Sales tax</span><span>Calculated at checkout</span></div>
    <div class="sum t"><span>Estimated total</span><span>${fmt(t.total)} USD</span></div>
    ${t.sub < S.freeShipOver ? `<p class="note">Add ${fmt(S.freeShipOver - t.sub)} more for free shipping.</p>` : ''}
    <a href="#/checkout" class="btn p" data-close>Checkout</a>` : '';
}
function openCart(o) { $('#drawer').classList.toggle('on', o); $('#scrim').classList.toggle('on', o); $('#drawer').setAttribute('aria-hidden', !o); }

document.addEventListener('click', e => {
  const t = e.target.closest('[data-add],[data-dq],[data-rm],[data-close],[data-mode],[data-pq]');
  if (!t) return;
  if (t.dataset.add) { add(t.dataset.add, +(t.dataset.q || 1)); }
  if (t.dataset.dq) { const id = t.dataset.dq; cart[id] = Math.max(0, (cart[id] || 0) + +t.dataset.d); if (!cart[id]) delete cart[id]; save(); if (location.hash === '#/checkout') route(); }
  if (t.dataset.rm) { delete cart[t.dataset.rm]; save(); if (location.hash === '#/checkout') route(); }
  if (t.dataset.mode) setMode(t.dataset.mode);
  if (t.hasAttribute('data-close')) openCart(false);
  if (t.dataset.pq) { const i = $('#pq'); i.value = Math.max(1, (+i.value || 1) + +t.dataset.pq); updPd(); }
});
document.addEventListener('change', e => {
  if (e.target.dataset.qi) { const v = Math.max(0, parseInt(e.target.value) || 0); const id = e.target.dataset.qi; if (v) cart[id] = v; else delete cart[id]; save(); }
});
$('#cartBtn').onclick = () => openCart(true);
$('#cartX').onclick = $('#scrim').onclick = () => openCart(false);
document.addEventListener('keydown', e => { if (e.key === 'Escape') openCart(false); });
$('#menuT').onclick = () => { const n = $('#nav'); n.classList.toggle('open'); $('#menuT').setAttribute('aria-expanded', n.classList.contains('open')); };

// ---------- views ----------
function card(p) {
  const r = unit(p), c = catOf(p.cat);
  return `<article class="card">
    <div class="im" onclick="location.hash='#/p/${p.id}'"><img src="${c.img}" alt="${esc(p.name)}" loading="lazy" width="400" height="300"><span class="tag">${c.name}</span></div>
    <div class="bd"><span class="sku">SKU ${p.id}</span><h3 onclick="location.hash='#/p/${p.id}'">${esc(p.name)}</h3>
    <ul>${p.specs.slice(0, 2).map(s => `<li>${esc(s)}</li>`).join('')}</ul>
    <div class="pr"><b>${fmt(r)}</b>${mode === 'trade' ? `<s>${fmt(p.price)}</s>` : ''}<small>/ ${p.unit}</small></div>
    <button class="btn d" data-add="${p.id}">Add to cart</button></div></article>`;
}

function home() {
  const feat = ['SE-P410', 'SE-H10', 'SE-B10W', 'SE-K6', 'SE-R24', 'SE-PS1', 'SE-C100', 'SE-K10'].map(prod);
  return `
  <section class="hero"><img src="img/hero.jpg" alt="Solar panels on a Southwest-style home at sunset" fetchpriority="high">
    <div class="wrap"><span class="eyebrow">Solar equipment supply · Ships across the contiguous US</span>
    <h1>Panels, power and storage — priced for the roof and the crew.</h1>
    <p>Everything from a $119 folding panel to a $9,990 whole-home kit. Homeowners buy at retail; licensed installers unlock trade pricing and volume breaks.</p>
    <div class="ctas"><a href="#/shop" class="btn p">Shop equipment</a><a href="#/trade" class="btn l">Open an installer account</a></div></div>
  </section>
  <div class="trust"><div class="wrap">
    <div><b>$100 – $10,000</b>${P.length} SKUs across ${C.length} categories</div>
    <div><b>Trade pricing</b>15% off retail, plus volume tiers</div>
    <div><b>Free shipping</b>On orders over ${fmt0(S.freeShipOver)}</div>
    <div><b>30-day returns</b>On unused, unopened items</div>
  </div></div>
  <section class="blk"><div class="wrap">
    <div class="sh"><div><span class="eyebrow">Categories</span><h2>Shop by system component</h2></div><a href="#/shop" class="btn o">View all products</a></div>
    <div class="cats">${C.map(c => `<a class="cat" href="#/shop/${c.id}"><img src="${c.img}" alt="" loading="lazy" width="400" height="300"><div>${c.name}<span>${P.filter(p => p.cat === c.id).length}</span></div></a>`).join('')}</div>
  </div></section>
  <section class="blk" style="padding-top:0"><div class="wrap split">
    <div class="aud a"><span class="eyebrow" style="color:var(--sun)">For local solar companies</span><h3>Stock your next install without the distributor runaround.</h3>
      <ul><li>Trade prices shown live once you switch to Installer mode</li><li>Volume breaks at 10 and 25 units per SKU</li><li>Pallet and freight shipping to your yard or the job site</li><li>Resale certificates accepted for tax-exempt purchases</li></ul>
      <a href="#/trade" class="btn p">Apply for trade pricing</a></div>
    <div class="aud b"><span class="eyebrow">For homeowners</span><h3>Real equipment, plain specs, honest prices.</h3>
      <ul><li>Every listing shows its price, specs and warranty up front</li><li>Complete kits sized for cabins, homes and backup power</li><li>Portable stations for outages and off-grid trips</li><li>Questions answered by phone or email before you buy</li></ul>
      <a href="#/shop/kits" class="btn d">Browse complete kits</a></div>
  </div></section>
  <section class="blk" style="padding-top:0"><div class="wrap">
    <div class="sh"><div><span class="eyebrow">Popular</span><h2>Most-ordered equipment</h2></div></div>
    <div class="grid">${feat.map(card).join('')}</div>
  </div></section>
  <section class="blk" style="padding-top:0"><div class="wrap">
    <div class="sh"><div><span class="eyebrow">How ordering works</span><h2>From cart to delivery</h2></div></div>
    <div class="steps">
      <div><i>01</i><b>Choose pricing</b>Homeowner retail, or Installer trade pricing for approved accounts.</div>
      <div><i>02</i><b>Prepare an order request</b>Review your cart and share your order details with our team.</div>
      <div><i>03</i><b>We confirm & ship</b>Orders leave in 1–3 business days with tracking emailed to you.</div>
      <div><i>04</i><b>Inspect on arrival</b>Report freight damage within 48 hours; returns accepted for 30 days.</div>
    </div>
  </div></section>
  <section class="blk" style="padding-top:0"><div class="wrap">
    <div class="band"><img src="img/warehouse.jpg" alt="" loading="lazy"><div class="in"><span class="eyebrow" style="color:var(--sun)">Questions before you order?</span><h2>Talk to a person about your system.</h2><p style="color:#E4E0D5">Send us your roof size, power bill or equipment list and we'll help match components.</p><div><a href="#/contact" class="btn l">Contact us</a></div></div></div>
  </div></section>`;
}

let F = { cat: 'all', q: '', sort: 'feat', price: 'all' };
function shop(cat) {
  if (cat) F.cat = cat;
  const ranges = { all: [0, 1e9], a: [0, 300], b: [300, 1000], c: [1000, 5000], d: [5000, 1e9] };
  let list = P.filter(p => (F.cat === 'all' || p.cat === F.cat) && p.price >= ranges[F.price][0] && p.price < ranges[F.price][1] && (!F.q || (p.name + ' ' + p.id + ' ' + p.specs.join(' ')).toLowerCase().includes(F.q.toLowerCase())));
  if (F.sort === 'lo') list.sort((a, b) => a.price - b.price);
  if (F.sort === 'hi') list.sort((a, b) => b.price - a.price);
  const title = F.cat === 'all' ? 'All equipment' : catOf(F.cat).name;
  return `<div class="wrap shop">
    <aside class="filters" aria-label="Filters">
      <div><h4>Search</h4><input class="field" id="fq" type="search" placeholder="Panel, 48V, kit…" value="${esc(F.q)}"></div>
      <div><h4>Category</h4>${[{ id: 'all', name: 'All equipment' }, ...C].map(c => `<label><input type="radio" name="fc" value="${c.id}" ${F.cat === c.id ? 'checked' : ''}>${c.name}</label>`).join('')}</div>
      <div><h4>Retail price</h4>${[['all', 'Any price'], ['a', 'Under $300'], ['b', '$300 – $1,000'], ['c', '$1,000 – $5,000'], ['d', '$5,000 – $10,000']].map(([v, l]) => `<label><input type="radio" name="fp" value="${v}" ${F.price === v ? 'checked' : ''}>${l}</label>`).join('')}</div>
    </aside>
    <div>
      <div class="toolbar"><div><h1>${title}</h1><p class="muted" style="font-size:var(--text-sm)">${list.length} product${list.length === 1 ? '' : 's'} · showing ${mode === 'trade' ? 'installer trade' : 'homeowner retail'} prices</p></div>
        <select class="field" id="fs" style="width:auto" aria-label="Sort"><option value="feat">Featured</option><option value="lo" ${F.sort === 'lo' ? 'selected' : ''}>Price: low to high</option><option value="hi" ${F.sort === 'hi' ? 'selected' : ''}>Price: high to low</option></select></div>
      <p class="catalog-note">Catalog examples are illustrative. Confirm current stock, specifications and final price with our team before ordering.</p>
      ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : `<div class="empty"><p><b>No products match those filters.</b></p><p class="muted">Try a different category or price range.</p><button class="btn o" id="fr" style="margin-top:12px">Clear filters</button></div>`}
    </div></div>`;
}
function bindShop() {
  const re = () => { app.innerHTML = shop(); bindShop(); };
  $('#fq')?.addEventListener('input', e => { F.q = e.target.value; const pos = e.target.selectionStart; re(); const i = $('#fq'); i.focus(); i.setSelectionRange(pos, pos); });
  document.querySelectorAll('[name=fc]').forEach(r => r.onchange = () => { F.cat = r.value; try { history.replaceState(null, '', r.value === 'all' ? '#/shop' : '#/shop/' + r.value); lastHash = location.hash; } catch {} re(); });
  document.querySelectorAll('[name=fp]').forEach(r => r.onchange = () => { F.price = r.value; re(); });
  $('#fs')?.addEventListener('change', e => { F.sort = e.target.value; re(); });
  $('#fr')?.addEventListener('click', () => { F = { cat: 'all', q: '', sort: 'feat', price: 'all' }; re(); });
}

let curP = null;
function pdp(id) {
  const p = prod(id); if (!p) return notFound();
  curP = p; const c = catOf(p.cat); const isBatt = ['batteries', 'kits', 'portable'].includes(p.cat);
  return `<div class="wrap pd">
    <div class="gal"><img src="${c.img}" alt="${esc(p.name)}" width="900" height="675"></div>
    <div>
      <div class="crumb"><a href="#/shop">Shop</a> / <a href="#/shop/${c.id}">${c.name}</a></div>
      <h1>${esc(p.name)}</h1>
      <p class="sku">SKU ${p.id} · Sold per ${p.unit}</p>
      <ul class="specs">${p.specs.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      <div class="pbox">
        <div class="pr" style="padding:0"><b style="font-size:var(--text-xl)" id="pu">${fmt(unit(p))}</b>${mode === 'trade' ? `<s>Retail ${fmt(p.price)}</s>` : ''}<small>/ ${p.unit} · USD</small></div>
        <table class="tiers"><thead><tr><th>Quantity</th><th>${mode === 'trade' ? 'Trade' : 'Retail'} unit price</th></tr></thead><tbody>${tiers(p).map(t => `<tr><td>${t.l}</td><td>${fmt(Math.round(t.u * 100) / 100)}</td></tr>`).join('')}</tbody></table>
        <div class="row"><div class="qty"><button data-pq="-1" aria-label="Decrease">−</button><input id="pq" value="1" inputmode="numeric" aria-label="Quantity"><button data-pq="1" aria-label="Increase">+</button></div>
          <button class="btn p" id="padd" style="flex:1">Add to cart — <span id="pt">${fmt(unit(p))}</span></button></div>
        ${mode === 'retail' ? `<p class="note">Installer? <button class="link" data-mode="trade">Switch to trade pricing</button> to see ${fmt(unit(p) * (1 - S.tradeDiscount))} and volume breaks. Trade orders are verified before shipping.</p>` : `<p class="note">Trade pricing applies to approved installer accounts. We confirm retail pricing before payment if no approved account exists.</p>`}
      </div>
      <div style="margin-top:var(--s6);display:grid;gap:var(--s2);font-size:var(--text-sm)">
        <div><b>Ships:</b> ${p.unit === 'pallet' || p.price >= 2500 ? 'LTL freight, 5–10 business days after dispatch' : 'Ground parcel, 3–7 business days after dispatch'}. Dispatch in 1–3 business days. Contiguous US only.</div>
        ${isBatt ? `<div><b>Lithium battery item:</b> ships by ground as a regulated Class 9 shipment; no air or PO boxes. See <a href="#/shipping">shipping policy</a>.</div>` : ''}
        <div><b>Returns:</b> 30 days for unused items in original packaging. <a href="#/returns">Return policy</a>.</div>
        <div><b>Warranty:</b> Manufacturer warranty as listed in specs. <a href="#/warranty">Warranty details</a>.</div>
      </div>
    </div></div>
    <section class="blk" style="padding-top:0"><div class="wrap"><div class="sh"><h2>More ${c.name.toLowerCase()}</h2></div>
    <div class="grid">${P.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4).map(card).join('')}</div></div></section>`;
}
function updPd() { const q = Math.max(1, parseInt($('#pq').value) || 1); $('#pq').value = q; $('#pu').textContent = fmt(unit(curP, q)); $('#pt').textContent = fmt(unit(curP, q) * q); }
function bindPdp() { $('#pq')?.addEventListener('input', updPd); $('#padd')?.addEventListener('click', () => add(curP.id, Math.max(1, parseInt($('#pq').value) || 1))); }

const US = 'AL AR AZ CA CO CT DE DC FL GA ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
function checkout() {
  const t = totals();
  if (!t.n) return `<div class="wrap"><div class="ok"><h1 style="font-size:var(--text-xl)">Your cart is empty</h1><p class="muted">Add equipment to your cart to check out.</p><div><a href="#/shop" class="btn d">Shop equipment</a></div></div></div>`;
  const lines = Object.entries(cart).filter(([id]) => prod(id)).map(([id, q]) => { const p = prod(id); return `<div class="li" style="grid-template-columns:56px 1fr auto"><img src="${catOf(p.cat).img}" alt="" style="width:56px;height:42px"><div><div class="t">${esc(p.name)}</div><div class="s">Qty ${q} × ${fmt(unit(p, q))}</div></div><b style="font-size:var(--text-sm)">${fmt(unit(p, q) * q)}</b></div>`; }).join('');
  return `<div class="wrap co">
  <form id="cof" novalidate>
    <h1>Checkout</h1>
    <fieldset><legend>Contact</legend>
      <div class="f2"><label class="l">Full name<input class="field" name="name" required autocomplete="name"></label><label class="l">Email<input class="field" type="email" name="email" required autocomplete="email"></label></div>
      <div class="f2"><label class="l">Phone<input class="field" type="tel" name="phone" required autocomplete="tel"></label><label class="l">Company (optional)<input class="field" name="company" autocomplete="organization"></label></div>
    </fieldset>
    <fieldset><legend>Shipping address</legend>
      <label class="l">Street address<input class="field" name="addr" required autocomplete="street-address"></label>
      <div class="f3"><label class="l">City<input class="field" name="city" required autocomplete="address-level2"></label>
        <label class="l">State<select class="field" name="state" required><option value="">Select</option>${US.map(s => `<option>${s}</option>`).join('')}</select></label>
        <label class="l">ZIP<input class="field" name="zip" required inputmode="numeric" pattern="\\d{5}" autocomplete="postal-code"></label></div>
      <p class="note">We ship to the 48 contiguous states and DC. No PO boxes for freight or lithium battery items. ${t.n && t.hasBatt ? 'Your cart contains lithium battery items that ship by ground only.' : ''}</p>
    </fieldset>
    <fieldset><legend>Order request</legend>
      <div class="paybox"><b>No online payment is collected here.</b>
      <p class="muted" style="font-size:var(--text-sm)">Prepare an order request in your email app. We will confirm stock, shipping, applicable tax and payment before your order is placed.</p></div>
    </fieldset>
    <fieldset>
      <label class="chk"><input type="checkbox" name="agree" required><span>I have read and agree to the <a href="#/terms" target="_blank">Terms of Sale</a>, <a href="#/returns" target="_blank">Return &amp; Refund Policy</a>, <a href="#/shipping" target="_blank">Shipping Policy</a> and <a href="#/privacy" target="_blank">Privacy Policy</a>.</span></label>
      ${mode === 'trade' ? `<label class="chk"><input type="checkbox" name="trade" required><span>I am purchasing on behalf of a licensed solar contractor. I understand trade pricing is verified before shipment and the order is billed at retail if no approved account exists.</span></label>` : ''}
      <p class="err" id="coErr" role="alert"></p>
      <button class="btn p" style="width:100%;padding:16px">Prepare order request — ${fmt(t.total)} USD</button>
      <p class="muted" style="font-size:var(--text-xs);text-align:center">Applicable sales tax is confirmed based on your shipping address. Trade buyers with a resale certificate may be tax-exempt.</p>
    </fieldset>
  </form>
  <aside class="aside"><h3 style="font-size:var(--text-lg)">Order summary</h3>${lines}
    <hr style="border:0;border-top:1px solid var(--line)">
    <div class="sum"><span>Subtotal</span><span>${fmt(t.sub)}</span></div>
    <div class="sum"><span>Shipping</span><span>${t.ship ? fmt(t.ship) : 'Free'}</span></div>
    <div class="sum muted"><span>Sales tax</span><span>Based on address</span></div>
    <div class="sum t"><span>Total</span><span>${fmt(t.total)} USD</span></div>
    <p class="note">Questions? Call ${esc(S.phone)} or email ${esc(S.email)}.</p>
  </aside></div>`;
}
function bindCheckout() {
  const f = $('#cof'); if (!f) return;
  f.addEventListener('input', e => { e.target.style.borderColor = ''; });
  f.addEventListener('submit', e => {
    e.preventDefault();
    const bad = [...f.elements].filter(x => x.required && (x.type === 'checkbox' ? !x.checked : !x.value.trim() || (x.validity && !x.validity.valid)));
    if (bad.length) { $('#coErr').textContent = 'Please complete the highlighted fields and accept the policies.'; bad.forEach(x => x.style.borderColor = '#A12A1B'); bad[0].focus(); return; }
    const details = Object.entries(cart).filter(([id]) => prod(id)).map(([id, q]) => { const p = prod(id); return `${p.id} ${p.name} x ${q} — ${fmt(unit(p, q) * q)}`; }).join('\n');
    const fields = [...new FormData(f).entries()].filter(([k]) => k !== 'agree' && k !== 'trade').map(([k, v]) => `${k}: ${v}`).join('\n');
    const t = totals();
    const body = `${fields}\n\n${details}\n\nSubtotal: ${fmt(t.sub)}\nEstimated shipping: ${fmt(t.ship)}\nEstimated total before tax: ${fmt(t.total)}\nPricing mode: ${mode}`;
    prepareRequest('Solar Edge LLC order request', body, $('#coErr'));
  });
}

function trade() {
  return `<div class="wrap doc"><span class="eyebrow">Installer accounts</span><h1>Trade pricing for local solar companies</h1>
  <p>Licensed solar and electrical contractors get 15% off retail on every SKU, plus extra breaks at 10 and 25 units per SKU. Switch the header toggle to <b>Installer</b> to see trade pricing anywhere on the site.</p>
  <table><thead><tr><th>Tier</th><th>Homeowner</th><th>Installer (trade)</th></tr></thead><tbody>
  <tr><td>Base price</td><td>Retail</td><td>15% off retail</td></tr>
  <tr><td>5–9 units / SKU</td><td>3% off retail</td><td>15% off retail</td></tr>
  <tr><td>10–24 units / SKU</td><td>5% off retail</td><td>Trade −5%</td></tr>
  <tr><td>25+ units / SKU</td><td>5% off retail</td><td>Trade −8%</td></tr></tbody></table>
  <h2>Requirements</h2><ul><li>Active state contractor or electrical license</li><li>Business EIN and company address</li><li>Resale certificate if purchasing tax-exempt</li></ul>
  <p>Trade orders are checked against your account before shipping. If no approved account exists, we will confirm retail pricing before payment.</p>
  <h2>Apply</h2>
  <form id="tf" class="pbox" novalidate>
    <div class="f2"><label class="l">Company name<input class="field" name="co" required></label><label class="l">Contact name<input class="field" name="n" required></label></div>
    <div class="f2"><label class="l">Email<input class="field" type="email" name="e" required></label><label class="l">Phone<input class="field" type="tel" name="p" required></label></div>
    <div class="f2"><label class="l">License number & state<input class="field" name="lic" required></label><label class="l">Installs per month<select class="field" name="v"><option>1–5</option><option>6–20</option><option>21–50</option><option>50+</option></select></label></div>
    <p class="err" id="tErr" role="alert"></p>
    <button class="btn p">Prepare application email</button>
  </form></div>`;
}
function bindTrade() {
  const f = $('#tf'); if (!f) return;
  f.addEventListener('submit', e => {
    e.preventDefault();
    const bad = [...f.elements].filter(x => x.required && (!x.value.trim() || !x.validity.valid));
    if (bad.length) { $('#tErr').textContent = 'Please complete all fields.'; bad[0].focus(); return; }
    const body = [...new FormData(f).entries()].map(([k, v]) => `${k}: ${v}`).join('\n');
    prepareRequest('Solar Edge LLC trade application', body, $('#tErr'));
  });
}

function idBox() {
  return `<dl class="idbox">
    <div><dt>Business name</dt><dd>${esc(S.brand)}</dd></div>
    <div><dt>Legal entity</dt><dd>${esc(S.legalName)}</dd></div>
    <div><dt>Address</dt><dd>${esc(S.address)}</dd></div>
    <div><dt>Phone</dt><dd>${esc(S.phone)}</dd></div>
    <div><dt>Email</dt><dd><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></dd></div></dl>`;
}
const updated = 'Last updated: November 3, 2026';
const pages = {
  about: () => `<div class="wrap doc"><span class="eyebrow">About</span><h1>About ${esc(S.brand)}</h1>
    <p>${esc(S.brand)} is an online solar equipment supplier serving the contiguous United States. We sell panels, inverters, batteries, charge controllers, racking, wiring and complete kits to two kinds of buyers: local solar installation companies stocking jobs, and homeowners building or expanding their own systems.</p>
    <p>We sell equipment only. We do not perform installations, and we recommend that grid-connected systems be installed by a licensed contractor and permitted with your local authority and utility.</p>
    <p>${esc(S.brand)} is an independent brand. It is not affiliated with, endorsed by or a reseller for any solar installer or manufacturer with a similar name.</p>
    <h2>Business information</h2>${idBox()}
    <h2>What we sell</h2><ul>${C.map(c => `<li><a href="#/shop/${c.id}">${c.name}</a> — ${P.filter(p => p.cat === c.id).length} products</li>`).join('')}</ul>
    <p>Retail prices range from ${fmt0(Math.min(...P.map(p => p.price)))} to ${fmt0(Math.max(...P.map(p => p.price)))} USD.</p></div>`,
  contact: () => `<div class="wrap doc"><span class="eyebrow">Contact</span><h1>Contact customer service</h1>
    <p>We answer every message within one business day. For order questions, include your order reference.</p>${idBox()}
    <form id="cf" class="pbox" novalidate>
      <div class="f2"><label class="l">Name<input class="field" name="n" required></label><label class="l">Email<input class="field" type="email" name="e" required></label></div>
      <label class="l">Topic<select class="field" name="t"><option>Product question</option><option>Order status</option><option>Return or refund</option><option>Installer account</option><option>Other</option></select></label>
      <label class="l">Message<textarea class="field" name="m" rows="5" required></textarea></label>
      <p class="err" id="cErr" role="alert"></p><button class="btn p">Prepare message email</button></form></div>`,
  faq: () => `<div class="wrap doc faq"><span class="eyebrow">FAQ</span><h1>Frequently asked questions</h1>
    ${[['Who can buy from you?', 'Anyone in the contiguous United States. Homeowners pay retail. Licensed installers can apply for trade pricing.'],
       ['Do you install systems?', 'No. We sell equipment only. We recommend a licensed contractor for any grid-connected or battery installation.'],
       ['How long does shipping take?', 'Orders dispatch in 1–3 business days. Parcel delivery takes 3–7 business days after dispatch; LTL freight takes 5–10 business days.'],
       ['Can I return an item?', 'Yes — unused items in original packaging within 30 days of delivery. See our Return & Refund Policy for details and exclusions.'],
       ['How is payment handled?', 'Online card payment is not active here. Email your order request and we will confirm stock, shipping and payment before placing the order.'],
       ['Will this website charge my card?', 'No. This website does not collect card details or charge your card.'],
       ['Do you charge sales tax?', 'Yes, where required, based on your shipping address. Installers with a valid resale certificate on file may purchase tax-exempt.'],
       ['Can you ship batteries by air or outside the US?', 'No. Lithium batteries ship by ground within the contiguous US only.']].map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}
    <p style="margin-top:var(--s6)">Still have a question? <a href="#/contact">Contact us</a>.</p></div>`,
  shipping: () => `<div class="wrap doc"><span class="eyebrow">Policy</span><h1>Shipping Policy</h1><p class="muted">${updated}</p>
    <h2>Where we ship</h2><p>We ship to addresses in the 48 contiguous United States and Washington, DC. We do not ship to Alaska, Hawaii, US territories, APO/FPO addresses or internationally.</p>
    <h2>Processing time</h2><p>Orders are processed and dispatched within 1–3 business days (Monday–Friday, excluding federal holidays). You will receive an email with tracking information when your order ships.</p>
    <h2>Shipping methods and rates</h2><table><thead><tr><th>Method</th><th>Used for</th><th>Transit after dispatch</th></tr></thead><tbody>
      <tr><td>Ground parcel</td><td>Most items under 150 lb</td><td>3–7 business days</td></tr>
      <tr><td>LTL freight</td><td>Pallets, large kits, battery systems</td><td>5–10 business days</td></tr></tbody></table>
    <p>Shipping is a flat ${fmt(S.shipFlat)} per order, and free on orders of ${fmt(S.freeShipOver)} or more. Liftgate or residential freight delivery may require scheduling; the carrier will call to arrange a delivery window.</p>
    <h2>Lithium batteries</h2><p>Lithium batteries, power stations and kits containing batteries are regulated hazardous materials (Class 9). They ship by ground only, cannot ship to PO boxes, and may require an adult signature.</p>
    <h2>Freight inspection</h2><p>Inspect freight deliveries before signing. Note any visible damage on the bill of lading and email photos to ${esc(S.email)} within 48 hours of delivery so we can file a carrier claim and send replacements.</p>
    <h2>Lost or delayed packages</h2><p>If tracking shows no movement for 5 business days, contact us and we will open a trace with the carrier. Packages confirmed lost are replaced or refunded at no cost to you.</p>${idBox()}</div>`,
  returns: () => `<div class="wrap doc"><span class="eyebrow">Policy</span><h1>Return &amp; Refund Policy</h1><p class="muted">${updated}</p>
    <h2>30-day returns</h2><p>You may return most items within 30 days of delivery for a refund, provided they are unused, uninstalled and in their original packaging with all accessories and manuals.</p>
    <h2>How to start a return</h2><ol><li>Email ${esc(S.email)} or call ${esc(S.phone)} with your order reference and the items you want to return.</li><li>We will send a Return Authorization (RA) number and return instructions within 1 business day.</li><li>Ship the item back with the RA number on the package. Returns without an RA number may be delayed.</li></ol>
    <h2>Refunds</h2><p>Once we receive and inspect the return, we issue the refund to your original payment method within 5 business days. Your bank may take a further 5–10 business days to post it. You will receive an email confirmation when the refund is issued.</p>
    <h2>Return shipping and restocking</h2><ul><li>Items that arrive damaged, defective or incorrect: we cover return shipping and refund or replace in full.</li><li>Change-of-mind returns of parcel items: the customer pays return shipping; no restocking fee.</li><li>Change-of-mind returns of freight items (pallets, battery systems, large kits): a 15% restocking fee applies plus actual return freight cost, deducted from the refund.</li></ul>
    <h2>Non-returnable items</h2><ul><li>Items that have been installed, energized or modified</li><li>Lithium batteries whose packaging seal has been opened (for safety reasons), unless defective</li><li>Cut-to-length wire</li></ul>
    <h2>Order cancellations</h2><p>You may cancel any order at no charge before it ships by contacting us. If you cancel after it ships, the return terms above apply.</p>
    <h2>Damaged or defective items</h2><p>Report shipping damage within 48 hours of delivery and defects within 30 days. After 30 days, defects are handled under the manufacturer's warranty.</p>${idBox()}</div>`,
  warranty: () => `<div class="wrap doc"><span class="eyebrow">Policy</span><h1>Warranty</h1><p class="muted">${updated}</p>
    <p>Products are covered by their manufacturer's warranty, as stated on each product page (for example, 25-year panel power warranties or 10-year battery warranties). ${esc(S.brand)} provides the warranty documentation with your order and helps file claims with the manufacturer.</p>
    <h2>Within 30 days</h2><p>If a product is defective within 30 days of delivery, contact us and we will replace or refund it directly.</p>
    <h2>After 30 days</h2><p>Contact us with your order reference, serial number and a description or photo of the issue. We will open a manufacturer claim on your behalf.</p>
    <h2>What warranties don't cover</h2><ul><li>Damage from improper installation, misuse, or unpermitted modifications</li><li>Physical damage after delivery, fire, flood, or acts of nature</li><li>Normal wear and cosmetic changes that don't affect performance</li></ul></div>`,
  terms: () => `<div class="wrap doc"><span class="eyebrow">Legal</span><h1>Terms of Sale</h1><p class="muted">${updated}</p>
    <p>These terms apply to all purchases from ${esc(S.brand)}, operated by ${esc(S.legalName)} ("we", "us"). By placing an order you agree to these terms.</p>
    <h2>1. Eligibility</h2><p>You must be at least 18 years old and ship to an address in the contiguous United States. Trade pricing is available only to approved licensed contractors.</p>
    <h2>2. Prices and payment</h2><p>All prices are in US dollars and exclude sales tax, which is added where required by law. Online card payment is not active on this website. We confirm the payment method and final amount before accepting an order.</p>
    <h2>3. Order acceptance</h2><p>An order is accepted when we send a shipping confirmation. We may cancel an order because of a pricing error, stock unavailability, failed verification or suspected fraud; if we do, you receive a full refund of any amount charged.</p>
    <h2>4. Shipping, returns and warranty</h2><p>Delivery, returns, refunds and warranties are governed by our <a href="#/shipping">Shipping Policy</a>, <a href="#/returns">Return &amp; Refund Policy</a> and <a href="#/warranty">Warranty</a>, which form part of these terms.</p>
    <h2>5. Installation and safety</h2><p>Solar and battery equipment can be dangerous if installed incorrectly. You are responsible for installing equipment in line with the manufacturer's instructions, the National Electrical Code, local codes, permits and utility interconnection rules. We recommend installation by a licensed contractor. We do not provide installation services.</p>
    <h2>6. Product information</h2><p>We aim to describe products accurately. Specifications come from the manufacturer and may change. Images are representative. If a product differs materially from its description, you may return it under our Return Policy.</p>
    <h2>7. Limitation of liability</h2><p>To the extent permitted by law, our liability for any claim relating to a product is limited to the amount you paid for that product. We are not liable for indirect or consequential damages, including lost energy production or savings.</p>
    <h2>8. Disputes</h2><p>Please contact us first so we can resolve any issue. These terms are governed by the laws of the State of ${esc(S.governingState)}, and disputes are subject to the courts of ${esc(S.governingCounty)}, ${esc(S.governingState)}.</p>
    <h2>9. Contact</h2>${idBox()}</div>`,
  privacy: () => `<div class="wrap doc"><span class="eyebrow">Legal</span><h1>Privacy Policy</h1><p class="muted">${updated}</p>
    <h2>Information we collect</h2><ul><li><b>Order information:</b> name, email, phone, shipping and billing address, company and order details.</li><li><b>Payment information:</b> not collected on this website. Payment arrangements are confirmed separately before an order is accepted.</li><li><b>Installer applications:</b> company, license and contact details.</li><li><b>Site usage:</b> basic device and browsing data through cookies, and your cart contents stored in your browser.</li></ul>
    <h2>How we use it</h2><p>To respond to order requests, process confirmed orders, verify trade accounts, prevent fraud, answer questions, meet tax and legal obligations, and, if you opt in, send product updates.</p>
    <h2>Sharing</h2><p>We share information only with service providers who help us run the store (shipping carriers, email and hosting providers) and when required by law. We do not sell your personal information.</p>
    <h2>Your choices</h2><p>You may request access to, correction of, or deletion of personal information you have sent us by emailing ${esc(S.email)}. You may unsubscribe from marketing email at any time.</p>
    <h2>Security and retention</h2><p>We use encryption in transit (HTTPS) and limit access to personal data. Order records are kept as long as required for tax and accounting purposes.</p>
    <h2>Children</h2><p>This site is not intended for anyone under 18.</p>
    <h2>Contact</h2>${idBox()}</div>`,
};
function bindContact() {
  const f = $('#cf'); if (!f) return;
  f.addEventListener('submit', e => {
    e.preventDefault();
    const bad = [...f.elements].filter(x => x.required && (!x.value.trim() || !x.validity.valid));
    if (bad.length) { $('#cErr').textContent = 'Please complete all fields.'; bad[0].focus(); return; }
    const body = [...new FormData(f).entries()].map(([k, v]) => `${k}: ${v}`).join('\n');
    prepareRequest('Solar Edge LLC customer message', body, $('#cErr'));
  });
}
function notFound() { return `<div class="wrap"><div class="ok"><h1 style="font-size:var(--text-xl)">Page not found</h1><div><a href="#/" class="btn d">Go home</a></div></div></div>`; }

// ---------- router ----------
function route() {
  const h = (location.hash || '#/').slice(2).split('/');
  const [r, a] = h; let html;
  if (!r) html = home();
  else if (r === 'shop') { if (!a) F.cat = 'all'; html = shop(a && catOf(a) ? a : null); }
  else if (r === 'p') html = pdp(a);
  else if (r === 'checkout') html = checkout();
  else if (r === 'trade') html = trade();
  else if (pages[r]) html = pages[r]();
  else html = notFound();
  app.innerHTML = html;
  bindShop(); bindPdp(); bindCheckout(); bindTrade(); bindContact();
  document.querySelectorAll('nav.main a').forEach(x => x.classList.toggle('on', x.dataset.r === r));
  $('#nav').classList.remove('open');
}
let lastHash = location.hash;
window.addEventListener('hashchange', () => { route(); if (location.hash !== lastHash) scrollTo(0, 0); lastHash = location.hash; });

// static chrome
$('#tb-contact').textContent = `${S.phone} · ${S.email}`;
$('#ft-id').innerHTML = `${esc(S.legalName)}<br>${esc(S.address)}<br>${esc(S.phone)} · ${esc(S.email)}`;
$('#ft-cats').innerHTML = C.map(c => `<a href="#/shop/${c.id}">${c.name}</a>`).join('');
$('#ft-copy').textContent = `© 2026 ${S.legalName}`;
if (!store.get('ts_cookie', false)) {
  const b = document.createElement('div'); b.className = 'cookie';
  b.innerHTML = `<span>We use essential cookies to keep your cart and preferences during your visit. See our <a href="#/privacy">Privacy Policy</a>.</span><button class="btn d" style="padding:8px 14px">OK</button>`;
  b.querySelector('button').onclick = () => { store.set('ts_cookie', true); b.remove(); };
  document.body.appendChild(b);
}
document.querySelectorAll('.mode button').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
renderCart(); route();
})();

