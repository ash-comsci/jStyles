'use strict';

/* ════════════════════════════════════
   EMAILJS CONFIG
════════════════════════════════════ */
const EMAILJS_PUBLIC_KEY  = "t0ZhDWn8N6TciIGFA";
const EMAILJS_SERVICE_ID  = "service_qpb17yf";
const EMAILJS_TEMPLATE_ID = "template_m8v30a6";
emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

/* ════════════════════════════════════
   PRODUCT DATA
   — Add a real `image` path per product
     e.g. image:"../images/hoodie.png"
════════════════════════════════════ */
const YOUTH_SIZES = ["Youth S","Youth M","Youth L","Youth XL"];
const ADULT_SIZES = ["Adult XS","Adult S","Adult M","Adult L","Adult XL","Adult XXL","Adult XXXL"];

const PRODUCTS = [
  { id:"black_hoodie", name:"Black Hoodie", price:60, tags:["Warrior Classic","Fleece"], image:"../images/warrior_black.png" },
  { id:"white_hoodie", name:"White Hoodie", price:60, tags:["Warrior Classic","Fleece"], image:"../images/warrior_white.png" },
  { id:"black_tee",    name:"Black Tee",    price:25, tags:["Warrior Classic","Lightweight"], image:null },
  { id:"white_tee",    name:"White Tee",    price:25, tags:["Warrior Classic","Lightweight"], image:null },
];

/* count store: key = "productId_Size Label" */
const counts = {};

/* ════════════════════════════════════
   ACTIVE PRODUCT STATE
════════════════════════════════════ */
let activeIdx = 0;

/* ════════════════════════════════════
   BUILD TABS
════════════════════════════════════ */
function buildTabs() {
  const wrap = document.getElementById('productTabs');
  PRODUCTS.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (i === 0 ? ' active' : '');
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
  // update tab active state
  document.querySelectorAll('.tab-btn').forEach((b,i) => b.classList.toggle('active', i===idx));
  renderImagePanel(PRODUCTS[idx]);
  renderOptionsPanel(PRODUCTS[idx], idx);
}

/* ── Image Panel ── */
function renderImagePanel(p) {
  const panel = document.getElementById('imagePanel');
  if (p.image) {
    panel.innerHTML = `
      <img class="product-img" src="${p.image}" alt="${p.name}"/>
      ${buildTagStrip(p)}
      ${buildPriceDisplay(p)}
    `;
  } else {
    panel.innerHTML = `
      <div class="product-img-placeholder">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="20" width="60" height="45" rx="6" stroke="white" stroke-width="3"/>
          <path d="M10 30 C25 20, 30 28, 40 28 C50 28, 55 20, 70 30" stroke="white" stroke-width="3" fill="none"/>
          <circle cx="40" cy="16" r="6" stroke="white" stroke-width="2.5"/>
        </svg>
        <span>Add apparel image<br/><small style="font-size:.68rem;opacity:.5;text-transform:none;">Set image path in PRODUCTS array</small></span>
      </div>
      ${buildTagStrip(p)}
      ${buildPriceDisplay(p)}
    `;
  }
}

function buildTagStrip(p) {
  const tags = p.tags.map((t,i) => `<span class="product-tag${i===0?' red':''}">${t}</span>`).join('');
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

  // product subtotal
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
  if (words.length <= 1) return `<span>${name}</span>`;
  const last = words.pop();
  return `${words.join(' ')} <span>${last}</span>`;
}

