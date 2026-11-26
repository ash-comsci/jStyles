/* ════════════════════════════════════════════════════════════
   jStyles storefront — script.js
   • Renders collections + product catalog
   • Product sheet (colour / size / option / qty), cart drawer
   • Sends orders and custom requests to the Google Apps Script
     web app as JSON (Content-Type text/plain, so no CORS preflight)
   ════════════════════════════════════════════════════════════ */
'use strict';

/* ────────────────────────────────────────────────────────────
   1. SETTINGS — the only block you normally need to edit
   ──────────────────────────────────────────────────────────── */
const CONFIG = {
  // Deploy Code.gs as a Web app (Execute as: Me · Access: Anyone),
  // then paste the URL that ends in /exec here.
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzEgeWhbHnwxlhiKhf9udiKCMOTPfBuOHpd9tcresVmiNnU0DaksWyzfS6GzyzVSyFf3w/exec',

  // Ask the Apps Script for live prices / stock / sold-out flags on page load.
  // Turn off if you don't use the Products sheet.
  SYNC_CATALOG: true,

  IMAGE_BASE: 'images/web/',
  CONTACT_EMAIL: 'jstyles.pro@gmail.com',
  CONTACT_SMS: '+16132986301',
  PAYMENT_EMAIL: 'jstyles.pro@gmail.com',
  CURRENCY: 'CAD',
  MAX_QTY_PER_LINE: 25,
  REQUEST_TIMEOUT_MS: 45000,
  STORAGE_KEY: 'jstyles_cart_v1'
};

/* ────────────────────────────────────────────────────────────
   2. CATALOG
   collection → must match an id in COLLECTIONS
   type       → hoodie | tee | hat | bottoms | tank (drives the filter chips)
   colors     → optional; each colour can swap the product image
   sizes      → array of { title, sizes[] } groups
   option     → optional extra choice, e.g. logo size
   status     → 'closed' hides the add button and shows "Drop closed"
   ──────────────────────────────────────────────────────────── */
// page  → the order page for this collection (all three use the same layout)
// note  → optional message shown under the page banner
const COLLECTIONS = [
  { id: 'fan-gear', page: 'wos.html', name: 'WOS Fan Gear', eyebrow: 'West Ottawa Soccer',
    blurb: 'Official club fan gear: hoodies, tees, tanks, sweats and caps.', image: 'wos_logo.webp', accent: '#e11919' },
  { id: 'tournament', page: 'tournament.html', name: 'Tournament Merch', eyebrow: 'Event drops',
    blurb: 'Limited-run merch from the tournaments we kit out.', image: '613.webp', accent: '#8fd3ff' },
  { id: 'aiden-army', page: 'aiden-army.html', name: "Aiden's Army", eyebrow: 'Fundraiser',
    blurb: 'Fundraiser apparel. Wear it and show your support.', image: 'aiden.webp', accent: '#2fd27a',
    note: 'Thank you for supporting Aiden’s Army 💚 Please include “Aiden’s Army” and your name in your e-transfer message.' }
];

const TYPES = [
  { id: 'all', label: 'All gear' },
  { id: 'hoodie', label: 'Hoodies' },
  { id: 'tee', label: 'Tees & tops' },
  { id: 'hat', label: 'Hats' },
  { id: 'bottoms', label: 'Bottoms' }
];

const SIZES = {
  youth: ['Youth S', 'Youth M', 'Youth L', 'Youth XL'],
  adult: ['Adult XS', 'Adult S', 'Adult M', 'Adult L', 'Adult XL', 'Adult XXL', 'Adult XXXL'],
  youthAiden: ['Youth XS', 'Youth S', 'Youth M', 'Youth L', 'Youth XL'],
  adultAiden: ['Adult XS', 'Adult S', 'Adult M', 'Adult L', 'Adult XL']
};
const YOUTH_ADULT = [{ title: 'Youth', sizes: SIZES.youth }, { title: 'Adult', sizes: SIZES.adult }];
const ONE_SIZE = [{ title: 'One size', sizes: ['One Size'] }];
const BLACK = '#111111';
const WHITE = '#f2f2f2';
const LOGO_OPTION = { label: 'Logo size', values: ['Large Logo', 'Small Logo'] };

