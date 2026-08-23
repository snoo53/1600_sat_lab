# SETUP — values the owner must supply

Everything in this file is a placeholder currently live on the site. Each entry
gives the exact file, the line, what to put there, and what breaks if you don't.

Last updated: 23 August 2026.

---

## 1. BLOCKING — the site cannot sell anything until these are done

### 1.1 Stripe Payment Link

**File:** `main.js` line 29
```js
const STRIPE_PAYMENT_LINK_URL = "https://buy.stripe.com/TODO_PAYMENT_LINK";
```

**What to do, in order:**

1. Create a Stripe account under the registered business — **1600 에스에이티 랩**,
   사업자등록번호 **214-53-01036**.
2. In **Settings → Business → Public details**, set the **public business name to
   `1600 SAT Lab`**. This is the name shown on the checkout page and on the card
   statement. It must NOT be the owner's legal name — the brand is anonymous, and
   the checkout page is the single most likely place for that to leak.
3. Create the product: **$19 USD, one-time**.
4. Create a **Payment Link** for it (Dashboard → Payment Links).
5. Set the Payment Link's **success URL** to exactly:
   ```
   https://1600satlab.com/thank-you/?session_id={CHECKOUT_SESSION_ID}
   ```
   The `{CHECKOUT_SESSION_ID}` part is literal — Stripe substitutes it at redirect.
   It is what makes the purchase-conversion event de-duplicate correctly (see 2.1).
6. Paste the resulting `https://buy.stripe.com/...` URL over the placeholder.

**Until this is done:** every buy button reads "Get notified when Test 1 is back"
and links to the waitlist, because `SALES_ENABLED` is `false` (see 1.2).

> **Why a Payment Link and not Stripe's `<stripe-buy-button>` web component:** the
> Payment Link is a plain `<a href>`, so checkout still works with JavaScript
> disabled. The buy-button component renders nothing without JS, which would make
> the checkout itself JS-gated. Don't switch to it.

### 1.2 Turning sales ON — this is NOT a one-line change

**File:** `main.js` line 15
```js
const SALES_ENABLED = false;
```

Flipping this to `true` handles the buttons and prices at runtime, but **three
things are static HTML that JavaScript cannot reach.** All four must change
together or the site will contradict itself:

| # | File | Line | Change |
|---|---|---|---|
| 1 | `main.js` | 15 | `SALES_ENABLED = false` → `true` |
| 2 | `tests/practice-test-1/index.html` | 47 | JSON-LD `"availability"`: `OutOfStock` → `InStock` |
| 3 | `index.html`, `tests/index.html`, `tests/practice-test-1/index.html` (×2) | buy CTAs | `href="/sample/#waitlist" data-waitlist-active="true">Get notified when Test 1 is back</a>` → `href="https://buy.stripe.com/YOUR_LINK">Get Practice Test 1 &mdash; $19</a>` |
| 4 | — | — | Nothing else. Badges flip automatically via `data-when-sales-on` / `data-when-sales-off`. |

**Item 2 matters more than it looks.** JSON-LD is what Google reads for search
rich results. Leaving it `InStock` while sales are off advertises a buyable $19
product in Google that cannot be bought; leaving it `OutOfStock` after you turn
sales on suppresses your own product listing. There is a comment above the block
in that file restating this.

**Item 3** is the no-JS fallback. The static `href` is what a visitor with
JavaScript disabled actually gets, so it must match the real state.

---

## 2. Analytics — needed before spending money on ads

### 2.1 GA4 measurement ID

**File:** `main.js` line 37
```js
const GA_MEASUREMENT_ID = "TODO_GA4_ID";
```

Replace with the real ID (`G-XXXXXXXXXX`). **Analytics is completely inert until
this is a real ID** — `main.js` checks for the string `TODO` and refuses to load
the gtag script, so no tag currently fires anywhere on the site. That is also why
the privacy policy currently says no analytics cookies are set; **update
`privacy/index.html` §11 when you turn this on**, or the privacy policy becomes
factually wrong.

Once live, two events fire on their own — no extra tags to install:

| Event | Fires when | Import as |
|---|---|---|
| `generate_lead` | MailerLite sample or waitlist form submitted | conversion, value $0 |
| `purchase` | `/thank-you/` loads, with `session_id` as the transaction ID | conversion, value $19 |

Then link Google Ads → GA4 (Ads → Tools → Linked accounts) and import both.

---

## 3. Legal — required before advertising in Korea

### 3.1 통신판매업신고번호

**Files:** all 13 pages, in the footer identity block. Search for `통신판매업신고번호`.
Currently renders as `준비 중` ("in preparation") with a `TODO(owner)` comment.

| File | Line |
|---|---|
| `index.html` | 329 |
| `tests/index.html` | 179 |
| `tests/practice-test-1/index.html` | 411 |
| `sample/index.html` | 249 |
| `about/index.html` | 129 |
| `faq/index.html` | 257 |
| `terms/index.html` | 75 **and** 214 (body block + footer) |
| `privacy/index.html` | 233 |
| `refund/index.html` | 140 |
| `thank-you/index.html` | 112 |
| `blog/index.html` | 118 |
| `blog/example-post/index.html` | 132 |
| `404.html` | 114 |

**Either** file for 통신판매업 신고 at 정부24 and paste the number, **or** confirm
you are exempt and replace the label with the exemption wording. Do not invent a
number. Note that 간이과세자 with low revenue may be exempt — this was one of the
open questions for the 국세청 126 call.

---

## 4. Content placeholders

### 4.1 Blog

`blog/index.html` line 63 carries a `TODO(owner)` comment. `/blog/example-post/`
is an explicit placeholder that says so in its own body text. It is excluded from
`sitemap.xml` and disallowed in `robots.txt`, so it will not be indexed — safe to
leave until real articles exist. Topic candidates are in
`sat_business/marketing/google_ads_test.md` under "Organic / SEO".

### 4.2 Master PDFs still carry the old refund text

**Not a website file, but it contradicts the website.** The disclaimer bound into
the master PDFs in `sat_business/masters/` and `1600satlab_sources/masters/` still
states the older refund terms. The site now says **all sales final, no refunds**.
Regenerate those PDFs before the next sale ships, or a buyer will hold a document
that contradicts the published policy.

### 4.3 Known cosmetic gap while sales are off

With JavaScript **disabled** and sales off, the price still reads "$19" next to a
"Get notified" button (JS rewrites it to "Coming soon", static HTML can't). Not
misleading — $19 is the real price, and the badge and button both say it isn't
purchasable yet — so this is left as-is. It resolves itself when sales turn on.

---

## 5. Verified working — no action needed

- `CNAME` contains `1600satlab.com`. Do not delete it; GitHub Pages needs it.
- DNS at Namecheap is already correct (4 A records + `www` CNAME). Adding a
  Search Console TXT record is additive and safe.
- MailerLite form is wired to the real account (`2413380`) and posts directly, so
  it works with JavaScript disabled.
- All 13 routes return 200; every internal link resolves; no `.html` in nav.
- Footer is byte-identical across all 13 pages; College Board disclaimer appears
  exactly once per page.
- Difficulty distribution sums to 98 and matches the shipped answer key.
- All four tables sit inside `overflow-x: auto` containers, so there is no
  horizontal page overflow at 360px.
