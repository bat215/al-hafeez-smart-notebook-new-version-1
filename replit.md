# Al-Hafeez Smart Notebook

A premium cafe sales tracker and menu management app — black + gold dark theme, mobile-first, powered by Firebase Firestore.

## Run & Operate

- `pnpm --filter @workspace/cafe-tracker run dev` — run the cafe tracker (port 18770)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7 + Tailwind CSS v4
- Routing: wouter
- Animations: framer-motion
- Database: Firebase Firestore (frontend-only, no backend needed)
- Icons: lucide-react
- UI: shadcn/ui components

## Where things live

- `artifacts/cafe-tracker/` — main app
- `artifacts/cafe-tracker/src/lib/firebase.ts` — Firebase initialization
- `artifacts/cafe-tracker/src/lib/firestore.ts` — Firestore CRUD helpers + default seeding
- `artifacts/cafe-tracker/src/pages/SalesEntry.tsx` — sales entry page (/)
- `artifacts/cafe-tracker/src/pages/History.tsx` — history page (/history)
- `artifacts/cafe-tracker/src/pages/Summary.tsx` — summary/analytics (/summary)
- `artifacts/cafe-tracker/src/pages/Menu.tsx` — menu management (/menu)
- `artifacts/cafe-tracker/src/components/BottomNav.tsx` — bottom navigation
- `artifacts/cafe-tracker/src/index.css` — black + gold theme tokens

## Architecture decisions

- Pure frontend + Firebase architecture: no Express server needed for the cafe tracker
- Firestore real-time listeners (onSnapshot) for live data across all pages
- Seeds default menu items to Firestore on first load if collection is empty
- Dark-only theme (adds `dark` class to html element in main.tsx)
- Mobile-first layout: max-width 430px, centered on desktop

## Product

- **Sales Entry (/)**: Tap menu items to add to cart, qty +/- controls, pick payment type (Cash/UPI/Split/Pending), save with one tap. Custom date picker for backdating.
- **History (/history)**: Sales grouped by date. Expand to see items. Edit payment type. Delete entries. Filter by payment type.
- **Summary (/summary)**: Revenue totals for today/week/month. Payment type breakdown with progress bars. Top-selling items ranked.
- **Menu (/menu)**: Full CRUD for menu items. Categories, image URL, price, enable/disable toggle. Firestore sync.

## User preferences

- Black + Gold premium theme (always dark)
- Currency: Indian Rupees (₹)
- Payment types: Cash, UPI, Split, Pending
- Mobile-first (max-width 430px)
- No emojis in UI

## Gotchas

- Firebase env vars must be set with VITE_ prefix for frontend access
- The app is dark-only — dark class is added in main.tsx, no toggle needed
- Run codegen (`pnpm --filter @workspace/api-spec run codegen`) after OpenAPI spec changes (for API server, not cafe tracker)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
