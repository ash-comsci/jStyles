'use strict';

/* ════════════════════════════════════
   EMAILJS CONFIG
════════════════════════════════════ */
const EMAILJS_PUBLIC_KEY  = "t0ZhDWn8N6TciIGFA";
const EMAILJS_SERVICE_ID  = "service_qpb17yf";
const EMAILJS_TEMPLATE_ID = "template_m8v30a6";

if (window.emailjs) {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

/* ════════════════════════════════════
   PRODUCT DATA
   Change image paths to match your uploaded apparel images.
   If an image path is missing or broken, the page shows a clean placeholder.
════════════════════════════════════ */
const TOURNAMENT_NAME = "613 Showdown";
const TOURNAMENT_FULL_NAME = "613 Showdown Recreational Tournament";
const PAYMENT_EMAIL = "jstyles.pro@gmail.com";

const YOUTH_SIZES = ["Youth S","Youth M","Youth L","Youth XL"];
const ADULT_SIZES = ["Adult XS","Adult S","Adult M","Adult L","Adult XL","Adult XXL","Adult XXXL"];

const PRODUCTS = [
  { id:"black_hoodie", name:"Black Hoodie", price:60, tags:["613 Showdown","Fleece"], image:"images/black_hoodie.png" },
  { id:"white_hoodie", name:"White Hoodie", price:60, tags:["613 Showdown","Fleece"], image:"images/white_hoodie.png" },
  { id:"black_tee",    name:"Black Tee",    price:25, tags:["613 Showdown","Lightweight"], image:"images/black_tee.png" },
  { id:"white_tee",    name:"White Tee",    price:25, tags:["613 Showdown","Lightweight"], image:"images/white_tee.png" },
];

/* count store: key = "productIdx_Size_Label" */
const counts = {};
let activeIdx = 0;

/* ════════════════════════════════════
   BUILD TABS
════════════════════════════════════ */
function buildTabs() {
  const wrap = document.getElementById('productTabs');
  if (!wrap) return;

  wrap.innerHTML = '';

  PRODUCTS.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (i === 0 ? ' active' : '');
    btn.type = 'button';
    btn.dataset.idx = i;
    btn.innerHTML = `${p.name} <span class="tab-price">$${p.price}</span><span class="tab-count" id="tabCount_${i}">0</span>`;
    btn.addEventListener('click', () => selectProduct(i));
    wrap.appendChild(btn);
  });
}

/* ════════════════════════════════════
   SELECT PRODUCT — renders image + options
════════════════════════════════════ */
function selectProduct(idx) {
  activeIdx = idx;

  document.querySelectorAll('.tab-btn').forEach((b,i) => {
    b.classList.toggle('active', i === idx);
  });

  renderImagePanel(PRODUCTS[idx]);
  renderOptionsPanel(PRODUCTS[idx], idx);
}

/* ── Image Panel ── */
function renderImagePanel(p) {
  const panel = document.getElementById('imagePanel');
  if (!panel) return;

  if (p.image) {
    panel.innerHTML = `
      <img class="product-img" src="${p.image}" alt="${escapeHtml(p.name)}"/>
      ${buildTagStrip(p)}
      ${buildPriceDisplay(p)}
    `;

    const img = panel.querySelector('.product-img');
    if (img) {
      img.addEventListener('error', () => renderPlaceholder(panel, p), { once:true });
    }
  } else {
    renderPlaceholder(panel, p);
  }
}

function renderPlaceholder(panel, p) {
  panel.innerHTML = `
    <div class="product-img-placeholder">
      <svg width="82" height="82" viewBox="0 0 82 82" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="11" y="22" width="60" height="45" rx="7" stroke="white" stroke-width="3"/>
        <path d="M11 32 C25 21, 31 29, 41 29 C51 29, 57 21, 71 32" stroke="white" stroke-width="3" fill="none"/>
        <circle cx="41" cy="17" r="6" stroke="white" stroke-width="2.5"/>
      </svg>
      <span>${escapeHtml(p.name)}<br/><small style="font-size:.68rem;opacity:.58;text-transform:none;">Add image path in PRODUCTS array</small></span>
    </div>
    ${buildTagStrip(p)}
    ${buildPriceDisplay(p)}
  `;
}