const PRODUCTS = [
  // ── WOS Fan Gear ─────────────────────────────
  { id: 'wos-hoodie', name: 'Elite Sideline Hoodie', collection: 'fan-gear', type: 'hoodie', price: 60, featured: true,
    image: 'black_hoodie.webp', sizes: YOUTH_ADULT, sizeChart: 'sizing_chart.webp',
    desc: 'Heavyweight pullover hoodie with the West Ottawa crest. Built for cold sidelines and colder streets.' },
  { id: 'wos-quarter-zip', name: 'Sideline Quarter Zip', collection: 'fan-gear', type: 'hoodie', price: 55, badge: 'New',
    image: 'black_quarter_zip.webp', sizes: YOUTH_ADULT, sizeChart: 'sizing_chart.webp',
    desc: 'Fleece 1/4-zip pullover with a tonal West Ottawa crest, stand-up collar and ribbed cuffs. Easy layer for the sideline.' },
  { id: 'wos-tee', name: 'Sideline Tee', collection: 'fan-gear', type: 'tee', price: 30,
    image: 'sideline_TEE.webp', sizes: YOUTH_ADULT, sizeChart: 'sizing_chart_tee.webp',
    desc: 'Everyday cotton tee with a tonal club crest. Clean enough for anywhere.' },
  { id: 'wos-long-sleeve', name: 'Long Sleeve', collection: 'fan-gear', type: 'tee', price: 25,
    image: 'black_long.webp', sizes: YOUTH_ADULT, sizeChart: 'sizing_chart_tee.webp',
    desc: 'Long sleeve layer for early-season games and late-night training.' },
  { id: 'wos-womens-tank', name: "Women's Tank Top", collection: 'fan-gear', type: 'tee', price: 25,
    image: 'black_Tank.webp', sizes: YOUTH_ADULT,
    desc: 'Lightweight tank for summer tournaments and warm-ups.' },
  { id: 'wos-mens-tank', name: "Men's Tank Top", collection: 'fan-gear', type: 'tee', price: 25,
    image: 'black_Tank.webp', sizes: YOUTH_ADULT,
    desc: 'Breathable tank with the club crest — gym, pitch or patio.' },
  { id: 'wos-sweats', name: 'Sideline Sweats', collection: 'fan-gear', type: 'bottoms', price: 30,
    image: 'black_sweats.webp', sizes: YOUTH_ADULT,
    desc: 'Comfortable fleece joggers to match the hoodie.' },
  { id: 'wos-cap', name: 'Ball Cap', collection: 'fan-gear', type: 'hat', price: 25,
    image: 'black_hat.webp', sizes: ONE_SIZE,
    desc: 'Structured cap with a tonal crest. Adjustable, one size fits most.' },

  // ── Aiden's Army ─────────────────────────────
  { id: 'aa-hoodie', name: "Aiden's Army Hoodie", collection: 'aiden-army', type: 'hoodie', price: 60, featured: true,
    image: 'aiden_hoodie.webp',
    sizes: [{ title: 'Youth', sizes: SIZES.youthAiden }, { title: 'Adult', sizes: SIZES.adultAiden }],
    desc: 'A warm, comfortable green hoodie made to show your support for Aiden’s Army.' },
  { id: 'aa-tee', name: "Aiden's Army Tee", collection: 'aiden-army', type: 'tee', price: 25,
    image: 'aiden_tee.webp',
    sizes: [{ title: 'Youth', sizes: SIZES.youthAiden }, { title: 'Adult', sizes: SIZES.adultAiden }],
    desc: 'A lightweight kelly green tee for friends, family, teammates and supporters.' },
  { id: 'aa-cap', name: "Aiden's Army Ball Cap", collection: 'aiden-army', type: 'hat', price: 25,
    image: 'aiden_cap.webp', sizes: ONE_SIZE,
    desc: 'Evergreen ball cap with a one-size fit and a whole lot of support behind it.' },
  { id: 'aa-fitted', name: "Aiden's Army Fitted Hat", collection: 'aiden-army', type: 'hat', price: 30,
    image: 'aiden_black_fitted_hat.webp', sizes: [{ title: 'Fitted', sizes: ['S/M', 'L/XL'] }],
    desc: 'Clean black fitted hat made to show your support for Aiden’s Army.' },

  // ── Tournament Drops ─────────────────────────
  { id: 'grind-hoodie', name: 'The Grind Hoodie', collection: 'tournament', type: 'hoodie', price: 60, featured: true, badge: 'New',
    colors: [{ name: 'Black', hex: BLACK, image: 'grind_black.webp' }, { name: 'White', hex: WHITE, image: 'grind_white.webp' }],
    sizes: YOUTH_ADULT, sizeChart: 'sizing_chart.webp',
    desc: 'Official tournament hoodie with the full-colour Grind skyline crest.' },
  { id: '613-hoodie', name: '613 Showdown Hoodie', collection: 'tournament', type: 'hoodie', price: 60, featured: true, badge: 'New',
    colors: [{ name: 'Black', hex: BLACK, image: '613_black.webp' }, { name: 'White', hex: WHITE, image: '613_white.webp' }],
    sizes: YOUTH_ADULT, sizeChart: 'sizing_chart.webp',
    desc: 'Rep the 613. Official 613 Showdown hoodie with the Ottawa skyline shield.' },
  { id: 'wc-hoodie', name: 'Warrior Classic Hoodie', collection: 'tournament', type: 'hoodie', price: 60, status: 'closed',
    colors: [{ name: 'Black', hex: BLACK, image: 'warrior_black_large.webp' }, { name: 'White', hex: WHITE, image: 'warrior_white_large.webp' }],
    option: LOGO_OPTION, sizes: YOUTH_ADULT, sizeChart: 'sizing_chart.webp',
    desc: 'Gold-crest Warrior Classic hoodie. Pick a large or small logo print.' },
  { id: 'wc-tee', name: 'Warrior Classic Tee', collection: 'tournament', type: 'tee', price: 25, status: 'closed',
    colors: [{ name: 'Black', hex: BLACK, image: 'wc_tee_black_large.webp' }, { name: 'White', hex: WHITE, image: 'wc_tee_white_large.webp' }],
    option: LOGO_OPTION, sizes: YOUTH_ADULT, sizeChart: 'sizing_chart_tee.webp',
    desc: 'Warrior Classic tournament tee with the gold crest.' }
];

