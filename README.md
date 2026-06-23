# Vera — AI Contract Scanner

**Don't sign away your rights. Let AI read the fine print.**

Vera is an AI-powered legal contract scanner that analyzes freelance agreements, NDAs, employment contracts, commercial leases, and more. It identifies red flags, toxic clauses, and unfair terms, then outputs a plain-English summary with actionable negotiation advice.

![Vera](https://img.shields.io/badge/status-active-emerald) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-6-indigo) ![Tailwind](https://img.shields.io/badge/Tailwind-4-cyan)

---

## Features

- **PDF Upload & Text Paste** — Drop a PDF or paste contract text directly
- **AI Red Flag Detection** — DeepSeek LLM trained on 8 contract risk categories
- **Elite Deep Audit Engine™** — Advanced tracking for Compound Risk Chains, Worst-Case Scenarios, and Economic Fairness
- **Intelligent Auto-Naming** — AI automatically renames generic pasted text and generic PDFs into premium, descriptive titles
- **Progressive Disclosure UI** — Executive summary dials with deep-dive legal drawers
- **Plain-English Explanations** — "What it means" and "How to fix it" for every flag
- **Risk Score** — Overall 0–100 risk meter with severity indicators
- **Freemium Model** — 2 free scans per user, then $5/scan or $10/month Pro
- **Google Sign-In** — Firebase Auth with one-click Google OAuth (Note: recently migrated from Supabase to Firebase)
- **Stripe Payments (Lemon Squeezy)** — Checkout sessions with webhook confirmation (recently migrated to Lemon Squeezy)
- **Dark Theme** — Premium dark UI with indigo/violet accents
- **Privacy First** — Contracts processed entirely in-memory, never stored on disk

---

## Architecture

```
vera/
├── prisma/
│   └── schema.prisma          # Database models (User, Scan, PaymentStatus enum)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/callback/  # Supabase OAuth callback handler
│   │   │   ├── scan/           # POST /api/scan — main contract analysis
│   │   │   ├── results/[id]/   # GET /api/results/:id — fetch scan results
│   │   │   └── webhook/stripe/ # Stripe checkout.session.completed handler
│   │   ├── pricing/            # /pricing page
│   │   ├── results/[id]/       # /results/:id permalink page
│   │   ├── layout.tsx          # Root layout (Inter font, dark bg)
│   │   ├── page.tsx            # Landing page (hero, features, upload, results)
│   │   └── globals.css         # Tailwind v4 base styles
│   ├── lib/
│   │   ├── contract-analyzer.ts # DeepSeek prompt engineering & response parsing
│   │   ├── openai.ts           # DeepSeek-compatible OpenAI SDK wrapper
│   │   ├── pdf-parser.ts       # pdfjs-dist in-memory PDF text extraction
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── stripe.ts           # Stripe SDK singleton
│   │   ├── supabase-client.ts  # Browser Supabase client
│   │   └── supabase-server.ts  # Server Supabase client + admin client
│   └── middleware.ts           # Supabase session refresh middleware
├── .env.example                # Environment variable template
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, TypeScript) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Database | [Supabase PostgreSQL](https://supabase.com) |
| ORM | [Prisma 6](https://prisma.io) |
| Auth | [Supabase Auth](https://supabase.com/auth) (Google OAuth) |
| AI | [DeepSeek](https://deepseek.com) (`deepseek-chat` via OpenAI SDK) |
| PDF Parsing | [pdfjs-dist](https://mozilla.github.io/pdf.js) (in-memory) |
| Payments | [Stripe](https://stripe.com) (Checkout Sessions + Webhooks) |
| Font | [Inter](https://fonts.google.com/specimen/Inter) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [DeepSeek](https://platform.deepseek.com) API key
- A [Stripe](https://stripe.com) account (with webhook secret)
- A [Google Cloud](https://console.cloud.google.com) OAuth 2.0 client (for sign-in)

### Installation

```bash
# Clone the repository
git clone https://github.com/0x3rn/Vera.git
cd vera

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Environment Variables

Open `.env` and fill in your keys:

```env
# Required — DeepSeek API key
DEEPSEEK_API_KEY=sk-...

# Required — Stripe keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ONETIME_PRICE_ID=price_...
STRIPE_SUBSCRIPTION_PRICE_ID=price_...

# Required — Supabase
DATABASE_URL=postgresql://postgres:...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Database Setup

```bash
# Push schema to database
npx prisma db push

# (Optional) Run migrations
npx prisma migrate dev --name init
```

### Supabase Auth Setup

1. In your Supabase dashboard, go to **Authentication → Providers**
2. Enable **Google** and configure your OAuth client ID and secret
3. Set the redirect URL to: `https://your-domain.com/api/auth/callback`

### Stripe Setup

1. Create two products/prices in Stripe: $5 one-time and $10/month
2. Copy the price IDs into `.env`
3. Set up a webhook endpoint pointing to `https://your-domain.com/api/webhook/stripe`
4. Listen for `checkout.session.completed` events

### Development

```bash
npm run dev
# → http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

---

## How It Works

### Scan Flow

1. User signs in with Google (Supabase Auth)
2. User uploads a PDF or pastes contract text
3. PDF is parsed **entirely in-memory** using `pdfjs-dist` — files never touch disk
4. Server checks the user's `free_scans_used` count in the database:
   - **< 2 free scans remaining** → AI analyzes the contract, stores results in DB, returns the report
   - **Free scans exhausted** → Saves a pending scan record, generates a Stripe Checkout session, returns the payment URL
5. Upon Stripe payment, the webhook marks the scan as `paid`

### AI Analysis

The system prompt instructs DeepSeek to act as an expert contract lawyer scanning for issues across 8 categories:

- **Payment Terms** — Net-60/90/120, "paid when paid", acceptance-based payment
- **IP Rights** — Perpetual assignments, work-for-hire, portfolio rights
- **Exclusivity** — Non-solicitation, right of first refusal
- **Termination** — Termination for convenience, kill fees
- **Liability** — Unlimited liability, indemnification clauses
- **Non-Compete** — Post-engagement restrictions
- **Scope Creep** — Vague SOW, unlimited revisions
- **Other** — Governing law, arbitration, confidentiality

The AI returns structured JSON with risk scores, plain-English explanations, and concrete negotiation advice.

---

## Database Schema

```prisma
model User {
  id              String   @id @default(uuid())
  email           String   @unique
  free_scans_used Int      @default(0)
  created_at      DateTime @default(now())
  scans           Scan[]
}

model Scan {
  id                String        @id @default(uuid())
  user_id           String
  document_name     String
  ai_result         Json?
  payment_status    PaymentStatus @default(free)
  stripe_session_id String?
  created_at        DateTime      @default(now())
  user              User          @relation(fields: [user_id], references: [id])
}

enum PaymentStatus {
  free
  unpaid
  paid
}
```

---

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/scan` | Upload PDF/text for analysis. Returns analysis JSON or Stripe URL |
| `GET` | `/api/results/:id` | Fetch a completed scan by ID |
| `POST` | `/api/webhook/stripe` | Stripe webhook receiver (updates payment status) |
| `GET` | `/api/auth/callback` | Supabase OAuth callback (exchanges code for session) |

---

## License

MIT License. See [LICENSE](./LICENSE) for details.

---

## Disclaimer

Vera is an AI analysis tool, not a substitute for legal counsel. The reports generated are for informational purposes only and do not constitute legal advice. Always consult a qualified attorney before signing any legally binding document.