import { reihWidget } from "./vendor/reimaginehome-widget.js";
import {
  WIDGET_DEV_API_BASE_URL,
  applyHostCssVars,
  buildNpmWidgetConfigureOptions,
  clearReihLoader,
  createWidgetOpener,
  initListingPage,
} from "./shared.js";

var LOG_PREFIX = "[package]";

var openWidget = createWidgetOpener(function () {
  return Promise.resolve(reihWidget);
}, LOG_PREFIX);

document.addEventListener("DOMContentLoaded", function () {
  applyHostCssVars();

  reihWidget.configure(buildNpmWidgetConfigureOptions());
  console.log(
    LOG_PREFIX + " reimaginehome-widget configured (dev API:",
    WIDGET_DEV_API_BASE_URL + ")"
  );

  initListingPage({ openWidget: openWidget, logPrefix: LOG_PREFIX });

  window.addEventListener("beforeunload", function () {
    reihWidget.destroy();
    clearReihLoader();
    console.log(LOG_PREFIX + " reimaginehome-widget destroyed");
  });
});
