import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/SettingsForm";

export const metadata = {
  title: "Settings | Vera",
};

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Profile Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Update your email and password.
        </p>
      </div>

      <SettingsForm />
    </div>
  );
}
