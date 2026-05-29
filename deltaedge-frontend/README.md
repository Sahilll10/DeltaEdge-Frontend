# DeltaEdge Frontend

A professional, production-grade React frontend for the DeltaEdge Algorithmic Trading Engine.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS + custom CSS variables |
| Routing | React Router v6 |
| Charts | Recharts |
| HTTP | Axios (with JWT interceptors) |
| WebSocket | STOMP over SockJS (Spring WebSocket) |
| Icons | Lucide React |

---

## Project Structure

```
src/
├── components/
│   └── common/         # Layout, Sidebar, Header, Modal, StatCard, Spinner…
├── context/
│   ├── AuthContext.jsx  # JWT auth state
│   └── ToastContext.jsx # Global notifications
├── pages/
│   ├── DashboardPage.jsx
│   ├── MarketPage.jsx
│   ├── CoinDetailPage.jsx   # Live chart + trade panel
│   ├── TradingPage.jsx      # Order management
│   ├── PortfolioPage.jsx    # Holdings + P&L + pie chart
│   ├── WalletPage.jsx       # ACID transactions, deposit/withdraw/transfer
│   ├── WatchlistPage.jsx
│   ├── GraphRiskPage.jsx    # BFS Contagion Graph (crown feature)
│   ├── AuditLogPage.jsx     # Async compliance ledger
│   ├── WithdrawalPage.jsx
│   └── ProfilePage.jsx      # 2FA, password, payment details
├── services/
│   ├── api.js           # Axios instance + all API calls
│   └── websocket.js     # STOMP WebSocket client
├── utils/
│   └── format.js        # Currency, date, risk utilities
└── styles/
    └── globals.css      # Design system variables + components
```

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- Your Spring Boot backend running on `http://localhost:8080`

### 1 — Install dependencies

```bash
cd deltaedge-frontend
npm install
```

### 2 — Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080/ws
```

### 3 — Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4 — Production build

```bash
npm run build
# Output is in /dist — deploy to Vercel, Netlify, Nginx, etc.
```

---

## Backend CORS Configuration

Add this to your Spring Boot `SecurityConfig` or a `@Bean`:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:3000"));
    config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

---

## Feature Map — Backend → Frontend

| Backend Feature | Frontend Page |
|---|---|
| JWT Auth + 2FA OTP | LoginPage — two-step auth flow |
| PESSIMISTIC_WRITE lock | WalletPage — architecture badge |
| Deadlock prevention (sorted IDs) | WalletPage — Transfer modal callout |
| Redis Idempotency Layer | WalletPage, CoinDetailPage — X-Idempotency-Key header |
| Async Audit Ledger (@Async) | AuditLogPage — architecture notice |
| BFS Risk Contagion Graph | GraphRiskPage — interactive SVG with drag |
| Circuit Breaker (Resilience4j) | Header — WS status pill / fallback indicator |
| Redis Cache (telemetry) | MarketPage — live ticker tape |
| WebSocket STOMP | Header ticker + CoinDetailPage live price |
| Dual-Entry Ledger | WalletPage — transaction history with types |
| Razorpay Payment | WalletPage — deposit modal |
| Watchlist | WatchlistPage |
| Orders (Buy/Sell) | CoinDetailPage trade panel + TradingPage |
| Portfolio Assets | PortfolioPage — pie chart + P&L table |
| Withdrawal | WithdrawalPage |

---

## Design System

- **Dark theme**: `--bg-void` → `--bg-base` → `--bg-card` → `--bg-elevated`
- **Green** (`#00E5A0`): positive prices, gains, buy orders
- **Red** (`#FF3D5E`): negative prices, losses, sell orders
- **Blue** (`#1B74FF`): primary actions, accents
- **Gold** (`#FFB020`): warnings, watchlist, audit
- **Purple** (`#7C3AED`): graph risk features
- Fonts: **Chakra Petch** (headings/labels), **Space Mono** (prices/numbers), **DM Sans** (body)

---

## Interview Talking Points

1. **Pessimistic Locking** → WalletPage badge + transfer modal explains the sorted-ID deadlock prevention
2. **Redis Idempotency** → Every trade/transfer sends `X-Idempotency-Key` header
3. **BFS Contagion** → GraphRiskPage with interactive draggable SVG graph
4. **Async Audit** → AuditLogPage architecture callout
5. **Circuit Breaker** → WebSocket offline fallback in Header
6. **WebSocket STOMP** → Live ticker tape + real-time coin price updates
7. **Dual-Entry Ledger** → WalletPage transaction history with signed amounts

---

*Built for DeltaEdge — Algorithmic Trading Engine*
