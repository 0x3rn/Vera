import { createServerSupabase } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ScanDropzone from "@/components/ScanDropzone";

export const metadata = {
  title: "New Scan | Vera",
};

export default async function ScanPage() {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email || "" },
  });

  if (!dbUser) {
    redirect("/login");
  }

  const isPro = dbUser.subscription_status === "active";
  const freeScansLeft = Math.max(0, 2 - dbUser.free_scans_used);

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">New Scan</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Upload a PDF or paste text to detect risks.
        </p>
      </div>

      <ScanDropzone isPro={isPro} freeScansLeft={freeScansLeft} />
    </div>
  );
}
