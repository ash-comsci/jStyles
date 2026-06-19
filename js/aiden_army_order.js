'use strict';

/* =========================================================
   AIDEN'S ARMY FUNDRAISER ORDER PAGE
   Edit the settings and product image paths below as needed.
   ========================================================= */

const TOURNAMENT = {
  name: "Aiden’s Army Fundraiser",
  emailTo: "jstyles.pro@gmail.com",
  paymentEmail: "jstyles.pro@gmail.com",
  paymentNote:
    "Please send the total by e-transfer to jstyles.pro@gmail.com after your order is confirmed. Include “Aiden’s Army” and your name in the e-transfer message.",
  confirmationNote:
    "Thank you for supporting Aiden’s Army. We will contact you when your order is ready and confirm pickup or delivery details with you directly."
};

/*
  The EmailJS template body should be only:
  {{{html_body}}}

  This page sends one message to the fundraiser organizer and one
  confirmation to the customer using the same template.
*/
const EMAILJS_CONFIG = {
  publicKey: "t0ZhDWn8N6TciIGFA",
  serviceId: "service_qpb17yf",
  templateId: "template_hfxilqc"
};

const PRODUCTS = [
  {
    id: "green-hoodie",
    name: "Kelly Green Hoodie",
    price: 60,
    image: "../images/aiden_hoodie.png",
    imageFileHint: "aiden_hoodie.png",
    tags: ["Hoodie", "Kelly Green", "$60"],
    description: "A warm, comfortable hoodie made to show your support for Aiden’s Army.",
    sizeGroups: [
      { title: "Youth Sizes", sizes: ["Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"] },
      { title: "Adult Sizes", sizes: ["Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL"] }
    ]
  },
  {
    id: "green-tee",
    name: "Kelly Green Tee",
    price: 25,
    image: "../images/aiden_tee.png",
    imageFileHint: "aiden_tee_green.png",
    tags: ["T-Shirt", "Kelly Green", "$25"],
    description: "A lightweight everyday tee for friends, family, teammates, and supporters.",
    sizeGroups: [
      { title: "Youth Sizes", sizes: ["Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL"] },
      { title: "Adult Sizes", sizes: ["Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL"] }
    ]
  },
  {
    id: "green-cap",
    name: "Kelly Green Ball Cap",
    price: 25,
    image: "../images/aiden_cap.png",
    imageFileHint: "aiden_cap.png",
    tags: ["Ball Cap", "One Size", "$25"],
    description: "A clean Kelly green ball cap with a one-size fit and a whole lot of support behind it.",
    sizeGroups: [
      { title: "Cap Size", sizes: ["One Size"] }
    ]
  }
];

const state = {
  activeProductId: PRODUCTS[0].id,
  quantities: {},
  donation: 0
};

let emailjsReady = false;
let lastFocusedElement = null;

PRODUCTS.forEach(product => {
  state.quantities[product.id] = {};
  product.sizeGroups.forEach(group => {
    group.sizes.forEach(size => {
      state.quantities[product.id][size] = 0;
    });
  });
});

/* =========================================================
   NAVBAR
   ========================================================= */
