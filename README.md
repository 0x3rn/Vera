# Vera — Expert System Contract Risk Engine

**Don't sign away your rights. Let an expert system read the fine print.**

Vera is a hybrid AI and Expert-Rule-Based contract scanner that analyzes freelance agreements, NDAs, employment contracts, commercial leases, and more. It uses an advanced legal taxonomy to identify red flags, toxic clauses, and unfair terms, then calculates a deterministic risk score and outputs a plain-English summary with actionable negotiation advice.

![Vera](https://img.shields.io/badge/status-active-emerald) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Firebase](https://img.shields.io/badge/Firebase-11-yellow) ![Tailwind](https://img.shields.io/badge/Tailwind-4-cyan)

---

## Features

- **PDF Upload & Text Paste** — Drop a PDF or paste contract text directly
- **Smart Risk Engine™** — Hybrid AI and Expert System trained to detect fake liability caps, risk cascades, and unbalanced obligations
- **Comprehensive Severity Taxonomy** — Dictionary-based weighting system scoring over 99% of contract clauses across Critical, High, Medium, and Low tiers
- **Zero-Hallucination Deterministic Math** — AI extracts the variables, but our backend TypeScript Normalizer overrides bad severities and computes the exact 0-100 risk score
- **Mutuality & Balance Tracking** — Measures the exact one-sidedness of IP, liability, and termination rights to apply a Risk Multiplier
- **Automated Lawyer Review** — Programmatic recommendation based on our strict 4-tier verdict system (Passed, Moderate Risk, Extreme Caution, Do Not Sign)
- **Firebase Auth & Firestore** — Google Sign-In and highly scalable serverless NoSQL document storage
- **Lemon Squeezy Payments** — Checkout sessions with secure webhook confirmation
- **Dark Theme** — Premium dark UI with indigo/violet accents
- **Privacy First** — Contracts processed entirely in-memory, never stored on disk

---

## Architecture

```
vera/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── scan/               # POST /api/scan — main contract analysis
│   │   │   ├── results/[id]/       # GET /api/results/:id — fetch scan results
│   │   │   └── webhook/lemonsqueezy/ # Lemon Squeezy webhook handler
│   │   ├── pricing/                # /pricing page
│   │   ├── results/[id]/           # /results/:id permalink page
│   │   ├── layout.tsx              # Root layout (Inter font, dark bg)
│   │   ├── page.tsx                # Landing page
│   │   └── globals.css             # Tailwind v4 base styles
│   ├── lib/
│   │   ├── contract-analyzer.ts    # AI prompt engineering & Expert System Rules Engine
│   │   ├── openai.ts               # OpenAI SDK wrapper
│   │   ├── pdf-parser.ts           # pdfjs-dist in-memory PDF text extraction
│   │   ├── firebase.ts             # Browser Firebase client config
│   │   └── firebase-admin.ts       # Server Firebase Admin SDK
│   └── middleware.ts               # Auth middleware
├── .env.example                    # Environment variable template
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
| Database | [Firebase Firestore](https://firebase.google.com/) |
| Auth | [Firebase Auth](https://firebase.google.com/docs/auth) (Google OAuth) |
| AI | OpenAI SDK |
| PDF Parsing | [pdfjs-dist](https://mozilla.github.io/pdf.js) (in-memory) |
| Payments | [Lemon Squeezy](https://lemonsqueezy.com/) (Checkout Sessions + Webhooks) |
| Font | [Inter](https://fonts.google.com/specimen/Inter) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase](https://firebase.google.com/) project
- An OpenAI API key
- A [Lemon Squeezy](https://lemonsqueezy.com/) account (with webhook secret)

### Installation

```bash
# Clone the repository
git clone https://github.com/0x3rn/Vera.git
cd vera

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Environment Variables

Open `.env.local` and fill in your keys:

```env
# Required — OpenAI API key
OPENAI_API_KEY=sk-...

# Required — Lemon Squeezy keys
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_WEBHOOK_SECRET=...
LEMONSQUEEZY_STORE_ID=...
LEMONSQUEEZY_VARIANT_ID=...

# Required — Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

# Required — Firebase Admin (Service Account)
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

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

1. User signs in with Google (Firebase Auth)
2. User uploads a PDF or pastes contract text
3. PDF is parsed **entirely in-memory** using `pdfjs-dist` — files never touch disk
4. Server checks the user's `free_scans_used` count in Firestore:
   - **< 2 free scans remaining** → AI analyzes the contract, stores results in DB, returns the report
   - **Free scans exhausted** → Saves a pending scan record, generates a Lemon Squeezy Checkout session, returns the payment URL
5. Upon Lemon Squeezy payment, the webhook marks the scan as `paid`

### Expert System Analysis & Deterministic Scoring

The system prompt instructs the AI to act as an expert contract lawyer scanning for issues across multiple categories. Crucially, the AI does *not* perform arithmetic or final severity mapping.

1. **Flag Extraction**: The AI extracts the raw contract clauses and proposes a severity.
2. **Backend Normalization**: The TypeScript backend (`contract-analyzer.ts`) runs the extracted flags through a massive Legal Taxonomy Matrix. It overrides hallucinations, unbundles merged concepts, and enforces strict severity weights (e.g., $Confession of Judgment = 40 pts$).
3. **Advanced Heuristics**: The backend dynamically scales weights using the AI's enforcement likelihood and confidence scores, and applies negative points for user-favorable terms.
4. **Deterministic Math**: The backend mathematically computes the final score, completely insulating the system from AI math hallucinations.
5. **Lawyer Review**: The backend automatically triggers a Verdict (Passed, Moderate Risk, Extreme Caution, Do Not Sign) and a Lawyer Review recommendation based on the mathematical score.

---

## License

MIT License. See [LICENSE](./LICENSE) for details.

---

## Disclaimer

Vera is an analysis tool, not a substitute for legal counsel. The reports generated are for informational purposes only and do not constitute legal advice. Always consult a qualified attorney before signing any legally binding document.