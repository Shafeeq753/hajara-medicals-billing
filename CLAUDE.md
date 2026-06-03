# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hajara Medicals: Billing & Inventory — a React single-page application for managing a medical/pharmacy shop. Handles sales, purchases, billing/prescriptions, inventory, customers, suppliers, and financial ledgers. Originally scaffolded via Google AI Studio.

## Commands

- `npm run dev` — Start Vite dev server on port 3000 (host 0.0.0.0)
- `npm run build` — Production build via Vite
- `npm run preview` — Preview production build

No test runner, linter, or formatter is configured.

It is a **web app** (deployable to Vercel/any static host). It was briefly an Electron desktop app; the `electron/`, `scripts/`, `installer.nsi`, and `components/UpdateBanner.tsx` files are leftover from that and are no longer wired into the web build.

## Environment

Set `GEMINI_API_KEY` in `.env.local` for the AI chatbot (Google Gemini). Vite exposes it as `process.env.GEMINI_API_KEY` and `process.env.API_KEY`.

Firebase config lives in `firebase.ts` (web apiKey — not a secret). Data lives in Cloud Firestore; access is governed by Firestore security rules.

## Architecture

### State & Data Flow

**Cloud Firestore is the source of truth.** `App.tsx` subscribes to one collection per entity via the `useCollection<T>(name)` hook (`hooks/useFirestore.ts`), which is a real-time `onSnapshot` listener — changes from any device/tab/console appear automatically. Collections: `customers`, `products`, `sales`, `purchases`, `suppliers`, `users`, `historyLog`, `bills`, `moneyTransactions`.

`App.tsx` defines CRUD handlers for every entity that write to Firestore (`addDoc`/`updateDoc`/`deleteDoc`, and `writeBatch` + `increment` for stock-affecting purchases/bills/transfers) and passes them as props to child components. Every mutation also calls `addLogEntry()` to write an audit entry to the `historyLog` collection.

**Local-folder mirror (optional, Chrome/Edge only):** `lib/localMirror.ts` uses the File System Access API to write a `hajara-data.json` backup into a user-picked folder on every change. The folder handle is persisted in IndexedDB. `lib/storage.ts` defines the `AppData` snapshot shape assembled from the live collections for mirroring/export. First-run folder choice is in `components/SetupWizard.tsx` (gated by the `hajara_setup_done` localStorage flag); folder management + Excel/JSON export is in `components/Settings.tsx`.

### Routing

No React Router. Navigation uses a `View` type (union of string literals defined in `types.ts`) and a `activeView` state in `App.tsx`. The `renderContent()` switch statement maps each view to its component. `Header.tsx` renders the sidebar/mobile nav and sets `activeView`.

To add a new view: add the view name to the `View` type in `types.ts`, add a case in `renderContent()` in `App.tsx`, and add a nav link in `Header.tsx`.

### Types

All shared TypeScript interfaces are in `types.ts` at the project root. Key entities: `User`, `Product`, `Customer`, `Supplier`, `Sale`, `Purchase`, `PurchaseItem`, `Bill`, `BillItem`, `PaymentRecord`, `MoneyTransaction`, `LogEntry`, `ChatMessage`.

### Financial Ledger System

Three computed balances (`useMemo` in `App.tsx`): `stockAmount` (cash), `bankBalance`, `savingsBalance`. Each is derived from sales revenue, purchase payment history, bill totals, and manual money transactions. Components that accept/make payments receive these balances as props for validation.

Payment sources map: Cash → Stock, Bank Transfer → Bank, Savings → Savings.

### ID Generation

Entity document IDs are Firestore auto-generated (via `addDoc`) and merged into objects as `id` by `useCollection`. Only sub-record IDs that live inside a document (e.g. `PaymentRecord` in a purchase's `paymentHistory`) still use the `PREFIX-${Date.now()}` pattern.

### Component Patterns

- Form components (`CustomerForm`, `ProductForm`, `SupplierForm`, `PaymentForm`) are modal-based using a shared `Modal.tsx`
- Icons are SVG components in `components/icons/Icons.tsx`
- `Chatbot.tsx` integrates Google Gemini with voice input (Web Speech API) and image analysis

### External Dependencies (CDN)

Tailwind CSS, jsPDF, and jsPDF-AutoTable are loaded via CDN `<script>` tags in `index.html`, not via npm. `jsPDF` is accessed as `window.jspdf` at runtime.

### Path Aliases

`@/*` resolves to the project root (configured in `vite.config.ts` and `tsconfig.json`).