/* ────────────────────────────────────────────────────────────
   3. STATE + helpers
   ──────────────────────────────────────────────────────────── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Which page are we on? Set by <body data-page="…" data-collection="…">
const PAGE = document.body.dataset.page || 'home';
const PAGE_COLLECTION = document.body.dataset.collection || '';
const CART_KEY = CONFIG.STORAGE_KEY + '_' + (PAGE_COLLECTION || 'home');   // one bag per store

const state = {
  filter: { type: 'all' },
  cart: [],               // loaded on DOMContentLoaded
  pd: null,               // product sheet selection
  pendingOrder: null,     // keeps the same order id when retrying
  submitting: false,
  lastFocus: null
};

const money = n => '$' + (Math.round(n * 100) / 100).toFixed(Number.isInteger(n) ? 0 : 2);
const img = file => CONFIG.IMAGE_BASE + file;
const productById = id => PRODUCTS.find(p => p.id === id);
const collectionById = id => COLLECTIONS.find(c => c.id === id);
const isAvailable = p => p.status !== 'closed' && p.active !== false && !(typeof p.stock === 'number' && p.stock <= 0);
const lineKey = l => [l.productId, l.color, l.size, l.option].join('|');
const isWebAppUrl = url => /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(String(url).trim());

function escapeHTML(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function makeId(prefix) {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(2, 12);
  const rand = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 5).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter(l => productById(l.productId)?.collection === PAGE_COLLECTION && l.qty > 0) : [];
  } catch { return []; }
}
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch { /* private mode */ }
}

function cartTotals() {
  return state.cart.reduce((t, l) => {
    const p = productById(l.productId);
    t.count += l.qty;
    t.total += l.qty * (p ? p.price : 0);
    return t;
  }, { count: 0, total: 0 });
}

function toast(message, isError = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : '');
  el.textContent = message;
  $('#toastStack').appendChild(el);
  setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 260); }, isError ? 5000 : 2600);
}

/* ────────────────────────────────────────────────────────────
   4. RENDER: collections, filters, products
   ──────────────────────────────────────────────────────────── */
function collectionCard(c) {
  const count = PRODUCTS.filter(p => p.collection === c.id && isAvailable(p)).length;
  return `
    <a class="collection-card" href="${c.page}" style="--accent:${c.accent}">
      <img src="${img(c.image)}" alt="" loading="lazy" width="300" height="300" />
      <span class="collection-copy">
        <span class="collection-eyebrow">${escapeHTML(c.eyebrow)}</span>
        <h3>${escapeHTML(c.name)}</h3>
        <p>${count} item${count === 1 ? '' : 's'} available</p>
        <span class="go">Shop now →</span>
      </span>
    </a>`;
}

const CUSTOM_CARD = `
    <a class="collection-card custom-card" href="index.html#custom" style="--accent:#8fd3ff">
      <span class="custom-mark" aria-hidden="true">JS</span>
      <span class="collection-copy">
        <span class="collection-eyebrow">Made for you</span>
        <h3>Custom Merch</h3>
        <p>Your team, your design</p>
        <span class="go">Start custom →</span>
      </span>
    </a>`;

function renderHome() {
  $('#collectionGrid').innerHTML = COLLECTIONS.map(collectionCard).join('') + CUSTOM_CARD;
}

function renderCollectionPage() {
  const c = collectionById(PAGE_COLLECTION);
  if (!c) return;
  document.body.style.setProperty('--accent', c.accent);
  $('#bannerLogo').src = img(c.image);
  $('#bannerEyebrow').textContent = c.eyebrow;
  $('#pageTitle').textContent = c.name;
  $('#bannerBlurb').textContent = c.blurb;
  if (c.note) { $('#bannerNote').textContent = c.note; $('#bannerNote').hidden = false; }
  $('#otherCollections').innerHTML = COLLECTIONS.filter(x => x.id !== c.id).map(collectionCard).join('') + CUSTOM_CARD;
}

function renderChips() {
  // Only show the type chips this store actually has
  const types = TYPES.filter(t => t.id === 'all' || PRODUCTS.some(p => p.collection === PAGE_COLLECTION && p.type === t.id));
  $('#typeChips').innerHTML = types.length > 2 ? types.map(t =>
    `<button class="chip" type="button" data-type="${t.id}" aria-pressed="${state.filter.type === t.id}">${escapeHTML(t.label)}</button>`).join('') : '';
}

