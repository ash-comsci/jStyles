'use strict';
/* =========================================================
   ASH HARMONICS HOODIE — ORDER PAGE
   Orders are sent to the jStyles Google Sheet (same Apps Script
   web app as the /new2 store pages). Each hoodie size becomes a
   row on the "Orders" tab with ORDER = "All Saints Harmonics".
   Price / deadline / pickup are edited in config.js.
   ========================================================= */
const ORDER_SETTINGS = {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzEgeWhbHnwxlhiKhf9udiKCMOTPfBuOHpd9tcresVmiNnU0DaksWyzfS6GzyzVSyFf3w/exec',
  STORE_NAME: 'All Saints Harmonics',     // shows in the sheet's ORDER column
  PRODUCT_ID: 'ash-hoodie',               // matches the row in the sheet's Products tab
  PRODUCT_NAME: 'All Saints Harmonics Hoodie',
  COLOUR: 'Red',
  CONTACT_EMAIL: 'jstyles.pro@gmail.com',
  REQUEST_TIMEOUT_MS: 30000,
  MAX_PER_SIZE: 20
};

const PRICE = parseFloat(String(CONFIG.price).replace(/[^0-9.]/g, '')) || 0;

const GROUPS = {
  youth: {
    label: 'Youth', blurb: 'Ages 4 – 20',
    note: 'Youth sizes run small. Youth XL fits about the same as an adult XS.',
    sizes: [['XS', 'Age 4–6 · chest 24–25"'], ['S', 'Age 8–10 · chest 26–27"'], ['M', 'Age 10–12 · chest 28–29"'], ['L', 'Age 14–16 · chest 30–31"'], ['XL', 'Age 18–20 · chest 32–33"']]
  },
  adult: {
    label: 'Adult', blurb: 'Unisex XS – 4XL',
    note: 'Unisex relaxed fit. If you are between sizes, size up.',
    sizes: [['XS', 'Chest 29–32"'], ['S', 'Chest 33–36"'], ['M', 'Chest 37–40"'], ['L', 'Chest 41–44"'], ['XL', 'Chest 45–48"'], ['2XL', 'Chest 49–52"'], ['3XL', 'Chest 53–56"'], ['4XL', 'Chest 57–60"']]
  }
};

const state = { group: 'youth', qty: { youth: {}, adult: {} }, submitting: false, pending: null };
Object.keys(GROUPS).forEach(g => GROUPS[g].sizes.forEach(([s]) => { state.qty[g][s] = 0; }));

const $ = s => document.querySelector(s);
const money = n => '$' + (Number.isInteger(n) ? n : n.toFixed(2));
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

/* ---------- config text + deadline ---------- */
document.querySelectorAll('[data-cfg]').forEach(el => { el.textContent = CONFIG[el.dataset.cfg]; });
const ordersClosed = CONFIG.closeOrdersAfterDeadline && new Date(CONFIG.deadline) - new Date() <= 0;
$('#orderStatus').textContent = ordersClosed ? 'Orders closed' : 'Orders open until ' + CONFIG.deadlineText;
if (ordersClosed) $('#closedBanner').hidden = false;

/* ---------- order maths ---------- */
function items() {
  const out = [];
  Object.keys(GROUPS).forEach(g => GROUPS[g].sizes.forEach(([s]) => {
    const q = state.qty[g][s];
    if (q > 0) out.push({ group: g, size: s, label: GROUPS[g].label + ' ' + s, qty: q, subtotal: q * PRICE });
  }));
  return out;
}
const groupCount = g => Object.values(state.qty[g]).reduce((a, b) => a + b, 0);
function totals() {
  const list = items();
  return { count: list.reduce((a, i) => a + i.qty, 0), total: list.reduce((a, i) => a + i.subtotal, 0) };
}

/* ---------- rendering ---------- */
function renderTabs() {
  $('#groupTabs').innerHTML = Object.keys(GROUPS).map(g => {
    const c = groupCount(g);
    return `<button class="group-tab" type="button" role="tab" data-g="${g}" aria-selected="${g === state.group}">
      <b>${GROUPS[g].label}</b><small>${GROUPS[g].blurb}</small>${c ? `<span class="cnt">${c}</span>` : ''}</button>`;
  }).join('');
  $('#groupNote').textContent = GROUPS[state.group].note;
}

function renderSizes() {
  const g = state.group;
  $('#sizeGrid').innerHTML = GROUPS[g].sizes.map(([s, hint]) => {
    const q = state.qty[g][s];
    return `<div class="size-row ${q ? 'on' : ''}">
      <div class="lbl"><b>${GROUPS[g].label} ${s}</b><small>${hint}</small></div>
      <div class="counter">
        <button type="button" data-s="${s}" data-d="-1" aria-label="Remove one ${GROUPS[g].label} ${s}" ${q ? '' : 'disabled'}>−</button>
        <span class="val" aria-live="polite">${q}</span>
        <button type="button" data-s="${s}" data-d="1" aria-label="Add one ${GROUPS[g].label} ${s}" ${ordersClosed || q >= ORDER_SETTINGS.MAX_PER_SIZE ? 'disabled' : ''}>+</button>
      </div></div>`;
  }).join('');
}

