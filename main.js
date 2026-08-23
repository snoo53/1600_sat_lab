/* ==========================================================================
   1600 SAT Lab — shared behaviour
   Progressive enhancement only. Every page is fully usable with JS disabled.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Configuration — the only values you should ever need to edit
   -------------------------------------------------------------------------- */

// Master switch for selling. While false, every buy CTA becomes a waitlist
// signup and every price reads "Coming soon".
// Currently false because the Paddle keys below are still placeholders.
// Turning this on is NOT a one-line change — see SETUP.md §1.2 for the
// three static-markup edits that must happen alongside it.
const SALES_ENABLED = false;

// Single source of truth for the Practice Test 1 checkout.
// Checkout is Paddle Billing. Paddle is the Merchant of Record: it is the
// legal seller on every transaction and remits VAT/sales tax worldwide.
//
// TODO(owner): fill both values from the Paddle dashboard. See SETUP.md.
//   PADDLE_CLIENT_TOKEN — Developer tools > Authentication > Client-side token
//                         (live_... for production, test_... for sandbox)
//   PADDLE_PRICE_ID     — Catalog > Products > your $19 one-time price (pri_...)
// Set PADDLE_SANDBOX = true ONLY while testing with a test_ token.
const PADDLE_CLIENT_TOKEN = "TODO_PADDLE_CLIENT_TOKEN";
const PADDLE_PRICE_ID = "TODO_PADDLE_PRICE_ID";
const PADDLE_SANDBOX = false;

// Where Paddle sends the buyer after a completed payment.
const PADDLE_SUCCESS_URL = "https://1600satlab.com/thank-you/";

// NOTE ON JAVASCRIPT: unlike the Stripe Payment Link this replaces, Paddle
// Billing has no static checkout URL — the overlay is opened by paddle.js
// against a transaction it creates. So CHECKOUT specifically requires JS.
// Every other part of every page still works without it. The static href on
// each buy button is a mailto fallback so a JS-disabled visitor still has a
// real way to purchase rather than a dead link.
const BUY_FALLBACK_MAILTO =
  "mailto:support@1600satlab.com" +
  "?subject=Practice%20Test%201%20%E2%80%94%20purchase%20request";

// Where a purchase CTA points when SALES_ENABLED is false.
const WAITLIST_URL = "/#sample";
const WAITLIST_LABEL_DEFAULT = "Get notified when it ships";

