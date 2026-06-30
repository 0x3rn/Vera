"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [profileStatus, setProfileStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) return;
    setIsUpdating(true);
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
      router.refresh(); // refresh to show updated name in dashboard greeting
    } catch (error: any) {
      setProfileStatus(`Error: ${error.message}`);
    }
    setIsUpdating(false);
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
            disabled={isUpdating || !firstName || !lastName}
            className="px-6 py-2.5 rounded-lg bg-primary border border-transparent text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
          {profileStatus && (
            <p className={`text-sm ${profileStatus.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
              {profileStatus}
            </p>
          )}
        </form>
      </div>

      <div className="h-px bg-border w-full" />

      {/* Password & Email Management Info */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Password & Email</h3>
        <div className="p-4 bg-muted border border-border rounded-xl">
          <p className="text-sm text-muted-foreground leading-relaxed">
            To change your email address or password, use the{" "}
            <a 
              href="https://firebase.google.com/docs/auth/web/manage-users" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover underline underline-offset-4"
            >
              Firebase account management
            </a>{" "}
            flow, or sign out and use the "Forgot Password" option on the login page.
          </p>
        </div>
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
