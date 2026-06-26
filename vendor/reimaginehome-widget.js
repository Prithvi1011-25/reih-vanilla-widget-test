// ../shared/dist/constants.js
var SLIDE_MS = 300;
function readEnvValue() {
  return "dev";
}
function getReihEnv() {
  const raw = readEnvValue();
  if (raw === "local" || raw === "dev" || raw === "stage" || raw === "prod")
    return raw;
  return "dev";
}
function appBaseUrl(env = getReihEnv()) {
  return "https://reimaginehome-embed-widget-app-git-dev-styldod.vercel.app";
}
function apiBaseUrl(env = getReihEnv()) {
  return "https://oetb78o6i5.execute-api.us-west-2.amazonaws.com/dev";
}

// src/config.ts
function readScriptAttrConfig() {
  const el = document.currentScript ?? document.querySelector('script[src*="widget.js"]');
  if (!el) return {};
  const out = {};
  const publicKey = el.dataset.publicKey;
  if (publicKey) out.public_key = publicKey;
  const mode = el.dataset.mode;
  if (mode === "simple" || mode === "agentic") {
    out.mode = mode;
  }
  const userId = el.dataset.userId;
  if (userId) out.user_id = userId;
  const sessionId = el.dataset.sessionId;
  if (sessionId) out.session_id = sessionId;
  return out;
}
function validateConfig(raw) {
  if (!raw || typeof raw !== "object") {
    console.warn("[reih] widget config is missing or invalid.");
    return null;
  }
  const cfg = raw;
  if (!cfg.public_key || typeof cfg.public_key !== "string") {
    console.warn("[reih] config.public_key is required.");
    return null;
  }
  if (!Array.isArray(cfg.media) || cfg.media.length === 0) {
    console.warn("[reih] config.media must be a non-empty array.");
    return null;
  }
  for (const item of cfg.media) {
    if (!item || typeof item !== "object" || !item.image_url) {
      console.warn("[reih] Each media item must have an image_url property.");
      return null;
    }
  }
  const mode = cfg.mode || "simple";
  if (mode !== "simple" && mode !== "agentic") {
    console.warn('[reih] config.mode must be "simple" or "agentic".');
    return null;
  }
  return {
    publicKey: cfg.public_key,
    media: cfg.media,
    clientSessionId: cfg.session_id,
    userId: cfg.user_id,
    mode,
    appUrl: appBaseUrl().replace(/\/$/, ""),
    apiBaseUrl: apiBaseUrl().replace(/\/$/, ""),
    branding: cfg.branding,
    language: cfg.language,
    theme: cfg.theme,
    onError: cfg.onError,
    onClose: cfg.onClose
  };
}

// src/api.ts
var DEVICE_FINGERPRINT_KEY = "reih_device_fingerprint";
function generateUuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : r & 3 | 8).toString(16);
  });
}
function getDeviceFingerprint() {
  try {
    const existing = window.localStorage.getItem(DEVICE_FINGERPRINT_KEY);
    if (existing) return existing;
    const id = generateUuid();
    window.localStorage.setItem(DEVICE_FINGERPRINT_KEY, id);
    return id;
  } catch {
    return generateUuid();
  }
}
function getDeviceType() {
  const width = window.screen?.width ?? window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}
