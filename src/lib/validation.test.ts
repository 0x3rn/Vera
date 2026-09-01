import { describe, expect, it } from "vitest";
import { checkoutRequestSchema, contactRequestSchema, parseJsonRequest } from "./validation";

describe("request validation", () => {
  it("accepts only known checkout plans", () => {
    expect(checkoutRequestSchema.parse({ plan: "onetime" })).toEqual({ plan: "onetime" });
    expect(() => checkoutRequestSchema.parse({ plan: "enterprise" })).toThrow();
    expect(() => checkoutRequestSchema.parse({ plan: ["onetime"] })).toThrow();
  });

  it("normalizes contact fields and rejects wrong types", () => {
    const result = contactRequestSchema.parse({ name: "  Ada Lovelace  ", email: " ADA@EXAMPLE.COM ", message: " Hello ", recaptchaToken: "token" });
    expect(result.name).toBe("Ada Lovelace");
    expect(result.email).toBe("ada@example.com");
    expect(() => contactRequestSchema.parse({ name: 42, email: "a@example.com", message: "hello" })).toThrow();
  });

  it("returns a controlled error for invalid JSON", async () => {
    const request = new Request("https://example.test", { method: "POST", body: "{" });
    await expect(parseJsonRequest(request, checkoutRequestSchema)).rejects.toThrow("valid JSON");
  });
});
