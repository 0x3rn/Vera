# Vera — Expert System Contract Risk Engine

**Don't sign away your rights. Let an expert system read the fine print.**

Vera is a hybrid AI and Expert-Rule-Based contract scanner that analyzes freelance agreements, NDAs, employment contracts, commercial leases, and more. It uses an advanced legal taxonomy to identify red flags, toxic clauses, and unfair terms, then calculates a deterministic risk score and outputs a plain-English summary with actionable negotiation advice.

![Vera](https://img.shields.io/badge/status-active-emerald) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Firebase](https://img.shields.io/badge/Firebase-12-yellow) ![Tailwind](https://img.shields.io/badge/Tailwind-4-cyan)

---

## Features

- **PDF Upload & Text Paste** — Drop a PDF or paste contract text directly
- **Smart Risk Engine™** — Hybrid AI and Expert System trained to detect fake liability caps, risk cascades, and unbalanced obligations
- **Comprehensive Severity Taxonomy** — Rule-based weighting across Critical, High, Medium, and Low tiers
- **Zero-Hallucination Deterministic Math** — AI extracts the variables, but our backend TypeScript Normalizer overrides bad severities and computes the exact 0-100 risk score
- **Mutuality & Balance Tracking** — Measures the exact one-sidedness of IP, liability, and termination rights to apply a Risk Multiplier
- **Automated Lawyer Review** — Programmatic recommendation based on our strict 4-tier verdict system (Passed, Moderate Risk, Extreme Caution, Do Not Sign)
- **Firebase Auth & Firestore** — Google Sign-In and highly scalable serverless NoSQL document storage
- **Lemon Squeezy Payments** — Checkout sessions with secure webhook confirmation
- **Dark Theme** — Premium dark UI with indigo/violet accents
- **Privacy First** — Uploaded PDFs are parsed in an isolated in-memory worker; reports are stored for the signed-in user

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
│   │   ├── pricing/                # /pricing redirect
│   │   ├── results/[id]/           # /results/:id permalink page
│   │   ├── layout.tsx              # Root metadata and theme providers
│   │   ├── page.tsx                # Landing page
│   │   └── globals.css             # Tailwind v4 base styles
│   ├── lib/
│   │   ├── contract-analyzer.ts    # AI prompt engineering & Expert System Rules Engine
│   │   ├── openai.ts               # OpenAI-compatible Vertex AI client
│   │   ├── pdf-parser.ts           # Isolated, bounded PDF text extraction
│   │   └── firebase/               # Browser and Admin Firebase clients
│   └── proxy.ts                    # Security headers and nonce CSP
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
| AI | Vertex AI through the OpenAI-compatible API |
| PDF Parsing | `pdf-parse` in a bounded worker |
| Payments | [Lemon Squeezy](https://lemonsqueezy.com/) (Checkout Sessions + Webhooks) |
| Font | [Inter](https://fonts.google.com/specimen/Inter) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase](https://firebase.google.com/) project
- A Google Cloud project with Vertex AI access and a service account
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
# Required — Vertex AI. The JSON value must remain on one line.
GOOGLE_CLOUD_PROJECT=your-google-cloud-project
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-google-cloud-project",...}

# Required — Lemon Squeezy keys
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_WEBHOOK_SECRET=...
LEMONSQUEEZY_STORE_ID=...
LEMONSQUEEZY_ONETIME_VARIANT_ID=...
LEMONSQUEEZY_SUBSCRIPTION_VARIANT_ID=...

# Required — Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

# Required in production — rate limiting and reCAPTCHA
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
RECAPTCHA_SECRET_KEY=...

# Required — Firebase Admin (Service Account)
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Verification email action URL

Registration and resend now send branded HTML and plain-text emails through the
server's SMTP transport, using Firebase Admin-generated action codes. The HTML
contains a white “Verify email” button on Vera's `#6366f1` background and a copyable
fallback URL. Both URLs omit `apiKey` and point directly to Vera's action handler.
The authenticated endpoint only emails the Firebase account belonging to the
request's ID token; it limits requests by IP and to one email per user per minute.

Before deploying this flow, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASSWORD`, and `SMTP_FROM_EMAIL` in the hosting provider's server environment.
`SMTP_REPLY_TO` is optional. Use a sender your SMTP provider permits, and configure
its SPF/DKIM records. Set `APP_URL=https://verahq.xyz` and keep Firebase Admin and
Upstash credentials configured. These settings must never use `NEXT_PUBLIC_`.
Missing configuration or delivery failures show a retryable error rather than
claiming an email was sent. A registration remains recoverable through resend or
sign-in if delivery fails after the account was created.

Run `npm run email:verify-smtp` with Node.js 22.18+ and your `.env.local` (or injected
environment) to check SMTP connectivity, TLS, and authentication without sending
mail. The script does not prove inbox delivery. Run `npm run test` for automated
template, authentication, rate-limit, delivery-failure, and action-code checks.
After deployment, register a test account, inspect the button and fallback URL,
verify through each link in separate accounts, and test resend. Check spam as well
as the inbox. The Firebase console's built-in verification message is no longer
used by registration/resend; email-change notifications still use Firebase.

Vera serves Firebase email verification links at `https://verahq.xyz/__/auth/action`.
The route validates the action and applies the one-time code, then refreshes the
signed-in user's Firebase token and server session. Links opened in another browser
verify the email without a session and offer sign-in. Invalid, expired, or used links
offer sign-in or a fresh verification email.

In Firebase Authentication → Templates, confirm the customized action URL is
`https://verahq.xyz/__/auth/action`. The `url` passed to `sendEmailVerification` is
the continuation destination (`/dashboard`), not the action handler. The handler
uses Vera's configured Firebase project, not the `apiKey` or `continueUrl` in the link.
It supports `verifyEmail` and `verifyAndChangeEmail`; other modes show an unsupported
action message. Do not enable password-reset templates against this handler without
adding a password-reset flow.

After deploying, request a fresh verification email and test both the registration
browser and a separate browser. Also confirm a reused link shows recovery options.

### Development server

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
3. PDF is parsed in a terminable worker with file, page, text, and time limits
4. The server atomically reserves a scan entitlement and validates the AI result
5. The report and credit settlement commit together; failed or abandoned work does not consume a credit
6. Lemon Squeezy webhooks add scan packs or project subscription state idempotently

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
