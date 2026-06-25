import type { Metadata } from "next";
import {GoogleAnalytics} from '@next/third-parties/google';
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { ThemeProvider } from "@/components/ThemeProvider";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Vera | Legal Document Risk Engine",
  description:
    "Lawyers cost $400/hr. Vera scans contracts, Terms of Service, and agreements in seconds, outputting a plain-English summary of hidden traps and toxic clauses.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans antialiased overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextTopLoader color="#6366f1" showSpinner={false} />
          <PageTransition>
            {children}
          </PageTransition>
        </ThemeProvider>
      </body>
      {/* Google Analytics */}
      <GoogleAnalytics gaId="G-5Z8JKH4TNQ" />
    </html>
  );
}
