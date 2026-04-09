// luma_control/content.js
// Content script for Luma — Brightness Controller
// - Applies a CSS-based brightness filter to the page
// - Honors per-site settings and a global default from chrome.storage
// - Listens for storage changes and runtime messages to reapply settings
// - Uses a dedicated <style> node so it is less likely to interfere with page styles
//
// Design goals:
// - Robust: tolerate pages that disallow modifications
// - Safe: minimal global footprint, no data exfiltration
// - Responsive: updates instantly when settings change

(() => {
  const STYLE_ID = 'luma-brightness-style';
  const CSS_VAR = '--luma-brightness';
  const DEFAULT_BRIGHTNESS = 100; // percent
  const MIN_BRIGHTNESS = 10; // percent
  const MAX_BRIGHTNESS = 300; // percent

  // Helper: clamp numeric values
  function clampNumber(n, min, max) {
    if (typeof n !== 'number' || Number.isNaN(n)) return null;
    return Math.min(Math.max(n, min), max);
  }

  // Avoid running on internal browser pages (defensive)
  function isInternalPage() {
    const proto = location.protocol;
    return proto === 'chrome-extension:' || proto === 'chrome:' || proto === 'about:' || proto === 'edge:';
  }

  if (isInternalPage()) return;

  // Create (or reuse) the style element that will apply the brightness filter.
  // We apply the filter on `:root` (documentElement) using a CSS variable so pages
  // that also adjust `filter` inline are less impacted and we can update atomically.
  function ensureStyleElement() {
    try {
      let style = document.getElementById(STYLE_ID);
      if (style && style.tagName === 'STYLE') return style;

      style = document.createElement('style');
      style.id = STYLE_ID;
      style.type = 'text/css';

      // Use high specificity to make the rule apply in most cases.
      // The rule targets html and body to cover different page setups.
      style.textContent = `
        :root {
          ${CSS_VAR}: ${DEFAULT_BRIGHTNESS}%;
        }
        html, body {
          /* Use var() so we can change the value without replacing the whole stylesheet */
          filter: brightness(var(${CSS_VAR})) !important;
        }
      `;
      // Insert as early as possible: put in head if available, otherwise at documentElement
      const container = document.head || document.documentElement;
      container.appendChild(style);
      return style;
    } catch (e) {
      // On pages that disallow DOM modifications, fail silently.
      // Do not throw — extension should not break page scripts.
      return null;
    }
  }

  // Set the brightness by updating the stored style node's CSS variable
  function applyBrightness(value) {
    const clamped = clampNumber(Number(value), MIN_BRIGHTNESS, MAX_BRIGHTNESS);
    const style = ensureStyleElement();
    if (!style || clamped === null) return false;

    try {
      // Update the style node's textContent with the new variable value.
      // We try to update only the variable declaration if present for minimal churn.
      // Fallback: replace the entire textContent.
      const varDeclRegex = new RegExp(`(${CSS_VAR}:)\\s*[-\\d\\.]+%`);
      if (varDeclRegex.test(style.textContent)) {
        style.textContent = style.textContent.replace(varDeclRegex, `$1 ${clamped}%`);
      } else {
        // If for some reason the declaration is missing, ensure it's present.
        style.textContent = `
          :root { ${CSS_VAR}: ${clamped}%; }
          html, body { filter: brightness(var(${CSS_VAR})) !important; }
        `;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // Determine which brightness to apply for this page:
  // 1) If site-specific setting exists, use it
  // 2) Otherwise use globalBrightness (or default)
  function loadAndApplyFromStorage() {
    try {
      const hostname = location.hostname;
      chrome.storage.sync.get(['globalBrightness', 'siteSettings'], (data) => {
        // Storage callback may not run in rare environments — guard defensively
        if (!chrome.runtime.lastError) {
          const globalBrightness = Number(data.globalBrightness ?? DEFAULT_BRIGHTNESS);
          const siteSettings = data.siteSettings || {};
          const siteValueRaw = siteSettings && hostname ? siteSettings[hostname] : undefined;
          const siteValue = siteValueRaw !== undefined ? Number(siteValueRaw) : undefined;
          const toApply = (siteValue !== undefined && !Number.isNaN(siteValue)) ? siteValue : globalBrightness;
          applyBrightness(toApply);
        } else {
          // If storage access fails, try to at least apply default value
          applyBrightness(DEFAULT_BRIGHTNESS);
        }
      });
    } catch (e) {
      // If chrome.storage is unavailable for any reason, apply default value
      applyBrightness(DEFAULT_BRIGHTNESS);
    }
  }

  // Listen for storage changes and reapply when brightness-related keys change.
  function setupStorageListener() {
    try {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'sync' && areaName !== 'local') {
          // some environments may use different areas; still react conservatively
        }
        if (changes.globalBrightness || changes.siteSettings) {
          loadAndApplyFromStorage();
        }
      });
    } catch (e) {
      // ignore: storage.onChanged may be unavailable in some contexts
    }
  }

  // Listen for runtime messages (e.g., from popup) to force reapply
  function setupRuntimeMessageListener() {
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message && message.type === 'brightness-updated') {
          loadAndApplyFromStorage();
        }
        // No response required
      });
    } catch (e) {
      // ignore
    }
  }

  // Some single-page apps modify root styles later (e.g., resetting filter). Use
  // a MutationObserver to detect removal of our style or mutation of inline filter on <html>
  // and re-apply if necessary. Keep observation lightweight.
  function setupMutationObserver() {
    try {
      const observer = new MutationObserver((mutations) => {
        let reapply = false;
        for (const m of mutations) {
          // If our <style> node was removed, we must recreate it
          if (m.type === 'childList') {
            for (const node of m.removedNodes) {
              if (node && node.id === STYLE_ID) {
                reapply = true;
                break;
              }
            }
            if (reapply) break;
          }
          // If someone changed style attribute on html/body that removes filter, reapply
          if (m.type === 'attributes' && (m.target === document.documentElement || m.target === document.body)) {
            if (m.attributeName === 'style') {
              // schedule reapply
              reapply = true;
              break;
            }
          }
        }
        if (reapply) {
          // small debounce to avoid thrashing
          setTimeout(() => loadAndApplyFromStorage(), 50);
        }
      });

      // Observe the documentElement for attribute changes and head/body for childList changes
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
      if (document.head) observer.observe(document.head, { childList: true });
      if (document.body) observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
      // Keep the observer reference on window so it isn't GC'd in some environments
      try { window.__luma_mutation_observer = observer; } catch (e) { /* ignore */ }
    } catch (e) {
      // ignore if MutationObserver isn't available
    }
  }

  // Public init
  function init() {
    // Ensure style node exists first so quickly-visible pages get the correct brightness
    ensureStyleElement();
    loadAndApplyFromStorage();
    setupStorageListener();
    setupRuntimeMessageListener();
    setupMutationObserver();
  }

  // Run when DOM is ready enough to add styles — if document is already interactive/complete, run asap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
    // As a fallback, also init after a small timeout in case DOMContentLoaded is never fired
    setTimeout(init, 2000);
  } else {
    init();
  }
})();