function buildTagStrip(p) {
  const tags = p.tags.map((t,i) => `<span class="product-tag${i === 0 ? ' red' : ''}">${escapeHtml(t)}</span>`).join('');
  return `<div class="product-tag-strip">${tags}</div>`;
}

function buildPriceDisplay(p) {
  return `
    <div class="product-price-display">
      <div class="price-label">Base Price</div>
      <div class="price-val"><span>$</span>${p.price}</div>
    </div>`;
}

/* ── Options Panel ── */
function renderOptionsPanel(p, pIdx) {
  const panel = document.getElementById('optionsPanel');
  if (!panel) return;

  const showYouth = !p.adultOnly;
  const showAdult = !p.youthOnly;

  let html = `
    <div class="product-options-header">
      <div class="product-options-name">${formatProductName(p.name)}</div>
      <div class="product-options-meta">$${p.price} each · Select quantity per size</div>
    </div>`;

  if (showYouth) {
    html += buildSizeGroup("Youth Sizes", YOUTH_SIZES, pIdx);
  }
  if (showAdult) {
    html += buildSizeGroup("Adult Sizes", ADULT_SIZES, pIdx);
  }

  html += `
    <div class="product-subtotal">
      <span class="product-subtotal-label">Item Subtotal</span>
      <span class="product-subtotal-val" id="prodSubtotal_${pIdx}">$0</span>
    </div>`;

  panel.innerHTML = html;
  refreshSubtotal(pIdx);
}

function formatProductName(name) {
  const words = name.split(' ');
  if (words.length <= 1) return `<span>${escapeHtml(name)}</span>`;
  const last = words.pop();
  return `${escapeHtml(words.join(' '))} <span>${escapeHtml(last)}</span>`;
}

