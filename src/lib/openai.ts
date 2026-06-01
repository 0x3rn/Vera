import OpenAI from "openai";

let client: OpenAI | null = null;

export function getDeepSeek(): OpenAI {
  if (!client) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey || apiKey === "sk-...") {
      throw new Error(
        "Missing DEEPSEEK_API_KEY. Create a .env file with your DeepSeek API key from https://platform.deepseek.com/api_keys"
      );
    }
    client = new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com/v1",
    });
  }
  return client;
}