function parseBrowser(ua) {
  const rules = [
    [/Edg\/([\d.]+)/, "Edge"],
    [/OPR\/([\d.]+)/, "Opera"],
    [/Chrome\/([\d.]+)/, "Chrome"],
    [/Version\/([\d.]+).*Safari/, "Safari"],
    [/Firefox\/([\d.]+)/, "Firefox"]
  ];
  for (const [pattern, name] of rules) {
    const match = ua.match(pattern);
    if (match) return { name, version: match[1] };
  }
  return { name: "Unknown", version: "" };
}
function parsePlatform(ua) {
  const windows = ua.match(/Windows NT ([\d.]+)/);
  if (windows) return { platform: "Windows", os_version: windows[1] };
  const mac = ua.match(/Mac OS X ([\d_]+)/);
  if (mac) return { platform: "macOS", os_version: mac[1].replace(/_/g, ".") };
  const android = ua.match(/Android ([\d.]+)/);
  if (android) return { platform: "Android", os_version: android[1] };
  const ios = ua.match(/(iPhone|iPad|iPod).*OS ([\d_]+)/);
  if (ios) return { platform: "iOS", os_version: ios[2].replace(/_/g, ".") };
  if (/Linux/.test(ua)) return { platform: "Linux" };
  return { platform: navigator.platform || "Unknown" };
}
function collectDeviceInfo() {
  const ua = navigator.userAgent;
  const browser = parseBrowser(ua);
  const { platform, os_version } = parsePlatform(ua);
  return {
    device_type: getDeviceType(),
    platform,
    os_version,
    browser_name: browser.name,
    browser_version: browser.version,
    screen_width: window.screen?.width ?? window.innerWidth,
    screen_height: window.screen?.height ?? window.innerHeight,
    language: navigator.language || "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}
async function createSession(config) {
  const url = `${config.apiBaseUrl}/v1/public/session`;
  const body = {
    public_key: config.publicKey,
    device_fingerprint: getDeviceFingerprint(),
    ...config.userId && { user_id: config.userId },
    metadata: collectDeviceInfo(),
    config: {
      // Send only the fields the backend session config accepts (its Joi
      // schema rejects unknown keys); id/metadata are not part of the contract.
      media: config.media.map((m) => ({
        image_url: m.image_url,
        ...m.label && { label: m.label }
      })),
      mode: config.mode,
      // Client-facing key is `session_id`; mapped to `client_session_id` for
      // the backend (our own session is identified by its `_id`).
      ...config.clientSessionId && {
        client_session_id: config.clientSessionId
      }
    }
  };
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `[reih] Session API failed (${response.status}): ${text || response.statusText}`
    );
  }
  const data = await response.json();
  if (!data.session_id) {
    throw new Error("[reih] Session API returned no session_id.");
  }
  return data;
}

// ../shared/dist/messages.js
var REIH_MESSAGE_PREFIX = "reih:";
function isReihMessage(value) {
  return typeof value === "object" && value !== null && "type" in value && typeof value.type === "string" && value.type.startsWith(REIH_MESSAGE_PREFIX);
}

// src/iframe.ts
function createIframe(config, onRequestClose) {
  const wrapper = document.createElement("div");
  wrapper.id = "reih-widget-frame";
  wrapper.className = "reih-frame-wrap";
  const iframe = document.createElement("iframe");
  iframe.className = "reih-frame-wrap__iframe";
  iframe.setAttribute("allow", "clipboard-write");
  iframe.setAttribute("allowtransparency", "true");
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("title", "REimagineHome Widget");
  function load(sessionId) {
    const origin = encodeURIComponent(window.location.origin);
    iframe.src = `${config.appUrl}/${sessionId}/${config.publicKey}?origin=${origin}`;
  }
  wrapper.appendChild(iframe);
  document.body.appendChild(wrapper);
  const onKeydown = (e) => {
    if (e.key === "Escape") onRequestClose();
  };
  const prevOverflow = document.body.style.overflow;
  let hiding = false;
  function show() {
    hiding = false;
    wrapper.classList.remove("reih-frame-wrap--closing");
    wrapper.classList.add("reih-frame-wrap--open");
    wrapper.classList.remove("reih-frame-wrap--animate");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        wrapper.classList.add("reih-frame-wrap--animate");
      });
    });
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeydown);
  }
  function hide(onComplete) {
    if (hiding || !wrapper.classList.contains("reih-frame-wrap--open")) {
      onComplete?.();
      return;
    }
    hiding = true;
    wrapper.classList.remove("reih-frame-wrap--animate");
    wrapper.classList.add("reih-frame-wrap--closing");
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      iframe.removeEventListener("transitionend", onTransitionEnd);
      wrapper.classList.remove("reih-frame-wrap--open", "reih-frame-wrap--closing");
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeydown);
      hiding = false;
      onComplete?.();
    };
    const onTransitionEnd = (e) => {
      if (e.target !== iframe || e.propertyName !== "transform") return;
      finish();
    };
    iframe.addEventListener("transitionend", onTransitionEnd);
    window.setTimeout(finish, SLIDE_MS + 50);
  }
  function destroy2() {
    hide();
    document.removeEventListener("keydown", onKeydown);
    wrapper.remove();
  }
  return { wrapper, iframe, show, hide, destroy: destroy2, load };
}