function setFilter(partial) {
  Object.assign(state.filter, partial);
  $$('#typeChips .chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.type === state.filter.type));
  renderProducts();
}

function productImage(p, colorName) {
  const color = p.colors && (p.colors.find(c => c.name === colorName) || p.colors[0]);
  return img(color ? color.image : p.image);
}

function renderProducts() {
  const { type } = state.filter;
  const list = PRODUCTS
    .filter(p => p.collection === PAGE_COLLECTION && (type === 'all' || p.type === type))
    .sort((a, b) => (isAvailable(b) - isAvailable(a)) || ((b.featured ? 1 : 0) - (a.featured ? 1 : 0)));

  $('#productGrid').innerHTML = list.map((p, i) => {
    const available = isAvailable(p);
    const lowStock = typeof p.stock === 'number' && p.stock > 0 && p.stock <= 5;
    const badge = !available
      ? `<span class="badge out">${p.status === 'closed' ? 'Drop closed' : 'Sold out'}</span>`
      : lowStock ? `<span class="badge">Only ${p.stock} left</span>`
      : p.badge ? `<span class="badge">${escapeHTML(p.badge)}</span>` : '';
    const dots = p.colors ? `<span class="dots" aria-label="${p.colors.length} colours">${p.colors.map(c => `<i style="background:${c.hex}"></i>`).join('')}</span>` : '';
    return `
      <article class="product-card${available ? '' : ' is-out'}" style="animation-delay:${Math.min(i, 8) * 40}ms">
        <button class="media" type="button" data-open="${p.id}" aria-label="View ${escapeHTML(p.name)}">
          <img src="${productImage(p)}" alt="${escapeHTML(p.name)}" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async" width="400" height="500" />
          ${badge}
        </button>
        <div class="body">
          <h3>${escapeHTML(p.name)}</h3>
          <p class="meta">${p.colors ? p.colors.length + ' colours · ' : ''}${escapeHTML(p.sizes.map(g => g.title).join(' + '))}</p>
          <div class="row">
            <span class="price">${money(p.price)}</span>
            ${dots}
            <button class="quick-add" type="button" data-quick="${p.id}" ${available ? '' : 'disabled'} aria-label="Add ${escapeHTML(p.name)} to bag">${available ? 'Add +' : 'Closed'}</button>
          </div>
        </div>
      </article>`;
  }).join('');

  $('#emptyState').hidden = list.length > 0;
  $('#resultCount').textContent = `${list.length} item${list.length === 1 ? '' : 's'}`;
}

/* ────────────────────────────────────────────────────────────
   5. PRODUCT SHEET
   ──────────────────────────────────────────────────────────── */
function openProduct(id) {
  const p = productById(id);
  if (!p) return;
  const onlySize = p.sizes.length === 1 && p.sizes[0].sizes.length === 1 ? p.sizes[0].sizes[0] : null;
  state.pd = {
    product: p,
    color: p.colors ? p.colors[0].name : '',
    option: p.option ? p.option.values[0] : '',
    size: onlySize || '',
    qty: 1
  };

  const col = collectionById(p.collection);
  $('#pdName').textContent = p.name;
  $('#pdPrice').textContent = money(p.price);
  $('#pdDesc').textContent = p.desc || '';
  $('#pdCollection').textContent = col ? col.name : '';
  $('#pdSizeError').hidden = true;
  $('#pdSizeChartBtn').hidden = !p.sizeChart;

  // Colours
  $('#pdColorBlock').hidden = !p.colors;
  $('#pdColors').innerHTML = (p.colors || []).map(c =>
    `<button class="swatch" type="button" role="radio" data-color="${escapeHTML(c.name)}" style="--sw:${c.hex}" aria-label="${escapeHTML(c.name)}"></button>`).join('');

  // Extra option (e.g. logo size)
  $('#pdOptionBlock').hidden = !p.option;
  if (p.option) {
    $('#pdOptionLabel').textContent = p.option.label;
    $('#pdOptions').setAttribute('aria-label', p.option.label);
    $('#pdOptions').innerHTML = p.option.values.map(v =>
      `<button class="size-btn" type="button" role="radio" data-option="${escapeHTML(v)}">${escapeHTML(v)}</button>`).join('');
  }

  // Sizes, grouped (Youth / Adult …)
  $('#pdSizes').innerHTML = p.sizes.map(g => `
    ${p.sizes.length > 1 ? `<p class="opt-group-title">${escapeHTML(g.title)}</p>` : ''}
    <div class="size-grid" role="radiogroup" aria-label="${escapeHTML(g.title)} sizes">
      ${g.sizes.map(s => `<button class="size-btn" type="button" role="radio" data-size="${escapeHTML(s)}">${escapeHTML(s.replace(/^(Youth|Adult) /, ''))}</button>`).join('')}
    </div>`).join('');

  const available = isAvailable(p);
  const add = $('#pdAddBtn');
  add.disabled = !available;
  add.textContent = available ? 'Add to bag' : (p.status === 'closed' ? 'Drop closed' : 'Sold out');
  const stockEl = $('#pdStock');
  stockEl.hidden = !(typeof p.stock === 'number' && p.stock > 0 && p.stock <= 5);
  stockEl.textContent = `Hurry — only ${p.stock} left.`;

  syncProductSheet();
  const dlg = $('#productDialog');
  state.lastFocus = document.activeElement;
  dlg.showModal();
  dlg.scrollTop = 0;
}

function syncProductSheet() {
  const s = state.pd;
  if (!s) return;
  const p = s.product;
  const image = productImage(p, s.color);
  $('#pdImage').src = image;
  $('#pdImage').alt = `${p.name}${s.color ? ' — ' + s.color : ''}`;
  $('#pdColorName').textContent = s.color;
  $$('#pdColors .swatch').forEach(b => b.setAttribute('aria-checked', b.dataset.color === s.color));
  $$('#pdOptions .size-btn').forEach(b => b.setAttribute('aria-checked', b.dataset.option === s.option));
  $$('#pdSizes .size-btn').forEach(b => b.setAttribute('aria-checked', b.dataset.size === s.size));
  $('#pdQty').textContent = s.qty;
  const subtotal = p.price * s.qty;
  if (isAvailable(p)) $('#pdAddBtn').textContent = `Add to bag · ${money(subtotal)}`;
}

function addToCart({ productId, color = '', size, option = '', qty = 1 }) {
  const p = productById(productId);
  if (!p || !isAvailable(p)) return false;
  const line = { productId, color, size, option, qty };
  const existing = state.cart.find(l => lineKey(l) === lineKey(line));
  const cap = Math.min(CONFIG.MAX_QTY_PER_LINE, typeof p.stock === 'number' ? p.stock : Infinity);
  if (existing) existing.qty = Math.min(cap, existing.qty + qty);
  else state.cart.push({ ...line, qty: Math.min(cap, qty) });
  state.pendingOrder = null;
  saveCart();
  renderCart(true);
  return true;
}

function bindProductSheet() {
  const dlg = $('#productDialog');

  $('#productGrid').addEventListener('click', e => {
    const open = e.target.closest('[data-open]');
    const quick = e.target.closest('[data-quick]');
    if (open) openProduct(open.dataset.open);
    if (quick) {
      const p = productById(quick.dataset.quick);
      const single = !p.colors && !p.option && p.sizes.length === 1 && p.sizes[0].sizes.length === 1;
      if (single) {
        addToCart({ productId: p.id, size: p.sizes[0].sizes[0] });
        toast(`✓ ${p.name} added to your bag`);
      } else {
        openProduct(p.id);
      }
    }
  });

  $('#pdColors').addEventListener('click', e => {
    const b = e.target.closest('[data-color]'); if (!b) return;
    state.pd.color = b.dataset.color; syncProductSheet();
  });
  $('#pdOptions').addEventListener('click', e => {
    const b = e.target.closest('[data-option]'); if (!b) return;
    state.pd.option = b.dataset.option; syncProductSheet();
  });
  $('#pdSizes').addEventListener('click', e => {
    const b = e.target.closest('[data-size]'); if (!b) return;
    state.pd.size = b.dataset.size; $('#pdSizeError').hidden = true; syncProductSheet();
  });
  $('#pdQtyMinus').addEventListener('click', () => { state.pd.qty = Math.max(1, state.pd.qty - 1); syncProductSheet(); });
  $('#pdQtyPlus').addEventListener('click', () => {
    const p = state.pd.product;
    const cap = Math.min(CONFIG.MAX_QTY_PER_LINE, typeof p.stock === 'number' ? p.stock : Infinity);
    state.pd.qty = Math.min(cap, state.pd.qty + 1); syncProductSheet();
  });

  $('#pdAddBtn').addEventListener('click', () => {
    const s = state.pd;
    if (!s.size) {
      $('#pdSizeError').hidden = false;
      $('#pdSizes .size-btn')?.focus();
      return;
    }
    if (addToCart({ productId: s.product.id, color: s.color, size: s.size, option: s.option, qty: s.qty })) {
      dlg.close();
      toast(`✓ ${s.product.name} added to your bag`);
    }
  });

  $('#pdSizeChartBtn').addEventListener('click', () => {
    const p = state.pd?.product;
    if (!p?.sizeChart) return;
    $('#chartImage').src = img(p.sizeChart);
    $('#chartDialog').showModal();
  });

  // Close a dialog by tapping its backdrop
  $$('dialog.sheet').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));
  dlg.addEventListener('close', () => state.lastFocus?.focus?.());
}

