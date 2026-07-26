# UniTrade

A student-to-student marketplace for Australian universities, built for the
**Pinch Me! I Want 50K** hackathon.

Every semester thousands of international students leave the country selling
exactly what the next intake arrives needing. Today that trade happens on
Facebook Marketplace and in WhatsApp groups — strangers, cash, no protection,
and a well-documented rental-bond scam problem aimed at people who pay before
they have even landed. UniTrade puts it behind verified student accounts and
real payments, so the money is the safe part.

Payments run on **Pinch Payments** (test mode) — hosted checkout for the payer,
tokenised cards, and every payment status mapped to a screen the UI knows how
to render.

---

## Run it

**Requires Node 22.5 or newer** (the server uses the built-in `node:sqlite`).
Built and tested on Node 24.

```bash
npm install
npm run dev:all
```

Then open **http://localhost:5173**.

That is the whole setup. The database is created and seeded automatically on
first run (22 listings, 20 accounts across 13 universities, including university
housing and agency accounts) — there is nothing to migrate and no service to
sign up for.

`npm run dev:all` starts both halves:

| | |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| API (Express) | http://localhost:3001 |

### Payments (optional, but it is the good bit)

The marketplace runs fine without keys — you can browse, negotiate and message.
Only checkout needs Pinch. To turn it on, copy the example env file and add your
own **test-mode** keys:

```bash
cp .env.example .env
```

```
PINCH_APP_ID=app_test_...
PINCH_SECRET=sk_test_...
VITE_PINCH_PUBLISHABLE_KEY=pk_test_...
```

Restart, and the server prints `Pinch credentials OK`. Without keys it prints a
warning and starts anyway with payments disabled — check which mode you are in
at http://localhost:3001/api/health (`"payments": true`).

`.env` is gitignored and no key is committed to this repo.

---

## The 90-second walkthrough

Accounts are real: bcrypt-hashed passwords and a JWT bearer token. Every seeded
account uses the password **`student123!`**.

1. Sign in as a buyer: **`priya.s@uon.edu.au`** / **`student123!`**.
2. Open **Items → "Laptop, great for uni work"** ($620).
3. Hit **Make a deal** and offer something under asking, say **$520**.
4. You land in Messages, where the offer sits in the thread.
5. Open a private window and sign in as the seller,
   **`aiko.t@student.unsw.edu.au`** / **`student123!`**. Accept or counter the
   offer there — both sides can move the number until the money lands.
6. Back as the buyer, press **Pay**. That hands you to Pinch's hosted checkout;
   card **`4242 4242 4242 4242`**, any future expiry, any CVC.
7. You come back to a confirmation carrying the real Pinch payment ID, and the
   listing is marked sold.

Prefer your own account? Any recognised Australian university domain works
(`@uon.edu.au`, `@student.unsw.edu.au`, `@sydney.edu.au`, …). Passwords need 8
characters, a number and a symbol.

### Forcing a failure

Payment failures are the interesting half, so they are reachable on demand
rather than by luck. Pinch forces an outcome when the payer's **first name**
starts with a dishonour code, and the payer we send is the signed-in account —
so go to **Account**, set your name to one of these, and pay as normal:

| Set your name to | What you get |
|---|---|
| `#insufficient-funds Test` | Declined — retry offered, reason shown |
| `#invalid-card Test` | Declined |
| `#blocked-by-bank Test` | Declined |
| `#technical-error Test` | Declined |

Set the name back to normal for a successful run.

Every Pinch status maps to exactly one screen — success, pending, failed,
reversed, in-dispute, and an explicit "we're confirming this payment" state for
anything unrecognised. There is no path that leaves the user on a spinner.

### Other things worth clicking

- **Accommodation** — inspections, not payments. A room deposit is a $2,000
  decision, so the journey ends in a confirmed viewing, not a checkout.
- **Services** — priced by the hour; the provider sends the quote.
- **Sell** — list something of your own. Photos come off your device and are
  scaled in the browser.
- **Student deals** — the affiliate revenue line. Codes are held server-side
  and only released to a verified student; the brands are illustrative.

---

## How it is put together

Vite + React + TypeScript on the front, Express + TypeScript on the back, run
with `tsx`. SQLite via `node:sqlite`, behind a `Repository` interface.

```
server/
  pinch.ts        every Pinch call lives here and nowhere else
  routers/        url shapes
  controllers/    request parsing, no rules
  services/       all the rules
  data/           repository seam, sqlite + in-memory impls, fixed seed
src/
  types/          shared types, defined once — the server imports these too
  api/            the only modules that talk to our backend
  utils/          our helpers (format, money, categories, image scaling)
  lib/            third-party glue (shadcn cn, fetch client, CaptureJS)
  ui/             components by feature
  pages/          one per route
```

Three rules shaped most of it:

- **Every backend state maps to exactly one frontend state.** Pinch's payment
  statuses are a fixed set; the checkout has a rendering for each, including an
  explicit unknown.
- **The rules live on the server.** A deal carries a `DealActions` block saying
  what you may do with it, computed server-side; the UI renders that rather than
  re-deriving permissions. The same function guards the endpoints, so a visible
  button and a successful call can never disagree.
- **One file per external service.** Card details go browser → Pinch directly and
  never touch our server.

Accounts use bcrypt password hashes and a 7-day JWT sent as a bearer token. The
hash never appears on a `User` object — it lives beside it in the repository, so
it cannot leak through a view. Set `JWT_SECRET` in `.env` for anything beyond a
local run.

It is deliberately a single package rather than split `frontend/` and `backend/`
folders: client and server import the same type definitions from `src/types/`, so
one `npm install` and one command runs the whole thing.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev:all` | Frontend + API together — this is the one you want |
| `npm run dev` | Frontend only |
| `npm run dev:server` | API only |
| `npm run build` | Typecheck and production build |
| `npm run lint` | ESLint |
| `npm run db:reset` | Delete the local database; it reseeds on next start |

Set `JWT_SECRET` in `.env` to sign tokens with your own secret.

## If something goes wrong

- **Port already in use** — Vite will move to 5174 and tell you; the API port is
  set with `PORT` in `.env`.
- **Listings missing or the data looks odd** — stop the server, run
  `npm run db:reset`, start again. The seed is fixed, so you get the same 22
  listings every time.
- **`node:sqlite` not found** — you are on Node older than 22.5.
- **Payment button does nothing** — no Pinch keys; check
  http://localhost:3001/api/health.