// src/bridge.ts
function createBridge(config, iframeHandle2, handlers) {
  const appOrigin = new URL(config.appUrl).origin;
  const postToApp = (message) => {
    iframeHandle2.iframe.contentWindow?.postMessage(message, appOrigin);
  };
  const onMessage = (event) => {
    if (event.origin !== appOrigin) return;
    if (event.source !== iframeHandle2.iframe.contentWindow) return;
    if (!isReihMessage(event.data)) return;
    const msg = event.data;
    switch (msg.type) {
      case "reih:ready":
        postToApp({
          type: "reih:init",
          public_key: config.publicKey,
          client_session_id: config.clientSessionId,
          media: config.media,
          mode: config.mode,
          branding: config.branding,
          language: config.language,
          user_id: config.userId,
          parentOrigin: window.location.origin
        });
        if (config.theme) {
          postToApp({ type: "reih:theme", theme: config.theme });
        }
        break;
      case "reih:resize":
        iframeHandle2.iframe.style.height = `${msg.height}px`;
        if (msg.width) iframeHandle2.iframe.style.width = `${msg.width}px`;
        break;
      case "reih:close":
        handlers.onRequestClose();
        break;
      case "reih:error":
        config.onError?.({ message: msg.message, code: msg.code });
        break;
    }
  };
  window.addEventListener("message", onMessage);
  const destroy2 = () => window.removeEventListener("message", onMessage);
  return { postToApp, destroy: destroy2 };
}

// src/styles.ts
var STYLE_ID = "reih-widget-styles";
var CSS = `
.reih-frame-wrap {
  position: fixed;
  inset: 0;
  z-index: 2147483600;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.6);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0s linear 0.45s;
}
.reih-frame-wrap--open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition:
    opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0s;
}
.reih-frame-wrap--open.reih-frame-wrap--closing {
  opacity: 0;
  pointer-events: none;
  transition-delay: 0.12s;
}
.reih-frame-wrap__iframe {
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
  box-shadow: 0 -12px 48px rgba(0, 0, 0, 0.28);
  transform: translateY(100%);
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}
.reih-frame-wrap--open.reih-frame-wrap--animate .reih-frame-wrap__iframe {
  transform: translateY(0);
  transition-delay: 0.12s;
}
@media (max-width: 640px) {
  .reih-frame-wrap__iframe {
    max-width: 100%;
    max-height: 100%;
    border-radius: 0;
  }
}
`;
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

