// popup.js
// Popup logic for Luma — Brightness Controller
// Provides:
// - live preview of brightness on the active tab
// - save global brightness
// - save per-site brightness
// - reset site / reset global
//
// Requirements in manifest:
// - "activeTab", "scripting", "storage" permissions
//
// Notes:
// - Uses chrome.scripting.executeScript to apply a temporary preview to the active tab.
// - Persists settings in chrome.storage.sync.
// - Not all pages accept script injection (e.g., chrome:// pages, extensions pages, or pages with CSP), errors are swallowed.

(() => {
  // DOM Elements
  const slider = document.getElementById('brightness');
  const valueLabel = document.getElementById('value');
  const saveGlobalBtn = document.getElementById('saveGlobal');
  const saveSiteBtn = document.getElementById('saveSite');
  const resetSiteBtn = document.getElementById('resetSite');
  const resetGlobalBtn = document.getElementById('resetGlobal');
  const openRepo = document.getElementById('openRepo');

  // Fallback repo URL - update to your repo if desired
  if (openRepo) openRepo.href = 'https://github.com/yourusername/luma';

  const DEFAULT_BRIGHTNESS = 100;

  function fmt(v) { return `${v}%`; }
  function setLabel(v) { if (valueLabel) valueLabel.textContent = fmt(v); }

  // Helper: get the currently active tab in the focused window
  function getActiveTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs && tabs[0]);
      });
    });
  }

  // Preview brightness on the specified tabId by injecting a small function.
  // This uses CSS variables and a filter so it's easy to override.
  function previewOnTab(tabId, brightness) {
    if (!tabId) return Promise.resolve();
    // clamp brightness to reasonable numeric
    const value = Number(brightness) || DEFAULT_BRIGHTNESS;
    return chrome.scripting.executeScript({
      target: { tabId },
      func: (v) => {
        try {
          // use a CSS variable so we don't clobber inline filter permanently
          document.documentElement.style.setProperty('--luma-brightness', `${v}%`);
          document.documentElement.style.filter = `brightness(var(--luma-brightness))`;
        } catch (e) {
          // ignore errors (e.g., blocked by CSP or privileged pages)
        }
      },
      args: [value]
    }).catch(() => {}); // swallow errors
  }

  // Initialize popup: read storage and active tab, set UI and preview current value
  async function init() {
    const tab = await getActiveTab();

    chrome.storage.sync.get(['globalBrightness', 'siteSettings'], (data) => {
      const globalBrightness = Number(data.globalBrightness ?? DEFAULT_BRIGHTNESS);
      const siteSettings = data.siteSettings || {};

      let initial = globalBrightness;
      if (tab && tab.url) {
        try {
          const hostname = new URL(tab.url).hostname;
          if (hostname && siteSettings[hostname] !== undefined) {
            initial = Number(siteSettings[hostname]);
          }
        } catch (e) {
          // ignore malformed URL
        }
      }

      // Update UI
      if (slider) slider.value = initial;
      setLabel(initial);

      // Preview
      if (tab && tab.id) previewOnTab(tab.id, initial);
    });
  }

  // Debounced preview (small debounce to avoid spamming executeScript)
  let previewTimeout = null;
  function schedulePreview(tabId, value) {
    if (previewTimeout) clearTimeout(previewTimeout);
    previewTimeout = setTimeout(() => {
      previewOnTab(tabId, value);
      previewTimeout = null;
    }, 80);
  }

  // Save global brightness
  function saveGlobal(value) {
    const v = Number(value);
    chrome.storage.sync.set({ globalBrightness: v }, () => {
      // Notify content scripts if they're listening
      chrome.runtime.sendMessage({ type: 'brightness-updated' }, () => {});
    });
  }

  // Save per-site brightness for the provided hostname
  function saveSite(hostname, value) {
    if (!hostname) return;
    chrome.storage.sync.get(['siteSettings'], (data) => {
      const siteSettings = data.siteSettings || {};
      siteSettings[hostname] = Number(value);
      chrome.storage.sync.set({ siteSettings }, () => {
        chrome.runtime.sendMessage({ type: 'brightness-updated' }, () => {});
      });
    });
  }

  // Remove site override for hostname
  function resetSite(hostname, fallbackValue, tabId) {
    if (!hostname) return;
    chrome.storage.sync.get(['siteSettings'], (data) => {
      const siteSettings = data.siteSettings || {};
      if (siteSettings && siteSettings.hasOwnProperty(hostname)) {
        delete siteSettings[hostname];
        chrome.storage.sync.set({ siteSettings }, () => {
          chrome.runtime.sendMessage({ type: 'brightness-updated' }, () => {});
          // apply fallback (likely global) to the current tab
          if (tabId) previewOnTab(tabId, fallbackValue);
        });
      } else {
        // no site setting; still apply fallback to current tab
        if (tabId) previewOnTab(tabId, fallbackValue);
      }
    });
  }

  // Reset global brightness to default
  function resetGlobal(tabId) {
    chrome.storage.sync.set({ globalBrightness: DEFAULT_BRIGHTNESS }, () => {
      chrome.runtime.sendMessage({ type: 'brightness-updated' }, () => {});
      if (tabId) previewOnTab(tabId, DEFAULT_BRIGHTNESS);
      if (slider) {
        slider.value = DEFAULT_BRIGHTNESS;
        setLabel(DEFAULT_BRIGHTNESS);
      }
    });
  }

  // Wire up events
  function wireEvents() {
    if (!slider) return;

    slider.addEventListener('input', async (e) => {
      const val = Number(e.target.value);
      setLabel(val);
      const tab = await getActiveTab();
      if (tab && tab.id) schedulePreview(tab.id, val);
    });

    if (saveGlobalBtn) {
      saveGlobalBtn.addEventListener('click', () => {
        const value = Number(slider.value);
        saveGlobal(value);
      });
    }

    if (saveSiteBtn) {
      saveSiteBtn.addEventListener('click', async () => {
        const value = Number(slider.value);
        const tab = await getActiveTab();
        if (!tab || !tab.url) return;
        try {
          const hostname = new URL(tab.url).hostname;
          if (hostname) saveSite(hostname, value);
        } catch (e) {
          // ignore
        }
      });
    }

    if (resetSiteBtn) {
      resetSiteBtn.addEventListener('click', async () => {
        const tab = await getActiveTab();
        if (!tab || !tab.url) return;
        let hostname = null;
        try { hostname = new URL(tab.url).hostname; } catch (e) { hostname = null; }
        // get current global value to apply as fallback
        chrome.storage.sync.get(['globalBrightness'], (data) => {
          const fallback = Number(data.globalBrightness ?? DEFAULT_BRIGHTNESS);
          resetSite(hostname, fallback, tab.id);
          // also update UI to reflect fallback
          if (slider) {
            slider.value = fallback;
            setLabel(fallback);
          }
        });
      });
    }

    if (resetGlobalBtn) {
      resetGlobalBtn.addEventListener('click', async () => {
        const tab = await getActiveTab();
        const tabId = tab && tab.id;
        resetGlobal(tabId);
      });
    }
  }

  // Initialize on popup open
  document.addEventListener('DOMContentLoaded', () => {
    wireEvents();
    init();
  });

  // Optional: when popup closes, no cleanup is necessary. Content scripts persist their applied styles.
})();