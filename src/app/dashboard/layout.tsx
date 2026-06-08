import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "Dashboard | Vera",
  description: "Manage your contracts and scans.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch the user from the DB to get their subscription status
  let dbUser = await prisma.user.findUnique({
    where: { email: session.user.email || "" },
  });

  // If user doesn't exist in DB yet, upsert them
  if (!dbUser && session.user.email) {
    dbUser = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: {
        id: session.user.id,
        email: session.user.email,
        free_scans_used: 0,
      },
    });
  }

  const isPro = dbUser?.subscription_status === "active";

  return (
    <div className="flex min-h-screen bg-[#070709] lg:flex-row flex-col">
      <Sidebar userEmail={session.user.email || ""} isPro={isPro} />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