// src/loaderCard.ts
var LOADER_ID = "reih-host-loader";
var LOADER_STYLE_ID = "reih-loader-styles";
var LOADER_CSS = `
.reih-loader {
  position: fixed;
  inset: 0;
  z-index: 2147483601;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  animation: reihLoaderIn 0.25s ease both;
}
@keyframes reihLoaderIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.reih-loader__card {
  position: relative;
  overflow: hidden;
  width: min(520px, calc(100vw - 40px));
  border-radius: 24px;
  padding: clamp(34px, 5.4vmin, 56px) clamp(30px, 5vmin, 54px) clamp(28px, 4vmin, 42px);
  display: flex;
  flex-direction: column;
  align-items: center;
  background: radial-gradient(125% 105% at 24% 10%, #fff, #fafaf4 72%);
  border: 1px solid #e6e6e6;
  box-shadow: 0 34px 90px rgba(0,0,0,.18), 0 0 0 1px rgba(255,255,255,.8), inset 0 1px 0 rgba(255,255,255,.9);
  animation: reihCardIn 0.5s cubic-bezier(.2,.8,.25,1) both;
}
@keyframes reihCardIn {
  from { opacity: 0; transform: scale(.92) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.reih-loader__spot {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  border-radius: inherit;
  background:
    radial-gradient(48% 42% at 26% 14%, rgba(255,255,255,.8), transparent 60%),
    radial-gradient(54% 48% at 84% 90%, rgba(63,211,123,.16), transparent 62%);
  animation: reihSpot 8s ease-in-out infinite alternate;
}
@keyframes reihSpot {
  from { transform: translate3d(-2%,-1%,0) scale(1); }
  to { transform: translate3d(2%,2%,0) scale(1.08); }
}

.reih-loader__stage {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(14px, 2.5vmin, 24px);
  width: 100%;
  text-align: center;
}

.reih-loader__logo {
  width: clamp(120px, 20vmin, 158px);
  height: clamp(36px, 5.8vmin, 48px);
  padding: 8px 14px;
  border-radius: 13px;
  background: #fff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 10px 24px rgba(0,0,0,.1);
  display: grid;
  place-items: center;
  animation: reihMarkIn 0.6s cubic-bezier(.2,.8,.2,1) both;
}
.reih-loader__logo img {
  width: 100%;
  height: auto;
  object-fit: contain;
}
@keyframes reihMarkIn {
  from { opacity: 0; transform: translateY(-8px) scale(.82); }
  to { opacity: 1; transform: none; }
}

.reih-loader__board {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: clamp(5px, 1.1vmin, 11px);
  padding: clamp(6px, 1.4vmin, 12px) 0 clamp(2px, .6vmin, 6px);
}
.reih-loader__swatch {
  position: relative;
  width: clamp(44px, 8vmin, 64px);
  height: clamp(58px, 10.5vmin, 84px);
  border-radius: 12px;
  background: var(--c, #ccc);
  box-shadow: 0 14px 26px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.45), inset 0 -12px 18px rgba(0,0,0,.16);
  transform-origin: bottom center;
  opacity: 0;
  overflow: hidden;
  animation: reihDeal .62s cubic-bezier(.18,.9,.25,1.25) both, reihLight 3.4s ease-in-out infinite;
}
.reih-loader__swatch::before {
  content: attr(data-step);
  position: absolute; top: 8px; left: 8px;
  display: grid; place-items: center;
  width: 20px; height: 20px; border-radius: 50%;
  font-size: 9px; font-weight: 700;
  color: rgba(255,255,255,.96);
  background: rgba(14,14,14,.22);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.22);
}
.reih-loader__swatch::after {
  content: attr(data-label);
  position: absolute; left: 0; right: 0; bottom: 0;
  font-size: clamp(6.5px, 1.15vmin, 9px); font-weight: 600;
  letter-spacing: .05em; text-transform: uppercase;
  color: rgba(255,255,255,.94); padding: 3px 2px;
  background: linear-gradient(to top, rgba(0,0,0,.4), rgba(0,0,0,.05) 70%, transparent);
  text-shadow: 0 1px 2px rgba(0,0,0,.5);
}
.reih-loader__swatch:nth-child(1) { --rot: -9deg; animation-delay: 0s, 2.0s; }
.reih-loader__swatch:nth-child(2) { --rot: -4.5deg; animation-delay: .1s, 2.18s; }
.reih-loader__swatch:nth-child(3) { --rot: 0deg; animation-delay: .2s, 2.36s; }
.reih-loader__swatch:nth-child(4) { --rot: 4.5deg; animation-delay: .3s, 2.54s; }
.reih-loader__swatch:nth-child(5) { --rot: 9deg; animation-delay: .4s, 2.72s; }
@keyframes reihDeal {
  from { opacity: 0; transform: translateY(28px) rotate(0) scale(.65); }
  to { opacity: 1; transform: translateY(0) rotate(var(--rot, 0)) scale(1); }
}
@keyframes reihLight { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.18); } }
.reih-loader__board::before {
  content: "";
  position: absolute; inset: -12% -6%; z-index: 3; pointer-events: none;
  background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,.5) 50%, transparent 62%);
  transform: translateX(-135%); mix-blend-mode: screen;
  animation: reihGloss 3.8s ease-in-out 1s infinite;
}
@keyframes reihGloss { 0% { transform: translateX(-135%); } 55%,100% { transform: translateX(135%); } }

.reih-loader__title {
  font-weight: 400;
  font-size: clamp(21px, 3.8vmin, 34px);
  line-height: 1.05;
  letter-spacing: -.01em;
  color: #0e0e0e;
  overflow: hidden;
  padding-bottom: .08em;
}
.reih-loader__title span {
  display: inline-block;
  animation: reihTitleIn .75s cubic-bezier(.2,.85,.2,1) .15s both;
}
@keyframes reihTitleIn {
  from { opacity: 0; transform: translateY(115%); }
  to { opacity: 1; transform: none; }
}

.reih-loader__sub {
  font-weight: 500;
  font-size: clamp(13px, 2.1vmin, 16px);
  color: #525252;
  min-height: 1.4em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.reih-loader__dot {
  width: 6px; height: 6px; border-radius: 50%; flex: 0 0 auto;
  background: #3fd37b;
  box-shadow: 0 0 10px rgba(63,211,123,.85);
  animation: reihDotPulse 1.2s ease-in-out infinite;
}
@keyframes reihDotPulse { 0%,100% { opacity: .4; transform: scale(.8); } 50% { opacity: 1; transform: scale(1.3); } }

.reih-loader__note {
  max-width: 360px;
  font-size: clamp(11px, 1.75vmin, 13px);
  line-height: 1.45;
  color: #8a8a8a;
}

.reih-loader__bar {
  position: relative;
  width: clamp(150px, 30vmin, 230px);
  height: 3px;
  border-radius: 999px;
  background: #e6e6e6;
  overflow: hidden;
}
.reih-loader__bar i {
  position: absolute; inset: 0; border-radius: inherit;
  transform-origin: left;
  background: linear-gradient(90deg, rgba(63,211,123,.55), #3fd37b, #eafff2);
  box-shadow: 0 0 12px rgba(63,211,123,.55);
  animation: reihFill 2.8s cubic-bezier(.4,0,.1,1) forwards;
}
@keyframes reihFill { from { transform: scaleX(.04); } to { transform: scaleX(1); } }

.reih-loader__credit {
  font-size: clamp(11px, 1.8vmin, 14px);
  color: #8a8a8a;
}
.reih-loader__credit b {
  font-weight: 500;
  color: #525252;
}

@media (prefers-reduced-motion: reduce) {
  .reih-loader__spot, .reih-loader__swatch, .reih-loader__board::before,
  .reih-loader__title span, .reih-loader__dot, .reih-loader__bar i {
    animation: none;
  }
  .reih-loader__swatch { opacity: 1; transform: rotate(var(--rot, 0)); }
  .reih-loader__title span { opacity: 1; transform: none; }
  .reih-loader__bar i { transform: scaleX(.66); }
}
`;
function injectLoaderStyles() {
  if (document.getElementById(LOADER_STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = LOADER_STYLE_ID;
  el.textContent = LOADER_CSS;
  document.head.appendChild(el);
}
function showLoaderCard(branding) {
  if (document.getElementById(LOADER_ID)) return;
  injectLoaderStyles();
  const logo = branding?.logo || "";
  const heading = branding?.heading || "Preparing your visual preview";
  const subHeading = branding?.sub_heading || "Setting up your workspace";
  const footer = branding?.footer_text || "Powered by <b>ReimagineHome AI</b>";
  const overlay = document.createElement("div");
  overlay.id = LOADER_ID;
  overlay.className = "reih-loader";
  overlay.innerHTML = `
    <div class="reih-loader__card">
      <div class="reih-loader__spot"></div>
      <div class="reih-loader__stage">
        ${logo ? `<div class="reih-loader__logo"><img src="${logo}" alt="Logo"></div>` : ""}
        <div class="reih-loader__board">
          <div class="reih-loader__swatch" data-step="01" data-label="Photos" style="--c:linear-gradient(150deg,#58606b,#303740)"></div>
          <div class="reih-loader__swatch" data-step="02" data-label="Room" style="--c:linear-gradient(150deg,#7a917f,#496d57)"></div>
          <div class="reih-loader__swatch" data-step="03" data-label="Light" style="--c:linear-gradient(150deg,#f3d98e,#cc9d39)"></div>
          <div class="reih-loader__swatch" data-step="04" data-label="Style" style="--c:linear-gradient(150deg,#c79073,#8e5d4d)"></div>
          <div class="reih-loader__swatch" data-step="05" data-label="Ready" style="--c:linear-gradient(150deg,#3fd37b,#16884a)"></div>
        </div>
        <div class="reih-loader__title"><span>${heading}</span></div>
        <div class="reih-loader__sub"><span class="reih-loader__dot"></span><span>${subHeading}</span></div>
        <div class="reih-loader__bar"><i></i></div>
        <div class="reih-loader__credit">${footer}</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}
function hideLoaderCard() {
  const el = document.getElementById(LOADER_ID);
  if (el) el.remove();
}

// src/widget.ts
var resolvedConfig = null;
var iframeHandle = null;
var bridgeHandle = null;
var initialized = false;
var opening = false;
var programmaticConfig = {};
var scriptAttrConfig = typeof document !== "undefined" ? readScriptAttrConfig() : {};
function buildBaseConfig() {
  const windowConfig = typeof window !== "undefined" ? window.reihWidgetConfig ?? {} : {};
  return {
    ...scriptAttrConfig,
    ...windowConfig,
    ...programmaticConfig
  };
}
function configure(config) {
  programmaticConfig = { ...programmaticConfig, ...config };
}
async function open(overrides) {
  if (opening) return;
  if (initialized && iframeHandle && !overrides) {
    iframeHandle.show();
    return;
  }
  if (initialized && overrides) {
    destroy();
  }
  opening = true;
  injectStyles();
  const merged = { ...buildBaseConfig(), ...overrides ?? {} };
  const cfg = validateConfig(merged);
  resolvedConfig = cfg;
  showLoaderCard(cfg?.branding);
  if (!cfg) {
    hideLoaderCard();
    opening = false;
    return;
  }
  try {
    const session = await createSession(cfg);
    if (!opening) {
      hideLoaderCard();
      return;
    }
    const frame = createIframe(cfg, () => close());
    const bridge = createBridge(cfg, frame, {
      onRequestClose: () => close()
    });
    frame.load(session.session_id);
    iframeHandle = frame;
    bridgeHandle = bridge;
    initialized = true;
    opening = false;
    hideLoaderCard();
    frame.show();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Session init failed";
    console.error(message);
    cfg.onError?.({ message, code: "SESSION_INIT_FAILED" });
    hideLoaderCard();
    opening = false;
  }
}
function close() {
  if (!iframeHandle) {
    resolvedConfig?.onClose?.();
    return;
  }
  iframeHandle.hide(() => {
    resolvedConfig?.onClose?.();
  });
}
function destroy() {
  bridgeHandle?.destroy();
  iframeHandle?.destroy();
  bridgeHandle = null;
  iframeHandle = null;
  resolvedConfig = null;
  initialized = false;
  opening = false;
}
var reihWidget = {
  configure,
  open,
  close,
  destroy
};

// src/module.ts
var module_default = reihWidget;

export { close, configure, module_default as default, destroy, open, reihWidget };
