/**
 * ════════════════════════════════════════════════════════════
 *  jStyles — Google Apps Script backend (Code.gs)
 * ════════════════════════════════════════════════════════════
 *  Receives JSON from script.js and:
 *    • logs every order line to the "Orders" sheet (ORDER column = stream)
 *    • checks prices / stock / active flags against the "Products" sheet
 *    • logs custom-merch requests to "Custom Requests"
 *    • emails the customer + jStyles, and adds a Calendar entry per order
 *    • returns JSON: { ok: true, orderId, total }  or  { ok: false, message }
 *
 *  SETUP (one time)
 *    1. Create a Google Sheet → Extensions → Apps Script → paste this file.
 *    2. Run  setup()  once from the editor and approve the permissions.
 *       It creates the three tabs and fills Products with the starter catalog.
 *    3. Deploy → New deployment → type "Web app"
 *         Execute as: Me      Who has access: Anyone
 *    4. Copy the /exec URL into CONFIG.APPS_SCRIPT_URL in script.js.
 *    After editing this code: Deploy → Manage deployments → Edit → Version:
 *    "New version". (A brand-new deployment gives you a NEW url.)
 *
 *  Also accepts the payloads sent by the older WOS / Aiden's Army order
 *  pages (orderPage / tournament fields, price instead of unitPrice).
 * ════════════════════════════════════════════════════════════
 */

const CONFIG = {
  BRAND: 'jStyles',
  OWNER_EMAIL: 'jstyles.pro@gmail.com',     // gets a copy of every order/request
  PAYMENT_EMAIL: 'jstyles.pro@gmail.com',   // where customers send e-transfers
  SPREADSHEET_ID: '',                       // leave blank when the script is bound to the sheet
  TIMEZONE: 'America/Toronto',
  SEND_CUSTOMER_EMAIL: true,
  SEND_OWNER_EMAIL: true,
  ADD_CALENDAR_EVENT: true,
  CALENDAR_ID: '',                          // blank = your default calendar
  MAX_ITEMS: 60,
  MAX_QTY_PER_LINE: 50
};

const SHEETS = {
  ORDERS: 'Orders',
  CUSTOM: 'Custom Requests',
  PRODUCTS: 'Products'
};

const ORDER_HEADERS = [
  'Timestamp', 'Order ID', 'ORDER', 'Status', 'Payment', 'First Name', 'Last Name', 'Email', 'Phone',
  'Fulfillment', 'Product ID', 'Product', 'Colour', 'Size', 'Option', 'Qty', 'Unit Price',
  'Line Total', 'Order Total', 'Notes', 'Source'
];
const CUSTOM_HEADERS = [
  'Timestamp', 'Request ID', 'Status', 'Name', 'Email', 'Phone', 'Team / Group',
  'Items', 'Quantity', 'Needed By', 'Details'
];
const PRODUCT_HEADERS = ['Product ID', 'Name', 'Collection', 'Price', 'Stock', 'Active'];

// Starter rows for the Products sheet (used by setup() only).
// Stock blank = unlimited. Active FALSE = hidden / closed.
const SEED_PRODUCTS = [
  ['wos-hoodie', 'Elite Sideline Hoodie', 'WOS Fan Gear', 60, '', true],
  ['wos-tee', 'Sideline Tee', 'WOS Fan Gear', 30, '', true],
  ['wos-long-sleeve', 'Long Sleeve', 'WOS Fan Gear', 25, '', true],
  ['wos-womens-tank', "Women's Tank Top", 'WOS Fan Gear', 25, '', true],
  ['wos-mens-tank', "Men's Tank Top", 'WOS Fan Gear', 25, '', true],
  ['wos-sweats', 'Sideline Sweats', 'WOS Fan Gear', 30, '', true],
  ['wos-cap', 'Ball Cap', 'WOS Fan Gear', 25, '', true],
  ['aa-hoodie', "Aiden's Army Hoodie", "Aiden's Army", 60, '', true],
  ['aa-tee', "Aiden's Army Tee", "Aiden's Army", 25, '', true],
  ['aa-cap', "Aiden's Army Ball Cap", "Aiden's Army", 25, '', true],
  ['aa-fitted', "Aiden's Army Fitted Hat", "Aiden's Army", 30, '', true],
  ['grind-hoodie', 'The Grind Hoodie', 'Tournament Merch', 60, '', true],
  ['613-hoodie', '613 Showdown Hoodie', 'Tournament Merch', 60, '', true],
  ['wc-hoodie', 'Warrior Classic Hoodie', 'Tournament Merch', 60, '', false],
  ['wc-tee', 'Warrior Classic Tee', 'Tournament Merch', 25, '', false]
];

