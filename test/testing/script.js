// ════════════════════════════════════════════════════
// SHARED NAVBAR LOADER
// ════════════════════════════════════════════════════
async function loadNav() {
  const navbarContainer = document.getElementById('navbar');
  if (!navbarContainer) return;

  const fallbackNav = `
    <nav class="navbar" aria-label="Main navigation">
      <div class="nav-container">
        <a class="nav-logo" href="/index.html" aria-label="jStyles home">
          <img src="/images/jstyles_logo.png" alt="jStyles logo" onerror="this.remove()" />
          <strong>J<span>STYLES</span></strong>
        </a>
        <button class="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false"><span></span></button>
        <ul class="nav-menu">
          <li><a href="/index.html">Home</a></li>
          <li><a href="/test/testing/wos_GEAR.html">Fan Gear</a></li>
          <li><a href="/test/testing/tournament_MERCH.html">Tournament Merch</a></li>
          <li><a href="/test/testing/custom_MERCH.html">Custom Merch</a></li>
          <li><a href="/test/pages/contact.html">Contact</a></li>
        </ul>
      </div>
    </nav>
  `;

  try {
    const res = await fetch('/nav.html');
    if (!res.ok) throw new Error('Shared nav was not found.');

    const data = await res.text();
    navbarContainer.innerHTML = data;
  } catch (error) {
    console.warn('Navbar was not loaded from /nav.html. Using built-in fallback navbar:', error);
    navbarContainer.innerHTML = fallbackNav;
  }

  const links = document.querySelectorAll('.nav-menu a');
  let currentPage = window.location.pathname.split('/').pop();
  if (currentPage === '') currentPage = 'index.html';

  links.forEach(link => {
    const href = link.getAttribute('href');
    const isCurrentPage = href && href.includes(currentPage);
    const isTournamentOrderPage = currentPage.toLowerCase().includes('order') && href && href.includes('tournament_MERCH');

    if (isCurrentPage || isTournamentOrderPage) {
      link.classList.add('active');
    }
  });

  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('open');
      toggle.classList.toggle('open');
      toggle.setAttribute('aria-expanded', menu.classList.contains('open'));
    });
  }
}

window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
});

// ════════════════════════════════════════════════════
// ORDER FORM DATA
// Change product names, prices, image paths, and size groups here.
// Product images use ../images/products/ by default.
// Ball Cap is one-size only.
// ════════════════════════════════════════════════════
const YOUTH_SIZES = ['Youth S', 'Youth M', 'Youth L', 'Youth XL'];
const ADULT_SIZES = ['Adult XS', 'Adult S', 'Adult M', 'Adult L', 'Adult XL', 'Adult XXL', 'Adult XXXL'];

const PRODUCTS = [
  {
    id: 'pullover-hoodie',
    name: 'Pullover Hoodie',
    image: '../images/products/pullover-hoodie.png',
    price: 50,
    subtitle: 'Youth and adult sizing',
    groups: [
      { label: 'YOUTH SIZES', sizes: YOUTH_SIZES },
      { label: 'ADULT SIZES', sizes: ADULT_SIZES }
    ]
  },
  {
    id: 'sideline-tee',
    name: 'Sideline Tee',
    image: '../images/products/sideline-tee.png',
    price: 25,
    subtitle: 'Youth and adult sizing',
    groups: [
      { label: 'YOUTH SIZES', sizes: YOUTH_SIZES },
      { label: 'ADULT SIZES', sizes: ADULT_SIZES }
    ]
  },
  {
    id: 'womens-tank-top',
    name: "Women's Tank Top",
    image: '../images/products/womens-tank-top.png',
    price: 25,
    subtitle: 'Youth and adult sizing',
    groups: [
      { label: 'YOUTH SIZES', sizes: YOUTH_SIZES },
      { label: 'ADULT SIZES', sizes: ADULT_SIZES }
    ]
  },
  {
    id: 'mens-tank-top',
    name: "Men's Tank Top",
    image: '../images/products/mens-tank-top.png',
    price: 25,
    subtitle: 'Youth and adult sizing',
    groups: [
      { label: 'YOUTH SIZES', sizes: YOUTH_SIZES },
      { label: 'ADULT SIZES', sizes: ADULT_SIZES }
    ]
  },
  {
    id: 'ball-cap',
    name: 'Ball Cap',
    image: '../images/products/ball-cap.png',
    price: 25,
    subtitle: 'One size fits all',
    groups: [
      { label: 'ONE SIZE', sizes: ['One Size Fits All'] }
    ]
  },
  {
    id: 'sweat-pants',
    name: 'Sweat Pants',
    image: '../images/products/sweat-pants.png',
    price: 0,
    subtitle: 'Youth and adult sizing',
    groups: [
      { label: 'YOUTH SIZES', sizes: YOUTH_SIZES },
      { label: 'ADULT SIZES', sizes: ADULT_SIZES }
    ]
  },
  {
    id: 'long-sleeve',
    name: 'Long Sleeve',
    image: '../images/products/long-sleeve.png',
    price: 0,
    subtitle: 'Youth and adult sizing',
    groups: [
      { label: 'YOUTH SIZES', sizes: YOUTH_SIZES },
      { label: 'ADULT SIZES', sizes: ADULT_SIZES }
    ]
  }
];