/* ────────────────────────────────────────────────────────────
   6. CART DRAWER
   ──────────────────────────────────────────────────────────── */
function renderCart(bump = false) {
  const { count, total } = cartTotals();

  const badge = $('#cartCount');
  badge.textContent = count;
  badge.classList.toggle('show', count > 0);
  if (bump && count > 0) { badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump'); }
  $('#cartOpenBtn').setAttribute('aria-label', `Open bag, ${count} item${count === 1 ? '' : 's'}`);

  const bar = $('#mobileCartBar');
  bar.hidden = count === 0 || $('#cartDrawer').classList.contains('open');
  $('#mobileCartCount').textContent = count;
  $('#mobileCartTotal').textContent = money(total);

  $('#cartEmpty').hidden = count > 0;
  $('#bagFoot').hidden = count === 0;
  $('#cartSubtotal').textContent = money(total);
  $('#checkoutTotal').textContent = money(total);
  $('#checkoutCountLabel').textContent = `${count} item${count === 1 ? '' : 's'} · total`;

  $('#cartList').innerHTML = state.cart.map((l, i) => {
    const p = productById(l.productId);
    const variant = [l.color, l.size, l.option].filter(Boolean).join(' · ');
    return `
      <li class="cart-item">
        <img src="${productImage(p, l.color)}" alt="" loading="lazy" />
        <div>
          <h3>${escapeHTML(p.name)}</h3>
          <p class="variant">${escapeHTML(variant)}</p>
          <div class="line">
            <div class="stepper small" aria-label="Quantity for ${escapeHTML(p.name)}">
              <button type="button" data-dec="${i}" aria-label="Decrease">−</button>
              <output>${l.qty}</output>
              <button type="button" data-inc="${i}" aria-label="Increase">+</button>
            </div>
            <span class="line-price">${money(p.price * l.qty)}</span>
          </div>
          <button class="remove" type="button" data-remove="${i}">Remove</button>
        </div>
      </li>`;
  }).join('');
}

function setDrawerView(view) {
  $('#viewBag').hidden = view !== 'bag';
  $('#viewCheckout').hidden = view !== 'checkout';
  $('#viewSuccess').hidden = view !== 'success';
  $('#cartTitle').textContent = view === 'checkout' ? 'Checkout' : view === 'success' ? 'Thank you' : 'Your bag';
}

function openCart(view = 'bag') {
  const drawer = $('#cartDrawer');
  state.lastFocus = document.activeElement;
  setDrawerView(view);
  drawer.removeAttribute('inert');
  drawer.setAttribute('aria-hidden', 'false');
  drawer.classList.add('open');
  $('#drawerBackdrop').hidden = false;
  document.body.classList.add('no-scroll');
  $('#cartOpenBtn').setAttribute('aria-expanded', 'true');
  $('#mobileCartBar').hidden = true;
  setTimeout(() => $('#cartCloseBtn').focus(), 50);
}

function closeCart() {
  const drawer = $('#cartDrawer');
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  drawer.setAttribute('inert', '');
  $('#drawerBackdrop').hidden = true;
  document.body.classList.remove('no-scroll');
  $('#cartOpenBtn').setAttribute('aria-expanded', 'false');
  renderCart();
  state.lastFocus?.focus?.();
}

function bindCart() {
  $('#cartOpenBtn').addEventListener('click', () => openCart());
  $('#mobileCartBar').addEventListener('click', () => openCart());
  $('#cartCloseBtn').addEventListener('click', closeCart);
  $('#drawerBackdrop').addEventListener('click', closeCart);
  $$('[data-close-cart]').forEach(el => el.addEventListener('click', () => {
    if ($('#viewSuccess').hidden === false) setDrawerView('bag');
    closeCart();
  }));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('#cartDrawer').classList.contains('open')) closeCart();
  });

  $('#cartList').addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    const i = Number(t.dataset.inc ?? t.dataset.dec ?? t.dataset.remove);
    const line = state.cart[i]; if (!line) return;
    const p = productById(line.productId);
    const cap = Math.min(CONFIG.MAX_QTY_PER_LINE, typeof p.stock === 'number' ? p.stock : Infinity);
    if ('inc' in t.dataset) line.qty = Math.min(cap, line.qty + 1);
    if ('dec' in t.dataset) line.qty -= 1;
    if ('remove' in t.dataset || line.qty <= 0) state.cart.splice(i, 1);
    state.pendingOrder = null;
    saveCart();
    renderCart();
  });

  $('#toCheckoutBtn').addEventListener('click', () => {
    if (!state.cart.length) return;
    setDrawerView('checkout');
    $('#viewCheckout input[name="firstName"]').focus();
  });
  $('#backToBagBtn').addEventListener('click', () => setDrawerView('bag'));
  $('#viewCheckout').addEventListener('submit', submitOrder);
}