/* ════════════════════════════════════════════════════════════
   ENTRY POINTS
   ════════════════════════════════════════════════════════════ */

/** GET  ?action=catalog  → live prices / stock for the storefront. */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';
  if (action === 'catalog') {
    return json_({ ok: true, products: readCatalog_() });
  }
  return json_({ ok: true, service: CONFIG.BRAND + ' orders', time: new Date().toISOString() });
}

/** POST  JSON body (sent as text/plain) → order or custom request. */
function doPost(e) {
  let payload;
  try {
    payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, message: 'Invalid request format.' });
  }

  try {
    if (payload.type === 'custom') return json_(handleCustomRequest_(payload));
    return json_(handleOrder_(payload));
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ ok: false, message: err && err.userMessage ? err.userMessage : 'Something went wrong on our side. Please try again or email ' + CONFIG.OWNER_EMAIL + '.' });
  }
}

/* ════════════════════════════════════════════════════════════
   ORDERS
   ════════════════════════════════════════════════════════════ */
function handleOrder_(p) {
  const customer = p.customer || {};
  const c = {
    firstName: clean_(customer.firstName, 60),
    lastName: clean_(customer.lastName, 60),
    email: clean_(customer.email, 120).toLowerCase(),
    phone: clean_(customer.phone, 40),
    fulfillment: clean_(customer.fulfillment, 40) || 'Pickup',
    notes: clean_(customer.notes || customer.note, 1000)
  };
  if (!c.firstName || !c.lastName) throw userError_('Please enter your first and last name.');
  if (!isEmail_(c.email)) throw userError_('Please enter a valid email address.');

  const rawItems = Array.isArray(p.items) ? p.items : [];
  if (!rawItems.length) throw userError_('Your bag is empty.');
  if (rawItems.length > CONFIG.MAX_ITEMS) throw userError_('That order has too many lines. Please contact us for bulk orders.');

  const orderId = clean_(p.orderId, 60) || 'JS-' + Utilities.getUuid().slice(0, 8).toUpperCase();
  const defaultStream = clean_(p.orderPage || p.tournament, 80) || 'jStyles Shop';

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ordersSheet = getSheet_(SHEETS.ORDERS, ORDER_HEADERS);

    // Duplicate protection: the storefront re-sends the same orderId on retry.
    const existing = findOrderTotal_(ordersSheet, orderId);
    if (existing !== null) return { ok: true, orderId: orderId, total: existing, duplicate: true };

    const catalog = readCatalogRows_();
    const items = rawItems.map(function (it) {
      const qty = Math.floor(Number(it.qty));
      if (!(qty >= 1 && qty <= CONFIG.MAX_QTY_PER_LINE)) throw userError_('Invalid quantity for ' + clean_(it.productName, 80) + '.');
      const id = clean_(it.productId, 60);
      const row = id ? catalog[id] : null;
      let unitPrice = Number(it.unitPrice != null ? it.unitPrice : it.price) || 0;
      let verified = false;

      if (row) {
        if (row.active === false) throw userError_(row.name + ' is no longer available. Please remove it from your bag.');
        if (typeof row.stock === 'number' && row.stock < qty) {
          throw userError_(row.stock > 0 ? 'Only ' + row.stock + ' left of ' + row.name + '. Please lower the quantity.' : row.name + ' just sold out.');
        }
        unitPrice = row.price;   // the sheet price always wins
        verified = true;
      }

      return {
        productId: id,
        productName: clean_(it.productName, 120) || (row && row.name) || 'Item',
        stream: clean_(it.collection, 80) || defaultStream,
        color: clean_(it.color, 40),
        size: clean_(it.size, 40),
        option: clean_(it.option, 60),
        qty: qty,
        unitPrice: unitPrice,
        subtotal: Math.round(unitPrice * qty * 100) / 100,
        verified: verified
      };
    });

    const total = items.reduce(function (s, i) { return s + i.subtotal; }, 0);
    const count = items.reduce(function (s, i) { return s + i.qty; }, 0);
    const now = new Date();

    const rows = items.map(function (i) {
      return [
        now, orderId, i.stream, i.verified ? 'New' : 'New – check price', 'Unpaid',
        c.firstName, c.lastName, c.email, c.phone, c.fulfillment,
        i.productId, i.productName, i.color, i.size, i.option, i.qty, i.unitPrice,
        i.subtotal, total, c.notes, clean_(p.source, 40) || 'legacy-page'
      ];
    });
    ordersSheet.getRange(ordersSheet.getLastRow() + 1, 1, rows.length, ORDER_HEADERS.length).setValues(rows);

    decrementStock_(items);
    SpreadsheetApp.flush();

    const order = { orderId: orderId, customer: c, items: items, total: total, count: count, date: now };
    // Side effects shouldn't fail the order once it is safely logged.
    safely_(function () { if (CONFIG.SEND_CUSTOMER_EMAIL) sendCustomerEmail_(order); }, 'customer email');
    safely_(function () { if (CONFIG.SEND_OWNER_EMAIL) sendOwnerEmail_(order); }, 'owner email');
    safely_(function () { if (CONFIG.ADD_CALENDAR_EVENT) addCalendarEvent_(order); }, 'calendar');

    return { ok: true, orderId: orderId, total: total, count: count };
  } finally {
    lock.releaseLock();
  }
}