function renderSummary() {
  const list = items(), t = totals();
  $('#sumTotal').textContent = money(t.total);
  $('#barCount').textContent = t.count;
  $('#barTotal').textContent = money(t.total);
  $('#sumList').innerHTML = list.length
    ? list.map(i => `<div class="row"><span>${esc(i.label)} × ${i.qty}</span><span>${money(i.subtotal)}</span></div>`).join('')
    : '<span class="o-empty">No hoodies added yet.</span>';
  $('#submitBtn').disabled = ordersClosed;
}

function render() { renderTabs(); renderSizes(); renderSummary(); }

$('#groupTabs').addEventListener('click', e => {
  const b = e.target.closest('[data-g]'); if (!b) return;
  state.group = b.dataset.g; render();
});
$('#sizeGrid').addEventListener('click', e => {
  const b = e.target.closest('button[data-s]'); if (!b || b.disabled) return;
  const g = state.group, s = b.dataset.s;
  state.qty[g][s] = Math.min(ORDER_SETTINGS.MAX_PER_SIZE, Math.max(0, state.qty[g][s] + Number(b.dataset.d)));
  render();
});

/* ---------- form ---------- */
const field = id => document.getElementById(id);
const val = id => field(id).value.trim();

function validate() {
  const status = $('#formStatus');
  status.hidden = true;
  document.querySelectorAll('.o-form .bad').forEach(el => el.classList.remove('bad'));

  if (!items().length) {
    toast('Add at least one hoodie to your order.', true);
    $('#shop').scrollIntoView({ behavior: 'smooth' });
    return false;
  }
  const missing = ['fname', 'lname', 'homeroom', 'email'].filter(id => !val(id));
  if (val('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email'))) missing.push('email');
  if (missing.length) {
    missing.forEach(id => field(id).classList.add('bad'));
    field(missing[0]).focus();
    showStatus('Please fill in the highlighted fields.');
    return false;
  }
  return true;
}

function showStatus(html) { const s = $('#formStatus'); s.innerHTML = html; s.hidden = false; }

function buildPayload() {
  const list = items(), t = totals();
  const notes = [
    'Homeroom / teacher: ' + val('homeroom'),
    val('parent') && 'Parent / guardian: ' + val('parent'),
    val('orderNotes') && 'Notes: ' + val('orderNotes'),
    'Payment: School Cash Online'
  ].filter(Boolean).join(' | ');

  return {
    source: 'ash-harmonics-order',
    orderPage: ORDER_SETTINGS.STORE_NAME,
    submittedAt: new Date().toISOString(),
    paymentNote: CONFIG.paymentNote,
    customer: {
      firstName: val('fname'),
      lastName: val('lname'),
      email: val('email').toLowerCase(),
      phone: val('phone'),
      fulfillment: 'Pickup – ' + CONFIG.pickup,
      notes
    },
    items: list.map(i => ({
      productId: ORDER_SETTINGS.PRODUCT_ID,
      productName: ORDER_SETTINGS.PRODUCT_NAME,
      collection: ORDER_SETTINGS.STORE_NAME,
      color: ORDER_SETTINGS.COLOUR,
      size: i.label,                       // e.g. "Youth M" / "Adult 2XL"
      option: GROUPS[i.group].label + ' sizing',
      qty: i.qty,
      unitPrice: PRICE
    })),
    totals: { count: t.count, total: t.total }
  };
}

async function postOrder(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ORDER_SETTINGS.REQUEST_TIMEOUT_MS);
  try {
    // text/plain avoids a CORS preflight, which Apps Script can't answer.
    const res = await fetch(ORDER_SETTINGS.APPS_SCRIPT_URL, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload), redirect: 'follow', signal: controller.signal
    });
    if (!res.ok) throw new Error('The order service is unavailable right now.');
    let data;
    try { data = await res.json(); } catch { throw new Error('The order service sent an unexpected reply.'); }
    if (!data.ok) throw new Error(data.message || 'The order could not be completed.');
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The request timed out. It may still have gone through, so check your email before trying again.');
    if (err instanceof TypeError) throw new Error('Could not reach the order service. Check your connection and try again.');
    throw err;
  } finally { clearTimeout(timer); }
}

