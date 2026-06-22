import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
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
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { uid, email, emailVerified, dbUser } = user;

  if (!emailVerified) {
    redirect("/verify-email");
  }

  let userData = dbUser;

  // If user doesn't exist in DB yet, create them
  if (!userData) {
    const newUserData = {
      email: email,
      free_scans_used: 0,
      subscription_status: "inactive",
      created_at: new Date().toISOString(),
    };
    await adminDb.collection("users").doc(uid).set(newUserData);
    userData = { id: uid, ...newUserData };
  }

  const isPro = userData?.subscription_status === "active";

  return (
    <div className="flex min-h-screen bg-[#070709] lg:flex-row flex-col">
      <Sidebar userEmail={email || ""} isPro={isPro} />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