function findOrderTotal_(sheet, orderId) {
  if (sheet.getLastRow() < 2) return null;
  const hit = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1)
    .createTextFinder(orderId).matchEntireCell(true).findNext();
  if (!hit) return null;
  return Number(sheet.getRange(hit.getRow(), ORDER_HEADERS.indexOf('Order Total') + 1).getValue()) || 0;
}

/* ════════════════════════════════════════════════════════════
   CUSTOM REQUESTS
   ════════════════════════════════════════════════════════════ */
function handleCustomRequest_(p) {
  const r = {
    requestId: clean_(p.requestId, 60) || 'CR-' + Utilities.getUuid().slice(0, 8).toUpperCase(),
    name: clean_(p.name, 100),
    email: clean_(p.email, 120).toLowerCase(),
    phone: clean_(p.phone, 40),
    group: clean_(p.group, 120),
    items: (Array.isArray(p.items) ? p.items : []).map(function (x) { return clean_(x, 40); }).join(', '),
    quantity: clean_(p.quantity, 10),
    deadline: clean_(p.deadline, 20),
    details: clean_(p.details, 3000)
  };
  if (!r.name) throw userError_('Please enter your name.');
  if (!isEmail_(r.email)) throw userError_('Please enter a valid email address.');
  if (!r.details) throw userError_('Please tell us a little about your idea.');

  const sheet = getSheet_(SHEETS.CUSTOM, CUSTOM_HEADERS);
  sheet.appendRow([new Date(), r.requestId, 'New', r.name, r.email, r.phone, r.group, r.items, r.quantity, r.deadline, r.details]);

  safely_(function () {
    MailApp.sendEmail({
      to: CONFIG.OWNER_EMAIL,
      replyTo: r.email,
      subject: 'Custom merch request — ' + r.name + (r.group ? ' (' + r.group + ')' : ''),
      htmlBody: emailShell_('New custom request',
        table_([
          ['Name', r.name], ['Email', r.email], ['Phone', r.phone], ['Team / group', r.group],
          ['Items', r.items], ['Quantity', r.quantity], ['Needed by', r.deadline]
        ]) + '<p style="margin:18px 0 6px;font-weight:700;">Details</p><p style="white-space:pre-wrap;margin:0;">' + esc_(r.details) + '</p>')
    });
  }, 'custom owner email');

  safely_(function () {
    MailApp.sendEmail({
      to: r.email,
      replyTo: CONFIG.OWNER_EMAIL,
      name: CONFIG.BRAND,
      subject: 'We got your custom merch request',
      htmlBody: emailShell_('Thanks, ' + esc_(r.name.split(' ')[0]) + '!',
        '<p>We received your custom merch request and will reach out within 1–2 days to talk through design, pricing and timing.</p>' +
        '<p style="color:#888;">Reference: ' + esc_(r.requestId) + '</p>')
    });
  }, 'custom customer email');

  return { ok: true, requestId: r.requestId };
}

