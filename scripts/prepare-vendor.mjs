#!/usr/bin/env node
/**
 * Copies reimaginehome-widget from node_modules and patches prod URLs to dev.
 * Run from repo root: npm run prepare-vendor
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

var __dirname = path.dirname(fileURLToPath(import.meta.url));
var repoRoot = path.resolve(__dirname, "..");
var src = path.join(
  repoRoot,
  "node_modules/reimaginehome-widget/dist/index.js"
);
var dest = path.resolve(__dirname, "../vendor/reimaginehome-widget.js");

if (!fs.existsSync(src)) {
  console.error("Missing package — run npm install in repo root first.");
  process.exit(1);
}

var code = fs.readFileSync(src, "utf8");
code = code
  .replaceAll(
    "https://oetb78o6i5.execute-api.us-west-2.amazonaws.com/prod",
    "https://oetb78o6i5.execute-api.us-west-2.amazonaws.com/dev"
  )
  .replaceAll(
    "https://widget.styldod.com",
    "https://reimaginehome-embed-widget-app-git-dev-styldod.vercel.app"
  )
  .replace('return "prod"', 'return "dev"');

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, code);
console.log("Wrote", dest);