function buildSizeGroup(label, sizes, pIdx) {
  const rows = sizes.map(size => {
    const key = `${pIdx}_${size.replace(/\s/g,'_')}`;
    const qty = counts[key] || 0;
    return `
      <div class="size-row${qty > 0 ? ' active' : ''}" id="row_${key}">
        <span class="size-label">${size}</span>
        <div class="counter">
          <button class="counter-btn" onclick="adjust('${key}','${pIdx}',-1)" aria-label="decrease">−</button>
          <span class="counter-val${qty > 0 ? ' nonzero' : ''}" id="val_${key}">${qty}</span>
          <button class="counter-btn" onclick="adjust('${key}','${pIdx}',1)" aria-label="increase">+</button>
        </div>
      </div>`;
  }).join('');
  return `
    <div class="size-group">
      <div class="size-group-title">${label}</div>
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
  if (valEl) { valEl.textContent = next; valEl.classList.toggle('nonzero', next > 0); }
  if (rowEl) rowEl.classList.toggle('active', next > 0);

  refreshSubtotal(parseInt(pIdx));
  refreshTabCount(parseInt(pIdx));
  refreshGrandTotal();
}

function productTotal(pIdx) {
  return Object.entries(counts)
    .filter(([k]) => k.startsWith(pIdx + '_'))
    .reduce((s,[,v]) => s+v, 0);
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
        rows.push({
          product: p.name,
          size,
          qty,
          cost: rowCost
        });
        items += qty;
        cost += rowCost;
      }
    });
  });

  return { rows, items, cost };
}


function updateStickyNavHeight() {
  const nav = document.querySelector('.navbar, .site-nav');
  if (!nav) return;
  const navHeight = Math.ceil(nav.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--sticky-nav-height', navHeight + 'px');
}


function initNavbar() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('active');
    toggle.classList.toggle('active', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    updateStickyNavHeight();
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('active');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      updateStickyNavHeight();
    });
  });
}

function refreshHeaderOrderList(summary) {
  const list = document.getElementById('headerOrderList');
  const headerItems = document.getElementById('headerTotalItems');
  const headerCost = document.getElementById('headerTotalCost');

  if (!list) return;

  if (!summary.rows.length) {
    list.innerHTML = '<span class="header-order-empty">No items selected yet.</span>';
  } else {
    list.innerHTML = summary.rows.map(row => `
      <div class="header-order-item">
        <span>
          <strong>${escapeHtml(row.product)}</strong>
          <small>${escapeHtml(row.size)} × ${row.qty}</small>
        </span>
        <span class="header-order-price">$${row.cost}</span>
      </div>`).join('');
  }

  if (headerItems) headerItems.textContent = summary.items;
  if (headerCost) headerCost.textContent = '$' + summary.cost;
  updateStickyNavHeight();
}

function refreshGrandTotal() {
  const summary = getCurrentOrderSummary();

  document.getElementById('totalCount').textContent = summary.items;
  document.getElementById('totalCost').textContent  = '$' + summary.cost;
  refreshHeaderOrderList(summary);
}

/* ════════════════════════════════════
   EMAIL BUILD
════════════════════════════════════ */
function buildAdminEmail(fname, lname, email, teamName, ageGroup, gender, orderRows, grandTotal, grandCost) {
  const now = new Date().toLocaleString("en-CA",{dateStyle:"long",timeStyle:"short"});
  const sections = orderRows.map(({name, items, subtotal, price}) => {
    const cost = subtotal * price;
    const rows = items.map(({size,qty}) => `
      <tr>
        <td style="padding:8px 14px;border-bottom:1px solid #ddd;">${escapeHtml(size)}</td>
        <td style="padding:8px 14px;border-bottom:1px solid #ddd;color:#d6a837;text-align:right;">×${qty}</td>
      </tr>`).join('');
    return `
      <div style="margin-bottom:18px;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
        <div style="background:#fff;padding:10px 14px;border-bottom:2px solid #d6a837;display:flex;justify-content:space-between;">
          <strong style="color:#111;font-size:13px;text-transform:uppercase;">${escapeHtml(name)}</strong>
          <span style="color:#d6a837;font-size:12px;font-weight:700;">${subtotal} items · $${cost}</span>
        </div>
        <table width="100%" cellspacing="0">${rows}</table>
      </div>`;
  }).join('');

  return `<!DOCTYPE html><html><body style="margin:0;background:#fff;font-family:Arial,sans-serif;">
<table width="100%" style="padding:28px;"><tr><td align="center">
<table width="600" style="border:1px solid #ddd;">
<tr><td style="border-top:4px solid #d6a837;padding:28px;text-align:center;">
  <div style="color:#d6a837;font-size:11px;letter-spacing:3px;">WARRIOR CLASSIC</div>
  <div style="font-size:26px;font-weight:700;color:#111;">NEW ORDER<br><span style="color:#d6a837;">RECEIVED</span></div>
</td></tr>
<tr><td style="padding:22px;">
  <table width="100%">
    <tr><td style="color:#666;">Name</td><td>${escapeHtml(fname)} ${escapeHtml(lname)}</td></tr>
    <tr><td style="color:#666;">Email</td><td><a href="mailto:${escapeHtml(email)}" style="color:#d6a837;">${escapeHtml(email)}</a></td></tr>
    <tr><td style="color:#666;">Team Name</td><td>${escapeHtml(teamName)}</td></tr>
    <tr><td style="color:#666;">Age Group</td><td>${escapeHtml(ageGroup)}</td></tr>
    <tr><td style="color:#666;">Gender</td><td>${escapeHtml(gender)}</td></tr>
    <tr><td style="color:#666;">Date</td><td>${now}</td></tr>
  </table>
</td></tr>
<tr><td style="padding:22px;">${sections}</td></tr>
<tr><td style="padding:22px;background:#fafafa;border-top:1px solid #ddd;">
  <table width="100%">
    <tr><td style="color:#666;">TOTAL ITEMS</td><td style="text-align:right;font-weight:700;">${grandTotal}</td></tr>
    <tr><td style="color:#666;padding-top:6px;">TOTAL COST</td>
    <td style="text-align:right;"><span style="background:#d6a837;color:#111;font-size:18px;font-weight:700;padding:5px 14px;border-radius:4px;">$${grandCost}</span></td></tr>
  </table>
</td></tr>
<tr><td style="text-align:center;padding:16px;color:#888;font-size:11px;">Submitted via Warrior Classic order form</td></tr>
</table></td></tr></table></body></html>`;
}

function buildCustomerEmail(fname, teamName, ageGroup, gender, orderRows, grandTotal, grandCost) {
  const items = orderRows.map(({name,items,subtotal,price}) => `
    <div style="margin-bottom:14px;">
      <strong>${escapeHtml(name)}</strong> — ${subtotal} items · <span style="color:#d6a837;">$${subtotal*price}</span>
      <ul>${items.map(({size,qty})=>`<li>${escapeHtml(size)} ×${qty}</li>`).join('')}</ul>
    </div>`).join('');
  return `<html><body style="font-family:Arial;padding:20px;">
<h2 style="color:#d6a837;">Warrior Classic Order Confirmation</h2>
<p>Hi ${escapeHtml(fname)}, thanks for your Warrior Classic order!</p>
<p><strong>Team:</strong> ${escapeHtml(teamName)}<br/>
<strong>Age Group:</strong> ${escapeHtml(ageGroup)}<br/>
<strong>Gender:</strong> ${escapeHtml(gender)}</p>
${items}
<hr/>
<p><strong>Total Items:</strong> ${grandTotal}</p>
<p><strong>Total Cost:</strong> <span style="color:#d6a837;">$${grandCost}</span></p>
<p style="margin-top:18px;">We'll be in touch soon! — Warrior Classic Merch</p>
</body></html>`;
}

/* ════════════════════════════════════
   SUBMIT
════════════════════════════════════ */
async function submitOrder() {
  const fname = document.getElementById('fname').value.trim();
  const lname = document.getElementById('lname').value.trim();
  const email = document.getElementById('email').value.trim();
  const teamName = document.getElementById('teamName').value.trim();
  const ageGroup = document.getElementById('ageGroup').value.trim();
  const gender = document.getElementById('gender').value.trim();

  if (gender && !['Male','Female'].includes(gender)) {
    showToast('Please choose Male or Female for gender.', true);
    return;
  }

  if (!fname || !lname || !email || !teamName || !ageGroup || !gender) {
    showToast('Please fill in your name, email, team name, age group, and gender first.', true);
    return;
  }

  const totalItems = Object.values(counts).reduce((s,v)=>s+v, 0);
  if (totalItems === 0) { showToast('Please add at least one item to your order.', true); return; }

  const orderRows = [];
  let grandTotal = 0, grandCost = 0;
  PRODUCTS.forEach((p, pIdx) => {
    const allSizes = [...YOUTH_SIZES, ...ADULT_SIZES];
    const items = allSizes
      .map(size => ({ size, qty: counts[`${pIdx}_${size.replace(/\s/g,'_')}`] || 0 }))
      .filter(r => r.qty > 0);
    if (!items.length) return;
    const subtotal = items.reduce((s,r) => s+r.qty, 0);
    grandTotal += subtotal;
    grandCost  += subtotal * p.price;
    orderRows.push({ name:p.name, items, subtotal, price:p.price });
  });

  if (EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY") {
    showToast('⚠ Add your EmailJS keys to enable sending.', true);
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true; btn.textContent = 'Sending…';

  try {
    const adminHTML    = buildAdminEmail(fname,lname,email,teamName,ageGroup,gender,orderRows,grandTotal,grandCost);
    const customerHTML = buildCustomerEmail(fname,teamName,ageGroup,gender,orderRows,grandTotal,grandCost);

    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      subject: `New Warrior Classic Order — ${fname} ${lname} — ${teamName}`,
      html_body: adminHTML, to_email: "jstyles.pro@gmail.com",
      from_name: `${fname} ${lname}`, reply_to: email
    });

    await new Promise(r => setTimeout(r, 1500));

    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      subject: "Your Warrior Classic Order Confirmation",
      html_body: customerHTML, to_email: email,
      from_name: "Warrior Classic Merch", reply_to: "jstyles.pro@gmail.com"
    });

    showToast('✓ Order sent successfully!');
    clearOrder();
  } catch(err) {
    console.error(err);
    showToast('Send failed — check your EmailJS keys.', true);
  } finally {
    btn.disabled = false; btn.textContent = 'Send Order →';
  }
}

function clearOrder() {
  Object.keys(counts).forEach(k => counts[k] = 0);
  selectProduct(activeIdx);
  PRODUCTS.forEach((_,i) => { refreshTabCount(i); });
  refreshGrandTotal();
}

/* ════════════════════════════════════
   TOAST
════════════════════════════════════ */
function showToast(msg, isErr=false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.toggle('err', isErr);
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
}

window.addEventListener('resize', updateStickyNavHeight);
window.addEventListener('load', updateStickyNavHeight);

/* ════════════════════════════════════
   INIT
════════════════════════════════════ */
initNavbar();
buildTabs();
selectProduct(0);
refreshGrandTotal();
updateStickyNavHeight();
