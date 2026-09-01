import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";

import { ThemeProvider } from "@/components/ThemeProvider";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://verahq.xyz"),
  title: { default: "Vera | Contract Risk Analysis", template: "%s | Vera" },
  description:
    "Vera reviews contracts, mortgages, and agreements and produces a structured plain-English risk report.",
  openGraph: {
    type: "website",
    title: "Vera | Contract Risk Analysis",
    description: "Review contracts for risky clauses and get a plain-English report.",
    siteName: "Vera",
  },
  twitter: { card: "summary", title: "Vera | Contract Risk Analysis", description: "Review contracts for risky clauses and get a plain-English report." },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") || undefined;
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans antialiased overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >

          <PageTransition>
            {children}
          </PageTransition>
        </ThemeProvider>
      </body>
    </html>
  );
}
