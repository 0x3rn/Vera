"use client";

import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Inquiry");
  const [message, setMessage] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState(""); // Honeypot
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", text: "" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: `${firstName} ${lastName}`, 
          email, 
          message: `[${subject}] ${message}`,
          websiteUrl,
          recaptchaToken: "dev-bypass" // Simplified since recaptcha isn't wired
        }),
      });

      if (res.ok) {
        setStatus({ type: "success", text: "Message sent successfully!" });
        setFirstName("");
        setLastName("");
        setEmail("");
        setMessage("");
        setWebsiteUrl("");
      } else {
        const data = await res.json();
        setStatus({ type: "error", text: data.error || "Failed to send message." });
      }
    } catch (err) {
      setStatus({ type: "error", text: "An error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Navigation */}
      <nav className="w-full bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 h-[70px] flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Vera<span className="text-primary">.</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="flex-grow pt-20 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight text-foreground">Contact Us</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Have questions about the Vera Risk Engine™, need help with an analysis, or want to discuss enterprise pricing? We're here to help.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-12">
            {/* Contact Form */}
            <div className="md:col-span-3 bg-card border border-border p-8 rounded-3xl shadow-sm">
              {status.text && (
                <div className={`p-4 rounded-lg mb-6 ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  {status.text}
                </div>
              )}
              <form className="space-y-6" onSubmit={handleSubmit}>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium text-foreground">First Name</label>
                    <input 
                      type="text" 
                      id="firstName" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium text-foreground">Last Name</label>
                    <input 
                      type="text" 
                      id="lastName" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">Work Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                    placeholder="john@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium text-foreground">Subject</label>
                  <select 
                    id="subject" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none"
                  >
                    <option>General Inquiry</option>
                    <option>Technical Support</option>
                    <option>Billing Question</option>
                    <option>Enterprise Sales</option>
                    <option>Legal / Privacy</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-foreground">Message</label>
                  <textarea 
                    id="message" 
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>

            {/* Direct Contact Info */}
            <div className="md:col-span-2 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Direct Email</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <div>
                      <p className="text-sm font-medium text-foreground">Support & General</p>
                      <a href="mailto:support@verahq.xyz" className="text-sm text-muted-foreground hover:text-primary transition-colors">support@verahq.xyz</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <div>
                      <p className="text-sm font-medium text-foreground">Legal & Privacy</p>
                      <a href="mailto:legal@verahq.xyz" className="text-sm text-muted-foreground hover:text-primary transition-colors">legal@verahq.xyz</a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
                <h4 className="font-bold text-primary mb-2">Response Times</h4>
                <p className="text-sm text-muted-foreground">We aim to respond to all inquiries within 24 hours during standard business days (Mon-Fri, EST).</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground bg-background">
        <p>© {new Date().getFullYear()} Vera Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}