function mailtoFallback(payload) {
  const lines = payload.items.map(i => `${i.size} × ${i.qty}`).join('\n');
  const body = `${ORDER_SETTINGS.PRODUCT_NAME} order\nOrder: ${payload.orderId}\nStudent: ${payload.customer.firstName} ${payload.customer.lastName}\n${payload.customer.notes}\nEmail: ${payload.customer.email}\n\n${lines}\n\nTotal: ${money(payload.totals.total)}`;
  return `mailto:${ORDER_SETTINGS.CONTACT_EMAIL}?subject=${encodeURIComponent('ASH Harmonics hoodie order')}&body=${encodeURIComponent(body)}`;
}

function makeId() {
  const r = window.crypto?.randomUUID ? crypto.randomUUID().slice(0, 6) : Math.random().toString(36).slice(2, 8);
  return 'ASH-' + Date.now().toString(36).toUpperCase() + '-' + r.toUpperCase();
}

async function submitOrder() {
  if (state.submitting || ordersClosed) return;
  if (!validate()) return;
  if (val('website')) { resetOrder(); return; } // honeypot: ignore bots quietly

  const payload = buildPayload();
  // Same order re-submitted (e.g. after a timeout) keeps its id so the sheet skips duplicates.
  const fp = JSON.stringify([payload.customer, payload.items]);
  if (!state.pending || state.pending.fp !== fp) state.pending = { fp, id: makeId() };
  payload.orderId = state.pending.id;

  const btn = $('#submitBtn');
  state.submitting = true; btn.disabled = true; btn.innerHTML = 'Sending…';
  try {
    const result = await postOrder(payload);
    const total = typeof result.total === 'number' ? result.total : payload.totals.total;
    $('#okId').textContent = result.orderId || payload.orderId;
    $('#okMsg').innerHTML =
      `<p>Thanks! The order for <b>${esc(payload.customer.firstName)} ${esc(payload.customer.lastName)}</b> has been added to the order list, and a copy is on its way to <b>${esc(payload.customer.email)}</b>.</p>` +
      `<ul>${payload.items.map(i => `<li>${esc(i.size)} × ${i.qty}</li>`).join('')}</ul>` +
      `<p><b>Total: ${money(total)}</b>. ${esc(CONFIG.paymentNote)}</p>` +
      `<p>Pickup: ${esc(CONFIG.pickup)}. We'll announce the date in class.</p>`;
    openSuccess();
    resetOrder();
  } catch (err) {
    console.error('Order error:', err);
    showStatus(`${esc(err.message)}<br>Your selections are still here. Reference <b>${esc(payload.orderId)}</b>. You can also <a href="${esc(mailtoFallback(payload))}">email this order</a>.`);
    toast('Order not sent. See the details above the button.', true);
  } finally {
    state.submitting = false; btn.disabled = ordersClosed; btn.innerHTML = 'Place Order <span class="arr">→</span>';
  }
}

function resetOrder() {
  Object.keys(state.qty).forEach(g => Object.keys(state.qty[g]).forEach(s => { state.qty[g][s] = 0; }));
  $('#orderForm').reset();
  state.pending = null;
  render();
}

$('#submitBtn').addEventListener('click', submitOrder);
$('#orderForm').addEventListener('submit', e => { e.preventDefault(); submitOrder(); });
$('#orderForm').addEventListener('input', e => e.target.classList.remove('bad'));

/* ---------- success modal ---------- */
const modal = $('#successModal');
function openSuccess() { modal.classList.add('open'); document.body.style.overflow = 'hidden'; modal.querySelector('.x').focus(); }
function closeSuccess() { modal.classList.remove('open'); document.body.style.overflow = ''; window.scrollTo({ top: 0, behavior: 'smooth' }); }
modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-close]')) closeSuccess(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeSuccess(); });

function toast(msg, isErr) {
  const t = $('#toast');
  t.textContent = msg; t.classList.toggle('err', !!isErr); t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 4200);
}

/* ---------- page chrome (matches index.html) ---------- */
const glyphs = ['♪', '♫', '♬', '♩', '𝄞'], notesEl = $('#notes');
for (let i = 0; i < 12; i++) {
  const n = document.createElement('span'); n.className = 'note'; n.textContent = glyphs[i % glyphs.length];
  n.style.left = Math.random() * 100 + '%'; n.style.bottom = (-20 + Math.random() * 40) + 'px';
  n.style.fontSize = (1.2 + Math.random() * 1.8) + 'rem';
  n.style.animationDuration = (9 + Math.random() * 9) + 's'; n.style.animationDelay = (-Math.random() * 16) + 's';
  notesEl.appendChild(n);
}
const nav = $('#nav'), prog = $('#progress');
addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  prog.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
  nav.classList.toggle('scrolled', scrollY > 40);
}, { passive: true });
$('#burger').addEventListener('click', () => $('#links').classList.toggle('open'));
document.querySelectorAll('.links a').forEach(a => a.addEventListener('click', () => $('#links').classList.remove('open')));

render();