// ════════════════════════════════════════════════════
// EMAILJS CONFIG
// These are kept from your original uploaded file.
// ════════════════════════════════════════════════════
const EMAILJS_PUBLIC_KEY = 't0ZhDWn8N6TciIGFA';
const EMAILJS_SERVICE_ID = 'service_qpb17yf';
const EMAILJS_TEMPLATE_ID = 'template_m8v30a6';
const ADMIN_EMAIL = 'jstyles.pro@gmail.com';

const counts = {};

const customerInfo = {
  fname: '',
  lname: '',
  email: '',
  notes: '',
  completed: false
};

function money(value) {
  return `$${value}`;
}

function productPriceLabel(product) {
  return product.price > 0 ? money(product.price) : 'PRICE TBD';
}

function safeId(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function productInitials(name) {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('');
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function openCustomerModal() {
  const modal = document.getElementById('customerModal');
  if (!modal) return;

  modal.classList.add('is-open');
  document.body.classList.add('modal-open');

  window.setTimeout(() => {
    const firstName = document.getElementById('fname');
    if (firstName) firstName.focus();
  }, 80);
}

function closeCustomerModal() {
  const modal = document.getElementById('customerModal');
  if (!modal) return;

  modal.classList.remove('is-open');
  document.body.classList.remove('modal-open');
}

function updateCustomerSummary() {
  const summary = document.getElementById('customerSummaryText');
  if (!summary) return;

  if (!customerInfo.completed) {
    summary.textContent = 'Customer information will appear here after the pop-up is completed.';
    return;
  }

  summary.innerHTML = `
    <strong>${escapeHTML(customerInfo.fname)} ${escapeHTML(customerInfo.lname)}</strong><br>
    ${escapeHTML(customerInfo.email)}${customerInfo.notes ? `<br><span>${escapeHTML(customerInfo.notes)}</span>` : ''}
  `;
}

function saveCustomerInfoFromModal() {
  const fname = document.getElementById('fname').value.trim();
  const lname = document.getElementById('lname').value.trim();
  const email = document.getElementById('email').value.trim();
  const notes = document.getElementById('notes').value.trim();

  if (!fname || !lname || !email) {
    showToast('Please enter your first name, last name, and email before choosing merch.', true);
    return false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showToast('Please enter a valid email address.', true);
    return false;
  }

  customerInfo.fname = fname;
  customerInfo.lname = lname;
  customerInfo.email = email;
  customerInfo.notes = notes;
  customerInfo.completed = true;

  updateCustomerSummary();
  closeCustomerModal();
  showToast('Customer info saved. You can now choose your merch.');
  return true;
}

function initCustomerModal() {
  const form = document.getElementById('customerModalForm');
  const editButton = document.getElementById('editCustomerInfoBtn');

  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      saveCustomerInfoFromModal();
    });
  }

  if (editButton) {
    editButton.addEventListener('click', openCustomerModal);
  }

  updateCustomerSummary();
  openCustomerModal();
}

function getCountKey(productId, size) {
  return `${productId}__${safeId(size)}`;
}

