'use strict';

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

/* Optional EmailJS setup.
   Leave these blank to use the built-in mailto fallback. */
const EMAILJS_CONFIG = {
  publicKey: '',
  serviceId: '',
  templateId: ''
};

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
    sizeChart: '/images/sizing_chart.png',
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
    sizeChart: '/images/sizing_chart.png',
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
    sizeChart: '/images/sizing_chart.png',
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
  createSizeChartStyles();

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
      ${product.sizeChart ? `
        <button class="size-chart-btn" type="button" id="sizeChartBtn">
          View Sizing Chart
        </button>
      ` : ''}
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

  const sizeChartBtn = panel.querySelector('#sizeChartBtn');
  if (sizeChartBtn && product.sizeChart) {
    sizeChartBtn.addEventListener('click', () => {
      openSizeChart(product.sizeChart, `${product.name} Sizing Chart`);
    });
  }
}

/* =========================================================
   SIZING CHART MODAL
   The button is rendered from product.sizeChart.
   Change each product's sizeChart path if hoodies/tees need different charts.
   ========================================================= */
function createSizeChartStyles() {
  if (document.getElementById('sizeChartModalStyles')) return;

  const style = document.createElement('style');
  style.id = 'sizeChartModalStyles';
  style.textContent = `
    .size-chart-btn {
      margin-top: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 38px;
      padding: 9px 16px;
      border-radius: 999px;
      border: 1px solid rgba(255, 226, 122, 0.48);
      background: rgba(255, 218, 105, 0.12);
      color: #fff2bf;
      font-family: 'Bebas Neue', Impact, sans-serif;
      font-size: 15px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      cursor: pointer;
      transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    }

    .size-chart-btn:hover,
    .size-chart-btn:focus-visible {
      transform: translateY(-2px);
      background: rgba(255, 218, 105, 0.22);
      border-color: rgba(255, 226, 122, 0.82);
      box-shadow: 0 12px 28px rgba(214, 168, 55, 0.28);
      outline: none;
    }

    .size-chart-modal {
      position: fixed;
      inset: 0;
      z-index: 3000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }

    .size-chart-modal.show {
      display: flex;
    }

    .size-chart-window {
      position: relative;
      width: min(900px, 96vw);
      max-height: 90vh;
      padding: 22px;
      border-radius: 18px;
      background:
        radial-gradient(circle at 50% 0%, rgba(255, 226, 122, 0.18), transparent 42%),
        linear-gradient(145deg, #151008, #050403);
      border: 1px solid rgba(255, 218, 105, 0.38);
      box-shadow: 0 28px 90px rgba(0, 0, 0, 0.72);
      overflow: auto;
    }

    .size-chart-window h3 {
      margin: 0 48px 16px 0;
      color: #ffe27a;
      font-family: 'Bebas Neue', Impact, sans-serif;
      font-size: clamp(26px, 5vw, 36px);
      line-height: 1;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .size-chart-window img {
      width: 100%;
      height: auto;
      display: block;
      border-radius: 12px;
      background: #fff;
    }

    .size-chart-close {
      position: absolute;
      top: 12px;
      right: 14px;
      width: 38px;
      height: 38px;
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.58);
      color: #fff;
      font-size: 28px;
      line-height: 1;
      cursor: pointer;
      transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
    }

    .size-chart-close:hover,
    .size-chart-close:focus-visible {
      background: rgba(255, 106, 0, 0.22);
      border-color: rgba(255, 106, 0, 0.7);
      transform: scale(1.04);
      outline: none;
    }

    body.modal-open {
      overflow: hidden;
    }
  `;

  document.head.appendChild(style);
}

function createSizeChartModal() {
  createSizeChartStyles();

  if (document.getElementById('sizeChartModal')) return;

  const modal = document.createElement('div');
  modal.id = 'sizeChartModal';
  modal.className = 'size-chart-modal';
  modal.setAttribute('aria-hidden', 'true');

  modal.innerHTML = `
    <div class="size-chart-window" role="dialog" aria-modal="true" aria-labelledby="sizeChartTitle">
      <button class="size-chart-close" type="button" aria-label="Close sizing chart">×</button>
      <h3 id="sizeChartTitle">Sizing Chart</h3>
      <img id="sizeChartImg" src="" alt="Sizing chart" />
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', event => {
    if (
      event.target.id === 'sizeChartModal' ||
      event.target.classList.contains('size-chart-close')
    ) {
      closeSizeChart();
    }
  });
}

function openSizeChart(imageSrc, title = 'Sizing Chart') {
  createSizeChartModal();

  const modal = document.getElementById('sizeChartModal');
  const img = document.getElementById('sizeChartImg');
  const heading = document.getElementById('sizeChartTitle');

  if (!modal || !img || !heading) return;

  heading.textContent = title;
  img.src = imageSrc;
  img.alt = title;

  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeSizeChart() {
  const modal = document.getElementById('sizeChartModal');
  if (!modal) return;

  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
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

  return `${TOURNAMENT.name} Order\n\nCustomer Information\nName: ${customer.firstName} ${customer.lastName}\nEmail: ${customer.email}\nClub Name: ${customer.clubName}\nAge Group: ${customer.ageGroup}\nGender: ${customer.gender}\n\nOrder Items\n${itemLines}\n\nTotal Items: ${totals.count}\nTotal Cost: $${totals.total}\n\n${TOURNAMENT.paymentNote}`;
}

function canUseEmailJS() {
  return Boolean(
    window.emailjs &&
    EMAILJS_CONFIG.publicKey &&
    EMAILJS_CONFIG.serviceId &&
    EMAILJS_CONFIG.templateId
  );
}

async function submitOrder() {
  if (!validateOrder()) return;

  const submitBtn = document.getElementById('submitBtn');
  const orderText = buildOrderText();
  const customer = getCustomerInfo();
  const totals = getOrderTotals();

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
  }

  try {
    if (canUseEmailJS()) {
      window.emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
      await window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
        tournament_name: TOURNAMENT.name,
        customer_name: `${customer.firstName} ${customer.lastName}`,
        customer_email: customer.email,
        club_name: customer.clubName,
        age_group: customer.ageGroup,
        gender: customer.gender,
        order_summary: orderText,
        total_items: totals.count,
        total_cost: `$${totals.total}`,
        to_email: TOURNAMENT.emailTo
      });
      showToast('Order sent. Thank you!');
    } else {
      const subject = encodeURIComponent(`${TOURNAMENT.name} Order - ${customer.firstName} ${customer.lastName}`);
      const body = encodeURIComponent(orderText);
      window.location.href = `mailto:${TOURNAMENT.emailTo}?subject=${subject}&body=${body}`;
      showToast('Email opened with your order details.');
    }
  } catch (error) {
    console.error('Order submission failed:', error);
    showToast('The order could not be sent. Please try again.', true);
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

    closeSizeChart();

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