/* ────────────────────────────────────────────────────────────
   7. APPS SCRIPT CONNECTION
   ──────────────────────────────────────────────────────────── */
async function postToAppsScript(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);
  try {
    // text/plain keeps this a "simple" request, so the browser skips the
    // CORS preflight that Apps Script can't answer.
    const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal
    });
    if (!res.ok) throw new Error('The order service is unavailable right now.');
    let data;
    try { data = await res.json(); }
    catch { throw new Error('The order service sent an unexpected reply. Check the Apps Script deployment access is set to "Anyone".'); }
    if (!data.ok) throw new Error(data.message || 'The request could not be completed.');
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The request timed out — it may still have gone through. Check your email before trying again.');
    if (err instanceof TypeError) throw new Error('Could not reach the order service. Check your connection and try again.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function syncCatalog() {
  if (!CONFIG.SYNC_CATALOG || !isWebAppUrl(CONFIG.APPS_SCRIPT_URL)) return;
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10000);
    const res = await fetch(CONFIG.APPS_SCRIPT_URL + '?action=catalog', { signal: controller.signal });
    const data = await res.json();
    if (!data.ok || !data.products) return;
    let changed = false;
    PRODUCTS.forEach(p => {
      const live = data.products[p.id];
      if (!live) return;
      if (typeof live.price === 'number' && live.price > 0 && live.price !== p.price) { p.price = live.price; changed = true; }
      if (typeof live.stock === 'number' && live.stock !== p.stock) { p.stock = live.stock; changed = true; }
      if (live.active === false && p.active !== false) { p.active = false; changed = true; }
    });
    if (changed) { renderProducts(); renderCart(); }
  } catch (err) {
    console.info('Live catalog not loaded; using built-in prices.', err);
  }
}

