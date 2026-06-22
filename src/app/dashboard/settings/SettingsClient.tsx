"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase/client";
import { updateEmail, updatePassword } from "firebase/auth";

export default function SettingsClient({ userEmail }: { userEmail: string }) {
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !auth.currentUser) return;
    setIsUpdating(true);
    setEmailStatus("");
    
    try {
      await updateEmail(auth.currentUser, newEmail);
      setEmailStatus("Email successfully updated.");
      setNewEmail("");
    } catch (error: any) {
      setEmailStatus(`Error: ${error.message}`);
    }
    setIsUpdating(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !auth.currentUser) return;
    if (newPassword.length < 6) {
      setPasswordStatus("Error: Password must be at least 6 characters.");
      return;
    }
    setIsUpdating(true);
    setPasswordStatus("");
    
    try {
      await updatePassword(auth.currentUser, newPassword);
      setPasswordStatus("Password successfully updated.");
      setNewPassword("");
    } catch (error: any) {
      setPasswordStatus(`Error: ${error.message}`);
    }
    setIsUpdating(false);
  };

  return (
    <div className="space-y-10">
      {/* Change Email */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Change Email Address</h3>
        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">New Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email"
              className="w-full px-4 py-2.5 bg-[#0a0a0e] border border-[#22222a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isUpdating || !newEmail}
            className="px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Email
          </button>
          {emailStatus && (
            <p className={`text-sm ${emailStatus.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
              {emailStatus}
            </p>
          )}
        </form>
      </div>

      <div className="h-px bg-[#22222a] w-full" />

      {/* Change Password */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Change Password</h3>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 6 characters)"
              className="w-full px-4 py-2.5 bg-[#0a0a0e] border border-[#22222a] rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isUpdating || !newPassword}
            className="px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Password
          </button>
          {passwordStatus && (
            <p className={`text-sm ${passwordStatus.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
              {passwordStatus}
            </p>
          )}
        </form>
      </div>

      <div className="h-px bg-[#22222a] w-full" />

      {/* 2FA Toggle (Mock) */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication</h3>
        <div className="flex items-center justify-between p-4 bg-[#0a0a0e] border border-[#22222a] rounded-xl">
          <div>
            <p className="text-white font-medium">Require 2FA for login</p>
            <p className="text-sm text-zinc-500">Add an extra layer of security to your account.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded">
              Coming Soon
            </span>
            <div className="w-11 h-6 bg-white/5 rounded-full border border-white/10 relative opacity-50 cursor-not-allowed">
              <div className="w-4 h-4 bg-zinc-500 rounded-full absolute top-1 left-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
