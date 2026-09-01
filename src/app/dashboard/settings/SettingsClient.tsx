"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail, updatePassword } from "firebase/auth";
import { Spinner } from "@/components/Spinner";

export default function SettingsClient({ 
  initialFirstName,
  initialLastName,
  canUsePassword,
}: { 
  initialFirstName: string,
  initialLastName: string,
  canUsePassword: boolean,
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
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") return;
    setIsDeleting(true);
    setDeleteStatus("");
    const response = await fetch("/api/user/account", { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      await auth.signOut();
      window.location.href = "/?account=deleted";
      return;
    }
    setDeleteStatus(data.error || "Account deletion failed.");
    setIsDeleting(false);
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

      // 2. Update email using verify method to support modern Firebase security rules
      await verifyBeforeUpdateEmail(user, newEmail);
      setEmailStatus("A verification link has been sent to your new email. Please check your inbox.");
      setNewEmail("");
      setEmailCurrentPassword("");
    } catch (error: any) {
      let msg = error.message;
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        msg = "Incorrect current password.";
      } else {
        // Strip Firebase prefix if it slipped through
        msg = msg.replace(/^Firebase:\s*/, "").replace(/\s*\(auth\/[a-z0-9-]+\)\.?$/, "");
      }
      setEmailStatus(`Error: ${msg}`);
    }
    setIsUpdatingEmail(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !passwordCurrentPassword) return;
    
    const user = auth.currentUser;
    if (!user || !user.email) return;

    if (newPassword.length < 8) {
      setPasswordStatus("Error: New password must be at least 8 characters.");
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
      setPasswordStatus("Password successfully updated. Signing out...");
      
      // Sign out since changing password invalidates all existing sessions/tokens
      await auth.signOut();
      await fetch("/api/auth/session/logout", { method: "POST" });
      router.push("/login?message=Password+updated.+Please+log+in+again.");
      return;
    } catch (error: any) {
      let msg = error.message;
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        msg = "Incorrect current password.";
      } else {
        // Strip Firebase prefix if it slipped through
        msg = msg.replace(/^Firebase:\s*/, "").replace(/\s*\(auth\/[a-z0-9-]+\)\.?$/, "");
      }
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
              <label htmlFor="settings-first-name" className="block text-sm font-medium text-muted-foreground mb-1.5">First Name</label>
              <input
                id="settings-first-name"
                autoComplete="given-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                maxLength={50}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="settings-last-name" className="block text-sm font-medium text-muted-foreground mb-1.5">Last Name</label>
              <input
                id="settings-last-name"
                autoComplete="family-name"
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

      {canUsePassword && (<>
      {/* Change Email */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Change Email Address</h3>
        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <div>
            <label htmlFor="settings-new-email" className="block text-sm font-medium text-muted-foreground mb-1.5">New Email</label>
            <input
              id="settings-new-email"
              autoComplete="email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label htmlFor="settings-email-password" className="block text-sm font-medium text-muted-foreground mb-1.5">Current Password</label>
            <input
              id="settings-email-password"
              autoComplete="current-password"
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
            <label htmlFor="settings-new-password" className="block text-sm font-medium text-muted-foreground mb-1.5">New Password</label>
            <input
              id="settings-new-password"
              autoComplete="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label htmlFor="settings-current-password" className="block text-sm font-medium text-muted-foreground mb-1.5">Current Password</label>
            <input
              id="settings-current-password"
              autoComplete="current-password"
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
      </>)}

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

      <div className="h-px bg-border w-full" />
      <div>
        <h3 className="text-lg font-semibold text-red-500 mb-2">Delete account</h3>
        <p className="text-sm text-muted-foreground mb-4">Permanently deletes your profile and saved reports. Active subscriptions must be cancelled first.</p>
        <label htmlFor="delete-confirmation" className="block text-sm font-medium text-muted-foreground mb-1.5">Type DELETE to confirm</label>
        <input id="delete-confirmation" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete="off" className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50" />
        <button type="button" onClick={handleDeleteAccount} disabled={deleteConfirmation !== "DELETE" || isDeleting} className="mt-3 rounded-lg border border-red-500/40 px-5 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/10 disabled:opacity-50">
          {isDeleting ? "Deleting…" : "Delete my account"}
        </button>
        {deleteStatus && <p className="mt-3 text-sm text-red-500">{deleteStatus}</p>}
      </div>
    </div>
  );
}
