# 🛒 Southwind

![Status](https://img.shields.io/badge/status-in%20development-orange?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)
![Sentry](https://img.shields.io/badge/Monitoring-Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Multi--stage-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Southwind is a full-stack e-commerce store with a React 19 single-page app and an Express 5 + PostgreSQL API. Shoppers browse a categorized catalog, pay through a Polar hosted checkout, and after payment can open a support chat and a video call with staff for that specific order through Stream. Admins manage the catalog with images hosted on ImageKit. Clerk handles sign-in and roles, and Sentry monitors both the browser and the server.

---

## ✨ Features

- **Product catalog**: A responsive product grid with category filter chips. The selected category lives in the URL (`?category=Audio`), so filtered views can be shared and bookmarked.
- **Product detail pages**: Each product has its own page at `/product/:slug`, with breadcrumbs, price, description, an "Add to cart" button, and an **Open full size** link that serves a watermarked, optimized image.
- **Persistent cart**: Add, remove, and change quantities (1–99) with a stepper. The cart survives page reloads, and a live item count badge shows in the navbar.
- **Authentication**: Clerk modal sign-in and the `UserButton` avatar menu. The Orders, Admin, and video call routes redirect signed-out visitors to the home page.
- **Secure checkout**: "Checkout securely" sends the cart to the API, which creates a Polar checkout and redirects the shopper to it. The `/checkout/return` page confirms payment, clears the cart, and refreshes the order list.
- **Order history**: Each order card shows a thumbnail mosaic (up to 4 product images plus a `+N` overflow tile), the status badge, the date, an item summary, and the total.
- **Order detail with tabs**: A header with the order number, full timestamp, status, and total, plus nested **Summary** and **Support chat** tabs. The chat tab stays locked with a warning until the order is `paid`.
- **Order support chat**: A Stream Chat channel for each paid order (`order-<id>`), shared by the customer and support staff.
- **Video call support**: Support and admin staff can post a **video call invite** into the order chat. Everyone joins the same Stream Video room at `/orders/:id/call`, with speaker layout and call controls.
- **Role-aware UI**: Three roles: `customer`, `support`, and `admin`. Staff see every store order, a role badge shows next to their avatar, and only admins see the Admin link.
- **Admin product management**: A product table with create and edit in a modal, direct image upload to ImageKit (PNG/JPG/WebP/GIF, up to 10 MB) or a pasted image URL, and an "Active in store" toggle. Deleting a product asks for confirmation and is blocked if the product is on any existing order.
- **Sentry demo panel**: `/demo-sentry` sends realistic sample logs, breadcrumbs, and issues (payment declined, out of stock, carrier timeout, tax error, webhook signature failure, rate limit) for exploring Sentry's Issues, Logs, and Replay views.

---

## 🧰 Tech Stack

**Frontend** (`frontend/package.json`)

- **UI**: React 19 (`react`, `react-dom` ^19.3)
- **Build tool**: Vite 8 with `@vitejs/plugin-react` 6
- **Routing**: React Router 7 (`react-router` ^7.18)
- **Styling**: Tailwind CSS 4 (`@tailwindcss/vite`) + daisyUI 5 (`forest` theme)
- **Server state**: TanStack Query 5 (`@tanstack/react-query`)
- **Client state**: Zustand 5 with the `persist` middleware
- **Auth**: Clerk React 6 (`@clerk/react`)
- **Chat & video**: `stream-chat` 9, `stream-chat-react` 14, `@stream-io/video-react-sdk` 1
- **Monitoring**: Sentry React 11 (`@sentry/react`): tracing, session replay, logs
- **Icons**: `lucide-react` 1
- **Linting**: ESLint 10 (flat config) with `eslint-plugin-react-hooks` 7 and `eslint-plugin-react-refresh`

**Backend** (`backend/package.json`)

- **Runtime & framework**: Node.js 22 + Express 5
- **Language**: TypeScript 5 (strict), `tsx` 4 for watch-mode dev
- **Database**: PostgreSQL via `pg` 8 + Drizzle ORM 0.39 (`drizzle-kit` 0.30 for schema push)
- **Validation**: Zod 3 (request bodies and environment variables)
- **Auth**: `@clerk/express` 2 (middleware) + `@clerk/backend` 3 (webhook verification)
- **Payments**: Polar checkouts through its REST API, with webhooks verified by `standardwebhooks` 1
- **Chat & video tokens**: `stream-chat` 8 (server SDK)
- **Media**: `@imagekit/nodejs` 7
- **Scheduling**: `cron` 4
- **Monitoring**: `@sentry/node` 10 + `@sentry/profiling-node` 10

**Deployment**

- **Container**: A multi-stage `Dockerfile` (based on `node:22-bookworm-slim`) builds the SPA and the API into a single image.

---

## 🧠 Engineering Highlights

- **The server sets the price.** The browser sends only `{ productId, quantity }`. The API loads the matching *active* products, computes the total in cents, stores a `checkout_sessions` snapshot of each line's unit price, and passes that amount to Polar as a fixed ad-hoc price. Totals below Polar's 10¢ minimum are rejected before any call to Polar is made.
- **Idempotent, transactional order fulfillment.** The `order.paid` webhook first checks whether an order with that Polar order ID or checkout ID is already paid. Otherwise it locks the checkout session (`SELECT … FOR UPDATE`) inside a transaction, creates the order and its line items, and deletes the session. Bad signatures or malformed payloads return `400`, so Polar does not retry them. Database failures return `500`, so Polar does retry.
- **Raw-body webhook verification.** `/webhooks/clerk` and `/webhooks/polar` are registered with `express.raw()` *before* `express.json()`, so their signatures are checked against the exact bytes received. The Polar handler accepts both the Standard Webhooks `whsec_` secret format and older raw secrets.
- **Clerk → Postgres user sync.** Clerk `user.created`, `user.updated`, and `user.deleted` webhooks upsert or delete a local `users` row. The role is read from Clerk `public_metadata.role`, and any unrecognized value falls back to `customer`.
- **Access control that doesn't reveal what exists.** Customers who request an order they don't own get `404`, not `403`. Support chat and video invites also require the order to be `paid`, and only staff can send an invite.
- **Fail-fast configuration.** `lib/env.ts` validates `process.env` with Zod (URLs, UUIDs, numeric coercion, defaults), caches the result, and lists each invalid field when startup fails.
- **Safe catalog deletes.** `order_items.product_id` uses `ON DELETE RESTRICT`. The admin API returns `409` with a "deactivate it instead" message when a product is on any order, and deletes the matching ImageKit file when a product is removed.
- **Signed direct-to-CDN uploads.** The admin form asks `/api/admin/imagekit/auth` for short-lived upload credentials and then uploads straight to ImageKit, so the private key never reaches the browser. File names are sanitized before upload.
- **Image optimization through URLs.** `lib/imagekitUrl.js` rewrites each ImageKit URL with resize, quality, and `f-auto` transformations, using named presets sized for each slot in the UI (catalog card, cart thumbnail, product hero, admin thumbnail, and so on) at 2× for high-density screens. It removes any transformation already in the URL, can add a text watermark, and returns non-ImageKit URLs unchanged.
- **Image loading strategy.** List and grid images use `loading="lazy"` and `decoding="async"`. The product hero image uses `fetchPriority="high"`.
- **One custom hook per page.** Each page has a hook (`useHomeCatalog`, `useCartPage`, `useOrderDetailPage`, `useOrderChatPage`, `useOrderVideoPage`, `useAdminProductsPage`, …) that holds its data fetching and side effects, which keeps the page components purely presentational.
- **Shared query cache.** Query keys such as `["me"]`, `["products", category]`, and `["order", id]` are reused across components. Admin create, update, and delete mutations invalidate the admin, catalog, and category queries so every view stays current.
- **Lean persisted cart.** The Zustand store saves only product IDs and quantities to `localStorage`. Names and prices always come from the API, so a stale cart can't show an outdated price.
- **Nested routes with outlet context.** `/orders/:id` loads the order once and passes `{ order, items, paid }` to its `Summary` and `Chat` child routes through `<Outlet context>`.
- **Predictable Stream identities.** Stream user IDs are `clerk_<clerkUserId>`, and both the chat channel and the video call are named `order-<orderId>`, so the customer and staff always land in the same room. Chat and video clients disconnect or leave the call when their page unmounts.
- **End-to-end observability.** Sentry runs on both the client and the server. Both sides tag events with the Clerk user ID. `apiFetch` records a breadcrumb for every request, reports network failures and 5xx responses, and frontend traces propagate to the API. The Express error handler returns the `sentryId` so error reports can be matched to Sentry events.
- **Accessibility details.** Decorative icons are `aria-hidden`. The cart link's `aria-label` includes the item count, the quantity display is `aria-live="polite"`, error messages use `role="alert"`, and the checkout button sets `aria-busy` while it loads.
- **Loading skeletons that match the layout.** Dedicated daisyUI skeletons for the product, cart, orders list, order detail, chat, video, and admin table views mirror the real layout to limit layout shift.
- **Single-container deployment.** In production, Express serves the built SPA from `public/` with a history-API fallback that leaves `/api` and `/webhooks` alone. The image runs as the non-root `node` user, and a cron job pings `/health` every 14 minutes to keep the service from idling.

---

## 📁 Folder Structure

```text
Southwind-E-Commerce-Application/
├── Dockerfile                        # 3-stage build: Vite SPA + compiled API → one Node 22 image
├── .dockerignore                     # Keeps node_modules, dist and .env files out of the image
├── .gitignore                        # Ignores node_modules, dist, .env files, editor folders
├── README.md                         # This file
├── backend/
│   ├── .env.example                  # Template for server environment variables
│   ├── drizzle.config.ts             # drizzle-kit config (schema path, PostgreSQL dialect)
│   ├── package.json                  # API scripts: dev, build, start, db:push, db:seed
│   ├── tsconfig.json                 # Strict TypeScript, NodeNext modules, emits to dist/
│   ├── scripts/
│   │   └── seed.ts                   # Upserts 18 demo products across 7 categories
│   └── src/
│       ├── index.ts                  # Express app: webhooks, middleware, /api routers, SPA fallback
│       ├── instrument.ts             # Sentry + profiling init (loaded with --import)
│       ├── controllers/
│       │   ├── adminController.ts    # requireAdmin guard, product CRUD, ImageKit auth params
│       │   ├── checkoutController.ts # Server-side pricing + Polar checkout creation
│       │   ├── orderController.ts    # Order list/detail, chat channel, video invite
│       │   ├── productController.ts  # Public catalog, categories, product by slug
│       │   └── streamController.ts   # Issues Stream user tokens
│       ├── db/
│       │   ├── index.ts              # pg Pool + Drizzle client
│       │   └── schema.ts             # users, products, checkout_sessions, orders, order_items
│       ├── lib/
│       │   ├── cron.ts               # 14-minute keep-alive ping to /health (production only)
│       │   ├── env.ts                # Zod-validated, cached environment config
│       │   ├── imagekit.ts           # Deletes ImageKit files (ignores already-missing)
│       │   ├── polar.ts              # Minimal Polar REST client for checkouts
│       │   ├── roles.ts              # customer / support / admin helpers
│       │   ├── stream.ts             # Stream server client, user ID + display-name helpers
│       │   └── users.ts              # Look up the local user by Clerk ID
│       ├── middleware/
│       │   └── sentryClerkUser.ts    # Attaches the signed-in Clerk user to the Sentry scope
│       ├── routes/
│       │   ├── adminRouter.ts        # /api/admin/* (admin-only)
│       │   ├── checkoutRouter.ts     # POST /api/checkout
│       │   ├── meRouter.ts           # GET /api/me (current user + role)
│       │   ├── orderRouter.ts        # /api/orders, /:id, /:id/stream-channel, /:id/video-invite
│       │   ├── productRouter.ts      # /api/products, /categories, /:slug
│       │   └── streamRouter.ts       # POST /api/stream/token
│       └── webhooks/
│           ├── clerk.ts              # Verifies Clerk events; upserts/deletes users
│           └── polar.ts              # Verifies order.paid; creates orders idempotently
└── frontend/
    ├── index.html                    # HTML shell (daisyUI "forest" theme)
    ├── vite.config.js                # React + Tailwind CSS Vite plugins
    ├── eslint.config.js              # Flat config: recommended, react-hooks, react-refresh
    ├── package.json                  # SPA scripts: dev, build, lint, preview
    ├── public/
    │   ├── favicon.svg               # Browser tab icon
    │   └── icons.svg                 # SVG icon sprite
    └── src/
        ├── main.jsx                  # Sentry init + Clerk, TanStack Query, Router providers
        ├── App.jsx                   # Route table with signed-in guards
        ├── index.css                 # Tailwind v4 import + daisyUI plugin
        ├── components/
        │   ├── AdminProductForm.jsx  # Create/edit form with ImageKit upload + preview
        │   ├── CatalogProductCard.jsx# Product card with category badge and quick "Add"
        │   ├── EmptyCart.jsx         # Empty-cart state with catalog/orders links
        │   ├── Footer.jsx            # Shop / Support / Company columns
        │   ├── HomeHero.jsx          # Hero banner with category count stat
        │   ├── Layout.jsx            # Navbar + centered main + footer shell
        │   ├── LoadingSkeletons.jsx  # Page-specific skeleton placeholders
        │   ├── Navbar.jsx            # Sticky nav, cart badge, role badge, Clerk buttons
        │   ├── OrderPreview.jsx      # Order thumbnail / 2×2 mosaic with +N overflow
        │   ├── PageError.jsx         # Error card with optional action link
        │   ├── PageLoader.jsx        # Full-screen spinner while Clerk loads
        │   ├── SentryErrorFallback.jsx # Error-boundary fallback UI
        │   ├── SentryUserSync.jsx    # Keeps Sentry user in sync with Clerk
        │   └── TrustStrip.jsx        # Four value-proposition tiles
        ├── hooks/
        │   ├── useAdminProductsPage.js # Admin products query + save/delete mutations
        │   ├── useCartPage.js        # Cart lines, subtotal, checkout redirect
        │   ├── useHomeCatalog.js     # Categories + URL-driven product filter
        │   ├── useOrderChatPage.js   # Connects Stream Chat to the order channel
        │   ├── useOrderDetailPage.js # Loads an order and its items
        │   ├── useOrderVideoPage.js  # Joins the order's Stream Video call
        │   ├── useOrdersPage.js      # Order list + staff detection
        │   └── useProductPage.js     # Product by slug
        ├── lib/
        │   ├── api.js                # Authenticated fetch wrapper with Sentry breadcrumbs
        │   ├── imagekitUpload.js     # Signed browser → ImageKit upload
        │   └── imagekitUrl.js        # URL transformation presets + watermark
        ├── pages/
        │   ├── AdminProductsPage.jsx # /admin product table + modal
        │   ├── CartPage.jsx          # /cart
        │   ├── CheckoutReturnPage.jsx# /checkout/return (Polar success redirect)
        │   ├── HomePage.jsx          # / hero, trust strip, catalog
        │   ├── OrderChatPage.jsx     # /orders/:id/chat
        │   ├── OrderDetailPage.jsx   # /orders/:id layout with tabs + <Outlet>
        │   ├── OrderSummaryPage.jsx  # /orders/:id (index) line items + total
        │   ├── OrderVideoPage.jsx    # /orders/:id/call
        │   ├── OrdersPage.jsx        # /orders
        │   ├── ProductDetailPage.jsx # /product/:slug
        │   └── SentryDemoPage.jsx    # /demo-sentry
        ├── store/
        │   └── cart.js               # Zustand cart persisted to localStorage
        └── utils/
            └── format.js             # Intl currency and date formatting
```

---

## 🔐 Environment Variables

Neither `.env` file is committed. `backend/.env.example` is the starting template for the API.

### Backend: `backend/.env`

Everything is validated at startup by [`backend/src/lib/env.ts`](backend/src/lib/env.ts).

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No (default `3001`) | Port the API listens on |
| `NODE_ENV` | No (default `development`) | `development`, `production` or `test`; `production` turns on the keep-alive cron |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `CLERK_PUBLISHABLE_KEY` | **Yes** | Clerk publishable key |
| `CLERK_SECRET_KEY` | **Yes** | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Needed for user sync | Signing secret for `POST /webhooks/clerk`. Without it, users never sync and API calls return "Account not synced yet" |
| `FRONTEND_URL` | **Yes** (URL) | Public URL of the SPA, used for Polar redirect URLs, video invite links and the `/health` keep-alive |
| `POLAR_ACCESS_TOKEN` | Needed for checkout | Polar API token; without it, checkout returns `503` |
| `POLAR_WEBHOOK_SECRET` | Needed for orders | Signing secret for `POST /webhooks/polar` |
| `POLAR_API_BASE` | No (default `https://api.polar.sh`) | Polar API base URL (for example, the sandbox) |
| `POLAR_CHECKOUT_PRODUCT_ID` | **Yes** (UUID) | The Polar product whose price is replaced by the cart total |
| `STREAM_API_KEY` | **Yes** | Stream API key (chat + video) |
| `STREAM_API_SECRET` | **Yes** | Stream API secret |
| `IMAGEKIT_PUBLIC_KEY` | **Yes** | ImageKit public key |
| `IMAGEKIT_PRIVATE_KEY` | **Yes** | ImageKit private key (server only) |
| `IMAGEKIT_URL_ENDPOINT` | **Yes** (URL) | ImageKit URL endpoint, e.g. `https://ik.imagekit.io/your_id` |
| `SENTRY_DSN` | No | Backend Sentry DSN; Sentry stays off if unset |

```bash
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require

CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

FRONTEND_URL=http://localhost:5173

POLAR_ACCESS_TOKEN=xxx
POLAR_WEBHOOK_SECRET=whsec_xxx
POLAR_API_BASE=https://api.polar.sh
POLAR_CHECKOUT_PRODUCT_ID=00000000-0000-0000-0000-000000000000

STREAM_API_KEY=xxx
STREAM_API_SECRET=xxx

IMAGEKIT_PUBLIC_KEY=public_xxx
IMAGEKIT_PRIVATE_KEY=private_xxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Frontend: `frontend/.env`

Vite exposes only variables prefixed with `VITE_` to the browser, so none of these should hold secrets.

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | **Yes** | Clerk publishable key used by `<ClerkProvider>` |
| `VITE_API_URL` | Yes in dev | API origin, e.g. `http://localhost:3001`. Leave empty to call `/api` on the same host (the Docker image builds with it empty) |
| `VITE_SENTRY_DSN` | No | Browser Sentry DSN |
| `VITE_IMAGEKIT_URL_ENDPOINT` | No | Custom ImageKit endpoint, so URLs on it are optimized as well as the default `*.ik.imagekit.io` URLs |

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
VITE_API_URL=http://localhost:3001
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 22.18+** and npm. `npm start` loads `src/instrument.ts` directly, which relies on Node's built-in TypeScript type stripping. That feature is on by default from 22.18.
- A **PostgreSQL** database (any hosted or local instance reachable through `DATABASE_URL`)
- Accounts and keys for **Clerk**, **Polar**, **Stream** and **ImageKit**; **Sentry** is optional
- For local webhooks: a public HTTPS URL that forwards to `http://localhost:3001`, so that Clerk and Polar can reach `/webhooks/clerk` and `/webhooks/polar`

### 1. Clone the repository

```bash
git clone https://github.com/K01J10W19/Southwind-E-Commerce-Application.git
```

```bash
cd Southwind-E-Commerce-Application
```

### 2. Install dependencies

The backend and frontend are separate npm projects, so install each one.

```bash
cd backend && npm install
```

```bash
cd ../frontend && npm install
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Then fill in `backend/.env` and create `frontend/.env` using the tables above. Two settings on the provider side:

- In **Clerk**, add a webhook to `https://<your-api>/webhooks/clerk` for `user.created`, `user.updated` and `user.deleted`. To make a user an admin or a support agent, set their **public metadata** to `{ "role": "admin" }` or `{ "role": "support" }`.
- In **Polar**, add a webhook to `https://<your-api>/webhooks/polar` for the `order.paid` event.

### 4. Create the database schema and seed products

```bash
cd backend && npm run db:push
```

```bash
npm run db:seed
```

### 5. Run in development

Run each command in its own terminal. The API starts on `http://localhost:3001` and the SPA on `http://localhost:5173`.

```bash
cd backend && npm run dev
```

```bash
cd frontend && npm run dev
```

### 6. Build for production

```bash
cd backend && npm run build
```

```bash
cd frontend && npm run build
```

### 7. Preview the production build

```bash
cd backend && npm start
```

```bash
cd frontend && npm run preview
```

### 8. (Optional) Build and run the Docker image

The image bundles the SPA and the API into a single container on port `3001`. The Clerk publishable key is baked in at build time, and the server variables are supplied at runtime.

```bash
docker build --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx -t southwind .
```

```bash
docker run --env-file backend/.env -p 3001:3001 southwind
```

### Lint the frontend

```bash
cd frontend && npm run lint
```

---

## 📱 Responsive Strategy

The layout is mobile-first and uses Tailwind's default breakpoints: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px. Each row below lists what changes at a breakpoint.

| Area | Base (mobile) | Breakpoint changes |
| --- | --- | --- |
| **Page shell** (`Layout`) | `min-h-svh` column, `px-4 py-8`, content capped at `max-w-7xl` | `md:` → `px-6 py-10` |
| **Navbar** | Sticky, icon-only links (Shop, Orders, Admin, Cart) | `sm:` → text labels appear; `md:` → larger logo text, wider gaps, role badge shown |
| **Home hero** | Single column, `p-8`, `text-3xl` heading | `md:` → 2 columns, `p-12`, `text-4xl`; `lg:` → `p-14`, `text-5xl` |
| **Trust strip** | 1 column | `sm:` → 2 columns; `lg:` → 4 columns |
| **Catalog header** | Title and category chips stacked; chips wrap | `sm:` → side by side, bottom-aligned |
| **Catalog grid** | 1 column | `sm:` → 2 columns; `xl:` → 3 columns |
| **Product detail** | Image above details | `lg:` → 2 columns with a wider `gap-14`; title/price `md:text-4xl` |
| **Cart** | Line items above the summary card | `lg:` → `grid-cols-[1fr_320px]` with a fixed-width summary sidebar |
| **Empty cart / checkout return** | Full-width stacked buttons, `px-6 py-12` | `sm:` → buttons in a centered row, `px-10 py-16`, larger heading |
| **Orders list** | Card content wraps (`flex-wrap`) | `sm:` → larger gaps, ID and total text |
| **Order detail header** | Info, then status/total under a divider | `sm:` → more padding, larger order number; `lg:` → side by side, status/total right-aligned, divider removed |
| **Order line items** | Thumbnail + info stacked over subtotal (with divider) | `sm:` → single row, larger `h-28` thumbnails, subtotal right-aligned |
| **Order preview mosaic** (large) | `h-32 w-32` | `sm:` → `h-36 w-36` |
| **Admin table** | Horizontal scroll (`overflow-x-auto`), `h-14` thumbnails | `sm:` → `h-18` thumbnails |
| **Footer** | Single column | `md:` → 4 columns |
| **Video call** | Call controls wrap and center | — |
| **Sentry demo rows** | Text and button stacked | `sm:` → text left, button right |
