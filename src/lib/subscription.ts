export function checkIsPro(dbUser: any): boolean {
  if (!dbUser) return false;
  
  if (dbUser.subscription_status === "active") {
    return true;
  }
  
  if (dbUser.subscription_status === "cancelled" && dbUser.subscription_ends_at) {
    const endsAt = new Date(dbUser.subscription_ends_at);
    if (endsAt > new Date()) {
      return true;
    }
  }
  
  return false;
}
