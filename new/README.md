# jStyles storefront — Option B "Matchday" — setup

Light paper-and-ink design with tab navigation (no hamburger), a fixture-list home page,
and list-style products on phones. It uses the **same** `script.js` and `Code.gs` as Option A,
so the two options are interchangeable: only the `.html` files and `styles.css` differ.

## Files
| File | What it does |
|---|---|
| `index.html` | Home page: compact banner, links to the three stores, how-it-works, custom-merch form |
| `wos.html` · `tournament.html` · `aiden-army.html` | The three order pages. Identical layout; each has its own bag and checkout |
| `styles.css` | Light "matchday" theme, mobile-first (640px / 1000px breakpoints) |
| `script.js` | Catalog data for all three stores, bags, checkout + custom form → Apps Script |
| `Code.gs` | Google Apps Script: logs to Sheets, checks prices/stock, emails, calendar entry |
| `images/web/` | Compressed WebP copies of your product images (~1.5 MB vs ~30 MB of PNGs) |

## 1. Backend (once)
1. Make a new Google Sheet → **Extensions → Apps Script** → paste `Code.gs`.
2. Select `setup` in the toolbar → **Run** → approve permissions.
   This creates **Orders**, **Custom Requests** and **Products** tabs.
3. **Deploy → New deployment → Web app**. Execute as **Me**, access **Anyone**.
4. Copy the `/exec` URL.
5. Optional: run `testOrder` to send yourself a test order email.

## 2. Front end
1. In `script.js`, paste the URL into `CONFIG.APPS_SCRIPT_URL`.
2. Put all the `.html` files, `styles.css`, `script.js` and `images/web/` together in the repo.
   - To make this the new homepage, replace the root `index.html` (rename the old one first).
   - Or put everything in a folder such as `/shop/`.
3. Each store page sends its orders with that store's name in the sheet's **ORDER** column
   (`WOS Fan Gear`, `Tournament Merch`, `Aiden's Army`).

Until a URL is pasted, checkout won't submit. Instead it shows an "email this order" link so nothing is lost.

## Day-to-day
- **Change a price / mark sold out / close a drop:** edit the **Products** tab
  (Price, Stock, Active checkbox). The site picks it up on the next page load. No redeploy needed.
  Stock left blank means unlimited. Stock counts down automatically with each order.
- **Add a product:** add it to `PRODUCTS` in `script.js` with `collection:` set to the store it belongs to
  (`fan-gear`, `tournament` or `aiden-army`), and a row in Products with the same ID.
- **Add a new store page:** copy `wos.html`, change `data-collection` on the `<body>` tag, and add the
  collection to `COLLECTIONS` in `script.js`.
- **Track payment:** the Orders tab has `Status` and `Payment` columns. Change `Unpaid` → `Paid` when the e-transfer arrives.
- **After editing Code.gs:** Deploy → Manage deployments → ✏️ → Version: *New version*. The URL stays the same.
