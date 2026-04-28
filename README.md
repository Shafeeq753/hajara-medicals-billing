# Hajara Medicals — Billing & Inventory (Desktop App)

A Windows desktop application for managing a medical/pharmacy shop. Handles sales, purchases, billing/prescriptions, inventory, customers, suppliers, and financial ledgers — with all data stored locally on your PC.

## For end users (your friend)

You don't need any developer tools to install the app — just download the installer.
See **SETUP.txt** for a step-by-step guide.

The installer is at: `release/Hajara-Medicals-Setup-1.0.0.exe`

## For developers

### Run in development

```bash
npm install
npm run dev
```

This starts Vite on port 3000 and opens an Electron window pointed at it.

### Build the Windows installer

Prerequisites: [NSIS](https://nsis.sourceforge.io/) (`winget install NSIS.NSIS`).

```bash
npm install
npm run build
```

This runs three steps:

1. `npm run build:web` — Vite builds the renderer into `dist/`
2. `npm run package` — `@electron/packager` packs the app into `release/Hajara Medicals-win32-x64/`
3. `npm run installer` — NSIS compiles `installer.nsi` into `release/Hajara-Medicals-Setup-1.0.0.exe`

### Architecture notes

- **Main process**: `electron/main.cjs` — owns file IO and IPC handlers.
- **Preload**: `electron/preload.cjs` — exposes a safe `window.electronAPI` to the renderer.
- **Renderer**: React + Vite, builds to `dist/`.
- **Storage**: a single `hajara-data.json` in a user-chosen folder. Path is remembered in `%APPDATA%/Hajara Medicals/config.json`.
- **Excel export**: handled in the main process via SheetJS (`xlsx`).
- **State**: all collections live in one `useState<AppData>` in `App.tsx`. Mutations are debounced and saved to disk after 400 ms of idle.
- **Installer**: per-user install (no admin required), targets `%LOCALAPPDATA%\HajaraMedicals\` by default, creates Start-menu and desktop shortcuts.

### Environment

`GEMINI_API_KEY` in `.env.local` powers the AI Assistant chatbot. Vite inlines it at build time. If the chatbot stops working, replace this key with a valid Gemini API key and rebuild.
