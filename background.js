// background.js (service worker)
// Initializes default settings on install and provides small runtime helpers.
//
// Responsibilities:
// - On install, ensure `globalBrightness` and `siteSettings` exist in storage.
// - Provide a tiny message relay for other parts of the extension.
// - Keep logic minimal and privacy-preserving (no external calls).

/**
 * Default values for the extension.
 */
const DEFAULTS = {
  globalBrightness: 100, // percent
  siteSettings: {}       // map hostname -> brightness
};

/**
 * Ensure the storage contains the required keys. This uses `chrome.storage.sync`
 * so values can sync across signed-in Chrome instances when available. If
 * `sync` is unavailable for any reason, callers can fall back to `local`.
 */
function ensureDefaults() {
  chrome.storage.sync.get(['globalBrightness', 'siteSettings'], (data) => {
    const toSet = {};
    if (data.globalBrightness === undefined) {
      toSet.globalBrightness = DEFAULTS.globalBrightness;
    }
    if (data.siteSettings === undefined) {
      toSet.siteSettings = DEFAULTS.siteSettings;
    }

    if (Object.keys(toSet).length > 0) {
      chrome.storage.sync.set(toSet, () => {
        if (chrome.runtime.lastError) {
          // If sync fails (quota or disabled), attempt to write to local storage as a best-effort fallback.
          console.warn('Luma: sync storage set failed, falling back to local:', chrome.runtime.lastError);
          chrome.storage.local.get(['globalBrightness', 'siteSettings'], (localData) => {
            const localToSet = {};
            if (localData.globalBrightness === undefined && toSet.globalBrightness !== undefined) {
              localToSet.globalBrightness = toSet.globalBrightness;
            }
            if (localData.siteSettings === undefined && toSet.siteSettings !== undefined) {
              localToSet.siteSettings = toSet.siteSettings;
            }
            if (Object.keys(localToSet).length > 0) {
              chrome.storage.local.set(localToSet, () => {
                if (chrome.runtime.lastError) {
                  console.error('Luma: failed to initialize local defaults:', chrome.runtime.lastError);
                } else {
                  console.info('Luma: initialized defaults in local storage');
                }
              });
            }
          });
        } else {
          console.info('Luma: initialized defaults in sync storage');
        }
      });
    } else {
      // Nothing to set: defaults already present
      console.info('Luma: defaults already present');
    }
  });
}

/**
 * Listen for the install event and initialize defaults.
 */
chrome.runtime.onInstalled.addListener((details) => {
  // Run initialization on fresh install or when the extension is updated.
  try {
    ensureDefaults();
    if (details.reason === 'install') {
      console.info('Luma installed. Defaults set.');
    } else if (details.reason === 'update') {
      console.info('Luma updated from', details.previousVersion, 'to', chrome.runtime.getManifest().version);
    }
  } catch (e) {
    console.error('Luma: error during onInstalled handler', e);
  }
});

/**
 * Message relay / simple API.
 * Other parts of the extension (popup/content) may send messages such as:
 *  { type: 'brightness-updated' }  -> this worker can optionally broadcast or handle future logic.
 *
 * Keep this minimal and avoid telemetry or external calls to preserve privacy.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') return;

  switch (message.type) {
    case 'get-defaults':
      // Return the defaults to the sender.
      sendResponse({ defaults: DEFAULTS });
      break;

    case 'brightness-updated':
      // A brightness change happened (saved global or for a site).
      // Currently we don't need to do anything here because content scripts listen
      // to `storage.onChanged`. This stub remains for future extension features.
      // A non-blocking acknowledgment:
      sendResponse({ ok: true });
      break;

    default:
      // Unknown message: ignore.
      break;
  }

  // Indicate we may send a response asynchronously if needed.
  return true;
});