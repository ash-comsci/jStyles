'use strict';

/* =========================================================
   FORGAN SMOKE ORDER PAGE SETTINGS
   ========================================================= */
const STORE = {
  name: 'Forgan Smoke',
  emailTo: 'jstyles.pro@gmail.com',
  logo: './images/forgan-smoke-logo.png',
  paymentNote: 'Payment, pickup and delivery details will be confirmed after the order is reviewed.',
  facebookUrl: 'https://www.facebook.com/ForganSmoke/'
};

const CUSTOMER_CONFIRMATION_NOTE =
  'Thank you for supporting Forgan Smoke. Your order has been received and will be reviewed before production begins. ' +
  'You will be contacted directly to confirm availability, payment and pickup or delivery details.';

/* Uses the same EmailJS account/template as the supplied Warrior Classic page.
   The template should render {{html_body}} and send to {{to_email}}. */
const EMAILJS_CONFIG = {
  publicKey: 't0ZhDWn8N6TciIGFA',
  serviceId: 'service_qpb17yf',
  templateId: 'template_hfxilqc'
};

const EMAILJS_SDK_URL = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';

/* Paste the deployed Google Apps Script Web App URL here later.
   Leave blank until the Google Sheet has been created. */
const GOOGLE_SHEETS_CONFIG = {
  webAppUrl: ''
};

/* TEMPORARY PRICES: update these values once final prices are confirmed. */
const PRODUCTS = [
  {
    id: 'black-hoodie',
    name: 'Black Hoodie',
    price: 60,
    image: './images/forgan_black-hoodie.png',
    tags: ['Hoodie', 'Black', '$60'],
    sizeGroups: [
      { title: 'Adult Sizes', sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] }
    ]
  },
  {
    id: 'black-tee',
    name: 'Black Tee Shirt',
    price: 25,
    image: './images/black-tee.svg',
    tags: ['T-Shirt', 'Black', '$25'],
    sizeGroups: [
      { title: 'Adult Sizes', sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] }
    ]
  },
  {
    id: 'black-cap',
    name: 'Black Ball Cap',
    price: 25,
    image: './images/black-cap.svg',
    tags: ['Ball Cap', 'One Size', '$25'],
    sizeGroups: [
      { title: 'Cap Size', sizes: ['One Size Fits Most'] }
    ]
  },
  {
    id: 'black-dickies-shirt',
    name: 'Black Dickies Shirt',
    price: 75,
    image: './images/black-dickies-shirt.svg',
    tags: ['Dickies', 'Black', '$75'],
    sizeGroups: [
      { title: 'Adult Sizes', sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] }
    ]
  },
  {
    id: 'blue-dickies-shirt',
    name: 'Blue Dickies Shirt',
    price: 75,
    image: './images/blue-dickies-shirt.svg',
    tags: ['Dickies', 'Blue', '$75'],
    sizeGroups: [
      { title: 'Adult Sizes', sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] }
    ]
  },
  {
    id: 'grey-dickies-shirt',
    name: 'Grey Dickies Shirt',
    price: 75,
    image: './images/grey-dickies-shirt.svg',
    tags: ['Dickies', 'Grey', '$75'],
    sizeGroups: [
      { title: 'Adult Sizes', sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] }
    ]
  }
];

const state = {
  activeProductId: PRODUCTS[0].id,
  quantities: {}
};

PRODUCTS.forEach(product => {
  state.quantities[product.id] = {};
  product.sizeGroups.forEach(group => {
    group.sizes.forEach(size => {
      state.quantities[product.id][size] = 0;
    });
  });
});

/* =========================================================
   SHARED NAVBAR
   ========================================================= */
async function loadNav() {
  const navbarContainer = document.getElementById('navbar');
  if (!navbarContainer) return;

  const possibleNavPaths = ['/nav.html', '../nav.html', './nav.html'];

  for (const path of possibleNavPaths) {
    try {
      const response = await fetch(path, { cache: 'no-cache' });
      if (!response.ok) continue;
      navbarContainer.innerHTML = await response.text();
      setupNav(navbarContainer);
      return;
    } catch (error) {
      // Local previews commonly block fetch. The fallback below handles that.
    }
  }

  navbarContainer.innerHTML = fallbackNavMarkup();
  setupNav(navbarContainer);
}

