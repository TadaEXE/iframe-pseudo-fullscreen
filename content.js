const STYLE_ID = "ipf-style";
const ATTR_ENABLED = "data-ipf-enabled";
const ATTR_TARGET = "data-ipf-target";
const ATTR_HIDDEN = "data-ipf-hidden";

const SAFEZONE_ID = "ipf-cursor-safezone";
const ATTR_PAGE_INSIDE = "data-ipf-page-inside";
const ATTR_ZONE_INSIDE = "data-ipf-zone-inside";

const SESSION_KEY = "ipf_enabled_v4";
const SESSION_IFRAME_SEL_KEY = "ipf_iframe_selector_v4";
const SESSION_HIDE_SEL_KEY = "ipf_hide_selector_v4";

const IFRAME_SELECTOR = "iframe";
const HIDE_SELECTOR =
  "header, nav, [role='banner'], .header, #header, .navbar, #navbar, .topbar, .sticky, .fixed-top";

function setSessionEnabled(enabled) {
  try {
    if (enabled) sessionStorage.setItem(SESSION_KEY, "1");
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

function getSessionEnabled() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function setSessionSelectors(iframeSelector, hideSelector) {
  try {
    sessionStorage.setItem(SESSION_IFRAME_SEL_KEY, iframeSelector || "");
    sessionStorage.setItem(SESSION_HIDE_SEL_KEY, hideSelector || "");
  } catch {}
}

function getSessionSelectors() {
  try {
    return {
      iframeSelector: sessionStorage.getItem(SESSION_IFRAME_SEL_KEY) || "",
      hideSelector: sessionStorage.getItem(SESSION_HIDE_SEL_KEY) || ""
    };
  } catch {
    return { iframeSelector: "", hideSelector: "" };
  }
}

function isEnabled() {
  return document.documentElement.getAttribute(ATTR_ENABLED) === "1";
}

function setPageInside(v) {
  document.documentElement.setAttribute(ATTR_PAGE_INSIDE, v ? "1" : "0");
}

function setZoneInside(v) {
  document.documentElement.setAttribute(ATTR_ZONE_INSIDE, v ? "1" : "0");
}

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    html[${ATTR_ENABLED}="1"],
    html[${ATTR_ENABLED}="1"] body {
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
      background: black !important;
    }

    html[${ATTR_ENABLED}="1"] [${ATTR_TARGET}="1"] {
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: none !important;
      max-height: none !important;
      margin: 0 !important;
      border: 0 !important;
      padding: 0 !important;
      z-index: 2147483646 !important;
      background: black !important;
      display: block !important;
      cursor: none !important;
    }

    html[${ATTR_ENABLED}="1"] [${ATTR_HIDDEN}="1"] {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    html[${ATTR_ENABLED}="1"] #${SAFEZONE_ID} {
      position: fixed !important;
      left: 50% !important;
      top: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: 96px !important;
      height: 96px !important;
      z-index: 2147483647 !important;

      border-radius: 10px !important;
      pointer-events: auto !important;
      user-select: none !important;
      -webkit-user-select: none !important;

      cursor: none !important;

      background: rgba(255,255,255,0.14) !important;
      border: 1px solid rgba(100, 100, 100, 0.35) !important;
      box-sizing: border-box;
      backdrop-filter: none !important;
    }

    html[${ATTR_ENABLED}="1"][${ATTR_ZONE_INSIDE}="1"] #${SAFEZONE_ID} {
      background: rgba(255,255,255,0.0) !important;
      border-color: rgba(0, 0, 0, 0.0) !important;
    }

    html[${ATTR_ENABLED}="1"][${ATTR_PAGE_INSIDE}="0"] #${SAFEZONE_ID} {
      display: none !important;
    }
  `;
  document.documentElement.appendChild(style);
}

function clearTargetMarkers() {
  const prev = document.querySelectorAll(`[${ATTR_TARGET}="1"]`);
  for (const el of prev) el.removeAttribute(ATTR_TARGET);
}

function clearHiddenMarkers() {
  const prev = document.querySelectorAll(`[${ATTR_HIDDEN}="1"]`);
  for (const el of prev) el.removeAttribute(ATTR_HIDDEN);
}

function clearSafezone() {
  const el = document.getElementById(SAFEZONE_ID);
  if (el) el.remove();
  setZoneInside(false);
}

function findIframe(selector) {
  try {
    const el = document.querySelector(selector);
    if (el && el.tagName === "IFRAME") return el;
    return null;
  } catch {
    return null;
  }
}

function markHidden(hideSelector) {
  clearHiddenMarkers();
  if (!hideSelector) return;

  let nodes = [];
  try {
    nodes = Array.from(document.querySelectorAll(hideSelector));
  } catch {
    return;
  }

  const target = document.querySelector(`[${ATTR_TARGET}="1"]`);
  for (const el of nodes) {
    if (target && (el === target || el.contains(target))) continue;
    el.setAttribute(ATTR_HIDDEN, "1");
  }
}

function ensureSafezone() {
  if (!isEnabled()) {
    clearSafezone();
    return;
  }

  let el = document.getElementById(SAFEZONE_ID);
  if (el) return;

  el = document.createElement("div");
  el.id = SAFEZONE_ID;

  el.addEventListener("mouseenter", () => setZoneInside(true));
  el.addEventListener("mouseleave", () => setZoneInside(false));

  document.documentElement.appendChild(el);
}

function enablePseudoFullscreen(iframeSelector, hideSelector) {
  ensureStyle();
  clearTargetMarkers();

  const iframe = findIframe(iframeSelector);
  if (!iframe) {
    console.warn(`[Iframe Pseudo Fullscreen] No iframe found for selector: ${iframeSelector}`);
    document.documentElement.removeAttribute(ATTR_ENABLED);
    setSessionEnabled(false);
    clearSafezone();
    return;
  }

  iframe.setAttribute(ATTR_TARGET, "1");
  document.documentElement.setAttribute(ATTR_ENABLED, "1");
  markHidden(hideSelector);

  setSessionEnabled(true);
  setSessionSelectors(iframeSelector, hideSelector);

  ensureSafezone();

  requestAnimationFrame(() => {
    try {
      iframe.scrollIntoView({ block: "center", inline: "center" });
    } catch {}
  });
}

function disablePseudoFullscreen() {
  clearTargetMarkers();
  clearHiddenMarkers();
  document.documentElement.removeAttribute(ATTR_ENABLED);
  setSessionEnabled(false);
  clearSafezone();
}

function togglePseudoFullscreen() {
  if (isEnabled()) {
    disablePseudoFullscreen();
    return;
  }
  enablePseudoFullscreen(IFRAME_SELECTOR, HIDE_SELECTOR);
}

function startPersistenceObserver() {
  const mo = new MutationObserver(() => {
    if (!getSessionEnabled()) return;

    const enabled = isEnabled();
    const { iframeSelector, hideSelector } = getSessionSelectors();
    const ifSel = iframeSelector || IFRAME_SELECTOR;
    const hiSel = hideSelector || HIDE_SELECTOR;

    if (!enabled) {
      enablePseudoFullscreen(ifSel, hiSel);
      return;
    }

    const target = document.querySelector(`[${ATTR_TARGET}="1"]`);
    if (!target || target.tagName !== "IFRAME" || !document.contains(target)) {
      enablePseudoFullscreen(ifSel, hiSel);
      return;
    }

    markHidden(hiSel);
    ensureSafezone();
  });

  mo.observe(document.documentElement, { childList: true, subtree: true });
}

function installPointerPresenceTracking() {
  setPageInside(true);
  setZoneInside(false);

  document.addEventListener("mouseenter", () => setPageInside(true), true);
  document.addEventListener("mouseleave", () => {
    setPageInside(false);
    setZoneInside(false);
  }, true);

  window.addEventListener("blur", () => {
    setPageInside(false);
    setZoneInside(false);
  });

  window.addEventListener("focus", () => {
    setPageInside(true);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      setPageInside(false);
      setZoneInside(false);
    } else {
      setPageInside(true);
    }
  });
}

browser.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "TOGGLE_PSEUDO_FULLSCREEN") {
    togglePseudoFullscreen();
  }
});

(() => {
  ensureStyle();
  installPointerPresenceTracking();

  if (getSessionEnabled()) {
    const stored = getSessionSelectors();
    enablePseudoFullscreen(
      stored.iframeSelector || IFRAME_SELECTOR,
      stored.hideSelector || HIDE_SELECTOR
    );
  } else {
    setSessionSelectors(IFRAME_SELECTOR, HIDE_SELECTOR);
  }

  startPersistenceObserver();
  ensureSafezone();
})();

