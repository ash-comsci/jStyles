'use strict';

/*
   EMAILJS TEMPLATE SETUP NOTES

   Main order template:
   - To Email: {{to_email}} OR your fixed jstyles.pro@gmail.com address
   - Reply To: {{reply_to}}
   - Subject: {{order_subject}}
   - Body can use: {{order_summary}}, {{order_lines}}, {{total_cost}}, {{customer_note}}

   Customer auto-reply:
   - In EmailJS, open your MAIN order template.
   - Go to Auto-Reply.
   - Link your customer confirmation template.
   - In the customer confirmation template, set To Email to: {{to_customer_email}}
   - The customer template can use: {{customer_name}}, {{order_lines}}, {{total_cost}}, {{payment_note}}, {{customer_note}}
*/

/* =========================================================
   TOURNAMENT TEMPLATE SETTINGS
   Change these values for each new tournament page.
   ========================================================= */
const TOURNAMENT = {
  name: 'Warrior Classic',
  emailTo: 'jstyles.pro@gmail.com',
  logo: '/images/warrior_classic.png',
  paymentNote: 'Payment via e-transfer to jstyles.pro@gmail.com after submission.'
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
    ['clubName', customer.clubName, 'club name'],
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
  const orderText = buildOrderText();
  const orderLines = buildOrderLines();
  const customer = getCustomerInfo();
  const totals = getOrderTotals();

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
  }

  try {
    await setupEmailJS();

    const templateParams = {
      tournament_name: TOURNAMENT.name,
      order_subject: `${TOURNAMENT.name} Order - ${customer.firstName} ${customer.lastName}`,

      // Your main order email should go to this address.
      to_email: TOURNAMENT.emailTo,
      owner_email: TOURNAMENT.emailTo,

      // Customer details.
      customer_name: `${customer.firstName} ${customer.lastName}`,
      customer_first_name: customer.firstName,
      customer_last_name: customer.lastName,
      customer_email: customer.email,
      to_customer_email: customer.email,
      reply_to: customer.email,

      club_name: customer.clubName,
      age_group: customer.ageGroup,
      gender: customer.gender,

      // Order details.
      order_summary: orderText,
      order_lines: orderLines,
      total_items: totals.count,
      total_cost: `$${totals.total}`,

      // Notes for customer confirmation.
      payment_note: TOURNAMENT.paymentNote,
      customer_note: CUSTOMER_CONFIRMATION_NOTE
    };

    await window.emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    showToast('Order sent. A confirmation email has been sent to the customer.');
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