function fallbackNavMarkup() {
  return `
    <header class="navbar">
      <div class="nav-container">
        <a class="nav-logo" href="./forgan_smoke.html">
          <img src="${STORE.logo}" alt="Forgan Smoke Logo" />
          <strong>FORGAN <span>SMOKE</span></strong>
        </a>
        <button class="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false"><span></span></button>
        <nav aria-label="Main navigation">
          <ul class="nav-menu">
            <li><a class="active" href="./forgan_smoke.html">Apparel</a></li>
            <li><a href="${STORE.facebookUrl}" target="_blank" rel="noopener">Facebook</a></li>
            <li><a href="/custom/index.html">Custom Merch</a></li>
            <li><a href="mailto:${STORE.emailTo}">Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>
  `;
}

function setupNav(navbarContainer) {
  const nav = navbarContainer.querySelector('.navbar');
  const toggle = navbarContainer.querySelector('.nav-toggle');
  const menu = navbarContainer.querySelector('.nav-menu');
  const links = navbarContainer.querySelectorAll('.nav-menu a');
  const currentPath = window.location.pathname.replace(/\/$/, '/index.html');

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http')) return;

    const linkPath = new URL(href, window.location.origin).pathname.replace(/\/$/, '/index.html');
    link.classList.toggle('active', linkPath === currentPath || href.includes('forgan_smoke'));

    link.addEventListener('click', () => {
      if (!menu || !toggle) return;
      menu.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
}

function setScrolledNav() {
  const nav = document.querySelector('.navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
}

/* =========================================================
   PRODUCT RENDERING
   ========================================================= */
function getProduct(productId) {
  return PRODUCTS.find(product => product.id === productId) || PRODUCTS[0];
}

function getProductCount(productId) {
  return Object.values(state.quantities[productId]).reduce((sum, qty) => sum + qty, 0);
}

function getProductSubtotal(productId) {
  const product = getProduct(productId);
  return getProductCount(productId) * product.price;
}

function getOrderItems() {
  const items = [];

  PRODUCTS.forEach(product => {
    Object.entries(state.quantities[product.id]).forEach(([size, qty]) => {
      if (qty > 0) {
        items.push({
          productId: product.id,
          productName: product.name,
          styleName: 'Forgan Smoke Logo',
          size,
          qty,
          price: product.price,
          subtotal: qty * product.price
        });
      }
    });
  });

  return items;
}

function getOrderTotals() {
  const items = getOrderItems();
  return {
    count: items.reduce((sum, item) => sum + item.qty, 0),
    total: items.reduce((sum, item) => sum + item.subtotal, 0)
  };
}

function renderProductTabs() {
  const tabs = document.getElementById('productTabs');
  if (!tabs) return;

  tabs.innerHTML = PRODUCTS.map(product => {
    const count = getProductCount(product.id);
    const active = product.id === state.activeProductId ? 'active' : '';
    return `
      <button class="tab-btn ${active}" type="button" data-product-id="${product.id}">
        ${escapeHTML(product.name)}
        <span class="tab-price">$${product.price}</span>
        ${count ? `<span class="tab-count">${count}</span>` : ''}
      </button>
    `;
  }).join('');

  tabs.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      state.activeProductId = button.dataset.productId;
      renderAll();
    });
  });
}

function renderProductImage() {
  const panel = document.getElementById('imagePanel');
  if (!panel) return;

  const product = getProduct(state.activeProductId);
  const tags = product.tags.map(tag => `<span class="product-tag">${escapeHTML(tag)}</span>`).join('');

  panel.innerHTML = `
    <img class="product-img" src="${product.image}" alt="${escapeHTML(product.name)} with Forgan Smoke branding" />
    <div class="product-tag-strip">${tags}</div>
    <div class="product-price-display">
      <div class="price-label">Price</div>
      <div class="price-val"><span>$</span>${product.price}</div>
      <div class="logo-price-note">Forgan Smoke apparel</div>
    </div>
  `;
}

function formatProductTitle(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return escapeHTML(parts[0]);
  const first = escapeHTML(parts.shift());
  return `${first} <span>${escapeHTML(parts.join(' '))}</span>`;
}

