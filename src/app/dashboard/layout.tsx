import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import Sidebar from "@/components/Sidebar";
import { checkIsPro } from "@/lib/subscription";

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
    const cookieStore = await cookies();
    if (cookieStore.get("session")) {
      redirect("/login?clear_session=true");
    }
    redirect("/login");
  }

  const { uid, email, emailVerified, dbUser } = user;

  if (!emailVerified) {
    redirect("/verify-email");
  }

  let userData = dbUser;

  // If user doesn't exist in DB yet, create them (e.g. Google OAuth signups)
  if (!userData) {
    const nameParts = (user.displayName || "").split(" ");
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || "";

    const newUserData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      free_scans_used: 0,
      bonus_scans: 0,
      subscription_status: "inactive",
      created_at: new Date().toISOString(),
    };
    await adminDb.collection("users").doc(uid).set(newUserData);
    userData = { id: uid, ...newUserData };
  } else if (email && userData.email !== email) {
    // Keep Firestore email in sync with Firebase Auth
    await adminDb.collection("users").doc(uid).update({ email: email });
    userData.email = email;
  }

  const isPro = checkIsPro(userData);

  return (
    <div className="flex min-h-screen bg-background lg:flex-row flex-col">
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