function renderProductNav() {
  const nav = document.getElementById('productNav');
  if (!nav) return;

  nav.innerHTML = PRODUCTS.map((product, index) => `
    <button class="quick-link" type="button" data-scroll-target="${product.id}">
      <span class="quick-link-name">${String(index + 1).padStart(2, '0')} / ${escapeHTML(product.name)}</span>
      <span class="quick-link-price">${productPriceLabel(product)}</span>
    </button>
  `).join('');

  nav.querySelectorAll('[data-scroll-target]').forEach(button => {
    button.addEventListener('click', () => {
      const card = document.getElementById(button.dataset.scrollTarget);
      if (!card) return;

      if (card.classList.contains('collapsed')) {
        const header = card.querySelector('.product-header');
        if (header) toggleCard(header);
      }

      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderProducts() {
  const wrap = document.getElementById('productsWrap');
  if (!wrap) return;

  wrap.innerHTML = PRODUCTS.map((product, index) => {
    const groupsHTML = product.groups.map(group => {
      const isOneSize = group.sizes.length === 1 && group.sizes[0].toLowerCase().includes('one size');
      const rowsHTML = group.sizes.map(size => {
        const key = getCountKey(product.id, size);
        return `
          <div class="size-row" data-count-key="${key}">
            <span class="size-label">${escapeHTML(size)}</span>
            <div class="counter" aria-label="Quantity for ${escapeHTML(product.name)} ${escapeHTML(size)}">
              <button class="counter-btn" type="button" data-adjust-key="${key}" data-delta="-1" aria-label="Decrease ${escapeHTML(size)}">−</button>
              <span class="counter-val" id="val_${key}">0</span>
              <button class="counter-btn" type="button" data-adjust-key="${key}" data-delta="1" aria-label="Increase ${escapeHTML(size)}">+</button>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="size-group-label">${escapeHTML(group.label)}</div>
        <div class="size-grid ${isOneSize ? 'one-size' : ''}">${rowsHTML}</div>
      `;
    }).join('');

    return `
      <article class="product-card collapsed" id="${product.id}" data-product-id="${product.id}">
        <button class="product-header" type="button" aria-expanded="false">
          <span class="product-title-line">
            <span class="product-num">${String(index + 1).padStart(2, '0')}</span>
            <span class="product-thumb" aria-hidden="true">
              <img src="${escapeHTML(product.image)}" alt="" loading="lazy" onload="this.closest('.product-thumb').classList.add('has-image'); window.updateCardHeights?.();" onerror="this.closest('.product-thumb').classList.add('image-missing'); this.remove();" />
              <span class="product-thumb-fallback">${productInitials(product.name)}</span>
            </span>
            <span class="product-name-wrap">
              <span class="product-name">${escapeHTML(product.name)}</span>
              <span class="product-subtitle">${escapeHTML(product.subtitle)}</span>
            </span>
          </span>

          <span class="product-meta">
            <span class="product-price">${productPriceLabel(product)}</span>
            <span class="product-badge">0 SELECTED</span>
            <span class="product-chevron">›</span>
          </span>
        </button>

        <div class="product-body" style="max-height: 0px;">${groupsHTML}</div>
      </article>
    `;
  }).join('');

  wrap.querySelectorAll('.product-header').forEach(header => {
    header.addEventListener('click', () => toggleCard(header));
  });

  wrap.querySelectorAll('[data-adjust-key]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      adjust(button.dataset.adjustKey, Number(button.dataset.delta));
    });
  });

  requestAnimationFrame(updateCardHeights);
}

function updateCardHeights() {
  document.querySelectorAll('.product-card:not(.collapsed) .product-body').forEach(body => {
    body.style.maxHeight = `${body.scrollHeight + 32}px`;
  });
}

window.updateCardHeights = updateCardHeights;

function adjust(key, delta) {
  const current = counts[key] || 0;
  const next = Math.max(0, current + delta);
  counts[key] = next;

  const valueElement = document.getElementById(`val_${key}`);
  const row = document.querySelector(`[data-count-key="${key}"]`);

  if (valueElement) {
    valueElement.textContent = next;
    valueElement.classList.toggle('nonzero', next > 0);
  }

  if (row) {
    row.classList.toggle('active', next > 0);
  }

  refreshBadges();
  refreshTotals();
  updateCardHeights();
}

function productTotal(product) {
  return product.groups.reduce((groupTotal, group) => {
    const sizeTotal = group.sizes.reduce((sum, size) => {
      return sum + (counts[getCountKey(product.id, size)] || 0);
    }, 0);
    return groupTotal + sizeTotal;
  }, 0);
}

function refreshBadges() {
  PRODUCTS.forEach(product => {
    const card = document.querySelector(`[data-product-id="${product.id}"]`);
    if (!card) return;

    const badge = card.querySelector('.product-badge');
    const total = productTotal(product);

    badge.textContent = `${total} SELECTED`;
    badge.classList.toggle('visible', total > 0);
  });
}

function calculateTotals() {
  return PRODUCTS.reduce((totals, product) => {
    const qty = productTotal(product);
    totals.items += qty;
    totals.cost += qty * product.price;
    return totals;
  }, { items: 0, cost: 0 });
}

function refreshTotals() {
  const totals = calculateTotals();

  const totalCountEls = [
    document.getElementById('total-count'),
    document.getElementById('sidebarTotalCount')
  ];

  const totalCostEls = [
    document.getElementById('total-cost'),
    document.getElementById('sidebarTotalCost')
  ];

  totalCountEls.forEach(el => {
    if (el) el.textContent = totals.items;
  });

  totalCostEls.forEach(el => {
    if (el) el.textContent = money(totals.cost);
  });
}

function toggleCard(header) {
  const card = header.closest('.product-card');
  const body = card.querySelector('.product-body');
  const isCollapsed = card.classList.contains('collapsed');

  if (isCollapsed) {
    card.classList.remove('collapsed');
    header.setAttribute('aria-expanded', 'true');
    body.style.maxHeight = `${body.scrollHeight + 32}px`;

    window.setTimeout(() => {
      if (!card.classList.contains('collapsed')) {
        body.style.maxHeight = 'none';
      }
    }, 380);
  } else {
    body.style.maxHeight = `${body.scrollHeight + 32}px`;
    requestAnimationFrame(() => {
      card.classList.add('collapsed');
      header.setAttribute('aria-expanded', 'false');
      body.style.maxHeight = '0px';
    });
  }
}

function collectOrderRows() {
  const orderRows = [];
  let grandTotal = 0;
  let grandTotalCost = 0;

  PRODUCTS.forEach(product => {
    const items = [];

    product.groups.forEach(group => {
      group.sizes.forEach(size => {
        const qty = counts[getCountKey(product.id, size)] || 0;
        if (qty > 0) items.push({ size, qty });
      });
    });

    if (!items.length) return;

    const subtotal = items.reduce((sum, item) => sum + item.qty, 0);
    const sectionTotal = subtotal * product.price;

    grandTotal += subtotal;
    grandTotalCost += sectionTotal;
    orderRows.push({
      name: product.name,
      price: product.price,
      priceLabel: productPriceLabel(product),
      items,
      subtotal,
      sectionTotal
    });
  });

  return { orderRows, grandTotal, grandTotalCost };
}

function buildEmailHTML(fname, lname, email, notes, orderRows, grandTotal, grandTotalCost) {
  const now = new Date().toLocaleString('en-CA', { dateStyle: 'long', timeStyle: 'short' });

  const productSections = orderRows.map(({ name, priceLabel, items, subtotal, sectionTotal }) => {
    const rows = items.map(({ size, qty }) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #ddd;color:#111;font-size:14px;">${escapeHTML(size)}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #ddd;color:#d72323;text-align:right;font-weight:bold;">×${qty}</td>
      </tr>
    `).join('');

    return `
      <div style="margin-bottom:20px;border-radius:8px;overflow:hidden;border:1px solid #ddd;">
        <div style="background:#ffffff;padding:12px 16px;border-bottom:2px solid #d72323;">
          <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="font-size:14px;font-weight:700;color:#111;text-transform:uppercase;">${escapeHTML(name)}</td>
              <td style="font-size:12px;font-weight:700;color:#d72323;text-align:right;">${subtotal} ITEMS • ${priceLabel} EACH • ${money(sectionTotal)}</td>
            </tr>
          </table>
        </div>
        <table width="100%" cellspacing="0" cellpadding="0">${rows}</table>
      </div>
    `;
  }).join('');

  const notesRow = notes ? `
    <tr>
      <td style="padding:8px 0;color:#666;width:150px;">Name / Notes</td>
      <td style="padding:8px 0;color:#111;">${escapeHTML(notes)}</td>
    </tr>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;background:#f4f4f4;font-family:Arial,sans-serif;">
      <table width="100%" style="padding:30px;">
        <tr>
          <td align="center">
            <table width="620" style="border:1px solid #ddd;background:#fff;border-collapse:collapse;">
              <tr>
                <td style="border-top:5px solid #d72323;padding:30px;text-align:center;">
                  <div style="color:#d72323;font-size:12px;letter-spacing:3px;font-weight:bold;">JSTYLES TOURNAMENT MERCH</div>
                  <div style="font-size:30px;font-weight:700;color:#111;line-height:1.05;">NEW ORDER<br><span style="color:#d72323;">RECEIVED</span></div>
                </td>
              </tr>

              <tr>
                <td style="padding:24px;">
                  <table width="100%" cellspacing="0" cellpadding="0">
                    <tr><td style="padding:8px 0;color:#666;width:150px;">Name</td><td style="padding:8px 0;color:#111;">${escapeHTML(fname)} ${escapeHTML(lname)}</td></tr>
                    <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHTML(email)}" style="color:#d72323;">${escapeHTML(email)}</a></td></tr>
                    <tr><td style="padding:8px 0;color:#666;">Date</td><td style="padding:8px 0;color:#111;">${escapeHTML(now)}</td></tr>
                    ${notesRow}
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:0 24px 24px;">${productSections}</td>
              </tr>

              <tr>
                <td style="padding:24px;background:#fafafa;border-top:1px solid #ddd;">
                  <table width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="color:#666;">TOTAL ITEMS</td>
                      <td style="text-align:right;font-weight:700;color:#111;">${grandTotal}</td>
                    </tr>
                    <tr>
                      <td style="color:#666;padding-top:8px;">TOTAL COST</td>
                      <td style="text-align:right;padding-top:8px;"><span style="background:#d72323;color:#fff;font-size:20px;font-weight:700;padding:8px 18px;border-radius:999px;">${money(grandTotalCost)}</span></td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="text-align:center;padding:18px;color:#777;font-size:12px;">Submitted via jStyles tournament merch order form</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function buildCustomerEmail(fname, orderRows, grandTotal, grandTotalCost) {
  const itemsHTML = orderRows.map(({ name, priceLabel, items, sectionTotal }) => {
    const rows = items.map(({ size, qty }) => `
      <tr>
        <td style="padding:6px 0;color:#111;">${escapeHTML(size)}</td>
        <td style="padding:6px 0;text-align:right;color:#d72323;font-weight:bold;">×${qty}</td>
      </tr>
    `).join('');

    return `
      <div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid #ddd;">
        <strong style="color:#111;text-transform:uppercase;">${escapeHTML(name)}</strong>
        <div style="font-size:12px;color:#777;margin:3px 0 8px;">${priceLabel} each</div>
        <table width="100%" cellspacing="0" cellpadding="0">${rows}</table>
        <div style="text-align:right;font-weight:bold;color:#d72323;">${money(sectionTotal)}</div>
      </div>
    `;
  }).join('');

  return `
    <html>
    <body style="font-family:Arial,sans-serif;padding:20px;background:#f4f4f4;color:#111;">
      <div style="max-width:620px;margin:auto;background:#fff;border-top:5px solid #d72323;padding:26px;border-radius:8px;">
        <h2 style="color:#d72323;margin:0 0 12px;">Order Confirmation</h2>
        <p>Hi ${escapeHTML(fname)},</p>
        <p>Thanks for your tournament merch order! Here’s your summary:</p>
        ${itemsHTML}
        <p><strong>Total Items:</strong> ${grandTotal}</p>
        <p><strong>Total Cost:</strong> <span style="color:#d72323;font-size:20px;">${money(grandTotalCost)}</span></p>
        <p style="margin-top:20px;">Orders will be started once e-transfer has been accepted to <strong>${ADMIN_EMAIL}</strong>.</p>
      </div>
    </body>
    </html>
  `;
}

function clearOrderSelections() {
  Object.keys(counts).forEach(key => {
    counts[key] = 0;
  });

  document.querySelectorAll('.counter-val').forEach(el => {
    el.textContent = '0';
    el.classList.remove('nonzero');
  });

  document.querySelectorAll('.size-row').forEach(row => {
    row.classList.remove('active');
  });

  document.querySelectorAll('.product-badge').forEach(badge => {
    badge.textContent = '0 SELECTED';
    badge.classList.remove('visible');
  });

  refreshTotals();
}

function clearCustomerInfo() {
  customerInfo.fname = '';
  customerInfo.lname = '';
  customerInfo.email = '';
  customerInfo.notes = '';
  customerInfo.completed = false;

  ['fname', 'lname', 'email', 'notes'].forEach(id => {
    const field = document.getElementById(id);
    if (field) field.value = '';
  });

  updateCustomerSummary();
}

async function submitOrder() {
  if (!customerInfo.completed && !saveCustomerInfoFromModal()) {
    openCustomerModal();
    return;
  }

  const fname = customerInfo.fname;
  const lname = customerInfo.lname;
  const email = customerInfo.email;
  const notes = customerInfo.notes;

  const { orderRows, grandTotal, grandTotalCost } = collectOrderRows();

  if (grandTotal === 0) {
    showToast('Please add at least one item to your order.', true);
    return;
  }

  if (typeof emailjs === 'undefined') {
    showToast('EmailJS did not load. Check your internet connection or script link.', true);
    return;
  }

  if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
    showToast('Add your EmailJS keys to enable sending.', true);
    console.log('Order data:', { fname, lname, email, notes, orderRows, grandTotal, grandTotalCost });
    return;
  }

  const buttons = [document.getElementById('submitBtn'), document.getElementById('sidebarSubmitBtn')].filter(Boolean);
  buttons.forEach(btn => {
    btn.disabled = true;
    btn.textContent = 'SENDING…';
  });

  try {
    const adminHTML = buildEmailHTML(fname, lname, email, notes, orderRows, grandTotal, grandTotalCost);
    const customerHTML = buildCustomerEmail(fname, orderRows, grandTotal, grandTotalCost);

    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      subject: `New jStyles Tournament Merch Order — ${fname} ${lname}`,
      html_body: adminHTML,
      to_email: ADMIN_EMAIL,
      from_name: `${fname} ${lname}`,
      reply_to: email
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      subject: 'Your jStyles Tournament Merch Order Confirmation',
      html_body: customerHTML,
      to_email: email,
      from_name: 'jStyles',
      reply_to: ADMIN_EMAIL
    });

    showToast('✓ Order sent successfully!');
    clearOrderSelections();
    clearCustomerInfo();
    openCustomerModal();
  } catch (err) {
    console.error('EmailJS error:', err);
    showToast('Send failed — check your EmailJS template, service, and allowed fields.', true);
  } finally {
    buttons.forEach(btn => {
      btn.disabled = false;
      btn.textContent = 'SEND ORDER →';
    });
  }
}

function showToast(message, isErr = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.toggle('err', isErr);
  toast.classList.add('show');

  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove('show');
  }, 4200);
}

function initEmailJS() {
  if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }
}

function initSubmitButtons() {
  [document.getElementById('submitBtn'), document.getElementById('sidebarSubmitBtn')]
    .filter(Boolean)
    .forEach(button => button.addEventListener('click', submitOrder));
}

function initOrderForm() {
  renderProductNav();
  renderProducts();
  initCustomerModal();
  initSubmitButtons();
  initEmailJS();
  refreshTotals();

  window.addEventListener('resize', updateCardHeights);
  window.addEventListener('load', updateCardHeights);
}

document.addEventListener('DOMContentLoaded', () => {
  loadNav();
  initOrderForm();
});

console.log('jStyles tournament merch order form loaded successfully.');
