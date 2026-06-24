"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

if (typeof window !== "undefined" && !SITE_KEY) {
  console.warn(
    "[Vera] NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set. reCAPTCHA will be skipped in development."
  );
}

function RegisterForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const preventDefault = (e: Event) => e.preventDefault();
    form.addEventListener("submit", preventDefault);
    return () => form.removeEventListener("submit", preventDefault);
  }, []);

  // Cooldown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSuccess && cooldown > 0) {
      timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown, isSuccess]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    setLoading(true);
    setError("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user session found.");

      await sendEmailVerification(user, {
        url: window.location.origin + "/dashboard",
        handleCodeInApp: true,
      });
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          const idToken = await user.getIdToken(true);
          await handleAuthSuccess(idToken);
          return;
        }
      }
      setError("Email not verified yet. Please check your inbox and click the link.");
    } catch (err: any) {
      setError("Failed to check verification status.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (idToken: string) => {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });
    if (res.ok) {
      window.location.href = "/dashboard";
    } else {
      setError("Failed to create secure session.");
      setLoading(false);
    }
  };

  const handleEmailRegister = useCallback(async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (loading) return;
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    let recaptchaToken = "";
    if (executeRecaptcha) {
      try {
        recaptchaToken = await executeRecaptcha("register_form");
      } catch {
        // Token generation failed
      }
    }

    try {
      // 1. Create user on backend
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password, recaptchaToken, websiteUrl }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Registration failed");
      }

      // 2. Sign in on the client to establish the Firebase Auth session
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 3. Immediately send verification email
      await sendEmailVerification(userCredential.user, {
        url: window.location.origin + "/dashboard",
        handleCodeInApp: true,
      });
      
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to register.");
    } finally {
      setLoading(false);
    }
  }, [firstName, lastName, email, password, confirmPassword, executeRecaptcha, loading]);

  const handleGoogleSignUp = useCallback(async (e?: React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();
      await handleAuthSuccess(idToken);
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google.");
      setLoading(false);
    }
  }, [loading]);

  return (
    <>
      {isSuccess ? (
        <div className="text-center animate-in fade-in duration-500">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Check your inbox</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            We've sent a verification link to your email address. Please click the link to verify your account and access the dashboard.
          </p>

          {error && (
            <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5 mb-6 text-left">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleCheckVerification}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-all disabled:opacity-50"
            >
              {loading ? "Checking..." : "I've verified my email"}
            </button>
            
            <button
              onClick={handleResend}
              disabled={cooldown > 0 || loading}
              className="w-full py-3 rounded-lg border border-border text-foreground font-medium text-sm hover:border-border hover:bg-muted/50 transition-all disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend Verification Link"}
            </button>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Can't find the email? Check your spam folder, or contact{" "}
            <a href="mailto:support@verahq.xyz" className="text-primary hover:text-indigo-300 underline underline-offset-4">
              support@verahq.xyz
            </a>
          </p>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-2">Create an account</h1>
          <p className="text-muted-foreground mb-8">Get 1 free contract scan.</p>

          {error && (
            <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5 mb-6">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form 
            ref={formRef}
            onSubmit={(e) => {
              e.preventDefault();
              handleEmailRegister(e);
            }} 
            className="space-y-4"
          >
            {/* Honeypot field - visually hidden to catch bots */}
            <input
              type="text"
              name="website_url"
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="firstName" className="block text-sm font-medium text-muted-foreground mb-1.5">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="John"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="lastName" className="block text-sm font-medium text-muted-foreground mb-1.5">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1.5">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1.5">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="Min. 8 characters"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground mb-1.5">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="Re-enter your password"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-all"
              style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-background text-muted-foreground">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full py-3 rounded-lg border border-border text-foreground font-medium text-sm hover:border-border hover:bg-muted/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-indigo-300 underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </>
      )}
    </>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex flex-col min-h-full animate-in fade-in duration-500">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-8 h-[70px] flex items-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Vera<span className="text-primary">.</span>
          </Link>
        </div>
      </nav>
      <main className="flex-1 pt-44 pb-24">
        <div className="max-w-sm mx-auto px-4">
          <GoogleReCaptchaProvider
            reCaptchaKey={SITE_KEY}
            scriptProps={{ async: true, defer: true }}
          >
            <RegisterForm />
          </GoogleReCaptchaProvider>
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