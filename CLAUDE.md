# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hajara Medicals: Billing & Inventory — a React single-page application for managing a medical/pharmacy shop. Handles sales, purchases, billing/prescriptions, inventory, customers, suppliers, and financial ledgers. Originally scaffolded via Google AI Studio.

## Commands

- `npm run dev` — Start Vite dev server on port 3000 (host 0.0.0.0)
- `npm run build` — Production build via Vite
- `npm run preview` — Preview production build

No test runner, linter, or formatter is configured.

## Environment

Set `GEMINI_API_KEY` in `.env.local` for the AI chatbot (Google Gemini). Vite exposes it as `process.env.GEMINI_API_KEY` and `process.env.API_KEY`.

## Architecture

### State & Data Flow

All application state lives in `App.tsx` as top-level `useState` hooks. There is no backend, database, or persistent storage — data initializes from `data/mockData.ts` and is lost on refresh.

`App.tsx` is the single source of truth. It defines CRUD handlers for every entity (customers, products, sales, purchases, bills, suppliers, users, money transactions) and passes them as props to child components. Every mutation also calls `addLogEntry()` to create an audit trail.

### Routing

No React Router. Navigation uses a `View` type (union of string literals defined in `types.ts`) and a `activeView` state in `App.tsx`. The `renderContent()` switch statement maps each view to its component. `Header.tsx` renders the sidebar/mobile nav and sets `activeView`.

To add a new view: add the view name to the `View` type in `types.ts`, add a case in `renderContent()` in `App.tsx`, and add a nav link in `Header.tsx`.

### Types

All shared TypeScript interfaces are in `types.ts` at the project root. Key entities: `User`, `Product`, `Customer`, `Supplier`, `Sale`, `Purchase`, `PurchaseItem`, `Bill`, `BillItem`, `PaymentRecord`, `MoneyTransaction`, `LogEntry`, `ChatMessage`.

### Financial Ledger System

Three computed balances (`useMemo` in `App.tsx`): `stockAmount` (cash), `bankBalance`, `savingsBalance`. Each is derived from sales revenue, purchase payment history, bill totals, and manual money transactions. Components that accept/make payments receive these balances as props for validation.

Payment sources map: Cash → Stock, Bank Transfer → Bank, Savings → Savings.

### ID Generation

All entity IDs use the pattern `PREFIX-${Date.now()}` (e.g., `CUST-1711234567890`, `PUR-1711234567890`).

### Component Patterns

- Form components (`CustomerForm`, `ProductForm`, `SupplierForm`, `PaymentForm`) are modal-based using a shared `Modal.tsx`
- Icons are SVG components in `components/icons/Icons.tsx`
- `Chatbot.tsx` integrates Google Gemini with voice input (Web Speech API) and image analysis

### External Dependencies (CDN)

Tailwind CSS, jsPDF, and jsPDF-AutoTable are loaded via CDN `<script>` tags in `index.html`, not via npm. `jsPDF` is accessed as `window.jspdf` at runtime.

### Path Aliases

`@/*` resolves to the project root (configured in `vite.config.ts` and `tsconfig.json`).
