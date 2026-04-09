# Brightness Controller Chrome Extension

A lightweight Chrome extension that allows users to control the brightness of web pages globally and on a per-site basis.

> 🔒 **Privacy First**: This extension does NOT collect, store, or transmit any user data. All settings are stored locally using Chrome's storage API.

---

## ✨ Features

* 🌐 Global brightness control for all websites
* 🎯 Per-site brightness customization
* ⚡ Instant updates without page reload
* 🧩 Simple and minimal UI
* 🔒 Zero data collection or tracking

---

## 📁 Project Structure

```
brightness-controller/
│
├── manifest.json        # Extension configuration
├── background.js        # Background service worker (optional logic)
├── content.js           # Injected script to apply brightness
├── popup.html           # Extension popup UI
├── popup.js             # Handles UI interactions and storage
├── styles.css (optional)# Styling for popup (if separated later)
└── README.md            # Project documentation
```

---

## ⚙️ How It Works

### 1. Brightness Application

The extension uses CSS filters to adjust brightness:

```js
document.documentElement.style.filter = `brightness(${value}%)`;
```

This visually modifies the page without altering its content.

### 2. Storage System

Uses Chrome's built-in storage:

* `globalBrightness`: Default brightness value
* `siteSettings`: Object storing per-domain brightness

Example structure:

```json
{
  "globalBrightness": 100,
  "siteSettings": {
    "example.com": 80
  }
}
```

### 3. Priority Logic

When a page loads:

1. Check if a site-specific setting exists
2. If yes → apply it
3. Otherwise → use global brightness

---

## 🚀 Installation (Development)

1. Clone or download this repository
2. Open Chrome and go to:

   ```
   chrome://extensions/
   ```
3. Enable **Developer Mode** (top right)
4. Click **Load unpacked**
5. Select the project folder

---

## 🧪 Usage

1. Click the extension icon
2. Adjust the brightness slider
3. Choose:

   * **Save Global** → applies to all sites
   * **Save For This Site** → overrides current domain

---

## 🔐 Privacy Policy

This extension is built with user privacy as a core principle:

* ❌ No data collection
* ❌ No analytics or tracking
* ❌ No external API calls
* ❌ No third-party integrations
* ✅ All data stays locally in your browser

---

## 🛠 Future Improvements

* Smooth brightness transitions
* Presets (Night / Reading / Dim)
* Keyboard shortcuts
* Scheduled brightness (day/night)
* UI enhancements

---

## 📜 License

MIT License (or choose your preferred license)

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## 💡 Notes

This extension is intentionally minimal, focusing on performance, simplicity, and privacy.

---

**Made with simplicity and privacy in mind.**
