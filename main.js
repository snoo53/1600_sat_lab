/* ==========================================================================
   1600 SAT Lab — shared behaviour
   Progressive enhancement only. Every page is fully usable with JS disabled.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Configuration — the only values you should ever need to edit
   -------------------------------------------------------------------------- */

// Flip to false to convert every checkout CTA into a waitlist signup.
// Price displays become "Coming soon". No other edit is required.
const SALES_ENABLED = true;

// Single source of truth for the Practice Test 1 checkout link.
// Every buy button on the site derives its href from this constant.
// TODO(owner): replace with an anonymised Gumroad permalink — the current
// host "sunwoolee.gumroad.com" exposes the owner's real name and breaks the
// anonymous-brand rule. See SETUP.md.
const GUMROAD_TEST1_URL = "https://sunwoolee.gumroad.com/l/rqsfzh?wanted=true";

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
        // Derive every buy link from the single constant.
        cta.setAttribute("href", GUMROAD_TEST1_URL);
        cta.classList.add("gumroad-button");
        cta.removeAttribute("data-waitlist-active");
      } else {
        var label =
          cta.getAttribute("data-waitlist-label") || WAITLIST_LABEL_DEFAULT;
        cta.setAttribute("href", WAITLIST_URL);
        // Drop the Gumroad hook so the overlay script ignores this element.
        cta.classList.remove("gumroad-button");
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
})();
