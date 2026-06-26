import {
  WIDGET_PUBLIC_KEY,
  applyHostCssVars,
  buildScriptEmbedWidgetConfig,
  clearReihLoader,
  createWidgetOpener,
  initListingPage,
  resolveListingMedia,
} from "./shared.js";

var WIDGET_SCRIPT_URL =
  "https://reimaginehome-embed-widget-app-git-dev-styldod.vercel.app/widget.js";
var WIDGET_SCRIPT_ID = "reih-widget-script";
var LOG_PREFIX = "[script-embed]";

function waitForReihWidget(timeoutMs) {
  var timeout = timeoutMs || 30000;
  var existing = window.reihWidget;

  if (existing && typeof existing.open === "function") {
    return Promise.resolve(existing);
  }

  return new Promise(function (resolve, reject) {
    var script = document.querySelector('script[src*="widget.js"]');
    var settled = false;
    var poller;
    var timer;

    function finish(widget) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearInterval(poller);
      script?.removeEventListener("load", tryResolve);
      resolve(widget);
    }

    function tryResolve() {
      var widget = window.reihWidget;
      if (widget && typeof widget.open === "function") {
        finish(widget);
      }
    }

    script?.addEventListener("load", tryResolve);
    poller = window.setInterval(tryResolve, 50);
    timer = window.setTimeout(function () {
      if (settled) return;
      settled = true;
      clearInterval(poller);
      script?.removeEventListener("load", tryResolve);
      reject(new Error("[reih] Widget script did not load in time"));
    }, timeout);
    tryResolve();
  });
}

function loadWidgetScript() {
  if (document.getElementById(WIDGET_SCRIPT_ID)) {
    if (window.reihWidget?.open) {
      console.log(LOG_PREFIX + " Widget script already loaded");
    }
    return;
  }

  var script = document.createElement("script");
  script.id = WIDGET_SCRIPT_ID;
  script.src = WIDGET_SCRIPT_URL + "?v=" + Date.now();
  script.async = true;
  script.setAttribute("data-public-key", WIDGET_PUBLIC_KEY);
  script.onload = function () {
    console.log(LOG_PREFIX + " Widget script loaded");
  };
  script.onerror = function () {
    console.error(LOG_PREFIX + " Widget script failed to load");
  };
  document.body.appendChild(script);
}

var openWidget = createWidgetOpener(waitForReihWidget, LOG_PREFIX);

document.addEventListener("DOMContentLoaded", function () {
  applyHostCssVars();

  var config = buildScriptEmbedWidgetConfig();
  window.reihWidgetConfig = config;
  console.log(LOG_PREFIX + " Widget config created", config.branding);

  initListingPage({ openWidget: openWidget, logPrefix: LOG_PREFIX });
  loadWidgetScript();

  window.addEventListener("beforeunload", clearReihLoader);
});