/* ────────────────────────────────────────────────────────────
   8. CHECKOUT
   ──────────────────────────────────────────────────────────── */
function validateForm(form) {
  let firstBad = null;
  $$('input[required], textarea[required]', form).forEach(el => {
    const bad = !el.value.trim() || (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim()));
    el.setAttribute('aria-invalid', bad);
    if (bad && !firstBad) firstBad = el;
  });
  if (firstBad) firstBad.focus();
  return !firstBad;
}

function showStatus(el, message, type = 'error') {
  el.className = `form-status ${type}`;
  el.innerHTML = message;
  el.hidden = false;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function buildOrderPayload(form) {
  const f = new FormData(form);
  const items = state.cart.map(l => {
    const p = productById(l.productId);
    return {
      productId: p.id,
      productName: p.name,
      collection: collectionById(p.collection)?.name || p.collection,
      color: l.color,
      size: l.size,
      option: l.option,
      qty: l.qty,
      unitPrice: p.price,
      subtotal: p.price * l.qty
    };
  });
  const { count, total } = cartTotals();
  return {
    type: 'order',
    source: 'jstyles-shop',
    orderPage: collectionById(PAGE_COLLECTION)?.name || 'jStyles Shop',
    submittedAt: new Date().toISOString(),
    currency: CONFIG.CURRENCY,
    customer: {
      firstName: f.get('firstName').trim(),
      lastName: f.get('lastName').trim(),
      email: f.get('email').trim().toLowerCase(),
      phone: f.get('phone').trim(),
      fulfillment: f.get('fulfillment'),
      notes: f.get('notes').trim()
    },
    items,
    totals: { count, merchandiseTotal: total, total }
  };
}

function mailtoFallback(payload) {
  const lines = payload.items.map(i => `• ${i.qty} × ${i.productName} (${[i.color, i.size, i.option].filter(Boolean).join(', ')}) — ${money(i.subtotal)}`);
  const body = `Hi jStyles,\n\nI'd like to order:\n${lines.join('\n')}\n\nTotal: ${money(payload.totals.total)}\n\nName: ${payload.customer.firstName} ${payload.customer.lastName}\nPhone: ${payload.customer.phone}\n${payload.customer.fulfillment}\nNotes: ${payload.customer.notes}`;
  return `mailto:${CONFIG.CONTACT_EMAIL}?subject=${encodeURIComponent('jStyles order')}&body=${encodeURIComponent(body)}`;
}

async function submitOrder(e) {
  e.preventDefault();
  if (state.submitting) return;
  const form = e.currentTarget;
  const status = $('#checkoutStatus');
  status.hidden = true;

  if (!state.cart.length) { setDrawerView('bag'); return; }
  if (!validateForm(form)) { showStatus(status, 'Please fill in the highlighted fields.'); return; }
  if (form.website.value) { setDrawerView('success'); return; } // honeypot: quietly ignore bots

  const payload = buildOrderPayload(form);

  if (!isWebAppUrl(CONFIG.APPS_SCRIPT_URL)) {
    showStatus(status, `Online checkout is being set up. <a href="${escapeHTML(mailtoFallback(payload))}">Email this order to jStyles</a> and we'll confirm it.`);
    return;
  }

  // Re-use the same order id if the customer retries the exact same order,
  // so the Apps Script can ignore duplicates.
  const fingerprint = JSON.stringify([payload.customer, payload.items]);
  if (!state.pendingOrder || state.pendingOrder.fingerprint !== fingerprint) {
    state.pendingOrder = { fingerprint, orderId: makeId('JS') };
  }
  payload.orderId = state.pendingOrder.orderId;

  const btn = $('#placeOrderBtn');
  state.submitting = true;
  btn.disabled = true;
  btn.textContent = 'Placing order…';

  try {
    const result = await postToAppsScript(payload);
    const total = typeof result.total === 'number' ? result.total : payload.totals.total;
    $('#successOrderId').textContent = result.orderId || payload.orderId;
    $('#successMessage').innerHTML =
      `A confirmation is on its way to <strong>${escapeHTML(payload.customer.email)}</strong>.<br /><br />` +
      `Please send <strong>${money(total)}</strong> by Interac e-transfer to <strong>${escapeHTML(CONFIG.PAYMENT_EMAIL)}</strong> and put your order number in the message.`;
    state.cart = [];
    state.pendingOrder = null;
    saveCart();
    renderCart();
    form.reset();
    setDrawerView('success');
  } catch (err) {
    console.error('Order error:', err);
    showStatus(status, `${escapeHTML(err.message)}<br />Your bag is saved. Reference: <strong>${escapeHTML(payload.orderId)}</strong>. Need help? <a href="${escapeHTML(mailtoFallback(payload))}">Email us</a>.`);
    toast('Order not sent — see details', true);
  } finally {
    state.submitting = false;
    btn.disabled = false;
    btn.textContent = 'Place order';
  }
}

/* ────────────────────────────────────────────────────────────
   9. CUSTOM MERCH REQUEST
   ──────────────────────────────────────────────────────────── */
function bindCustomForm() {
  const form = $('#customForm');
  const status = $('#customStatus');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.hidden = true;
    if (!validateForm(form)) { showStatus(status, 'Please fill in the highlighted fields.'); return; }
    if (form.website.value) { showStatus(status, 'Thanks! We got your request.', 'ok'); form.reset(); return; }

    const f = new FormData(form);
    const payload = {
      type: 'custom',
      source: 'jstyles-shop',
      requestId: makeId('CR'),
      submittedAt: new Date().toISOString(),
      name: f.get('name').trim(),
      email: f.get('email').trim().toLowerCase(),
      phone: f.get('phone').trim(),
      group: f.get('group').trim(),
      items: f.getAll('items'),
      quantity: f.get('quantity'),
      deadline: f.get('deadline'),
      details: f.get('details').trim()
    };

    if (!isWebAppUrl(CONFIG.APPS_SCRIPT_URL)) {
      const body = `Name: ${payload.name}\nGroup: ${payload.group}\nItems: ${payload.items.join(', ')}\nQuantity: ${payload.quantity}\nNeeded by: ${payload.deadline}\n\n${payload.details}`;
      location.href = `mailto:${CONFIG.CONTACT_EMAIL}?subject=${encodeURIComponent('Custom merch request')}&body=${encodeURIComponent(body)}`;
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const label = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      await postToAppsScript(payload);
      form.reset();
      showStatus(status, `<strong>Request sent!</strong> We'll be in touch at ${escapeHTML(payload.email)} soon.`, 'ok');
    } catch (err) {
      showStatus(status, `${escapeHTML(err.message)} You can also email <a href="mailto:${CONFIG.CONTACT_EMAIL}">${CONFIG.CONTACT_EMAIL}</a>.`);
    } finally {
      btn.disabled = false;
      btn.innerHTML = label;
    }
  });
}

