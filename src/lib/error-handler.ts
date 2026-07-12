export function formatErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred.";

  let message = typeof error === 'string' ? error : (error.message || String(error));

  // Network / Timeout errors
  if (message.includes("network") || message.includes("Failed to fetch") || (error.name === "TypeError" && message.includes("fetch"))) {
    return "Error: Unable to connect to the server. Please check your internet connection or try again later.";
  }
  
  if (message.includes("timeout") || message.includes("timed out")) {
    return "Error: The request timed out. The provider might be experiencing downtime.";
  }

  // Firebase Auth specific errors
  if (message.includes("auth/operation-not-allowed") && message.includes("verify the new email")) {
    return "Error: For security reasons, you must use the verify-before-update method for emails. Please contact support if this persists.";
  }
  if (message.includes("auth/operation-not-allowed")) {
    return "Error: This operation is not allowed. Please contact support.";
  }
  if (message.includes("auth/requires-recent-login")) {
    return "Error: For security reasons, please log out and log back in before making this change.";
  }
  if (message.includes("auth/popup-closed-by-user") || message.includes("pop-up closed by the user")) {
    return "Error: The sign-in popup was closed before completion. Please try again.";
  }
  if (message.includes("auth/user-not-found") || message.includes("auth/wrong-password") || message.includes("auth/invalid-credential")) {
    return "Error: Invalid email or password.";
  }
  if (message.includes("auth/email-already-in-use")) {
    return "Error: An account with this email already exists.";
  }
  if (message.includes("auth/weak-password")) {
    return "Error: Password is too weak. Please use a stronger password.";
  }
  if (message.includes("auth/network-request-failed")) {
    return "Error: Network request failed. Please check your connection.";
  }
  if (message.includes("auth/too-many-requests")) {
    return "Error: Too many attempts. Please try again later.";
  }

  // General Firebase error stripping
  if (message.startsWith("Firebase: ")) {
    message = message.replace(/^Firebase:\s*/, "");
    // Remove the trailing error code like (auth/...)
    message = message.replace(/\s*\(auth\/[a-z0-9-]+\)\.?$/, "");
    return `Error: ${message}`;
  }

  // Allow LemonSqueezy errors through transparently
  if (message.toLowerCase().includes("lemonsqueezy")) {
    return message;
  }

  // Fallback prefix
  if (!message.toLowerCase().startsWith("error")) {
    return `Error: ${message}`;
  }

  return message;
}
