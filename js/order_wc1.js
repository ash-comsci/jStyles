'use strict';

/*
   EMAILJS TEMPLATE SETUP NOTES

   This file sends TWO direct EmailJS messages:
   1) A detailed admin order email to jstyles.pro@gmail.com
   2) A polished customer confirmation email to the buyer

   The EmailJS template should include these fields:
   - To Email: {{to_email}}
   - Reply To: {{reply_to}}
   - Subject: {{subject}}
   - Body: {{html_body}}

   This matches the working order.js flow and does not rely on mailto or
   a separate EmailJS auto-reply setup.
*/

/* =========================================================
   TOURNAMENT TEMPLATE SETTINGS
   Change these values for each new tournament page.
   ========================================================= */
const TOURNAMENT = {
  name: 'Warrior Classic',
  emailTo: 'jstyles.pro@gmail.com',
  logo: '/images/warrior_classic.png',
  paymentNote: 'Please send your e-transfer to jstyles.pro@gmail.com after submitting your order. Production starts once the e-transfer has been received.'
};

const CUSTOMER_CONFIRMATION_NOTE =
  'Thank you for your order. I will contact you once your order is complete. ' +
  'Production will only begin once the e-transfer has been received. ' +
  'I will also confirm pickup or drop-off details with you directly.';

/* =========================================================
   EMAILJS SETTINGS
   Fill these in from your EmailJS dashboard.

   publicKey: Account > API Keys > Public Key
   serviceId: Email Services > your connected email service
   templateId: Email Templates > your MAIN order template

   IMPORTANT:
   This file no longer uses mailto. If these are not filled in,
   the site will show an error instead of opening the visitor's email app.
   ========================================================= */
const EMAILJS_CONFIG = {
  publicKey: 't0ZhDWn8N6TciIGFA',
  serviceId: 'service_qpb17yf',
  templateId: 'template_m8v30a6'
};

const EMAILJS_SDK_URL = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';

/* Product options shown as clickable tabs.
   Change names, prices, and image paths here for another tournament. */
const PRODUCTS = [
  {
  id: 'black-hoodie',
  name: 'Black Hoodie',
  price: 60,
  image: '/images/warrior_black_large.png',
  images: {
    'large-logo': '/images/wc_hoodie_black_large.png',
    'small-logo': '/images/wc_hoodie_black_small.png'
  },
  sizeChart: '/images/sizing_chart.png',
  tags: ['Hoodie', 'Warm Fit', '$60']
  },
  {
    id: 'white-hoodie',
    name: 'White Hoodie',
    price: 60,
    image: '/images/wc_hoodie_white_large.png',
    images: {
      'large-logo': '/images/wc_hoodie_white_large.png',
      'small-logo': '/images/wc_hoodie_white_small.png'
    },
    tags: ['Hoodie', 'Clean Look', '$60']
  },
  {
    id: 'black-tee',
    name: 'Black Tee',
    price: 25,
    image: '/images/wc_tee_black_large.png',
    images: {
      'large-logo': '/images/wc_tee_black_large.png',
      'small-logo': '/images/wc_tee_black_small.png'
    },
    tags: ['T-Shirt', 'Street Ready', '$25']
  },
  {
    id: 'white-tee',
    name: 'White Tee',
    price: 25,
    image: '/images/wc_tee_white_large.png',
    images: {
      'large-logo': '/images/wc_tee_white_large.png',
      'small-logo': '/images/wc_tee_white_small.png'
    },
    tags: ['T-Shirt', 'Light Fit', '$25']
  }
];

/* Logo options available for every apparel item.
   The id matches the image keys above, so changing Large/Small also changes the preview image. */
const LOGO_OPTIONS = [
  {
    id: 'large-logo',
    name: 'Large Logo',
    description: 'Bigger tournament logo print.'
  },
  {
    id: 'small-logo',
    name: 'Small Logo',
    description: 'Smaller tournament logo print.'
  }
];