function renderProductOptions() {
  const panel = document.getElementById('optionsPanel');
  if (!panel) return;

  const product = getProduct(state.activeProductId);

  const groups = product.sizeGroups.map(group => {
    const rows = group.sizes.map(size => {
      const qty = state.quantities[product.id][size] || 0;
      return `
        <div class="size-row ${qty > 0 ? 'active' : ''}">
          <div class="size-label">${escapeHTML(size)}</div>
          <div class="counter" aria-label="${escapeHTML(product.name)} ${escapeHTML(size)} quantity">
            <button class="counter-btn" type="button" aria-label="Remove one ${escapeHTML(size)}" data-action="decrease" data-size="${escapeHTML(size)}">−</button>
            <span class="counter-val ${qty > 0 ? 'nonzero' : ''}">${qty}</span>
            <button class="counter-btn" type="button" aria-label="Add one ${escapeHTML(size)}" data-action="increase" data-size="${escapeHTML(size)}">+</button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="size-group">
        <div class="size-group-title">${escapeHTML(group.title)}</div>
        <div class="size-rows">${rows}</div>
      </div>
    `;
  }).join('');

  panel.innerHTML = `
    <div>
      <h2 class="product-options-name">${formatProductTitle(product.name)}</h2>
      <p class="product-options-meta">Click + or − to set the quantity for each available size.</p>
    </div>
    <div class="branding-note">
      <strong>Branding:</strong> Official Forgan Smoke logo included.
    </div>
    ${groups}
    <div class="product-subtotal">
      <div>
        <span class="product-subtotal-label">This Item Total</span>
        <strong class="product-subtotal-val">$${getProductSubtotal(product.id)}</strong>
      </div>
    </div>
  `;

  panel.querySelectorAll('.counter-btn').forEach(button => {
    button.addEventListener('click', () => {
      const direction = button.dataset.action === 'increase' ? 1 : -1;
      updateQuantity(product.id, button.dataset.size, direction);
    });
  });
}

function updateQuantity(productId, size, direction) {
  const current = state.quantities[productId][size] || 0;
  state.quantities[productId][size] = Math.max(0, current + direction);
  renderAll();
}

function renderSummary() {
  const items = getOrderItems();
  const totals = getOrderTotals();

  setText('totalCount', totals.count);
  setText('totalCost', `$${totals.total}`);
  setText('headerTotalItems', totals.count);
  setText('headerTotalCost', `$${totals.total}`);

  const list = document.getElementById('headerOrderList');
  if (!list) return;

  if (!items.length) {
    list.innerHTML = '<span class="header-order-empty">Nothing in the smoke stack yet.</span>';
    return;
  }

  list.innerHTML = items.map(item => `
    <div class="header-order-item">
      <div>
        <strong>${escapeHTML(item.productName)}</strong>
        <small>${escapeHTML(item.size)} × ${item.qty}</small>
      </div>
      <span class="header-order-price">$${item.subtotal}</span>
    </div>
  `).join('');
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderAll() {
  renderProductTabs();
  renderProductImage();
  renderProductOptions();
  renderSummary();
}

/* =========================================================
   EMAIL CONTENT
   ========================================================= */
function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function buildAdminEmailHTML(customer, items, totals, orderId) {
  const now = new Date().toLocaleString('en-CA', { dateStyle: 'long', timeStyle: 'short' });
  const rows = items.map(item => `
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #e3ded6;color:#171512;font-weight:700;">${escapeHTML(item.productName)}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #e3ded6;color:#5d544c;">${escapeHTML(item.size)}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #e3ded6;color:#171512;text-align:center;font-weight:800;">${item.qty}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #e3ded6;color:#b9501f;text-align:right;font-weight:900;">${money(item.subtotal)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html><html><body style="margin:0;background:#e7e3dd;font-family:Arial,Helvetica,sans-serif;color:#171512;">
    <table width="100%" cellspacing="0" cellpadding="0" style="padding:28px;background:#e7e3dd;"><tr><td align="center">
      <table width="680" cellspacing="0" cellpadding="0" style="max-width:680px;width:100%;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #c9b8a9;box-shadow:0 18px 45px rgba(0,0,0,.18);">
        <tr><td style="background:linear-gradient(135deg,#080807 0%,#24201c 50%,#b9501f 100%);padding:34px 28px;text-align:center;color:#fff;">
          <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#ffb46d;font-weight:900;">${STORE.name}</div>
          <div style="font-size:34px;line-height:1.05;font-weight:900;margin-top:8px;text-transform:uppercase;">New Apparel Order</div>
          <div style="margin-top:10px;color:#eee8df;font-size:14px;">Order ${escapeHTML(orderId)} · ${escapeHTML(now)}</div>
        </td></tr>
        <tr><td style="padding:26px 28px 12px;"><h3 style="margin:0 0 14px;font-size:18px;">Customer Information</h3>
          <table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
            <tr><td style="padding:7px 0;color:#776d63;width:160px;">Name</td><td style="padding:7px 0;font-weight:700;">${escapeHTML(customer.firstName)} ${escapeHTML(customer.lastName)}</td></tr>
            <tr><td style="padding:7px 0;color:#776d63;">Email</td><td style="padding:7px 0;"><a href="mailto:${escapeHTML(customer.email)}" style="color:#b9501f;font-weight:700;">${escapeHTML(customer.email)}</a></td></tr>
            <tr><td style="padding:7px 0;color:#776d63;">Phone</td><td style="padding:7px 0;">${escapeHTML(customer.phone)}</td></tr>
            <tr><td style="padding:7px 0;color:#776d63;">Preferred Contact</td><td style="padding:7px 0;">${escapeHTML(customer.contactPreference)}</td></tr>
            <tr><td style="padding:7px 0;color:#776d63;vertical-align:top;">Notes</td><td style="padding:7px 0;white-space:pre-line;">${escapeHTML(customer.orderNotes || 'None')}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:16px 28px 24px;"><h3 style="margin:0 0 14px;font-size:18px;">Order Details</h3>
          <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e3ded6;border-radius:12px;overflow:hidden;border-collapse:separate;border-spacing:0;font-size:13px;">
            <tr style="background:#171512;color:#ffb46d;text-transform:uppercase;font-size:11px;letter-spacing:1px;">
              <th align="left" style="padding:12px 14px;">Item</th><th align="left" style="padding:12px 14px;">Size</th><th align="center" style="padding:12px 14px;">Qty</th><th align="right" style="padding:12px 14px;">Subtotal</th>
            </tr>${rows}
          </table>
        </td></tr>
        <tr><td style="padding:24px 28px;background:#f4f0eb;border-top:1px solid #ddd2c8;"><table width="100%"><tr><td style="color:#695d52;font-weight:700;">TOTAL ITEMS</td><td style="text-align:right;font-size:18px;font-weight:900;">${totals.count}</td></tr><tr><td style="padding-top:10px;color:#695d52;font-weight:700;">TOTAL COST</td><td style="padding-top:10px;text-align:right;"><span style="display:inline-block;background:#171512;color:#ffb46d;font-size:24px;font-weight:900;padding:9px 20px;border-radius:999px;border:1px solid #b9501f;">${money(totals.total)}</span></td></tr></table></td></tr>
        <tr><td style="padding:18px 28px;text-align:center;color:#776d63;font-size:12px;">Submitted through the jStyles Forgan Smoke order form.</td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}

function buildCustomerEmailHTML(customer, items, totals, orderId) {
  const rows = items.map(item => `
    <tr>
      <td style="padding:11px 0;border-bottom:1px solid #e3ded6;"><strong>${escapeHTML(item.productName)}</strong><br><span style="color:#776d63;font-size:12px;">${escapeHTML(item.size)}</span></td>
      <td style="padding:11px 0;border-bottom:1px solid #e3ded6;text-align:center;font-weight:800;">${item.qty}</td>
      <td style="padding:11px 0;border-bottom:1px solid #e3ded6;text-align:right;color:#b9501f;font-weight:900;">${money(item.subtotal)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html><html><body style="margin:0;background:#e7e3dd;font-family:Arial,Helvetica,sans-serif;color:#171512;">
    <table width="100%" cellspacing="0" cellpadding="0" style="padding:28px;background:#e7e3dd;"><tr><td align="center">
      <table width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #c9b8a9;box-shadow:0 18px 45px rgba(0,0,0,.15);">
        <tr><td style="background:linear-gradient(135deg,#080807 0%,#24201c 50%,#b9501f 100%);padding:32px 28px;text-align:center;color:#fff;">
          <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#ffb46d;font-weight:900;">${STORE.name} Apparel</div>
          <div style="font-size:30px;line-height:1.05;font-weight:900;margin-top:8px;text-transform:uppercase;">Order Confirmation</div>
          <div style="margin-top:10px;color:#eee8df;font-size:13px;">Order ${escapeHTML(orderId)}</div>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="font-size:16px;line-height:1.55;margin:0 0 14px;">Hi ${escapeHTML(customer.firstName)},</p>
          <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Thanks for your Forgan Smoke apparel order. Here is a copy of what was submitted.</p>
          <table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">${rows}</table>
          <div style="margin-top:22px;padding:18px;border-radius:14px;background:#f4f0eb;border:1px solid #ddd2c8;"><table width="100%"><tr><td style="color:#695d52;font-weight:700;">Total Items</td><td style="text-align:right;font-weight:900;">${totals.count}</td></tr><tr><td style="padding-top:8px;color:#695d52;font-weight:700;">Total Cost</td><td style="padding-top:8px;text-align:right;color:#b9501f;font-size:22px;font-weight:900;">${money(totals.total)}</td></tr></table></div>
          <div style="margin-top:22px;padding:18px;border-radius:14px;background:#171512;color:#fff;border:1px solid #b9501f;"><strong style="color:#ffb46d;">What happens next</strong><p style="margin:8px 0 0;line-height:1.6;color:#eee8df;">${escapeHTML(CUSTOMER_CONFIRMATION_NOTE)}</p><p style="margin:12px 0 0;line-height:1.6;color:#eee8df;">${escapeHTML(STORE.paymentNote)}</p></div>
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}

/* =========================================================
   ORDER SUBMISSION
   ========================================================= */
function getValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : '';
}

function getCustomerInfo() {
  return {
    firstName: getValue('fname'),
    lastName: getValue('lname'),
    email: getValue('email'),
    phone: getValue('phone'),
    contactPreference: getValue('contactPreference'),
    orderNotes: getValue('orderNotes')
  };
}

function validateOrder() {
  const customer = getCustomerInfo();
  const required = [
    ['fname', customer.firstName, 'first name'],
    ['lname', customer.lastName, 'last name'],
    ['email', customer.email, 'email address'],
    ['phone', customer.phone, 'phone number'],
    ['contactPreference', customer.contactPreference, 'preferred contact method']
  ];

  for (const [id, value, label] of required) {
    if (!value) {
      document.getElementById(id)?.focus();
      showToast(`Please enter/select your ${label}.`, true);
      return false;
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    document.getElementById('email')?.focus();
    showToast('Please enter a valid email address.', true);
    return false;
  }

  if (!getOrderItems().length) {
    showToast('Please add at least one item to your order.', true);
    return false;
  }

  return true;
}

function buildOrderLines() {
  return getOrderItems().map(item =>
    `${item.productName} | ${item.size} | Qty: ${item.qty} | ${money(item.subtotal)}`
  ).join('\n');
}

function buildOrderText(orderId) {
  const customer = getCustomerInfo();
  const totals = getOrderTotals();
  return `${STORE.name} Apparel Order\nOrder ID: ${orderId}\n\nCustomer Information\nName: ${customer.firstName} ${customer.lastName}\nEmail: ${customer.email}\nPhone: ${customer.phone}\nPreferred Contact: ${customer.contactPreference}\nNotes: ${customer.orderNotes || 'None'}\n\nOrder Items\n${buildOrderLines()}\n\nTotal Items: ${totals.count}\nTotal Cost: ${money(totals.total)}\n\nNext Steps\n${STORE.paymentNote}\n${CUSTOMER_CONFIRMATION_NOTE}`;
}

function hasGoogleSheetsConfig() {
  const url = GOOGLE_SHEETS_CONFIG.webAppUrl;
  return Boolean(url && /^https:\/\/script\.google\.com\/macros\/s\//i.test(url));
}

function createOrderId() {
  const unique = window.crypto?.randomUUID
    ? window.crypto.randomUUID().split('-')[0].toUpperCase()
    : Math.random().toString(36).slice(2, 10).toUpperCase();
  return `FS-${Date.now()}-${unique}`;
}

function buildGoogleSheetsPayload(customer, items, totals, orderId) {
  return {
    action: 'add_forgan_smoke_order',
    source: 'forgan-smoke-apparel-page',
    orderId,
    submittedAt: new Date().toISOString(),
    businessName: STORE.name,
    customer,
    totals: {
      itemCount: totals.count,
      orderTotal: totals.total
    },
    items: items.map(item => ({
      productName: item.productName,
      styleName: item.styleName,
      size: item.size,
      quantity: item.qty,
      unitPrice: item.price,
      lineTotal: item.subtotal
    })),
    orderSummary: buildOrderText(orderId)
  };
}

async function trackOrderInGoogleSheets(payload) {
  if (!hasGoogleSheetsConfig()) return { tracked: false, reason: 'not-configured' };

  try {
    await fetch(GOOGLE_SHEETS_CONFIG.webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-store',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return { tracked: true };
  } catch (error) {
    console.error('Google Sheets tracking failed:', error);
    return { tracked: false, reason: 'request-failed' };
  }
}

function hasEmailJSConfig() {
  return [EMAILJS_CONFIG.publicKey, EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId]
    .every(value => typeof value === 'string' && value.trim() && !value.startsWith('PASTE_'));
}

function loadEmailJSScript() {
  return new Promise((resolve, reject) => {
    if (window.emailjs) return resolve();

    const existing = document.querySelector(`script[src="${EMAILJS_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = EMAILJS_SDK_URL;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('EmailJS browser SDK could not be loaded.'));
    document.head.appendChild(script);
  });
}

async function setupEmailJS() {
  if (!hasEmailJSConfig()) {
    throw new Error('EmailJS is not configured. Add the public key, service ID and template ID in forgan_smoke.js.');
  }

  await loadEmailJSScript();
  if (!window.emailjs) throw new Error('EmailJS browser SDK is unavailable.');
  window.emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
}

function clearOrderAfterSend() {
  PRODUCTS.forEach(product => {
    Object.keys(state.quantities[product.id]).forEach(size => {
      state.quantities[product.id][size] = 0;
    });
  });

  ['fname', 'lname', 'email', 'phone', 'contactPreference', 'orderNotes'].forEach(id => {
    const field = document.getElementById(id);
    if (field) field.value = '';
  });

  renderAll();
}

async function submitOrder() {
  if (!validateOrder()) return;

  const submitBtn = document.getElementById('submitBtn');
  const customer = getCustomerInfo();
  const items = getOrderItems();
  const totals = getOrderTotals();
  const orderId = createOrderId();
  const orderText = buildOrderText(orderId);
  const orderLines = buildOrderLines();
  const sheetsPayload = buildGoogleSheetsPayload(customer, items, totals, orderId);

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
  }

  try {
    await setupEmailJS();

    const commonParams = {
      business_name: STORE.name,
      tournament_name: STORE.name,
      order_id: orderId,
      customer_name: `${customer.firstName} ${customer.lastName}`,
      customer_first_name: customer.firstName,
      customer_last_name: customer.lastName,
      customer_email: customer.email,
      customer_phone: customer.phone,
      contact_preference: customer.contactPreference,
      order_notes: customer.orderNotes || 'None',
      order_summary: orderText,
      order_lines: orderLines,
      total_items: totals.count,
      total_cost: money(totals.total),
      payment_note: STORE.paymentNote,
      customer_note: CUSTOMER_CONFIRMATION_NOTE
    };

    await window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
      ...commonParams,
      subject: `${STORE.name} Apparel Order - ${customer.firstName} ${customer.lastName}`,
      order_subject: `${STORE.name} Apparel Order - ${customer.firstName} ${customer.lastName}`,
      html_body: buildAdminEmailHTML(customer, items, totals, orderId),
      to_email: STORE.emailTo,
      owner_email: STORE.emailTo,
      from_name: `${customer.firstName} ${customer.lastName}`,
      reply_to: customer.email
    });

    await window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
      ...commonParams,
      subject: `Your ${STORE.name} Apparel Order Confirmation`,
      order_subject: `Your ${STORE.name} Apparel Order Confirmation`,
      html_body: buildCustomerEmailHTML(customer, items, totals, orderId),
      to_email: customer.email,
      to_customer_email: customer.email,
      from_name: STORE.name,
      reply_to: STORE.emailTo
    });

    const sheetSync = await trackOrderInGoogleSheets(sheetsPayload);

    if (sheetSync.tracked) {
      showToast('✓ Order sent. Confirmation email delivered and Google Sheet updated.');
    } else if (sheetSync.reason === 'not-configured') {
      showToast('✓ Order and confirmation emails sent. Google Sheets can be connected later.');
    } else {
      showToast('✓ Emails sent, but the Google Sheet could not be updated.', true);
    }

    clearOrderAfterSend();
  } catch (error) {
    console.error('Order submission failed:', error);
    showToast(error?.message || 'The order could not be sent. Please check the EmailJS settings.', true);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send the smoke signal →';
    }
  }
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.toggle('err', isError);
  toast.classList.add('show');

  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 4200);
}

function addKeyboardFocus() {
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const menu = document.querySelector('.nav-menu');
    const toggle = document.querySelector('.nav-toggle');
    if (menu && toggle) {
      menu.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

window.submitOrder = submitOrder;

document.addEventListener('DOMContentLoaded', async () => {
  await loadNav();
  addKeyboardFocus();
  renderAll();
  document.getElementById('submitBtn')?.addEventListener('click', submitOrder);
});

window.addEventListener('scroll', setScrolledNav, { passive: true });
