# StockSquares Web Client

Enterprise paper trading dashboard built with **React 19**, **TypeScript 5.7**, **Vite 6**, and **RxJS 7.8**. Engineered with full bilingual support (**English LTR** & **Arabic RTL**), real-time SignalR WebSocket feeds, interactive financial charting, and resilient error handling.

---

## Features Overview

1. **Live Price Watchlist (`LivePriceTable`)**:
   - Sub-second streaming ticker prices over SignalR.
   - Dynamic tick flashes (emerald green for upticks, crimson red for downticks).
   - Real-time search by symbol/pair and category filters (`All`, `Top Gainers`, `Top Losers`, `24h Volume`).
   - Clickable column sorting and asset selection.

2. **Interactive Financial Chart (`PriceChart`)**:
   - Multi-timeframe view (`1M`, `5M`, `15M`, `1H`, `ALL`).
   - Switchable SVG **Area/Line Mode** and financial **Candlestick Mode** (OHLC).
   - Responsive multi-level Y-axis price grid and timestamped X-axis.
   - Real-time live price pulse badge and interactive crosshair inspection tooltip.

3. **Order Ticket (`OrderTicket`)**:
   - Buy & Sell tabs with Market and Limit order execution modes.
   - Real-time balance and position affordability validation.
   - Dynamic estimated total calculation and 1-click quick allocation buttons (`25%`, `50%`, `75%`, `MAX`).
   - Built-in `Idempotency-Key` UUID generation preventing duplicate submissions.

4. **Portfolio & Execution Console (`PortfolioSummary`, `PositionsTable`, `OrderHistoryTable`)**:
   - Live mark-to-market net portfolio value, cash balance, reserved margin, and unrealized/realized P&L.
   - Open positions table with weighted average entry price and 1-click position close pre-fill.
   - Order history table with status badges and 1-click pending limit order cancellation.
   - Real-time executed trades log.

5. **Bilingual & RTL/LTR Design**:
   - Instant English / Arabic switcher updating `dir="rtl"` / `dir="ltr"`.
   - BiDi numeric isolation (`unicode-bidi: isolate`) to guarantee negative balances and dollar formatting remain clean in Arabic layout without flipped signs.

6. **Notification Deduplication**:
   - 1,000ms deduplication window preventing toast spam during high-frequency tick bursts.

---

## Getting Started

### Prerequisites
* [Node.js 20+](https://nodejs.org/)
* npm 10+

### Installation & Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

---

## Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| **dev** | `npm run dev` | Starts the Vite development server with HMR on port 5173 |
| **build** | `npm run build` | Compiles TypeScript and generates production bundle in `dist/` |
| **preview** | `npm run preview` | Locally serves the compiled production build from `dist/` |
| **lint** | `npm run lint` | Runs Oxlint for high-speed AST-level code validation |

---

## Environment Variables

Copy `.env.example` to `.env` to customize endpoint configuration:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:5000` | Backend REST API base URL |
| `VITE_SIGNALR_HUB` | `http://localhost:5000/hubs/trading` | SignalR WebSocket Hub endpoint |

---

## Containerization & Production Build

The web client is containerized via a multi-stage Docker build:
* **Stage 1**: `node:22-alpine` compiles the static SPA bundle into `/app/dist`.
* **Stage 2**: `nginx:alpine` serves static assets with 1-year cache headers and acts as a reverse proxy for `/api/` and `/hubs/` (SignalR WebSocket upgrading).

To run with Docker Compose alongside the backend and database:
```bash
# From workspace root
docker compose up --build
```
Web client will be accessible at [http://localhost:3000](http://localhost:3000).