async function loadNav() {
  const navbarContainer = document.getElementById("navbar");
  if (!navbarContainer) return;

  const possibleNavPaths = ["/nav.html", "../nav.html", "./nav.html"];

  for (const path of possibleNavPaths) {
    try {
      const response = await fetch(path, { cache: "no-cache" });
      if (!response.ok) continue;
      navbarContainer.innerHTML = await response.text();
      setupNav(navbarContainer);
      return;
    } catch {
      // Try the next possible location.
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
          <img src="/images/jstyles_logo.png" alt="jStyles logo" onerror="this.style.display='none'" />
          <strong>J<span>STYLES</span></strong>
        </a>
        <button class="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false"><span></span></button>
        <nav aria-label="Main navigation">
          <ul class="nav-menu">
            <li><a href="/index.html">Home</a></li>
            <li><a href="/WOS/index.html">Fan Gear</a></li>
            <li><a href="/tournament/index.html">Tournament Merch</a></li>
            <li><a href="/custom/index.html">Custom Merch</a></li>
            <li><a href="mailto:${TOURNAMENT.emailTo}">Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>
  `;
}

function setupNav(navbarContainer) {
  const nav = navbarContainer.querySelector(".navbar");
  const toggle = navbarContainer.querySelector(".nav-toggle");
  const menu = navbarContainer.querySelector(".nav-menu");
  const links = navbarContainer.querySelectorAll(".nav-menu a");
  const currentPath = window.location.pathname.replace(/\/$/, "/index.html");

  links.forEach(link => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;

    const linkPath = new URL(href, window.location.origin).pathname.replace(/\/$/, "/index.html");
    link.classList.toggle("active", linkPath === currentPath);

    link.addEventListener("click", () => closeMobileNav(menu, toggle));
  });

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  setScrolledNav();
}

function closeMobileNav(menu = document.querySelector(".nav-menu"), toggle = document.querySelector(".nav-toggle")) {
  if (!menu || !toggle) return;
  menu.classList.remove("open");
  toggle.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
}

function setScrolledNav() {
  document.querySelector(".navbar")?.classList.toggle("scrolled", window.scrollY > 40);
}

/* =========================================================
   ORDER STATE HELPERS
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

function getDonation() {
  return Math.max(0, Math.round(Number(state.donation) || 0));
}

function getOrderTotals() {
  const items = getOrderItems();
  const itemTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const donation = getDonation();

  return {
    count: items.reduce((sum, item) => sum + item.qty, 0),
    itemTotal,
    donation,
    total: itemTotal + donation
  };
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(0)}`;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatProductTitle(name) {
  const words = String(name || "").trim().split(/\s+/);
  if (words.length < 2) return escapeHTML(name);
  const first = words.shift();
  return `${escapeHTML(first)} <span>${escapeHTML(words.join(" "))}</span>`;
}

/* =========================================================
   PRODUCT UI
   ========================================================= */
function renderProductTabs() {
  const tabs = document.getElementById("productTabs");
  if (!tabs) return;

  tabs.innerHTML = PRODUCTS.map(product => {
    const count = getProductCount(product.id);
    const active = product.id === state.activeProductId ? "active" : "";
    return `
      <button class="tab-btn ${active}" type="button" data-product-id="${product.id}">
        ${escapeHTML(product.name)}
        <span class="tab-price">${formatMoney(product.price)}</span>
        ${count ? `<span class="tab-count">${count}</span>` : ""}
      </button>
    `;
  }).join("");

  tabs.querySelectorAll(".tab-btn").forEach(button => {
    button.addEventListener("click", () => {
      state.activeProductId = button.dataset.productId;
      renderAll();
    });
  });
}

function productPlaceholderMarkup(product) {
  return `
    <div class="product-img-placeholder">
      <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
        <path d="M18 28 28 18h24l10 10-6 9v28H24V37l-6-9Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
        <path d="M31 18c1.3 5.5 4.3 8 9 8s7.7-2.5 9-8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        <path d="M26 65h28" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      </svg>
      <span>${escapeHTML(product.name)}<br>Image Placeholder</span>
      <small>Add <b>images/${escapeHTML(product.imageFileHint)}</b> when the product photo is ready.</small>
    </div>
  `;
}

function renderProductImage() {
  const panel = document.getElementById("imagePanel");
  if (!panel) return;

  const product = getProduct(state.activeProductId);
  panel.innerHTML = `
    <img class="product-img" src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" />
    <div class="product-tag-strip">
      ${product.tags.map(tag => `<span class="product-tag">${escapeHTML(tag)}</span>`).join("")}
    </div>
    <div class="product-price-display">
      <div class="price-label">Fundraiser Price</div>
      <div class="price-val"><span>$</span>${product.price}</div>
    </div>
  `;

  const image = panel.querySelector(".product-img");
  image.addEventListener("error", () => {
    image.replaceWith(document.createRange().createContextualFragment(productPlaceholderMarkup(product)));
  }, { once: true });
}

function renderProductOptions() {
  const panel = document.getElementById("optionsPanel");
  if (!panel) return;

  const product = getProduct(state.activeProductId);

  const groupMarkup = product.sizeGroups.map(group => {
    const rows = group.sizes.map(size => {
      const qty = state.quantities[product.id][size] || 0;
      return `
        <div class="size-row ${qty > 0 ? "active" : ""}">
          <div class="size-label">${escapeHTML(size)}</div>
          <div class="counter" aria-label="${escapeHTML(product.name)} ${escapeHTML(size)} quantity">
            <button class="counter-btn" type="button" aria-label="Remove one ${escapeHTML(size)}" data-action="decrease" data-size="${escapeHTML(size)}">−</button>
            <span class="counter-val ${qty > 0 ? "nonzero" : ""}">${qty}</span>
            <button class="counter-btn" type="button" aria-label="Add one ${escapeHTML(size)}" data-action="increase" data-size="${escapeHTML(size)}">+</button>
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="size-group">
        <div class="size-group-title">${escapeHTML(group.title)}</div>
        <div class="size-rows">${rows}</div>
      </div>
    `;
  }).join("");

  panel.innerHTML = `
    <div>
      <h2 class="product-options-name">${formatProductTitle(product.name)}</h2>
      <p class="product-options-meta">${escapeHTML(product.description)}</p>
    </div>
    ${groupMarkup}
    <div class="product-subtotal">
      <div>
        <span class="product-subtotal-label">This Item Total</span>
        <strong class="product-subtotal-val">${formatMoney(getProductSubtotal(product.id))}</strong>
      </div>
      <div>
        <span class="product-subtotal-label">Quantity</span>
        <strong class="product-subtotal-val">${getProductCount(product.id)}</strong>
      </div>
    </div>
  `;

  panel.querySelectorAll(".counter-btn").forEach(button => {
    button.addEventListener("click", () => {
      updateQuantity(product.id, button.dataset.size, button.dataset.action === "increase" ? 1 : -1);
    });
  });
}

function updateQuantity(productId, size, direction) {
  const current = state.quantities[productId][size] || 0;
  state.quantities[productId][size] = Math.max(0, current + direction);
  renderAll();
}

function renderDonationControls() {
  const customDonation = document.getElementById("customDonation");
  if (customDonation && document.activeElement !== customDonation) {
    customDonation.value = getDonation() || "";
  }

  document.querySelectorAll(".donation-btn").forEach(button => {
    const amount = Number(button.dataset.donation);
    button.classList.toggle("active", getDonation() === amount);
  });
}

function bindDonationControls() {
  document.querySelectorAll(".donation-btn").forEach(button => {
    button.addEventListener("click", () => {
      const amount = Number(button.dataset.donation) || 0;
      state.donation = getDonation() === amount ? 0 : amount;
      const customDonation = document.getElementById("customDonation");
      if (customDonation) customDonation.value = state.donation || "";
      renderAll();
    });
  });

  const customDonation = document.getElementById("customDonation");
  customDonation?.addEventListener("input", () => {
    state.donation = Math.max(0, Math.round(Number(customDonation.value) || 0));
    renderAll();
  });
}

function renderSummary() {
  const items = getOrderItems();
  const totals = getOrderTotals();

  setText("totalCount", totals.count);
  setText("totalCost", formatMoney(totals.total));
  setText("headerTotalItems", totals.count);
  setText("headerTotalCost", formatMoney(totals.total));

  const headerOrderList = document.getElementById("headerOrderList");
  if (!headerOrderList) return;

  const rows = items.map(item => `
    <div class="header-order-item">
      <div>
        <strong>${escapeHTML(item.productName)}</strong>
        <small>${escapeHTML(item.size)} · ${item.qty} × ${formatMoney(item.price)}</small>
      </div>
      <span class="header-order-price">${formatMoney(item.subtotal)}</span>
    </div>
  `);

  if (totals.donation > 0) {
    rows.push(`
      <div class="header-order-item">
        <div>
          <strong>Extra Support</strong>
          <small>Optional fundraiser donation</small>
        </div>
        <span class="header-order-price">${formatMoney(totals.donation)}</span>
      </div>
    `);
  }

  headerOrderList.innerHTML = rows.length
    ? rows.join("")
    : '<span class="header-order-empty">No items selected yet.</span>';
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderAll() {
  renderProductTabs();
  renderProductImage();
  renderProductOptions();
  renderDonationControls();
  renderSummary();
}

/* =========================================================
   ORDER REVIEW
   ========================================================= */
function getCustomer() {
  return {
    firstName: document.getElementById("fname")?.value.trim() || "",
    lastName: document.getElementById("lname")?.value.trim() || "",
    email: document.getElementById("email")?.value.trim() || "",
    phone: document.getElementById("phone")?.value.trim() || "",
    fulfillment: document.getElementById("fulfillment")?.value || "",
    note: document.getElementById("customerNote")?.value.trim() || ""
  };
}

function validateForReview() {
  const totals = getOrderTotals();
  if (totals.count < 1 && totals.donation < 1) {
    showToast("Please add at least one apparel item or an optional support amount before continuing.", true);
    document.getElementById("productTabs")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }

  const customer = getCustomer();
  const required = [
    ["fname", customer.firstName, "Please enter your first name."],
    ["lname", customer.lastName, "Please enter your last name."],
    ["email", customer.email, "Please enter a valid email address."]
  ];

  for (const [id, value, message] of required) {
    const field = document.getElementById(id);
    if (!value || (id === "email" && !field.checkValidity())) {
      showToast(message, true);
      field?.focus();
      return false;
    }
  }

  return true;
}

function openReviewModal() {
  if (!validateForReview()) return;

  const modal = document.getElementById("reviewModal");
  const summary = document.getElementById("modalSummary");
  const totalElement = document.getElementById("modalTotal");
  const paymentNote = document.getElementById("modalPaymentNote");
  const items = getOrderItems();
  const totals = getOrderTotals();

  lastFocusedElement = document.activeElement;

  const rows = items.map(item => `
    <div class="modal-item">
      <div>
        <strong>${escapeHTML(item.productName)}</strong>
        <small>${escapeHTML(item.size)} · ${item.qty} × ${formatMoney(item.price)}</small>
      </div>
      <span class="modal-item-price">${formatMoney(item.subtotal)}</span>
    </div>
  `);

  if (totals.donation > 0) {
    rows.push(`
      <div class="modal-item">
        <div>
          <strong>Extra Support Donation</strong>
          <small>Optional addition to Aiden’s Army</small>
        </div>
        <span class="modal-item-price">${formatMoney(totals.donation)}</span>
      </div>
    `);
  }

  summary.innerHTML = rows.join("");
  totalElement.textContent = formatMoney(totals.total);
  paymentNote.textContent = TOURNAMENT.paymentNote;

  modal.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("confirmSubmitBtn")?.focus();
}

function closeReviewModal() {
  const modal = document.getElementById("reviewModal");
  if (!modal || modal.hidden) return;

  modal.hidden = true;
  document.body.style.overflow = "";
  lastFocusedElement?.focus?.();
}

/* =========================================================
   EMAILS
   ========================================================= */
function buildOrderLines(items, totals) {
  const lines = items.map(item =>
    `${item.productName} — ${item.size} × ${item.qty} = ${formatMoney(item.subtotal)}`
  );

  if (totals.donation > 0) lines.push(`Extra Support Donation = ${formatMoney(totals.donation)}`);

  return lines.join("\n");
}

function buildAdminEmailHTML(customer, items, totals) {
  const now = new Date().toLocaleString("en-CA", { dateStyle: "long", timeStyle: "short" });
  const itemRows = items.map(item => `
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #d9eadc;color:#111;font-weight:700;">${escapeHTML(item.productName)}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #d9eadc;color:#3d6545;">${escapeHTML(item.size)}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #d9eadc;color:#111;text-align:center;font-weight:800;">${item.qty}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #d9eadc;color:#06712d;text-align:right;font-weight:900;">${formatMoney(item.subtotal)}</td>
    </tr>
  `).join("");

  const donationRow = totals.donation > 0 ? `
    <tr>
      <td colspan="3" style="padding:12px 14px;border-bottom:1px solid #d9eadc;color:#134c23;font-weight:800;">Extra Support Donation</td>
      <td style="padding:12px 14px;border-bottom:1px solid #d9eadc;color:#06712d;text-align:right;font-weight:900;">${formatMoney(totals.donation)}</td>
    </tr>
  ` : "";

  const noteRow = customer.note ? `
    <tr><td style="padding:7px 0;color:#56745d;width:145px;vertical-align:top;">Order Note</td><td style="padding:7px 0;color:#111;white-space:pre-line;">${escapeHTML(customer.note)}</td></tr>
  ` : "";

  return `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;background:#ecf3ed;font-family:Arial,Helvetica,sans-serif;color:#111;">
        <table width="100%" cellspacing="0" cellpadding="0" style="padding:28px;background:#ecf3ed;">
          <tr>
            <td align="center">
              <table width="680" cellspacing="0" cellpadding="0" style="max-width:680px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #a4d8af;box-shadow:0 18px 45px rgba(0,0,0,0.16);">
                <tr>
                  <td style="background:linear-gradient(135deg,#06220e 0%,#0c481e 52%,#08a844 100%);padding:34px 28px;text-align:center;color:#fff;">
                    <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#b8f6c6;font-weight:900;">${escapeHTML(TOURNAMENT.name)}</div>
                    <div style="font-size:34px;line-height:1.05;font-weight:900;margin-top:8px;text-transform:uppercase;">New Order Received</div>
                    <div style="margin-top:12px;color:#e5ffea;font-size:14px;">Submitted ${escapeHTML(now)}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:26px 28px 12px;">
                    <h3 style="margin:0 0 14px;color:#111;font-size:18px;">Customer Information</h3>
                    <table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
                      <tr><td style="padding:7px 0;color:#56745d;width:145px;">Name</td><td style="padding:7px 0;color:#111;font-weight:700;">${escapeHTML(customer.firstName)} ${escapeHTML(customer.lastName)}</td></tr>
                      <tr><td style="padding:7px 0;color:#56745d;">Email</td><td style="padding:7px 0;"><a href="mailto:${escapeHTML(customer.email)}" style="color:#06712d;font-weight:700;">${escapeHTML(customer.email)}</a></td></tr>
                      <tr><td style="padding:7px 0;color:#56745d;">Phone</td><td style="padding:7px 0;color:#111;">${escapeHTML(customer.phone || "Not provided")}</td></tr>
                      <tr><td style="padding:7px 0;color:#56745d;">Pickup / Delivery</td><td style="padding:7px 0;color:#111;">${escapeHTML(customer.fulfillment || "Not selected")}</td></tr>
                      ${noteRow}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 28px 24px;">
                    <h3 style="margin:0 0 14px;color:#111;font-size:18px;">Order Details</h3>
                    <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #d9eadc;border-radius:12px;overflow:hidden;border-collapse:separate;border-spacing:0;font-size:13px;">
                      <tr style="background:#093317;color:#b8f6c6;text-transform:uppercase;font-size:11px;letter-spacing:1px;">
                        <th align="left" style="padding:12px 14px;">Item</th>
                        <th align="left" style="padding:12px 14px;">Size</th>
                        <th align="center" style="padding:12px 14px;">Qty</th>
                        <th align="right" style="padding:12px 14px;">Subtotal</th>
                      </tr>
                      ${itemRows}
                      ${donationRow}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 28px;background:#f2faf4;border-top:1px solid #d9eadc;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr><td style="color:#496f52;font-weight:700;">TOTAL APPAREL ITEMS</td><td style="text-align:right;color:#111;font-size:18px;font-weight:900;">${totals.count}</td></tr>
                      <tr><td style="padding-top:10px;color:#496f52;font-weight:700;">ORDER TOTAL</td><td style="padding-top:10px;text-align:right;"><span style="display:inline-block;background:#093317;color:#b8f6c6;font-size:24px;font-weight:900;padding:9px 20px;border-radius:999px;border:1px solid #08a844;">${formatMoney(totals.total)}</span></td></tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="padding:18px 28px;text-align:center;color:#56745d;font-size:12px;">Submitted through the jStyles Aiden’s Army fundraiser order form.</td></tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function buildCustomerEmailHTML(customer, items, totals) {
  const rows = items.map(item => `
    <tr>
      <td style="padding:11px 0;border-bottom:1px solid #d9eadc;">
        <strong style="color:#111;">${escapeHTML(item.productName)}</strong><br>
        <span style="color:#57775f;font-size:12px;">${escapeHTML(item.size)} · ${item.qty} × ${formatMoney(item.price)}</span>
      </td>
      <td style="padding:11px 0;border-bottom:1px solid #d9eadc;text-align:right;color:#06712d;font-weight:900;">${formatMoney(item.subtotal)}</td>
    </tr>
  `).join("");

  const donationRow = totals.donation > 0 ? `
    <tr>
      <td style="padding:11px 0;border-bottom:1px solid #d9eadc;">
        <strong style="color:#111;">Extra Support Donation</strong><br>
        <span style="color:#57775f;font-size:12px;">Optional addition to Aiden’s Army</span>
      </td>
      <td style="padding:11px 0;border-bottom:1px solid #d9eadc;text-align:right;color:#06712d;font-weight:900;">${formatMoney(totals.donation)}</td>
    </tr>
  ` : "";

  return `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;background:#ecf3ed;font-family:Arial,Helvetica,sans-serif;color:#111;">
        <table width="100%" cellspacing="0" cellpadding="0" style="padding:28px;background:#ecf3ed;">
          <tr>
            <td align="center">
              <table width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #a4d8af;box-shadow:0 18px 45px rgba(0,0,0,0.15);">
                <tr>
                  <td style="background:linear-gradient(135deg,#06220e 0%,#0c481e 52%,#08a844 100%);padding:32px 28px;text-align:center;color:#fff;">
                    <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#b8f6c6;font-weight:900;">Aiden’s Army Fundraiser</div>
                    <div style="font-size:30px;line-height:1.05;font-weight:900;margin-top:8px;text-transform:uppercase;">Order Confirmation</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <p style="font-size:16px;line-height:1.55;margin:0 0 14px;">Hi ${escapeHTML(customer.firstName)},</p>
                    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Thank you for standing with Aiden and his family. Here is a copy of the order you submitted.</p>
                    <table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">${rows}${donationRow}</table>
                    <div style="margin-top:22px;padding:18px;border-radius:14px;background:#f2faf4;border:1px solid #d9eadc;">
                      <table width="100%" cellspacing="0" cellpadding="0">
                        <tr><td style="color:#496f52;font-weight:700;">Apparel Items</td><td style="text-align:right;color:#111;font-weight:900;">${totals.count}</td></tr>
                        <tr><td style="padding-top:8px;color:#496f52;font-weight:700;">Order Total</td><td style="padding-top:8px;text-align:right;color:#06712d;font-size:22px;font-weight:900;">${formatMoney(totals.total)}</td></tr>
                      </table>
                    </div>
                    <div style="margin-top:20px;padding:16px;border-radius:12px;background:#ecf8ee;border:1px solid #bfe6c7;">
                      <strong style="display:block;color:#075e26;font-size:14px;margin-bottom:6px;">What happens next?</strong>
                      <p style="margin:0;color:#345b3e;font-size:13px;line-height:1.55;">${escapeHTML(TOURNAMENT.confirmationNote)}</p>
                      <p style="margin:10px 0 0;color:#345b3e;font-size:13px;line-height:1.55;">${escapeHTML(TOURNAMENT.paymentNote)}</p>
                    </div>
                  </td>
                </tr>
                <tr><td style="padding:18px 28px;text-align:center;color:#56745d;font-size:12px;">Aiden’s Army Fundraiser · Apparel by jStyles</td></tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function setupEmailJS() {
  if (emailjsReady) return;

  if (!window.emailjs) {
    throw new Error("EmailJS did not load. Please refresh the page and try again.");
  }

  if (!EMAILJS_CONFIG.publicKey || !EMAILJS_CONFIG.serviceId || !EMAILJS_CONFIG.templateId) {
    throw new Error("EmailJS settings are incomplete. Add your public key, service ID, and template ID in the JavaScript file.");
  }

  window.emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
  emailjsReady = true;
}

async function submitOrder() {
  if (!validateForReview()) {
    closeReviewModal();
    return;
  }

  const submitButton = document.getElementById("confirmSubmitBtn");
  const customer = getCustomer();
  const items = getOrderItems();
  const totals = getOrderTotals();
  const orderLines = buildOrderLines(items, totals);
  const customerName = `${customer.firstName} ${customer.lastName}`.trim();

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
  }

  try {
    setupEmailJS();

    const adminHTML = buildAdminEmailHTML(customer, items, totals);
    const customerHTML = buildCustomerEmailHTML(customer, items, totals);

    const common = {
      tournament_name: TOURNAMENT.name,
      customer_name: customerName,
      customer_first_name: customer.firstName,
      customer_last_name: customer.lastName,
      customer_email: customer.email,
      phone: customer.phone,
      fulfillment: customer.fulfillment,
      customer_note: customer.note,
      order_lines: orderLines,
      total_items: totals.count,
      total_cost: formatMoney(totals.total),
      payment_note: TOURNAMENT.paymentNote
    };

    await window.emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      {
        ...common,
        subject: `${TOURNAMENT.name} Order — ${customerName}`,
        order_subject: `${TOURNAMENT.name} Order — ${customerName}`,
        html_body: adminHTML,
        to_email: TOURNAMENT.emailTo,
        owner_email: TOURNAMENT.emailTo,
        from_name: customerName,
        reply_to: customer.email
      }
    );

    await window.emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      {
        ...common,
        subject: `Your Aiden’s Army Order Confirmation`,
        order_subject: `Your Aiden’s Army Order Confirmation`,
        html_body: customerHTML,
        to_email: customer.email,
        to_customer_email: customer.email,
        from_name: "Aiden’s Army Fundraiser",
        reply_to: TOURNAMENT.emailTo
      }
    );

    closeReviewModal();
    showToast("✓ Your order was sent. A confirmation email is on its way.");
    clearOrderAfterSend();
  } catch (error) {
    console.error("Order submission failed:", error);
    showToast(error?.message || "The order could not be sent. Please check your EmailJS settings.", true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Send My Order →";
    }
  }
}

function clearOrderAfterSend() {
  PRODUCTS.forEach(product => {
    Object.keys(state.quantities[product.id]).forEach(size => {
      state.quantities[product.id][size] = 0;
    });
  });

  state.donation = 0;
  state.activeProductId = PRODUCTS[0].id;

  ["fname", "lname", "email", "phone", "customerNote"].forEach(id => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });

  const fulfillment = document.getElementById("fulfillment");
  if (fulfillment) fulfillment.value = "";

  renderAll();
}

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.toggle("err", isError);
  toast.classList.add("show");

  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3800);
}

function bindStaticEvents() {
  document.getElementById("submitBtn")?.addEventListener("click", openReviewModal);
  document.getElementById("confirmSubmitBtn")?.addEventListener("click", submitOrder);

  document.querySelectorAll("[data-close-modal]").forEach(button => {
    button.addEventListener("click", closeReviewModal);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (!document.getElementById("reviewModal")?.hidden) closeReviewModal();
      closeMobileNav();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadNav();
  bindDonationControls();
  bindStaticEvents();
  renderAll();
});

window.addEventListener("scroll", setScrolledNav, { passive: true });
