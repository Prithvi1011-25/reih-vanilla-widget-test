# REIH Vanilla JS Widget Compatibility Test

Plain HTML, CSS, and JavaScript host pages for testing ReimagineHome widget integration.

## Pages

| Page | Integration |
|------|-------------|
| [index.html](./index.html) | Home — choose an approach |
| [script-embed.html](./script-embed.html) | CDN `widget.js` + `window.reihWidgetConfig` |
| [package.html](./package.html) | `reimaginehome-widget` npm package via ES module import |

## Live site

https://reih-vanilla-widget-test.vercel.app

## Run locally

```bash
python3 -m http.server 8080
```

Open http://localhost:8080

## Refresh vendored npm package

```bash
npm install
npm run prepare-vendor
```

This copies `reimaginehome-widget` into `vendor/` and patches prod URLs to dev.
