import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <nav className="fixed top-0 w-full z-50 bg-[#070709]/80 backdrop-blur-xl border-b border-[#22222a]">
        <div className="max-w-6xl mx-auto px-8 h-[70px] flex items-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Vera<span className="text-indigo-500">.</span>
          </Link>
        </div>
      </nav>
      <main className="flex-1 pt-36 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-zinc-500 text-sm mb-10">Last updated: June 2025</p>
          <div className="space-y-8 text-zinc-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Vera, you agree to these Terms of Service. If you do not agree, do not use the service.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
              <p>
                Vera is an AI-powered contract analysis tool. It scans uploaded contracts and provides plain-English summaries of potential red flags and risky clauses. Vera is not a law firm and does not provide legal advice.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information during registration and to update it as necessary.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Free Trial & Payments</h2>
              <p>
                Vera provides 2 free contract scans per user account. After exhausting your free scans, you must purchase a paid plan to continue using the service. All payments are processed by Lemon Squeezy and are subject to their terms.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Disclaimer of Legal Advice</h2>
              <p>
                Vera is an informational tool, not a substitute for professional legal counsel. The AI-generated analyses are for reference only. Always consult a qualified attorney before signing any legally binding document.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Limitation of Liability</h2>
              <p>
                Vera and its operators shall not be liable for any damages arising from the use of this service. You use Vera at your own risk.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Contact</h2>
              <p>
                For questions about these terms,{" "}
                <Link href="/contact" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4">
                  contact us
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <footer className="border-t border-[#22222a] py-8">
        <div className="max-w-6xl mx-auto px-8 flex flex-wrap justify-center gap-6 text-xs text-zinc-600">
          <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-zinc-400 transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
}