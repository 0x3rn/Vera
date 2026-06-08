import { createServerSupabase } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BillingPlan from "@/components/BillingPlan";

export const metadata = {
  title: "Billing | Vera",
};

export default async function BillingPage() {
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

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Billing &amp; Plan</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Manage your subscription and billing details.
        </p>
      </div>

      <BillingPlan isPro={isPro} />
    </div>
  );
}
