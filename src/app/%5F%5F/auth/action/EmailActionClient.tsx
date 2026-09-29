"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { completeEmailAction, emailActionError, type EmailActionResult } from "@/lib/firebase/email-action";

export default function EmailActionClient({ mode, code }: { mode: string; code: string }) {
  const request = useRef<Promise<EmailActionResult> | null>(null);
  const [result, setResult] = useState<EmailActionResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    // Reuse the in-flight action during Strict Mode's effect replay: codes are single-use.
    request.current ??= completeEmailAction(mode, code);
    request.current.then(
      value => { if (active) setResult(value); },
      failure => { if (active) setError(emailActionError(failure)); },
    );
    return () => { active = false; };
  }, [mode, code]);

  return (
    <div className="flex flex-col min-h-full">
      <nav className="border-b border-border bg-background/80">
        <div className="max-w-6xl mx-auto px-8 h-[70px] flex items-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">Vera<span className="text-primary">.</span></Link>
        </div>
      </nav>
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-md text-center" aria-live="polite">
          <h1 className="text-3xl font-bold mb-4">
            {error ? "Unable to verify email" : result ? "Email verified" : "Verifying your email…"}
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {error || result?.message || "Please wait while we confirm your verification link."}
          </p>
          {result && <Link href={result.destination} className="block w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover">
            {result.destination === "/dashboard" ? "Continue to dashboard" : "Sign in"}
          </Link>}
          {error && <div className="space-y-4">
            <Link href="/verify-email" className="block w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover">Request a new verification link</Link>
            <Link href="/login?clear_session=true" className="block text-primary underline underline-offset-4">Sign in</Link>
          </div>}
        </div>
      </main>
    </div>
  );
}