/* ════════════════════════════════════════════════════════════
   PRODUCTS / INVENTORY
   ════════════════════════════════════════════════════════════ */
function readCatalogRows_() {
  const sheet = getSpreadsheet_().getSheetByName(SHEETS.PRODUCTS);
  const out = {};
  if (!sheet || sheet.getLastRow() < 2) return out;
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, PRODUCT_HEADERS.length).getValues();
  values.forEach(function (v, idx) {
    const id = String(v[0] || '').trim();
    if (!id) return;
    const stockRaw = v[4];
    out[id] = {
      row: idx + 2,
      name: String(v[1] || id),
      price: Number(v[3]) || 0,
      stock: stockRaw === '' || stockRaw === null ? null : Number(stockRaw),
      active: !(v[5] === false || String(v[5]).toUpperCase() === 'FALSE')
    };
  });
  return out;
}

/** Public shape for the storefront (no row numbers). */
function readCatalog_() {
  const rows = readCatalogRows_();
  const out = {};
  Object.keys(rows).forEach(function (id) {
    const r = rows[id];
    out[id] = { price: r.price, active: r.active };
    if (typeof r.stock === 'number' && !isNaN(r.stock)) out[id].stock = r.stock;
  });
  return out;
}

function decrementStock_(items) {
  const sheet = getSpreadsheet_().getSheetByName(SHEETS.PRODUCTS);
  if (!sheet) return;
  const catalog = readCatalogRows_();
  const used = {};
  items.forEach(function (i) { if (i.productId) used[i.productId] = (used[i.productId] || 0) + i.qty; });
  Object.keys(used).forEach(function (id) {
    const r = catalog[id];
    if (r && typeof r.stock === 'number' && !isNaN(r.stock)) {
      sheet.getRange(r.row, 5).setValue(Math.max(0, r.stock - used[id]));
    }
  });
}

/* ════════════════════════════════════════════════════════════
   EMAILS + CALENDAR
   ════════════════════════════════════════════════════════════ */
function itemsTable_(order) {
  const rows = order.items.map(function (i) {
    const variant = [i.color, i.size, i.option].filter(String).join(' · ');
    return '<tr>' +
      '<td style="padding:10px 0;border-bottom:1px solid #2a2a2e;"><strong>' + esc_(i.productName) + '</strong><br><span style="color:#9a9aa2;font-size:13px;">' + esc_(variant) + ' · ' + esc_(i.stream) + '</span></td>' +
      '<td style="padding:10px 0;border-bottom:1px solid #2a2a2e;text-align:center;">' + i.qty + '</td>' +
      '<td style="padding:10px 0;border-bottom:1px solid #2a2a2e;text-align:right;">' + money_(i.subtotal) + '</td></tr>';
  }).join('');
  return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:15px;">' +
    '<tr><th align="left" style="color:#9a9aa2;font-size:12px;letter-spacing:1px;">ITEM</th><th style="color:#9a9aa2;font-size:12px;">QTY</th><th align="right" style="color:#9a9aa2;font-size:12px;">TOTAL</th></tr>' +
    rows +
    '<tr><td colspan="2" style="padding:14px 0 0;font-weight:700;">Total (' + order.count + ' items)</td><td style="padding:14px 0 0;text-align:right;font-size:22px;font-weight:900;color:#ff5a1f;">' + money_(order.total) + '</td></tr></table>';
}

