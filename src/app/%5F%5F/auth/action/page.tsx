import type { Metadata } from "next";
import EmailActionClient from "./EmailActionClient";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
};

// %5F escapes Next.js's private-folder convention to expose /__/auth/action.
export default async function EmailActionPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const mode = typeof query.mode === "string" ? query.mode : "";
  const code = typeof query.oobCode === "string" ? query.oobCode : "";
  return <EmailActionClient key={`${mode}:${code}`} mode={mode} code={code} />;
}
