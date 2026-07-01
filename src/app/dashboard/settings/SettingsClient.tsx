"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword } from "firebase/auth";
import { Spinner } from "@/components/Spinner";

export default function SettingsClient({ 
  userEmail,
  initialFirstName,
  initialLastName
}: { 
  userEmail: string,
  initialFirstName: string,
  initialLastName: string
}) {
  const router = useRouter();
  
  // Profile state
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [profileStatus, setProfileStatus] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Email state
  const [newEmail, setNewEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [passwordCurrentPassword, setPasswordCurrentPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) return;
    setIsUpdatingProfile(true);
    setProfileStatus("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update profile");
      
      setProfileStatus("Profile successfully updated.");
      router.refresh(); 
    } catch (error: any) {
      setProfileStatus(`Error: ${error.message}`);
    }
    setIsUpdatingProfile(false);
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !emailCurrentPassword) return;
    
    const user = auth.currentUser;
    if (!user || !user.email) return;

    setIsUpdatingEmail(true);
    setEmailStatus("");

    try {
      // 1. Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, emailCurrentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Update email
      await updateEmail(user, newEmail);
      setEmailStatus("Email successfully updated.");
      setNewEmail("");
      setEmailCurrentPassword("");
    } catch (error: any) {
      let msg = error.message;
      if (error.code === "auth/wrong-password") msg = "Incorrect current password.";
      setEmailStatus(`Error: ${msg}`);
    }
    setIsUpdatingEmail(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !passwordCurrentPassword) return;
    
    const user = auth.currentUser;
    if (!user || !user.email) return;

    if (newPassword.length < 6) {
      setPasswordStatus("Error: New password must be at least 6 characters.");
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordStatus("");

    try {
      // 1. Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, passwordCurrentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Update password
      await updatePassword(user, newPassword);
      setPasswordStatus("Password successfully updated.");
      setNewPassword("");
      setPasswordCurrentPassword("");
    } catch (error: any) {
      let msg = error.message;
      if (error.code === "auth/wrong-password") msg = "Incorrect current password.";
      setPasswordStatus(`Error: ${msg}`);
    }
    setIsUpdatingPassword(false);
  };

  return (
    <div className="space-y-10">
      {/* Profile Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                maxLength={50}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                maxLength={50}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isUpdatingProfile || !firstName || !lastName}
            className="px-6 py-2.5 rounded-lg bg-primary border border-transparent text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
          >
            {isUpdatingProfile ? <Spinner size="sm" /> : null}
            {isUpdatingProfile ? "Saving..." : "Save Changes"}
          </button>
          {profileStatus && (
            <p className={`text-sm ${profileStatus.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
              {profileStatus}
            </p>
          )}
        </form>
      </div>

      <div className="h-px bg-border w-full" />

      {/* Change Email */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Change Email Address</h3>
        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">New Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Current Password</label>
            <input
              type="password"
              value={emailCurrentPassword}
              onChange={(e) => setEmailCurrentPassword(e.target.value)}
              required
              placeholder="Confirm your current password"
              className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isUpdatingEmail || !newEmail || !emailCurrentPassword}
            className="px-6 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
          >
            {isUpdatingEmail ? <Spinner size="sm" /> : null}
            {isUpdatingEmail ? "Updating..." : "Update Email"}
          </button>
          {emailStatus && (
            <p className={`text-sm ${emailStatus.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
              {emailStatus}
            </p>
          )}
        </form>
      </div>

      <div className="h-px bg-border w-full" />

      {/* Change Password */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Change Password</h3>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Current Password</label>
            <input
              type="password"
              value={passwordCurrentPassword}
              onChange={(e) => setPasswordCurrentPassword(e.target.value)}
              required
              placeholder="Confirm your current password"
              className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isUpdatingPassword || !newPassword || !passwordCurrentPassword}
            className="px-6 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[160px]"
          >
            {isUpdatingPassword ? <Spinner size="sm" /> : null}
            {isUpdatingPassword ? "Updating..." : "Update Password"}
          </button>
          {passwordStatus && (
            <p className={`text-sm ${passwordStatus.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
              {passwordStatus}
            </p>
          )}
        </form>
      </div>

      <div className="h-px bg-border w-full" />

      {/* 2FA Toggle (Mock) */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication</h3>
        <div className="flex items-center justify-between p-4 bg-muted border border-border rounded-xl">
          <div>
            <p className="text-foreground font-medium">Require 2FA for login</p>
            <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded">
              Coming Soon
            </span>
            <div className="w-11 h-6 bg-muted/50 rounded-full border border-border relative opacity-50 cursor-not-allowed">
              <div className="w-4 h-4 bg-zinc-500 rounded-full absolute top-1 left-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
