import OpenAI from "openai";
import { GoogleAuth } from "google-auth-library";
import { withTimeout } from "./http";

// DEEPSEEK - DISABLED FOR NOW

// export function getDeepSeek() {
//   return new OpenAI({
//     apiKey: process.env.DEEPSEEK_API_KEY,
//     baseURL: "https://api.deepseek.com",
//   });
// }


// GOOGLE VERTEX AI / GEMINI

export async function getGemini() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!projectId) {
    throw new Error("GOOGLE_CLOUD_PROJECT is not configured.");
  }

  if (!credentialsJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured.");
  }

  let credentials: { project_id?: string; client_email?: string; private_key?: string };
  try {
    credentials = JSON.parse(credentialsJson) as typeof credentials;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON must be valid one-line JSON.");
  }
  if (!credentials.project_id || !credentials.client_email || !credentials.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is missing required service-account fields.");
  }
  if (credentials.project_id !== projectId) {
    throw new Error("GOOGLE_CLOUD_PROJECT must match the service account project_id.");
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = await auth.getClient();
  const accessToken = await withTimeout(client.getAccessToken(), 10_000, "Google authentication");

  if (!accessToken.token) {
    throw new Error("Unable to obtain Google Cloud access token.");
  }

  return new OpenAI({
    apiKey: accessToken.token,
    timeout: 45_000,
    maxRetries: 1,
    baseURL:
      `https://aiplatform.googleapis.com/v1/` +
      `projects/${projectId}/locations/global/endpoints/openapi`,
  });
}
