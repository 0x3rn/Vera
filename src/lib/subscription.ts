type SubscriptionUser = {
  subscription_status?: unknown;
  subscription_ends_at?: unknown;
};

export function checkIsPro(dbUser: SubscriptionUser | null | undefined): boolean {
  if (!dbUser) return false;

  if (["active", "on_trial", "past_due", "paused"].includes(String(dbUser.subscription_status))) {
    return true;
  }

  if (dbUser.subscription_status === "cancelled" && typeof dbUser.subscription_ends_at === "string") {
    const endsAt = new Date(dbUser.subscription_ends_at);
    if (endsAt > new Date()) {
      return true;
    }
  }

  return false;
}
