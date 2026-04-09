// Chrome Extension: Brightness Controller
// This extension lets users control page brightness globally and per-site.
// It DOES NOT collect or transmit any user data.

// =======================
// manifest.json
// =======================
{
  "manifest_version": 3,
  "name": "Brightness Controller",
  "version": "1.0",
  "description": "Control brightness for all pages and customize per site. No data collection.",
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": ["<all_urls>"],
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ]
}

// =======================
// content.js
// =======================
function applyBrightness(value) {
  document.documentElement.style.filter = `brightness(${value}%)`;
}

function loadSettings() {
  const hostname = window.location.hostname;
  chrome.storage.sync.get(["globalBrightness", "siteSettings"], (data) => {
    const siteSettings = data.siteSettings || {};

    if (siteSettings[hostname]) {
      applyBrightness(siteSettings[hostname]);
    } else {
      applyBrightness(data.globalBrightness || 100);
    }
  });
}

loadSettings();

chrome.storage.onChanged.addListener(loadSettings);

// =======================
// popup.html
// =======================
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial; padding: 10px; width: 200px; }
  </style>
</head>
<body>
  <h3>Brightness</h3>
  <input type="range" id="brightness" min="50" max="150" value="100" />
  <button id="saveGlobal">Save Global</button>
  <button id="saveSite">Save For This Site</button>
  <p style="font-size:10px;">No data is collected or transmitted.</p>

  <script src="popup.js"></script>
</body>
</html>

// =======================
// popup.js
// =======================
const slider = document.getElementById("brightness");

chrome.storage.sync.get(["globalBrightness"], (data) => {
  slider.value = data.globalBrightness || 100;
});

function getCurrentTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    callback(tabs[0]);
  });
}

// Save global brightness

document.getElementById("saveGlobal").addEventListener("click", () => {
  chrome.storage.sync.set({ globalBrightness: slider.value });
});

// Save per-site brightness

document.getElementById("saveSite").addEventListener("click", () => {
  getCurrentTab((tab) => {
    const url = new URL(tab.url);
    const hostname = url.hostname;

    chrome.storage.sync.get(["siteSettings"], (data) => {
      const siteSettings = data.siteSettings || {};
      siteSettings[hostname] = slider.value;

      chrome.storage.sync.set({ siteSettings });
    });
  });
});

// =======================
// background.js
// =======================
// (Optional for future features)
console.log("Brightness Controller running");