function buildSizeGroup(label, sizes, pIdx) {
  const rows = sizes.map(size => {
    const key = `${pIdx}_${size.replace(/\s/g,'_')}`;
    const qty = counts[key] || 0;

    return `
      <div class="size-row${qty > 0 ? ' active' : ''}" id="row_${key}">
        <span class="size-label">${escapeHtml(size)}</span>
        <div class="counter">
          <button class="counter-btn" type="button" onclick="adjust('${key}','${pIdx}',-1)" aria-label="decrease">−</button>
          <span class="counter-val${qty > 0 ? ' nonzero' : ''}" id="val_${key}">${qty}</span>
          <button class="counter-btn" type="button" onclick="adjust('${key}','${pIdx}',1)" aria-label="increase">+</button>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="size-group">
      <div class="size-group-title">${escapeHtml(label)}</div>
      <div class="size-rows">${rows}</div>
    </div>`;
}

/* ════════════════════════════════════
   COUNTER LOGIC
════════════════════════════════════ */
function adjust(key, pIdx, delta) {
  const cur = counts[key] || 0;
  const next = Math.max(0, cur + delta);
  counts[key] = next;

  const valEl = document.getElementById('val_' + key);
  const rowEl = document.getElementById('row_' + key);

  if (valEl) {
    valEl.textContent = next;
    valEl.classList.toggle('nonzero', next > 0);
  }

  if (rowEl) {
    rowEl.classList.toggle('active', next > 0);
  }

  refreshSubtotal(parseInt(pIdx, 10));
  refreshTabCount(parseInt(pIdx, 10));
  refreshGrandTotal();
}

function productTotal(pIdx) {
  return Object.entries(counts)
    .filter(([k]) => k.startsWith(pIdx + '_'))
    .reduce((s,[,v]) => s + v, 0);
}

function refreshSubtotal(pIdx) {
  const el = document.getElementById('prodSubtotal_' + pIdx);
  if (!el) return;

  const qty = productTotal(pIdx);
  const price = PRODUCTS[pIdx].price;
  el.textContent = '$' + (qty * price);
}

function refreshTabCount(pIdx) {
  const el = document.getElementById('tabCount_' + pIdx);
  if (el) el.textContent = productTotal(pIdx);
}

function getCurrentOrderSummary() {
  const rows = [];
  let items = 0;
  let cost = 0;

  PRODUCTS.forEach((p, pIdx) => {
    const allSizes = [...YOUTH_SIZES, ...ADULT_SIZES];

    allSizes.forEach(size => {
      const key = `${pIdx}_${size.replace(/\s/g,'_')}`;
      const qty = counts[key] || 0;

      if (qty > 0) {
        const rowCost = qty * p.price;
        rows.push({ product:p.name, size, qty, cost:rowCost });
        items += qty;
        cost += rowCost;
      }
    });
  });

  return { rows, items, cost };
}

function refreshGrandTotal() {
  const summary = getCurrentOrderSummary();

  const totalCount = document.getElementById('totalCount');
  const totalCost = document.getElementById('totalCost');

  if (totalCount) totalCount.textContent = summary.items;
  if (totalCost) totalCost.textContent = '$' + summary.cost;
}

function updateStickyNavHeight() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  const navHeight = Math.ceil(nav.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--sticky-nav-height', navHeight + 'px');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ════════════════════════════════════
   EMAIL BUILD
════════════════════════════════════ */
function buildAdminEmail(fname, lname, email, notes, orderRows, grandTotal, grandCost) {
  const now = new Date().toLocaleString("en-CA", { dateStyle:"long", timeStyle:"short" });
  const safeNotes = escapeHtml(notes);

  const sections = orderRows.map(({name, items, subtotal, price}) => {
    const cost = subtotal * price;
    const rows = items.map(({size,qty}) => `
      <tr>
        <td style="padding:8px 14px;border-bottom:1px solid #dbeaf5;">${escapeHtml(size)}</td>
        <td style="padding:8px 14px;border-bottom:1px solid #dbeaf5;color:#166dcb;text-align:right;font-weight:700;">×${qty}</td>
      </tr>`).join('');

    return `
      <div style="margin-bottom:18px;border:1px solid #dbeaf5;border-radius:8px;overflow:hidden;">
        <div style="background:#f2f9ff;padding:10px 14px;border-bottom:2px solid #46a8ff;display:flex;justify-content:space-between;">
          <strong style="color:#061734;font-size:13px;text-transform:uppercase;">${escapeHtml(name)}</strong>
          <span style="color:#166dcb;font-size:12px;font-weight:700;">${subtotal} items · $${cost}</span>
        </div>
        <table width="100%" cellspacing="0">${rows}</table>
      </div>`;
  }).join('');

  const notesRow = notes ? `<tr><td style="color:#617589;padding:6px 0;">Name for Back</td><td>${safeNotes}</td></tr>` : '';

  return `<!DOCTYPE html><html><body style="margin:0;background:#ffffff;font-family:Arial,sans-serif;">
<table width="100%" style="padding:28px;background:#f7fbff;"><tr><td align="center">
<table width="600" style="border:1px solid #dbeaf5;background:#ffffff;">
<tr><td style="border-top:4px solid #46a8ff;padding:28px;text-align:center;">
  <div style="color:#166dcb;font-size:11px;letter-spacing:3px;text-transform:uppercase;">${TOURNAMENT_FULL_NAME}</div>
  <div style="font-size:26px;font-weight:700;color:#061734;">NEW ORDER<br><span style="color:#166dcb;">RECEIVED</span></div>
</td></tr>
<tr><td style="padding:22px;">
  <table width="100%">
    <tr><td style="color:#617589;">Name</td><td>${escapeHtml(fname)} ${escapeHtml(lname)}</td></tr>
    <tr><td style="color:#617589;">Email</td><td><a href="mailto:${escapeHtml(email)}" style="color:#166dcb;">${escapeHtml(email)}</a></td></tr>
    <tr><td style="color:#617589;">Date</td><td>${now}</td></tr>
    ${notesRow}
  </table>
</td></tr>
<tr><td style="padding:22px;">${sections}</td></tr>
<tr><td style="padding:22px;background:#f2f9ff;border-top:1px solid #dbeaf5;">
  <table width="100%">
    <tr><td style="color:#617589;">TOTAL ITEMS</td><td style="text-align:right;font-weight:700;">${grandTotal}</td></tr>
    <tr><td style="color:#617589;padding-top:6px;">TOTAL COST</td>
    <td style="text-align:right;"><span style="background:#46a8ff;color:#061734;font-size:18px;font-weight:700;padding:5px 14px;border-radius:4px;">$${grandCost}</span></td></tr>
  </table>
</td></tr>
<tr><td style="text-align:center;padding:16px;color:#7d8f9e;font-size:11px;">Submitted via ${TOURNAMENT_NAME} order form</td></tr>
</table></td></tr></table></body></html>`;
}

function buildCustomerEmail(fname, orderRows, grandTotal, grandCost) {
  const items = orderRows.map(({name, items, subtotal, price}) => `
    <div style="margin-bottom:14px;">
      <strong>${escapeHtml(name)}</strong> — ${subtotal} items · <span style="color:#166dcb;">$${subtotal * price}</span>
      <ul>${items.map(({size,qty}) => `<li>${escapeHtml(size)} ×${qty}</li>`).join('')}</ul>
    </div>`).join('');

  return `<html><body style="font-family:Arial;padding:20px;">
<h2 style="color:#166dcb;">${TOURNAMENT_NAME} Order Confirmation</h2>
<p>Hi ${escapeHtml(fname)}, thanks for your ${TOURNAMENT_NAME} order!</p>
${items}
<hr/>
<p><strong>Total Items:</strong> ${grandTotal}</p>
<p><strong>Total Cost:</strong> <span style="color:#166dcb;">$${grandCost}</span></p>
<p style="margin-top:18px;"><strong>Payment:</strong> Please send e-transfer to ${PAYMENT_EMAIL}.</p>
<p>We'll be in touch soon! — ${TOURNAMENT_NAME} Merch</p>
</body></html>`;
}

/* ════════════════════════════════════
   SUBMIT
════════════════════════════════════ */
async function submitOrder() {
  const fname = document.getElementById('fname').value.trim();
  const lname = document.getElementById('lname').value.trim();
  const email = document.getElementById('email').value.trim();
  const notes = document.getElementById('notes').value.trim();

  if (!fname || !lname || !email) {
    showToast('Please fill in your name and email first.', true);
    return;
  }

  const totalItems = Object.values(counts).reduce((s,v) => s + v, 0);
  if (totalItems === 0) {
    showToast('Please add at least one item to your order.', true);
    return;
  }

  const orderRows = [];
  let grandTotal = 0;
  let grandCost = 0;

  PRODUCTS.forEach((p, pIdx) => {
    const allSizes = [...YOUTH_SIZES, ...ADULT_SIZES];
    const items = allSizes
      .map(size => ({ size, qty: counts[`${pIdx}_${size.replace(/\s/g,'_')}`] || 0 }))
      .filter(r => r.qty > 0);

    if (!items.length) return;

    const subtotal = items.reduce((s,r) => s + r.qty, 0);
    grandTotal += subtotal;
    grandCost  += subtotal * p.price;

    orderRows.push({ name:p.name, items, subtotal, price:p.price });
  });

  if (!window.emailjs || EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY") {
    showToast('⚠ Add your EmailJS keys to enable sending.', true);
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = 'Sending…';

  try {
    const adminHTML = buildAdminEmail(fname, lname, email, notes, orderRows, grandTotal, grandCost);
    const customerHTML = buildCustomerEmail(fname, orderRows, grandTotal, grandCost);

    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      subject: `New ${TOURNAMENT_NAME} Order — ${fname} ${lname}`,
      html_body: adminHTML,
      to_email: PAYMENT_EMAIL,
      from_name: `${fname} ${lname}`,
      reply_to: email
    });

    await new Promise(r => setTimeout(r, 900));

    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      subject: `Your ${TOURNAMENT_NAME} Order Confirmation`,
      html_body: customerHTML,
      to_email: email,
      from_name: `${TOURNAMENT_NAME} Merch`,
      reply_to: PAYMENT_EMAIL
    });

    showToast('✓ Order sent successfully!');
    clearOrder();
  } catch(err) {
    console.error(err);
    showToast('Send failed — check your EmailJS keys/template.', true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send Order →';
  }
}

function clearOrder() {
  Object.keys(counts).forEach(k => counts[k] = 0);
  selectProduct(activeIdx);
  PRODUCTS.forEach((_,i) => refreshTabCount(i));
  refreshGrandTotal();
}

/* ════════════════════════════════════
   TOAST
════════════════════════════════════ */
function showToast(msg, isErr=false) {
  const t = document.getElementById('toast');
  if (!t) return;

  t.textContent = msg;
  t.classList.toggle('err', isErr);
  t.classList.add('show');

  setTimeout(() => t.classList.remove('show'), 4000);
}

/* ════════════════════════════════════
   INIT
════════════════════════════════════ */
window.addEventListener('resize', updateStickyNavHeight);
window.addEventListener('load', updateStickyNavHeight);

buildTabs();
selectProduct(0);
refreshGrandTotal();
updateStickyNavHeight();