function sendCustomerEmail_(order) {
  const c = order.customer;
  const body =
    '<p>Hi ' + esc_(c.firstName) + ', thanks for your order! Here\'s your summary.</p>' +
    '<p style="font-size:13px;color:#9a9aa2;margin:0 0 16px;">Order <strong style="color:#8fd3ff;">' + esc_(order.orderId) + '</strong></p>' +
    itemsTable_(order) +
    '<div style="margin:24px 0 0;padding:16px;border-radius:10px;background:#1d1d21;border-left:4px solid #ff5a1f;">' +
    '<strong>Next step — payment</strong><br>Please send <strong>' + money_(order.total) + '</strong> by Interac e-transfer to <strong>' + esc_(CONFIG.PAYMENT_EMAIL) + '</strong> and put <strong>' + esc_(order.orderId) + '</strong> in the message.</div>' +
    '<p style="margin-top:20px;">Fulfillment: <strong>' + esc_(c.fulfillment) + '</strong>. We\'ll be in touch when your gear is ready.</p>';
  MailApp.sendEmail({
    to: c.email,
    replyTo: CONFIG.OWNER_EMAIL,
    name: CONFIG.BRAND,
    subject: 'Your ' + CONFIG.BRAND + ' order ' + order.orderId,
    htmlBody: emailShell_('Order confirmed', body)
  });
}

function sendOwnerEmail_(order) {
  const c = order.customer;
  const streams = unique_(order.items.map(function (i) { return i.stream; })).join(', ');
  const unverified = order.items.some(function (i) { return !i.verified; });
  const body =
    table_([
      ['Order', order.orderId], ['Stream', streams], ['Name', c.firstName + ' ' + c.lastName],
      ['Email', c.email], ['Phone', c.phone], ['Fulfillment', c.fulfillment], ['Notes', c.notes]
    ]) +
    (unverified ? '<p style="color:#ff5d6c;font-weight:700;">⚠ Some items weren\'t in the Products sheet — double-check the prices.</p>' : '') +
    '<div style="height:16px"></div>' + itemsTable_(order);
  MailApp.sendEmail({
    to: CONFIG.OWNER_EMAIL,
    replyTo: c.email,
    subject: 'New order ' + order.orderId + ' — ' + c.firstName + ' ' + c.lastName + ' — ' + money_(order.total),
    htmlBody: emailShell_('New order · ' + esc_(streams), body)
  });
}

function addCalendarEvent_(order) {
  const cal = CONFIG.CALENDAR_ID ? CalendarApp.getCalendarById(CONFIG.CALENDAR_ID) : CalendarApp.getDefaultCalendar();
  if (!cal) return;
  const c = order.customer;
  const lines = order.items.map(function (i) {
    return i.qty + ' × ' + i.productName + ' (' + [i.color, i.size, i.option].filter(String).join(', ') + ') — ' + i.stream;
  });
  const start = order.date;
  const end = new Date(start.getTime() + 15 * 60 * 1000);
  cal.createEvent(
    '🧢 ' + CONFIG.BRAND + ' order — ' + c.firstName + ' ' + c.lastName + ' (' + money_(order.total) + ')',
    start, end,
    { description: 'Order ' + order.orderId + '\n' + c.email + (c.phone ? ' · ' + c.phone : '') + '\n' + c.fulfillment + '\n\n' + lines.join('\n') + (c.notes ? '\n\nNotes: ' + c.notes : '') }
  );
}

