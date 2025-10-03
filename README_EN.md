# Mobbin Cracker Chrome Extension

This Chrome extension improves the viewing experience on Mobbin by upgrading low-res image sources and simplifying the UI. It also adds a quick "Download All" action to save all images on the current page.

## Features

- **High‑res image replacement**: Automatically upgrades small images (w < 80) to higher resolution.
- **URL cleanup**: Removes unnecessary URL parameters (e.g., `image`, `gravity`, `v`).
- **UI simplification**: Removes the sidebar on Mobbin for a clearer showcase.
  - **Dynamic monitoring**: Observes DOM changes and processes newly loaded images.
  - **Download All**: Click the extension icon to download upgraded images on the page.

## Files

- `manifest.json`: Extension metadata and permissions (MV3).
- `background.js`: Handles extension lifecycle and the "Download All" action.
- `content.js`: Scans and upgrades image sources, cleans UI, and responds with image URLs.
- `images/`: Optional icons.

## Icons

If you want icons, provide the following PNG assets converted from `images/icon.svg`:

- 16x16: `images/icon16.png`
- 48x48: `images/icon48.png`
- 128x128: `images/icon128.png`

## Install

1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode" (top-right).
3. Click "Load unpacked" and select this folder.

### Use

- **Automatic upgrade**: On `*.mobbin.com`, images are upgraded and URL params cleaned automatically.
- **Dynamic pages**: New images loaded via infinite scroll are handled automatically.
- **Scroll first**: Scroll to the bottom so all images are loaded.
- **Download All**: Click the extension icon and press "Download All". Chrome may prompt to allow multiple downloads; choose "Allow".
Console logs will show how many images were updated.

## Development

- Edit `manifest.json` for metadata/permissions (uses MV3 + `downloads`).
- `background.js` wires the action click -> page query -> downloads.
 - `content.js` updates image URLs, collects upgraded URLs in-memory during scroll, and returns only those for downloading.

## Notes

- For learning and research only; do not use commercially.
- After changing files, refresh the extension from `chrome://extensions/`.
- Manifest changes require a full reload.
