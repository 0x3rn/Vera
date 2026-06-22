import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-full">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-8 h-[70px] flex items-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Vera<span className="text-primary">.</span>
          </Link>
        </div>
      </nav>
      <main className="flex-1 pt-36 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mb-10">Last updated: June 2025</p>
          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
              <p>
                Vera processes contracts you upload solely for the purpose of AI analysis. We collect your email address when you sign up via Google or email/password, and store your scan history. We never sell your data.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Contract Documents</h2>
              <p>
                PDF files and pasted text are processed entirely in-memory and are never stored on disk. After analysis is complete, the extracted text is discarded. The AI-generated analysis results are stored in your account for you to reference later.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Payment Information</h2>
              <p>
                Payments are processed securely by Lemon Squeezy. Vera does not store or have access to your full credit card details. Lemon Squeezy provides us with limited transaction metadata to fulfill your order.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Cookies & Analytics</h2>
              <p>
                We use essential session cookies for authentication via Firebase. We do not use third-party tracking cookies or analytics scripts.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Your Rights</h2>
              <p>
                You may request deletion of your account and all associated data at any time by contacting us at support@verahq.xyz. We will process your request within 30 days.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Contact</h2>
              <p>
                For privacy-related inquiries, contact us at{" "}
                <Link href="/contact" className="text-primary hover:text-indigo-300 underline underline-offset-4">
                  our contact page
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-8 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-muted-foreground transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-muted-foreground transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
}