function emailShell_(title, inner) {
  return '<div style="background:#0a0a0b;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">' +
    '<div style="max-width:600px;margin:0 auto;background:#141416;border-radius:14px;overflow:hidden;color:#f5f2ed;">' +
    '<div style="padding:22px 28px;background:linear-gradient(90deg,#ff5a1f,#ff7a18);color:#0a0a0b;">' +
    '<div style="font-size:12px;letter-spacing:3px;font-weight:900;">JSTYLES</div>' +
    '<div style="font-size:26px;font-weight:900;margin-top:4px;">' + title + '</div></div>' +
    '<div style="padding:24px 28px;line-height:1.55;">' + inner + '</div>' +
    '<div style="padding:16px 28px;border-top:1px solid #2a2a2e;color:#9a9aa2;font-size:12px;">' + CONFIG.BRAND + ' · Apparel &amp; Gear · Questions? Reply to this email.</div>' +
    '</div></div>';
}

function table_(pairs) {
  return '<table role="presentation" cellspacing="0" cellpadding="0" style="font-size:15px;">' +
    pairs.filter(function (p) { return p[1]; }).map(function (p) {
      return '<tr><td style="padding:4px 16px 4px 0;color:#9a9aa2;vertical-align:top;">' + esc_(p[0]) + '</td><td style="padding:4px 0;">' + esc_(p[1]) + '</td></tr>';
    }).join('') + '</table>';
}

/* ════════════════════════════════════════════════════════════
   SETUP + HELPERS
   ════════════════════════════════════════════════════════════ */

/** Run once from the editor. Safe to run again (won't duplicate products). */
function setup() {
  getSheet_(SHEETS.ORDERS, ORDER_HEADERS);
  getSheet_(SHEETS.CUSTOM, CUSTOM_HEADERS);
  const products = getSheet_(SHEETS.PRODUCTS, PRODUCT_HEADERS);
  const existing = readCatalogRows_();
  const missing = SEED_PRODUCTS.filter(function (r) { return !existing[r[0]]; });
  if (missing.length) products.getRange(products.getLastRow() + 1, 1, missing.length, PRODUCT_HEADERS.length).setValues(missing);
  products.getRange(2, 6, Math.max(1, products.getLastRow() - 1), 1).insertCheckboxes();
  // Touch the services once so all permissions are requested now.
  MailApp.getRemainingDailyQuota();
  if (CONFIG.ADD_CALENDAR_EVENT) CalendarApp.getDefaultCalendar();
  Logger.log('jStyles setup complete. Products added: ' + missing.length);
}

/** Quick self-test from the editor (sends real emails to OWNER_EMAIL). */
function testOrder() {
  const res = doPost({ postData: { contents: JSON.stringify({
    type: 'order', source: 'editor-test', orderId: 'TEST-' + Date.now(),
    customer: { firstName: 'Test', lastName: 'Order', email: CONFIG.OWNER_EMAIL, fulfillment: 'Pickup' },
    items: [{ productId: 'wos-cap', productName: 'Ball Cap', collection: 'WOS Fan Gear', size: 'One Size', qty: 1, unitPrice: 25 }]
  }) } });
  Logger.log(res.getContent());
}

function getSpreadsheet_() {
  return CONFIG.SPREADSHEET_ID ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet_(name, headers) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setBackground('#0a0a0b').setFontColor('#ff5a1f');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Trim, cap length, and stop spreadsheet formula injection (=, +, -, @). */
function clean_(v, max) {
  let s = String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max || 200);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function isEmail_(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s)); }
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function money_(n) { return '$' + (Number(n) % 1 ? Number(n).toFixed(2) : Number(n)); }
function unique_(arr) { return arr.filter(function (v, i) { return arr.indexOf(v) === i; }); }
function userError_(msg) { const e = new Error(msg); e.userMessage = msg; return e; }
function safely_(fn, label) { try { fn(); } catch (err) { console.error(label + ' failed: ' + err); } }
