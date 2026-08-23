/* ==========================================================================
   1600 SAT Lab — shared behaviour
   Progressive enhancement only. Every page is fully usable with JS disabled.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Configuration — the only values you should ever need to edit
   -------------------------------------------------------------------------- */

// Flip to true once STRIPE_PAYMENT_LINK_URL below is a real Payment Link.
// Currently false because that URL is still a TODO placeholder — flipping
// this on before then would put a live, clickable "$19" button on the site
// that goes nowhere. Price displays read "Coming soon" while this is false.
// No other edit is required either direction.
const SALES_ENABLED = false;

// Single source of truth for the Practice Test 1 checkout link.
// Every buy button on the site derives its href from this constant.
// This is a Stripe Payment Link (buy.stripe.com/...) — a plain URL, not a
// script-based overlay, so the buy button is a REAL link that works even if
// JavaScript never loads. Create it in Stripe Dashboard -> Payment Links,
// set the "public business name" shown at checkout to "1600 SAT Lab" (not
// your legal name), and set its success URL to
// https://1600satlab.com/thank-you/?session_id={CHECKOUT_SESSION_ID}
// (Stripe substitutes the session ID at redirect time — it powers the
// purchase-conversion event below and lets Google de-duplicate a refreshed
// thank-you page from a real second sale).
// TODO(owner): paste the real Payment Link URL here. See SETUP.md.
const STRIPE_PAYMENT_LINK_URL = "https://buy.stripe.com/TODO_PAYMENT_LINK";

// Where a purchase CTA points when SALES_ENABLED is false.
const WAITLIST_URL = "/sample/#waitlist";
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
    initNavToggle();
    initAnalytics();
    trackPurchaseIfThankYouPage();
  });

  /* ------------------------------------------------------------------------
     Sales toggle
     Same DOM in both states — only href, label and class change.
     ------------------------------------------------------------------------ */

  function applySalesState() {
    var buyCtas = document.querySelectorAll("[data-buy-cta]");

    for (var i = 0; i < buyCtas.length; i++) {
      var cta = buyCtas[i];

      if (SALES_ENABLED) {
        // Derive every buy link from the single constant. Stripe Payment
        // Links need no script and no special class — it's just a link.
        cta.setAttribute("href", STRIPE_PAYMENT_LINK_URL);
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
     Reads the Stripe Checkout session ID from the URL (if the Payment
     Link's success URL includes ?session_id={CHECKOUT_SESSION_ID}) so a
     page refresh doesn't count as a second sale. Link Google Ads to this
     GA4 property and import the "purchase" event as a conversion action —
     no separate AW-xxxx pixel needed on this page.
     ------------------------------------------------------------------------ */

  function trackPurchaseIfThankYouPage() {
    var marker = document.querySelector("[data-purchase-value]");
    if (!marker) return;

    var value = parseFloat(marker.getAttribute("data-purchase-value")) || 0;
    var params = new URLSearchParams(window.location.search);
    var sessionId = params.get("session_id") || "";

    track("purchase", {
      transaction_id: sessionId,
      value: value,
      currency: "USD",
      items: [{ item_name: "Digital SAT Practice Test 1", price: value }]
    });
  }
})();
