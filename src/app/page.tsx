"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import ScannerInput, { AppState } from "@/components/ScannerInput";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const [scannerState, setScannerState] = useState<AppState>("idle");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        window.location.href = "/dashboard";
        return;
      }
      setUser(null);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    window.location.href = "/";
  };

  const isInput =
    scannerState === "idle" || scannerState === "uploaded" || scannerState === "error";

  return (
    <div className="flex flex-col min-h-full">
      {/* 1. Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-[70px] flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Vera<span className="text-primary">.</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors duration-500 ease-out">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors duration-500 ease-out">How It Works</a>
            <a href="#pricing" className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors duration-500 ease-out">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors duration-500 ease-out">FAQ</a>
          </div>
            <div className="flex items-center gap-6">
              <ThemeToggle />
              {user ? (
                <div className="flex items-center gap-3">
                  <Link href="/dashboard" className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors duration-500 ease-out">Dashboard</Link>
                  <button onClick={signOut} className="text-sm font-medium text-muted-foreground hover:text-muted-foreground transition-colors duration-500 ease-out">Sign out</button>
                </div>
              ) : (
                <Link href="/login" className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors duration-500 ease-out">Sign in</Link>
              )}
            </div>
          </div>
        </nav>
  
        <main className="flex-grow pt-[70px]">
        {/* 2. Hero Section (Split Layout logic via conditional classes) */}
        <section className={isInput ? "pt-20 sm:pt-32 pb-16 relative" : "pt-8 sm:pt-16 pb-32 relative"} id="hero">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            
            {/* Main Hero Title - Only show when waiting for input */}
            {isInput && (
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-16 text-center max-w-4xl mx-auto md:animate-in md:fade-in md:slide-in-from-bottom-4 md:duration-700">
                Don't Sign Away Your Rights.{" "}
                <br className="hidden md:block" />
                <span className="text-primary">Let AI Read the Fine Print.</span>
              </h1>
            )}

            <div className={isInput ? "grid lg:grid-cols-2 gap-12 lg:gap-16 items-start" : "block"}>
              
              {/* Left Side: Marketing Text - Only show when waiting for input */}
              {isInput && (
                <div className="order-2 lg:order-1 md:animate-in md:fade-in md:slide-in-from-bottom-4 md:duration-700 md:delay-100">
                  <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
                    Lawyers charge hundreds per hour. Vera scans freelance contracts in seconds and explains dangerous clauses in plain English before you sign.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Payment terms",
                      "IP ownership clauses",
                      "Exclusivity restrictions",
                      "Kill fees",
                      "Termination risks",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-muted-foreground">
                        <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm font-medium text-muted-foreground">1 Free Scan • No Credit Card Required</p>
                </div>
              )}

              {/* Right Side: The Scanner Component (expands to full width when scanning/results) */}
              <div className={isInput ? "order-1 lg:order-2 w-full relative z-20 md:animate-in md:fade-in md:slide-in-from-bottom-4 md:duration-700 md:delay-200" : "w-full"}>
                <ScannerInput onStateChange={setScannerState} />
              </div>
            </div>
          </div>
        </section>

        {/* The rest of the marketing page - Hide when scanning or viewing results */}
        {scannerState === "idle" && (
          <>
            {/* 3. Trust Bar */}
            <section className="py-12 border-t border-b border-border bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center opacity-70">
                <p className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-widest">
                  Trusted by freelancers, consultants, designers, developers, marketers, and agencies worldwide.
                </p>
                <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-muted-foreground font-semibold text-lg">
                  <span>Designers</span>
                  <span>Developers</span>
                  <span>Copywriters</span>
                  <span>Consultants</span>
                  <span>Agencies</span>
                </div>
              </div>
            </section>

            {/* 4. Product Demo Section */}
            <section className="py-24 relative overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Spot Red Flags Instantly</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Upload your contract and Vera will highlight exactly what you need to look out for.</p>
                </div>
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                  <div className="relative h-[400px] bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
                    <div className="h-12 border-b border-border bg-card flex items-center px-4 gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                      <span className="ml-4 font-mono text-xs text-muted-foreground">CLIENT_AGREEMENT.pdf</span>
                    </div>
                    <div className="flex-grow p-8 flex flex-col gap-6">
                      <div className="h-4 bg-muted rounded-full w-3/4"></div>
                      <div className="h-4 bg-muted rounded-full w-full"></div>
                      <div className="h-4 bg-muted rounded-full w-5/6"></div>
                      <div className="h-4 bg-primary/30 rounded-full w-full relative">
                        <div className="absolute inset-0 border-2 border-primary/50 rounded-full animate-pulse"></div>
                      </div>
                      <div className="h-4 bg-muted rounded-full w-2/3"></div>
                      <div className="h-4 bg-muted rounded-full w-4/5"></div>
                      <div className="h-4 bg-red-500/30 rounded-full w-full relative mt-4">
                        <div className="absolute inset-0 border-2 border-red-500/50 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-card border border-red-500/30 p-6 rounded-2xl relative z-20 backdrop-blur-xl hover:-translate-y-1 transition-transform duration-500 ease-out">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-red-400 font-bold">⚠</span>
                        </div>
                        <div>
                          <h4 className="text-foreground font-bold text-lg mb-1">Payment Terms</h4>
                          <p className="text-muted-foreground text-sm leading-relaxed mb-3">Net-90 payment schedule detected. You may wait up to 90 days before receiving payment.</p>
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> High Risk
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-card border border-amber-500/30 p-6 rounded-2xl relative z-20 backdrop-blur-xl hover:-translate-y-1 transition-transform duration-500 ease-out">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-amber-400 font-bold">⚠</span>
                        </div>
                        <div>
                          <h4 className="text-foreground font-bold text-lg mb-1">Intellectual Property</h4>
                          <p className="text-muted-foreground text-sm leading-relaxed mb-3">Client receives perpetual rights to all deliverables before payment is completed.</p>
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Medium Risk
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Problem Section */}
            <section className="py-24 bg-muted border-y border-border">
              <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Most Freelancers Sign Contracts Blindly</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
                  You spend hours negotiating a project. Then receive a 15-page contract filled with legal language. Hidden inside could be:
                </p>
                <div className="grid sm:grid-cols-2 gap-4 text-left max-w-3xl mx-auto mb-10">
                  {["Net-90 payment terms", "Perpetual ownership transfers", "Exclusivity restrictions", "No cancellation compensation", "Automatic renewals"].map((trap, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-card p-4 rounded-xl border border-border">
                      <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      <span className="text-muted-foreground font-medium">{trap}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xl font-bold text-foreground">By the time you discover the problem, you've already signed.</p>
              </div>
            </section>

            {/* 6. Features Grid */}
            <section id="features" className="py-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need Before You Sign</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Vera's AI engine is strictly trained on legal contracts to catch what you missed.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { title: "Payment Timeline Detection", desc: "Know exactly when you'll get paid. Spots hidden Net-60 or Net-90 clauses." },
                    { title: "IP Rights Analysis", desc: "Understand who owns the work. Checks if rights transfer before or after payment." },
                    { title: "Exclusivity Detection", desc: "Avoid restrictions on future clients. Flags broad non-compete clauses." },
                    { title: "Kill Fee Analysis", desc: "Spot weak cancellation terms. Ensures you're compensated if a project dies." },
                    { title: "Plain-English Summaries", desc: "No legal jargon. Get straightforward explanations of complex clauses." },
                    { title: "Risk Scoring", desc: "Instant contract risk assessment. Color-coded severity scores at a glance." }
                  ].map((feat, idx) => (
                    <div key={idx} className="bg-muted/50 backdrop-blur-sm border border-border p-8 rounded-2xl hover:bg-muted hover:-translate-y-1 transition-all duration-500 ease-out">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 border border-primary/20">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 7. How It Works */}
            <section id="how-it-works" className="py-24 bg-muted border-y border-border">
              <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-16">Review Any Contract In 3 Steps</h2>
                <div className="grid md:grid-cols-3 gap-12 relative">
                  <div className="hidden md:block absolute top-1/4 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-[#22222a] to-transparent"></div>
                  {[
                    { step: "1", title: "Upload PDF", desc: "Drag and drop your contract." },
                    { step: "2", title: "Vera Scans It", desc: "AI analyzes every clause." },
                    { step: "3", title: "Get Your Summary", desc: "Receive a one-page risk report." }
                  ].map((s, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-card border border-primary/30 text-primary flex items-center justify-center text-2xl font-bold mb-6">
                        {s.step}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                      <p className="text-muted-foreground">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 8. Example Report Section */}
            <section className="py-24">
              <div className="max-w-4xl mx-auto px-4 sm:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">See Exactly What You'll Receive</h2>
                  <p className="text-lg text-muted-foreground">Clear, actionable advice to help you negotiate better terms.</p>
                </div>
                <div className="space-y-6">
                  <div className="bg-card border border-border p-6 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 px-2.5 py-1 bg-red-500/10 border border-red-500/30 rounded text-xs font-bold text-red-400 tracking-wider uppercase">High Risk</div>
                      <div>
                        <p className="text-foreground font-medium mb-2">Payment delayed for up to 90 days.</p>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                          <p className="text-sm text-emerald-300"><span className="font-bold text-emerald-400">Recommended:</span> Request Net-30 or Net-15 terms.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card border border-border p-6 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-xs font-bold text-amber-400 tracking-wider uppercase">Medium Risk</div>
                      <div>
                        <p className="text-foreground font-medium mb-2">Client retains perpetual IP rights.</p>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                          <p className="text-sm text-emerald-300"><span className="font-bold text-emerald-400">Recommended:</span> Limit ownership transfer upon full payment.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 9. Comparison Table */}
            <section className="py-24 bg-muted border-y border-border">
              <div className="max-w-4xl mx-auto px-4 sm:px-8">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Why Not Just Use GPT?</h2>
                <div className="border border-border rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-2 bg-card border-b border-border p-6">
                    <div className="font-bold text-lg text-muted-foreground">Generic AI</div>
                    <div className="font-bold text-lg text-primary flex items-center gap-2">Vera <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></div>
                  </div>
                  {[
                    ["General-purpose responses", "Contract-focused analysis"],
                    ["May miss legal red flags", "Trained specifically for contract review"],
                    ["Inconsistent outputs", "Structured, color-coded risk reports"],
                    ["Requires prompt engineering", "Upload PDF and scan instantly"]
                  ].map((row, idx) => (
                    <div key={idx} className="grid grid-cols-2 p-6 border-b border-border last:border-0 bg-muted">
                      <div className="text-muted-foreground font-medium flex items-center gap-3">
                        <svg className="w-5 h-5 text-red-400/50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        {row[0]}
                      </div>
                      <div className="text-foreground font-medium flex items-center gap-3">
                        <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        {row[1]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 10. Security Section */}
            <section className="py-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-16">Your Contracts Stay Private</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                    { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", text: "Bank-level encryption" },
                    { icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4", text: "Secure cloud storage" },
                    { icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16", text: "Files automatically deleted" },
                    { icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636", text: "Never used for AI training" }
                  ].map((sec, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-muted/50 border border-border flex items-center justify-center mb-4 text-muted-foreground">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={sec.icon} /></svg>
                      </div>
                      <p className="text-muted-foreground font-medium text-sm">{sec.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 11. Pricing Section */}
            <section id="pricing" className="py-24 bg-muted border-y border-border">
              <div className="max-w-4xl mx-auto px-4 sm:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Free</h2>
                  <p className="text-lg text-muted-foreground">1 free scan included. No credit card required.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="bg-card border border-border rounded-3xl p-8 text-center hover:border-zinc-600 transition-all duration-500 ease-out">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Per Scan</p>
                    <div className="text-5xl font-bold mb-4">$5</div>
                    <p className="text-muted-foreground text-sm mb-8">One contract, one fee</p>
                    <ul className="text-left space-y-4 mb-8">
                      <li className="flex items-center gap-3 text-sm text-muted-foreground"><svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>1 Full PDF Scan (up to 30 pages)</li>
                      <li className="flex items-center gap-3 text-sm text-muted-foreground"><svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>1-Page Plain English Summary</li>
                      <li className="flex items-center gap-3 text-sm text-muted-foreground"><svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Highlights Red Flags & Toxic Clauses</li>
                      <li className="flex items-center gap-3 text-sm text-muted-foreground"><svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Secure Checkout</li>
                    </ul>
                    <Link href="/login" className="inline-block w-full py-3.5 rounded-xl border border-border text-sm font-bold hover:border-border hover:bg-muted/50 transition-all duration-500 ease-out">Get started</Link>
                  </div>
                  <div className="bg-card border border-primary/50 rounded-3xl p-8 text-center hover:border-primary transition-all duration-500 ease-out relative">
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>Best Value
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 mt-2">Pro</p>
                    <div className="text-5xl font-bold mb-2">$10<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                    <p className="text-muted-foreground text-sm mb-8">Unlimited scans</p>
                    <ul className="text-left space-y-4 mb-8">
                      <li className="flex items-center gap-3 text-sm text-muted-foreground"><svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Unlimited Document Scans</li>
                      <li className="flex items-center gap-3 text-sm text-muted-foreground"><svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Export Summaries to PDF</li>
                      <li className="flex items-center gap-3 text-sm text-muted-foreground"><svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Upload Multi-Document Portfolios</li>
                      <li className="flex items-center gap-3 text-sm text-muted-foreground"><svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Priority Email Support</li>
                    </ul>
                    <a href="#hero" className="inline-block w-full py-3.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover hover:-translate-y-0.5 transition-all duration-500 ease-out">Get started free</a>
                  </div>
                </div>
              </div>
            </section>

            {/* 12. Final CTA Section */}
            <section className="py-20 relative overflow-hidden">
              <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-8">Stop Guessing What's Hidden In Your Contract</h2>
                <a href="#hero" className="inline-block px-10 py-5 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary-hover hover:-translate-y-1 transition-all duration-500 ease-out mb-6">
                  Scan Contract Free
                </a>
                <p className="text-muted-foreground font-medium">Get your first scan free. No Credit Card Required.</p>
              </div>
            </section>

            {/* 13. FAQ Section */}
            <section id="faq" className="py-24">
              <div className="max-w-3xl mx-auto px-4 sm:px-8">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {[
                    { q: "Is this legal advice?", a: "No. Vera identifies risks and explains clauses but does not replace a lawyer." },
                    { q: "What contract types are supported?", a: "Freelance agreements, consulting contracts, service agreements, NDAs, agency agreements, and more." },
                    { q: "How accurate is Vera?", a: "Vera focuses specifically on common contract red flags and risk patterns." },
                    { q: "Are my contracts stored?", a: "No. Contracts are encrypted and automatically deleted after processing." },
                    { q: "Can I upload large contracts?", a: "Yes, up to 30 pages on the current plan." },
                    { q: "Can agencies use Vera?", a: "Yes. The Pro plan includes unlimited scans." }
                  ].map((faq, idx) => (
                    <details key={idx} className="group bg-card border border-border rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-lg text-foreground hover:bg-muted transition-colors duration-500 ease-out">
                        {faq.q}
                        <span className="ml-4 flex-shrink-0 text-muted-foreground group-open:rotate-180 transition-transform duration-500 ease-out">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </span>
                      </summary>
                      <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                        {faq.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}