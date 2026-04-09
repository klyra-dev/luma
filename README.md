# Luma — Brightness Controller

Luma is a lightweight, privacy-first Chrome extension that lets you adjust the brightness of web pages globally and per-site. It is designed for simplicity, performance, and transparency: no tracking, no analytics, and no network connections for user data. All settings are stored locally in the user's browser via the Chrome storage APIs.

Status: Stable — ready for use and contribution.

---

Table of contents
- Features
- Privacy & Security
- Installation
  - Developer (load unpacked)
  - Packaging & publishing
- Usage
- How it works (technical)
- File / project structure
- Development notes
- Contributing
- Troubleshooting
- License

---

Features
- Global brightness control for all webpages.
- Per-site (domain-level) overrides.
- Instant preview from the extension popup without reloading pages.
- Minimal permissions: `storage`, `activeTab`, `scripting`. Host permission: `<all_urls>` only to apply brightness across pages.
- Accessibility-conscious UI: keyboard-friendly controls and clear labels.
- Privacy-first: no telemetry, no external requests, everything is stored locally.

---

Privacy & security

Luma is built with privacy as a first-class requirement:

- No user data is collected, transmitted, or stored outside the browser.
- No analytics, no remote logging, and no third-party SDKs.
- All settings (global and per-site) are stored locally using Chrome's storage (sync where available).
- The extension only runs code to apply CSS-based brightness filters and to read/write settings from storage.
- If you want a fully local-only configuration, you can switch from `chrome.storage.sync` to `chrome.storage.local` in the source.

If you'd like to review exactly what the extension stores, check the storage keys:
- `globalBrightness` — numeric percentage (default `100`).
- `siteSettings` — object keyed by hostname, e.g. `{ "example.com": 80 }`.

---

Installation (Developer / Local testing)

1. Clone the repository:
   git clone https://github.com/klyra-dev/luma.git
2. Open Chrome and navigate to:
   chrome://extensions/
3. Enable "Developer mode" (top-right).
4. Click "Load unpacked" and choose the project folder (root of the repo).
5. The extension should appear in your toolbar. Click it to open the popup and adjust brightness.

Notes:
- During development you can use Chrome's extension inspector to see console logs from the popup, background worker, and content scripts.
- If you change `manifest.json` you may need to reload the extension from the extensions page.

Packaging & publishing

- To publish to the Chrome Web Store follow Google’s developer documentation for packaging and uploading a ZIP of the extension files.
- Ensure icons and screenshots are included in the store listing and that the `manifest.json` version is updated for each release.

---

Usage

- Click the Luma icon in the toolbar to open the popup.
- Drag the slider to preview brightness on the active tab instantly.
- Buttons:
  - "Save Global" — sets the default brightness applied to all sites that do not have a site override.
  - "Save Site" — stores the current slider value as an override for the active domain.
  - "Reset Site" — removes the site override for the active domain (falls back to global).
  - "Reset Global" — sets the global brightness to the default (100%).
- The popup shows the current effective value and updates the active tab immediately while you drag the slider.

Best practices:
- Use per-site overrides for very bright or very dark sites where readability differs.
- Default global range is 50% to 150% (configurable in code).

---

How it works (technical summary)

- content script (`content.js`) runs on page load (`document_idle`) and:
  - Retrieves the hostname of the page.
  - Reads `siteSettings` and `globalBrightness` from storage.
  - Applies the effective brightness via CSS filter:
    document.documentElement.style.filter = `brightness(XX%)`;
  - Listens for storage changes and runtime messages to reapply settings without reload.
- popup (`popup.html` + `popup.js`) provides a local UI to preview and save settings:
  - Uses `chrome.scripting.executeScript` (or messaging to content script) to preview the slider value on the active tab.
  - Saves values into `chrome.storage.sync` so settings can optionally sync across the user's devices.
- background worker (`background.js`) initializes sane defaults on install and can be extended for future features.

Storage schema example
```json
{
  "globalBrightness": 100,
  "siteSettings": {
    "example.com": 80,
    "news.example.org": 110
  }
}
```

---

Project structure

- `manifest.json` — extension manifest and permissions
- `popup.html` — the popup UI
- `popup.js` — popup interactivity and preview logic
- `content.js` — content script that applies brightness to pages
- `background.js` — service worker for extension lifecycle events
- `icons/` — icons used by the extension
- `README.md` — this file
- `LICENSE` — project license (MIT by default)
- `CONTRIBUTING.md` — guidelines for contributing
- `CODE_OF_CONDUCT.md` — community guidelines

---

Development notes

- Use plain, dependency-free JavaScript for portability and small bundle size.
- Prefer `chrome.storage.sync` for a better user experience (sync across devices), but be mindful of quota limits. If you expect many site entries, consider `chrome.storage.local`.
- Keep the content script defensive: some pages disallow DOM changes or throw on style access. Catch and ignore those errors to avoid noisy failures.
- For previewing, prefer `scripting.executeScript` from the popup to avoid race conditions and to keep the popup stateless.

Accessibility
- Ensure slider and buttons have accessible labels.
- Ensure keyboard users can operate all controls (tab focus and enter/space on buttons).
- Avoid small touch targets in the popup.

---

Contributing

Thanks for considering contributing! A few guidelines:
- Open an issue for discussion before building large features.
- Keep pull requests focused and small.
- Include screenshots/GIFs for UI changes.
- Follow the existing code style (simple, well-documented JS).
- Add tests where practical for logic (e.g., storage handling, parsing hostnames).

Suggested labels:
- bug
- enhancement
- docs
- help wanted

Community
- Be respectful and follow `CODE_OF_CONDUCT.md`.

---

Troubleshooting

- "Slider doesn't preview on some pages": Some pages restrict script execution or are special Chrome pages. The extension cannot modify internal browser pages (chrome://, new tab, extension pages).
- "Changes don't persist": Ensure Chrome sync is enabled for extensions (if you rely on `storage.sync`) and that storage quotas have not been exceeded.
- "Extension not visible": Check `chrome://extensions/` for errors and ensure Developer Mode is enabled when loading unpacked.

Logging
- Minimal console logging is used for debugging (background and content scripts). In production builds consider removing or gating logs behind a debug flag.

---

License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

Acknowledgements

Built with a focus on privacy, simplicity, and accessibility. Contributions and feedback welcome.

---

Contact / links
- GitHub: https://github.com/klyra-dev/luma
- Issues: https://github.com/klyra-dev/luma/issues