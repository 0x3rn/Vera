"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function SettingsForm() {
  const supabase = createClient();
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [accountMsg, setAccountMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMsg(null);
    if (newPassword.length < 8) {
      setAccountMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    setSavingAccount(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setAccountMsg({ type: "error", text: error.message });
    } else {
      setAccountMsg({ type: "success", text: "Password updated successfully." });
      setNewPassword("");
    }
    setSavingAccount(false);
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMsg(null);
    if (!newEmail.includes("@")) {
      setAccountMsg({ type: "error", text: "Please enter a valid email address." });
      return;
    }
    setSavingAccount(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setAccountMsg({ type: "error", text: error.message });
    } else {
      setAccountMsg({
        type: "success",
        text: "Check your new email for a confirmation link.",
      });
      setNewEmail("");
    }
    setSavingAccount(false);
  };

  return (
    <div className="max-w-lg space-y-6 animate-in fade-in duration-500">
      {/* Change Password */}
      <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-5 sm:p-8">
        <h2 className="text-lg font-bold mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min. 8 characters)"
            className="w-full px-4 py-3 rounded-lg bg-[#0a0a0e] border border-[#22222a] text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={savingAccount}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {savingAccount ? "Saving..." : "Update password"}
          </button>
        </form>
      </div>

      {/* Change Email */}
      <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-5 sm:p-8">
        <h2 className="text-lg font-bold mb-4">Change Email</h2>
        <form onSubmit={handleChangeEmail} className="space-y-4">
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="New email address"
            className="w-full px-4 py-3 rounded-lg bg-[#0a0a0e] border border-[#22222a] text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
          <p className="text-xs text-zinc-500">
            You will receive a confirmation link at your new email to approve this change.
          </p>
          <button
            type="submit"
            disabled={savingAccount}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {savingAccount ? "Saving..." : "Update email"}
          </button>
        </form>
      </div>

      {/* Account messages */}
      {accountMsg && (
        <div className={`p-4 rounded-lg border ${
          accountMsg.type === "success"
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-red-500/30 bg-red-500/5"
        }`}>
          <p className={`text-sm ${accountMsg.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
            {accountMsg.text}
          </p>
        </div>
      )}
    </div>
  );
}
