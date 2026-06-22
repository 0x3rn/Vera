import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Settings | Vera",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { email, dbUser } = user;

  if (!dbUser) {
    redirect("/login");
  }

  const isPro = dbUser.subscription_status === "active";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Manage your account information and security preferences.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8 items-start">
        {/* Account Information Section */}
        <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-6">Account Information</h2>
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Email Address</p>
              <p className="text-white">{email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Current Plan</p>
              <p className="text-white">{isPro ? "Pro Plan" : "Free Trial"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Member Since</p>
              <p className="text-white">
                {new Date(dbUser.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Security Section (Forms handled by Client Component) */}
        <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-6">Security</h2>
          <SettingsClient userEmail={email || ""} />
        </div>
      </div>
    </div>
  );
}