const SIZE_GROUPS = [
  {
    title: 'Youth Sizes',
    sizes: ['Youth XS', 'Youth S', 'Youth M', 'Youth L', 'Youth XL']
  },
  {
    title: 'Adult Sizes',
    sizes: ['Adult XS', 'Adult S', 'Adult M', 'Adult L', 'Adult XL']
  }
];

const state = {
  activeProductId: PRODUCTS[0].id,
  activeLogoId: LOGO_OPTIONS[0].id,
  quantities: {}
};

PRODUCTS.forEach(product => {
  state.quantities[product.id] = {};
  LOGO_OPTIONS.forEach(logoOption => {
    state.quantities[product.id][logoOption.id] = {};
    SIZE_GROUPS.forEach(group => {
      group.sizes.forEach(size => {
        state.quantities[product.id][logoOption.id][size] = 0;
      });
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
      const res = await fetch(path, { cache: 'no-cache' });
      if (!res.ok) continue;
      navbarContainer.innerHTML = await res.text();
      setupNav(navbarContainer);
      return;
    } catch (error) {
      // Try the next path before falling back.
    }
  }

  navbarContainer.innerHTML = fallbackNavMarkup();
  setupNav(navbarContainer);
}

function fallbackNavMarkup() {
  return `
    <header class="navbar">
      <div class="nav-container">
        <a class="nav-logo" href="/index.html">
          <img src="/images/jstyles_logo.png" alt="jStyles Logo" onerror="this.style.display='none'" />
          <strong>J<span>STYLES</span></strong>
        </a>
        <button class="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false"><span></span></button>
        <nav aria-label="Main navigation">
          <ul class="nav-menu">
            <li><a href="/index.html">Home</a></li>
            <li><a href="/WOS/index.html">Fan Gear</a></li>
            <li><a href="/tournament/index.html">Tournament MERCH</a></li>
            <li><a href="/custom/index.html">Custom MERCH</a></li>
            <li><a href="mailto:${TOURNAMENT.emailTo}">Contact</a></li>
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
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    const linkPath = new URL(href, window.location.origin).pathname.replace(/\/$/, '/index.html');
    link.classList.toggle('active', linkPath === currentPath);

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

function getLogoOption(logoId) {
  return LOGO_OPTIONS.find(option => option.id === logoId) || LOGO_OPTIONS[0];
}

function getProductImage(product, logoId = state.activeLogoId) {
  return product.images?.[logoId] || product.image || '';
}

function getProductCount(productId) {
  return LOGO_OPTIONS.reduce((logoSum, logoOption) => {
    return logoSum + Object.values(state.quantities[productId][logoOption.id]).reduce((sum, qty) => sum + qty, 0);
  }, 0);
}

function getLogoCount(productId, logoId) {
  return Object.values(state.quantities[productId][logoId]).reduce((sum, qty) => sum + qty, 0);
}

function getProductSubtotal(productId) {
  const product = getProduct(productId);
  return getProductCount(productId) * product.price;
}

function getLogoSubtotal(productId, logoId) {
  const product = getProduct(productId);
  return getLogoCount(productId, logoId) * product.price;
}

function getOrderItems() {
  const items = [];

  PRODUCTS.forEach(product => {
    LOGO_OPTIONS.forEach(logoOption => {
      Object.entries(state.quantities[product.id][logoOption.id]).forEach(([size, qty]) => {
        if (qty > 0) {
          items.push({
            productId: product.id,
            productName: product.name,
            logoId: logoOption.id,
            logoName: logoOption.name,
            size,
            qty,
            price: product.price,
            subtotal: qty * product.price
          });
        }
      });
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
        ${product.name}
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

function renderLogoOptions(product) {
  return `
    <div class="logo-option-wrap" aria-label="Logo size options">
      <div class="size-group-title">Logo Option</div>
      <div class="logo-option-tabs">
        ${LOGO_OPTIONS.map(option => {
          const selected = option.id === state.activeLogoId ? 'active' : '';
          const count = getLogoCount(product.id, option.id);
          return `
            <button class="logo-option-btn ${selected}" type="button" data-logo-id="${option.id}">
              <strong>${option.name}</strong>
              <span>${option.description}</span>
              ${count ? `<em>${count}</em>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderProductImage() {
  const panel = document.getElementById('imagePanel');
  if (!panel) return;

  const product = getProduct(state.activeProductId);
  const logoOption = getLogoOption(state.activeLogoId);
  const productImage = getProductImage(product, logoOption.id);
  const tags = [...product.tags, logoOption.name].map(tag => `<span class="product-tag">${tag}</span>`).join('');

  panel.innerHTML = `
    <img class="product-img" src="${productImage}" alt="${product.name} - ${logoOption.name}" onerror="this.replaceWith(createProductPlaceholder('${product.name.replace(/'/g, '&apos;')}'))" />
    <div class="product-tag-strip">${tags}</div>
    <div class="product-price-display">
      <div class="price-label">Price</div>
      <div class="price-val"><span>$</span>${product.price}</div>
      <div class="logo-price-note">${logoOption.name}</div>
    </div>
  `;
}

function createProductPlaceholder(productName) {
  const placeholder = document.createElement('div');
  placeholder.className = 'product-img-placeholder';
  placeholder.innerHTML = `
    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7l4-3h8l4 3-3 4v9H7v-9L4 7Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
      <path d="M9 4c.4 1.7 1.4 2.6 3 2.6S14.6 5.7 15 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
    </svg>
    <span>${productName}<br>Image Placeholder</span>
  `;
  return placeholder;
}

function formatProductTitle(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts.shift();
  return `${first} <span>${parts.join(' ')}</span>`;
}

function renderProductOptions() {
  const panel = document.getElementById('optionsPanel');
  if (!panel) return;

  const product = getProduct(state.activeProductId);
  const logoOption = getLogoOption(state.activeLogoId);

  const groups = SIZE_GROUPS.map(group => {
    const rows = group.sizes.map(size => {
      const qty = state.quantities[product.id][logoOption.id][size] || 0;
      const active = qty > 0 ? 'active' : '';
      return `
        <div class="size-row ${active}">
          <div class="size-label">${size}</div>
          <div class="counter" aria-label="${product.name} ${logoOption.name} ${size} quantity">
            <button class="counter-btn" type="button" aria-label="Remove one ${size}" data-action="decrease" data-size="${size}">−</button>
            <span class="counter-val ${qty > 0 ? 'nonzero' : ''}">${qty}</span>
            <button class="counter-btn" type="button" aria-label="Add one ${size}" data-action="increase" data-size="${size}">+</button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="size-group">
        <div class="size-group-title">${group.title}</div>
        <div class="size-rows">${rows}</div>
      </div>
    `;
  }).join('');

  panel.innerHTML = `
    <div>
      <h2 class="product-options-name">${formatProductTitle(product.name)}</h2>
      <p class="product-options-meta">Choose a logo size, then click + or − to set sizes and quantities.</p>
    </div>
    ${renderLogoOptions(product)}
    ${groups}
    <div class="product-subtotal split">
      <div>
        <span class="product-subtotal-label">Selected Logo</span>
        <strong class="product-subtotal-val">$${getLogoSubtotal(product.id, logoOption.id)}</strong>
      </div>
      <div>
        <span class="product-subtotal-label">This Item Total</span>
        <strong class="product-subtotal-val">$${getProductSubtotal(product.id)}</strong>
      </div>
    </div>
  `;

  panel.querySelectorAll('.logo-option-btn').forEach(button => {
    button.addEventListener('click', () => {
      state.activeLogoId = button.dataset.logoId;
      renderAll();
    });
  });

  panel.querySelectorAll('.counter-btn').forEach(button => {
    button.addEventListener('click', () => {
      const size = button.dataset.size;
      const direction = button.dataset.action === 'increase' ? 1 : -1;
      updateQuantity(product.id, logoOption.id, size, direction);
    });
  });
}

function updateQuantity(productId, logoId, size, direction) {
  const current = state.quantities[productId][logoId][size] || 0;
  state.quantities[productId][logoId][size] = Math.max(0, current + direction);
  renderAll();
}

function renderSummary() {
  const items = getOrderItems();
  const totals = getOrderTotals();

  setText('totalCount', totals.count);
  setText('totalCost', `$${totals.total}`);
  setText('headerTotalItems', totals.count);
  setText('headerTotalCost', `$${totals.total}`);

  const headerOrderList = document.getElementById('headerOrderList');
  if (!headerOrderList) return;

  if (!items.length) {
    headerOrderList.innerHTML = '<span class="header-order-empty">No items selected yet.</span>';
    return;
  }

  headerOrderList.innerHTML = items.map(item => `
    <div class="header-order-item">
      <div>
        <strong>${item.productName}</strong>
        <small>${item.logoName} · ${item.size} × ${item.qty}</small>
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
   ORDER SUBMIT
   ========================================================= */
function getCustomerInfo() {
  return {
    firstName: getValue('fname'),
    lastName: getValue('lname'),
    email: getValue('email'),
    clubName: getValue('clubName'),
    ageGroup: getValue('ageGroup'),
    gender: getValue('gender')
  };
}

function getValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : '';
}

function validateOrder() {
  const customer = getCustomerInfo();
  const required = [
    ['fname', customer.firstName, 'first name'],
    ['lname', customer.lastName, 'last name'],
    ['email', customer.email, 'email address'],
    ['clubName', customer.clubName, 'team / club name'],
    ['ageGroup', customer.ageGroup, 'age group'],
    ['gender', customer.gender, 'gender']
  ];

  for (const [id, value, label] of required) {
    if (!value) {
      const field = document.getElementById(id);
      if (field) field.focus();
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

function buildOrderText() {
  const customer = getCustomerInfo();
  const items = getOrderItems();
  const totals = getOrderTotals();

  const itemLines = items.map(item => {
    return `${item.productName} | ${item.logoName} | ${item.size} | Qty: ${item.qty} | $${item.subtotal}`;
  }).join('\n');

  return `${TOURNAMENT.name} Order\n\nCustomer Information\nName: ${customer.firstName} ${customer.lastName}\nEmail: ${customer.email}\nClub Name: ${customer.clubName}\nAge Group: ${customer.ageGroup}\nGender: ${customer.gender}\n\nOrder Items\n${itemLines}\n\nTotal Items: ${totals.count}\nTotal Cost: $${totals.total}\n\nPayment Information\n${TOURNAMENT.paymentNote}\n\nCustomer Note\n${CUSTOMER_CONFIRMATION_NOTE}`;
}

function buildOrderLines() {
  const items = getOrderItems();

  return items.map(item => {
    return `${item.productName} | ${item.logoName} | ${item.size} | Qty: ${item.qty} | $${item.subtotal}`;
  }).join('\n');
}

function money(value) {
  return `$${value}`;
}

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildAdminEmailHTML(customer, items, totals) {
  const now = new Date().toLocaleString('en-CA', { dateStyle: 'long', timeStyle: 'short' });
  const customerName = `${customer.firstName} ${customer.lastName}`.trim();

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #e7e2dc;color:#161616;font-weight:700;">${escapeHTML(item.productName)}</td>
      <td style="padding:14px 16px;border-bottom:1px solid #e7e2dc;color:#555;">${escapeHTML(item.logoName)}</td>
      <td style="padding:14px 16px;border-bottom:1px solid #e7e2dc;color:#555;">${escapeHTML(item.size)}</td>
      <td style="padding:14px 16px;border-bottom:1px solid #e7e2dc;color:#e85d1c;text-align:center;font-weight:800;">×${item.qty}</td>
      <td style="padding:14px 16px;border-bottom:1px solid #e7e2dc;color:#161616;text-align:right;font-weight:800;">${money(item.subtotal)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;background:#f1eee9;font-family:Arial,Helvetica,sans-serif;color:#161616;">
      <table width="100%" cellspacing="0" cellpadding="0" style="background:#f1eee9;padding:28px 12px;">
        <tr>
          <td align="center">
            <table width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dfd6cc;box-shadow:0 12px 30px rgba(0,0,0,0.12);">
              <tr>
                <td style="background:#101820;padding:30px 26px;text-align:center;border-bottom:5px solid #e85d1c;">
                  <div style="color:#f7b267;font-size:12px;letter-spacing:4px;text-transform:uppercase;font-weight:900;">${escapeHTML(TOURNAMENT.name)}</div>
                  <div style="color:#ffffff;font-size:34px;line-height:1.05;font-weight:900;text-transform:uppercase;margin-top:8px;">New Order<br><span style="color:#e85d1c;">Received</span></div>
                </td>
              </tr>

              <tr>
                <td style="padding:26px;">
                  <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="padding:9px 0;color:#777;width:150px;font-weight:700;">Customer</td>
                      <td style="padding:9px 0;color:#161616;font-weight:800;">${escapeHTML(customerName)}</td>
                    </tr>
                    <tr>
                      <td style="padding:9px 0;color:#777;font-weight:700;">Email</td>
                      <td style="padding:9px 0;"><a href="mailto:${escapeHTML(customer.email)}" style="color:#e85d1c;font-weight:800;text-decoration:none;">${escapeHTML(customer.email)}</a></td>
                    </tr>
                    <tr>
                      <td style="padding:9px 0;color:#777;font-weight:700;">Team / Club</td>
                      <td style="padding:9px 0;color:#161616;">${escapeHTML(customer.clubName)}</td>
                    </tr>
                    <tr>
                      <td style="padding:9px 0;color:#777;font-weight:700;">Age / Gender</td>
                      <td style="padding:9px 0;color:#161616;">${escapeHTML(customer.ageGroup)} • ${escapeHTML(customer.gender)}</td>
                    </tr>
                    <tr>
                      <td style="padding:9px 0;color:#777;font-weight:700;">Submitted</td>
                      <td style="padding:9px 0;color:#161616;">${escapeHTML(now)}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:0 26px 26px;">
                  <div style="border-radius:14px;overflow:hidden;border:1px solid #e7e2dc;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      <tr>
                        <th align="left" style="background:#fbf7f1;padding:12px 16px;color:#101820;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Item</th>
                        <th align="left" style="background:#fbf7f1;padding:12px 16px;color:#101820;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Logo</th>
                        <th align="left" style="background:#fbf7f1;padding:12px 16px;color:#101820;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Size</th>
                        <th align="center" style="background:#fbf7f1;padding:12px 16px;color:#101820;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Qty</th>
                        <th align="right" style="background:#fbf7f1;padding:12px 16px;color:#101820;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Subtotal</th>
                      </tr>
                      ${itemRows}
                    </table>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding:24px 26px;background:#fbf7f1;border-top:1px solid #e7e2dc;">
                  <table width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="color:#777;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">Total Items</td>
                      <td style="color:#161616;text-align:right;font-size:18px;font-weight:900;">${totals.count}</td>
                    </tr>
                    <tr>
                      <td style="color:#777;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding-top:12px;">Total Cost</td>
                      <td style="text-align:right;padding-top:12px;"><span style="display:inline-block;background:#e85d1c;color:#ffffff;font-size:24px;font-weight:900;padding:9px 20px;border-radius:999px;">${money(totals.total)}</span></td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:20px 26px;text-align:center;color:#777;font-size:12px;">
                  Reply directly to this email to contact ${escapeHTML(customerName)}.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function buildCustomerEmailHTML(customer, items, totals) {
  const customerName = `${customer.firstName} ${customer.lastName}`.trim();

  const itemCards = items.map(item => `
    <div style="border:1px solid #e7e2dc;border-radius:14px;padding:14px 16px;margin-bottom:12px;background:#ffffff;">
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td>
            <div style="color:#101820;font-size:15px;font-weight:900;text-transform:uppercase;">${escapeHTML(item.productName)}</div>
            <div style="color:#777;font-size:13px;margin-top:4px;">${escapeHTML(item.logoName)} • ${escapeHTML(item.size)} • Qty ${item.qty}</div>
          </td>
          <td style="text-align:right;color:#e85d1c;font-size:18px;font-weight:900;">${money(item.subtotal)}</td>
        </tr>
      </table>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;background:#f1eee9;font-family:Arial,Helvetica,sans-serif;color:#161616;">
      <table width="100%" cellspacing="0" cellpadding="0" style="background:#f1eee9;padding:28px 12px;">
        <tr>
          <td align="center">
            <table width="620" cellspacing="0" cellpadding="0" style="max-width:620px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dfd6cc;box-shadow:0 12px 30px rgba(0,0,0,0.10);">
              <tr>
                <td style="background:#101820;padding:30px 26px;text-align:center;border-bottom:5px solid #e85d1c;">
                  <div style="color:#f7b267;font-size:12px;letter-spacing:4px;text-transform:uppercase;font-weight:900;">JSTYLES</div>
                  <div style="color:#ffffff;font-size:30px;line-height:1.08;font-weight:900;text-transform:uppercase;margin-top:8px;">Your ${escapeHTML(TOURNAMENT.name)}<br><span style="color:#e85d1c;">Order Summary</span></div>
                </td>
              </tr>

              <tr>
                <td style="padding:26px;">
                  <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">Hi ${escapeHTML(customer.firstName)},</p>
                  <p style="margin:0 0 18px;font-size:16px;line-height:1.5;">Thanks for your order. Here is a copy of what you submitted:</p>

                  ${itemCards}

                  <div style="margin-top:18px;background:#fbf7f1;border:1px solid #e7e2dc;border-radius:16px;padding:18px;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color:#777;font-weight:800;text-transform:uppercase;font-size:13px;">Total Items</td>
                        <td style="text-align:right;color:#161616;font-size:18px;font-weight:900;">${totals.count}</td>
                      </tr>
                      <tr>
                        <td style="padding-top:10px;color:#777;font-weight:800;text-transform:uppercase;font-size:13px;">Total Cost</td>
                        <td style="padding-top:10px;text-align:right;color:#e85d1c;font-size:24px;font-weight:900;">${money(totals.total)}</td>
                      </tr>
                    </table>
                  </div>

                  <div style="margin-top:20px;border-left:5px solid #e85d1c;background:#fff7ef;padding:16px 18px;border-radius:12px;">
                    <div style="font-weight:900;color:#101820;margin-bottom:6px;">What happens next?</div>
                    <p style="margin:0;color:#333;font-size:15px;line-height:1.55;">${escapeHTML(CUSTOMER_CONFIRMATION_NOTE)}</p>
                    <p style="margin:12px 0 0;color:#333;font-size:15px;line-height:1.55;">${escapeHTML(TOURNAMENT.paymentNote)}</p>
                  </div>

                  <p style="margin:20px 0 0;color:#777;font-size:13px;line-height:1.5;">Order name: ${escapeHTML(customerName)}<br>Team / Club: ${escapeHTML(customer.clubName)}<br>Age Group: ${escapeHTML(customer.ageGroup)} • ${escapeHTML(customer.gender)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function buildTemplateParams({ toEmail, subject, htmlBody, customer, items, totals, replyTo, fromName }) {
  const orderText = buildOrderText();
  const orderLines = buildOrderLines();

  return {
    subject,
    order_subject: subject,
    html_body: htmlBody,
    message: htmlBody,
    message_html: htmlBody,

    tournament_name: TOURNAMENT.name,
    to_email: toEmail,
    owner_email: TOURNAMENT.emailTo,
    reply_to: replyTo,
    from_name: fromName,

    customer_name: `${customer.firstName} ${customer.lastName}`,
    customer_first_name: customer.firstName,
    customer_last_name: customer.lastName,
    customer_email: customer.email,
    to_customer_email: customer.email,

    club_name: customer.clubName,
    age_group: customer.ageGroup,
    gender: customer.gender,

    order_summary: orderText,
    order_lines: orderLines,
    total_items: totals.count,
    total_cost: money(totals.total),

    payment_note: TOURNAMENT.paymentNote,
    customer_note: CUSTOMER_CONFIRMATION_NOTE,
    items_json: JSON.stringify(items)
  };
}

function clearCompletedOrder() {
  PRODUCTS.forEach(product => {
    LOGO_OPTIONS.forEach(logoOption => {
      SIZE_GROUPS.forEach(group => {
        group.sizes.forEach(size => {
          state.quantities[product.id][logoOption.id][size] = 0;
        });
      });
    });
  });

  ['fname', 'lname', 'email', 'clubName', 'ageGroup', 'gender'].forEach(id => {
    const field = document.getElementById(id);
    if (field) field.value = '';
  });

  renderAll();
}

function hasEmailJSConfig() {
  const values = [
    EMAILJS_CONFIG.publicKey,
    EMAILJS_CONFIG.serviceId,
    EMAILJS_CONFIG.templateId
  ];

  return values.every(value => {
    return value &&
      typeof value === 'string' &&
      value.trim() &&
      !value.startsWith('PASTE_');
  });
}

function loadEmailJSScript() {
  return new Promise((resolve, reject) => {
    if (window.emailjs) {
      resolve();
      return;
    }

    const existingScript = document.querySelector(`script[src="${EMAILJS_SDK_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
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
    throw new Error(
      'EmailJS is not configured. Add your publicKey, serviceId, and templateId in EMAILJS_CONFIG.'
    );
  }

  await loadEmailJSScript();

  if (!window.emailjs) {
    throw new Error('EmailJS browser SDK is unavailable.');
  }

  window.emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
}

async function submitOrder() {
  if (!validateOrder()) return;

  const submitBtn = document.getElementById('submitBtn');
  const customer = getCustomerInfo();
  const items = getOrderItems();
  const totals = getOrderTotals();
  const customerName = `${customer.firstName} ${customer.lastName}`.trim();

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
  }

  try {
    await setupEmailJS();

    const adminHTML = buildAdminEmailHTML(customer, items, totals);
    const customerHTML = buildCustomerEmailHTML(customer, items, totals);

    const adminParams = buildTemplateParams({
      toEmail: TOURNAMENT.emailTo,
      subject: `${TOURNAMENT.name} Order - ${customerName}`,
      htmlBody: adminHTML,
      customer,
      items,
      totals,
      replyTo: customer.email,
      fromName: customerName
    });

    const customerParams = buildTemplateParams({
      toEmail: customer.email,
      subject: `Your ${TOURNAMENT.name} Order Confirmation`,
      htmlBody: customerHTML,
      customer,
      items,
      totals,
      replyTo: TOURNAMENT.emailTo,
      fromName: 'jStyles'
    });

    await window.emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      adminParams
    );

    // Small pause helps avoid EmailJS rate-limit hiccups when sending two messages back-to-back.
    await new Promise(resolve => window.setTimeout(resolve, 1200));

    await window.emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      customerParams
    );

    showToast('✓ Order sent to jStyles and the customer.');
    clearCompletedOrder();
  } catch (error) {
    console.error('Order submission failed:', error);
    const message = error?.message || 'The order could not be sent. Please check your EmailJS settings.';
    showToast(message, true);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Order →';
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
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
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