/* ────────────────────────────────────────────────────────────
   10. HEADER, NAV, MISC
   ──────────────────────────────────────────────────────────── */
function bindChrome() {
  const header = $('#siteHeader');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger menu (only on layouts that have one)
  const menuBtn = $('#menuBtn');
  const nav = $('#mainNav');
  if (menuBtn && nav) {
    const setMenu = open => {
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open);
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }
  // Keep the current page's tab in view on scrolling tab bars
  nav?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });

  $('#typeChips')?.addEventListener('click', e => { const c = e.target.closest('[data-type]'); if (c) setFilter({ type: c.dataset.type }); });
  $$('[data-reset-filters]').forEach(b => b.addEventListener('click', () => setFilter({ type: 'all' })));

  $$('[data-contact="email"]').forEach(a => { a.href = `mailto:${CONFIG.CONTACT_EMAIL}`; });
  $$('[data-contact="sms"]').forEach(a => { a.href = `sms:${CONFIG.CONTACT_SMS}`; });
  if ($('#paymentNote')) $('#paymentNote').textContent = `After you order, send payment by Interac e-transfer to ${CONFIG.PAYMENT_EMAIL} with your order number in the message.`;
  $('#year').textContent = new Date().getFullYear();

  // Clear the red "invalid" outline as soon as a field is edited
  document.addEventListener('input', e => {
    if (e.target.matches('[aria-invalid="true"]')) e.target.setAttribute('aria-invalid', 'false');
  });
}

/* ────────────────────────────────────────────────────────────
   INIT
   ──────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  bindChrome();
  if (PAGE === 'home') {
    renderHome();
    bindCustomForm();
    return;
  }
  // Collection order page (wos.html, tournament.html, aiden-army.html)
  state.cart = loadCart();
  renderCollectionPage();
  renderChips();
  renderProducts();
  renderCart();
  bindProductSheet();
  bindCart();
  syncCatalog();
});
