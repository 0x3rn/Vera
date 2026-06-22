"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/client";
import { ThemeToggle } from "./ThemeToggle";

export default function Sidebar({ userEmail, isPro }: { userEmail: string; isPro: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await auth.signOut();
      await fetch("/api/auth/session/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    }
    router.push("/login");
  };

  const navLinks = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      )
    },
    {
      name: "New Scan",
      href: "/dashboard/scan",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      name: "Risk Library",
      href: "/dashboard/library",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      )
    },
    {
      name: "Billing",
      href: "/dashboard/billing",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      )
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      )
    }
  ];

  // Close mobile menu when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Top Nav */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-border bg-background">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">
          Vera<span className="text-primary">.</span>
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 -mr-2 text-foreground hover:text-muted-foreground"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Sidebar (Desktop & Mobile Overlay) */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-muted border-r border-border transform transition-transform duration-300 ease-in-out flex flex-col
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:h-screen
      `}>
        {/* Logo (Desktop) */}
        <div className="hidden lg:flex px-8 py-8">
          <Link href="/dashboard" className="text-2xl font-bold tracking-tight">
            Vera<span className="text-primary">.</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-8 lg:py-2 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  if (link.name === "New Scan" && pathname === "/dashboard/scan") {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('reset-scanner'));
                  }
                }}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                  ${isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-foreground hover:bg-muted/50 hover:text-primary"
                  }
                `}
              >
                <div className={isActive ? "text-primary" : "text-foreground"}>
                  {link.icon}
                </div>
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Area */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 text-primary flex items-center justify-center font-bold uppercase text-sm shrink-0">
              {userEmail.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">{userEmail}</p>
              <p className="text-xs text-muted-foreground">{isPro ? "Pro Plan" : "Free Trial"}</p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
          
          <div className="mt-4 flex justify-between items-center px-2">
            <span className="text-xs font-medium text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
