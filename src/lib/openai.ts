import OpenAI from "openai";

let client: OpenAI | null = null;

export function getDeepSeek(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com/v1",
    });
  }
  return client;
}