// TODO(owner): replace with the real GA4 measurement ID, e.g. "G-XXXXXXXXXX".
// Analytics stays inert until this is a real ID. See SETUP.md.
const GA_MEASUREMENT_ID = "TODO_GA4_ID";

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    applySalesState();
    initPaddle();
    initNavToggle();
    initAnalytics();
    trackPurchaseIfThankYouPage();
  });

  /* ------------------------------------------------------------------------
     Paddle Billing checkout
     ------------------------------------------------------------------------ */

  function paddleConfigured() {
    return (
      PADDLE_CLIENT_TOKEN.indexOf("TODO") === -1 &&
      PADDLE_PRICE_ID.indexOf("TODO") === -1
    );
  }

  function initPaddle() {
    // Nothing to wire up if sales are off, the keys are still placeholders,
    // or paddle.js did not load (blocked, offline, script error).
    if (!SALES_ENABLED || !paddleConfigured() || !window.Paddle) return;

    if (PADDLE_SANDBOX) {
      window.Paddle.Environment.set("sandbox");
    }
    window.Paddle.Initialize({ token: PADDLE_CLIENT_TOKEN });

    var ctas = document.querySelectorAll("[data-buy-cta]");
    for (var i = 0; i < ctas.length; i++) {
      ctas[i].addEventListener("click", function (e) {
        // Only take over the click once Paddle is genuinely ready. If
        // anything is off, the mailto href runs instead of a dead button.
        if (!window.Paddle || !window.Paddle.Checkout) return;
        e.preventDefault();
        window.Paddle.Checkout.open({
          items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }],
          settings: { successUrl: PADDLE_SUCCESS_URL }
        });
      });
    }
  }

  /* ------------------------------------------------------------------------
     Sales toggle
     Same DOM in both states — only href, label and class change.
     ------------------------------------------------------------------------ */

  function applySalesState() {
    var buyCtas = document.querySelectorAll("[data-buy-cta]");

    for (var i = 0; i < buyCtas.length; i++) {
      var cta = buyCtas[i];

      if (SALES_ENABLED) {
        // Paddle has no static checkout URL, so the href stays the mailto
        // fallback and the click handler below upgrades it to the overlay
        // when paddle.js is available.
        cta.setAttribute("href", BUY_FALLBACK_MAILTO);
        cta.removeAttribute("data-waitlist-active");
      } else {
        var label =
          cta.getAttribute("data-waitlist-label") || WAITLIST_LABEL_DEFAULT;
        cta.setAttribute("href", WAITLIST_URL);
        cta.setAttribute("data-waitlist-active", "true");
        cta.textContent = label;
      }
    }

    // Price displays collapse to "Coming soon" when sales are off.
    if (!SALES_ENABLED) {
      var prices = document.querySelectorAll("[data-price]");
      for (var p = 0; p < prices.length; p++) {
        prices[p].textContent = "Coming soon";
        prices[p].classList.add("is-coming-soon");
      }
    }

    // Blocks that only make sense in one state.
    toggleAll("[data-when-sales-on]", SALES_ENABLED);
    toggleAll("[data-when-sales-off]", !SALES_ENABLED);
  }

  function toggleAll(selector, show) {
    var els = document.querySelectorAll(selector);
    for (var i = 0; i < els.length; i++) {
      els[i].hidden = !show;
    }
  }

  /* ------------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------------ */

  function initNavToggle() {
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.getElementById("primary-nav");
    if (!toggle || !menu) return;

    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Collapse the menu when a link is followed.
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ------------------------------------------------------------------------
     Analytics — GA4 via gtag.js, loaded only once a real ID is configured
     ------------------------------------------------------------------------ */

  function analyticsReady() {
    return (
      typeof GA_MEASUREMENT_ID === "string" &&
      GA_MEASUREMENT_ID.indexOf("TODO") === -1 &&
      GA_MEASUREMENT_ID.charAt(0) === "G"
    );
  }

  function initAnalytics() {
    if (analyticsReady()) {
      var s = document.createElement("script");
      s.async = true;
      s.src =
        "https://www.googletagmanager.com/gtag/js?id=" +
        encodeURIComponent(GA_MEASUREMENT_ID);
      document.head.appendChild(s);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", GA_MEASUREMENT_ID);
    }

    bindAnalyticsEvents();
  }

  function track(eventName, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params || {});
    }
  }

  function bindAnalyticsEvents() {
    // Buy-button clicks.
    var buyCtas = document.querySelectorAll("[data-buy-cta]");
    for (var i = 0; i < buyCtas.length; i++) {
      buyCtas[i].addEventListener("click", function (e) {
        var el = e.currentTarget;
        if (el.getAttribute("data-waitlist-active") === "true") {
          track("waitlist_cta_click", { location: ctaLocation(el) });
        } else {
          track("begin_checkout", {
            location: ctaLocation(el),
            items: [{ item_name: "Digital SAT Practice Test 1", price: 19 }]
          });
        }
      });
    }

    // Sample / waitlist form submissions.
    var forms = document.querySelectorAll("[data-capture-form] form, form[data-capture-form]");
    for (var f = 0; f < forms.length; f++) {
      forms[f].addEventListener("submit", function (e) {
        track("generate_lead", {
          location: e.currentTarget.getAttribute("data-form-name") || "sample"
        });
      });
    }
  }

  function ctaLocation(el) {
    return el.getAttribute("data-cta-location") || "unknown";
  }

  /* ------------------------------------------------------------------------
     Purchase conversion — fires once, on the thank-you page only.
     Paddle appends its transaction id as _ptxn on the success redirect; we
     use it as the GA4 transaction_id so a refreshed thank-you page is
     de-duplicated rather than counted as a second sale. (session_id is also
     read so the older Stripe-style success URLs still de-duplicate if one
     is ever used.) Link Google Ads to this GA4 property and import the
     "purchase" event as a conversion action — no separate AW-xxxx pixel.
     ------------------------------------------------------------------------ */

  function trackPurchaseIfThankYouPage() {
    var marker = document.querySelector("[data-purchase-value]");
    if (!marker) return;

    var value = parseFloat(marker.getAttribute("data-purchase-value")) || 0;
    var params = new URLSearchParams(window.location.search);
    var txnId = params.get("_ptxn") || params.get("session_id") || "";

    track("purchase", {
      transaction_id: txnId,
      value: value,
      currency: "USD",
      items: [{ item_name: "Digital SAT Practice Test 1", price: value }]
    });
  }
})();
