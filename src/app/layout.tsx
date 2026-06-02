import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Vera | AI Legal Contract Scanner",
  description:
    "Lawyers cost $400/hr. Vera scans contracts in seconds, outputting a plain-English summary of hidden traps, bad payment terms, and toxic clauses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#070709] text-white font-sans antialiased overflow-x-hidden">
        <NextTopLoader
          color="#2563eb"
          height={2}
          showSpinner={false}
          shadow="0 0 6px rgba(37, 99, 235, 0.3)"
        />
        <div className="animate-page-in">{children}</div>
      </body>
    </html>
  );
}
