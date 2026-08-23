# SETUP — values the owner must supply

Everything in this file is a placeholder currently live on the site. Each entry
gives the exact file, the line, what to put there, and what breaks if you don't.

Last updated: 23 August 2026.

---

## 1. BLOCKING — the site cannot sell anything until these are done

### 1.1 Paddle account and keys

**File:** `main.js` lines 24-26
```js
const PADDLE_CLIENT_TOKEN = "TODO_PADDLE_CLIENT_TOKEN";
const PADDLE_PRICE_ID     = "TODO_PADDLE_PRICE_ID";
const PADDLE_SANDBOX      = false;
```

**Why Paddle and not Stripe or Gumroad** (decided 23 Aug 2026, after research):

- **Stripe cannot pay out to Korean bank accounts.** It can accept payments from
  customers anywhere, but a Korea-registered business cannot receive the money.
  This is not a configuration problem and cannot be worked around.
- **Gumroad is a payout risk and costs double.** It ended PayPal payouts in late
  2024, routes direct deposits through Stripe Connect (same Korea limitation),
  and supports neither Payoneer nor Wise. Its fee is 10% + $0.30 (≈$2.20 on a $19
  sale) versus Paddle's ≈$1.45.
- **Paddle supports Korean sellers, and eBooks/PDFs are an explicitly approved
  product category.**

**What to do, in order:**

1. Sign up at paddle.com for **Paddle Billing** under the registered business —
   **1600 에스에이티 랩**, 사업자등록번호 **214-53-01036**.
2. Complete seller verification. **This takes a few days and Paddle is strict.**
   It reviews your live site, so `/terms/`, `/privacy/` and `/refund/` being
   published and consistent works in your favour. Present the business as purely
   digital-goods — Paddle rejects mixed models that include human consulting or
   services.
3. Set the **public business name shown at checkout to `1600 SAT Lab`** — not the
   owner's legal name. The checkout page is the single most likely place for the
   anonymous brand to leak.
4. Add and verify the domain **1600satlab.com** under Checkout → domain approval.
   Paddle.js only runs on approved domains, so checkout silently fails without it.
5. Create the product with a **one-time price of $19 USD**. Copy its **Price ID**
   (`pri_...`) into `PADDLE_PRICE_ID`.
6. Copy your **client-side token** (Developer tools → Authentication →
   Client-side tokens, `live_...`) into `PADDLE_CLIENT_TOKEN`.
7. Test with a sandbox account first: use a `test_` token and sandbox `pri_` id,
   set `PADDLE_SANDBOX = true`, pay with Paddle's test card, and confirm the
   overlay opens and redirects to `/thank-you/`. Then switch to live values and
   set `PADDLE_SANDBOX` back to `false`.

**Until this is done:** every buy button reads "Get notified when Test 1 is back"
and links to the waitlist, because `SALES_ENABLED` is `false` (see 1.2).

> ### Known limitation: checkout requires JavaScript
>
> Every other part of every page works with JS disabled. **Checkout does not.**
> Paddle Billing has no static checkout URL — the overlay is opened by `paddle.js`
> against a transaction Paddle creates, so there is nothing to put in a plain
> `href`. This is a real regression from the Stripe Payment Link approach this
> replaced, and it is not fixable while using Paddle.
>
> The mitigation: each buy button's static `href` is a **mailto to
> support@1600satlab.com** with a purchase-request subject line. A visitor with JS
> disabled gets a working way to reach you rather than a dead button, and you can
> send them a Paddle invoice manually. `main.js` upgrades the click to the overlay
> whenever Paddle is actually available.

### 1.2 Turning sales ON — this is NOT a one-line change

**File:** `main.js` line 15
```js
const SALES_ENABLED = false;
```

Flipping this to `true` handles the buttons and prices at runtime, but **two
things are static HTML that JavaScript cannot reach.** All three must change
together or the site will contradict itself:

| # | File | Line | Change |
|---|---|---|---|
| 1 | `main.js` | 15 | `SALES_ENABLED = false` → `true` |
| 2 | `index.html` | Product JSON-LD | `"availability"`: `OutOfStock` → `InStock` |
| 3 | `index.html` (×2 — hero and pricing) | buy CTAs | `href="/sample/#waitlist" data-waitlist-active="true">Get notified when Test 1 is back</a>` → `href="mailto:support@1600satlab.com?subject=Practice%20Test%201%20%E2%80%94%20purchase%20request">Get Practice Test 1 &mdash; $19</a>` |
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
| `purchase` | `/thank-you/` loads, with Paddle's `_ptxn` as the transaction ID | conversion, value $19 |

Then link Google Ads → GA4 (Ads → Tools → Linked accounts) and import both.

---

## 3. Legal — required before advertising in Korea

### 3.1 통신판매업신고번호

**Files:** every page, in the footer identity block. Search for `통신판매업신고번호`.
Currently renders as `준비 중` ("in preparation") with a `TODO(owner)` comment.

| File | Line |
|---|---|
| `index.html` | 375 |
| `terms/index.html` | 75 |
| `terms/index.html` | 215 |
| `privacy/index.html` | 232 |
| `refund/index.html` | 139 |
| `thank-you/index.html` | 111 |
| `404.html` | 113 |

**Either** file for 통신판매업 신고 at 정부24 and paste the number, **or** confirm
you are exempt and replace the label with the exemption wording. Do not invent a
number. Note that 간이과세자 with low revenue may be exempt — this was one of the
open questions for the 국세청 126 call.

---

## 4. Content placeholders

### 4.1 Master PDFs still carry the old refund text

**Not a website file, but it contradicts the website.** The disclaimer bound into
the master PDFs in `sat_business/masters/` and `1600satlab_sources/masters/` still
states the older refund terms. The site now says **all sales final, no refunds**.
Regenerate those PDFs before the next sale ships, or a buyer will hold a document
that contradicts the published policy.

### 4.2 Known cosmetic gap while sales are off

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
- All 6 routes return 200; every internal link and on-page anchor resolves.
- Footer is byte-identical across all 6 pages; College Board disclaimer appears
  exactly once per page.
- Difficulty distribution sums to 98 and matches the shipped answer key.
- All four tables sit inside `overflow-x: auto` containers, so there is no
  horizontal page overflow at 360px.
