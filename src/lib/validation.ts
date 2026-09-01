import { z } from "zod";
import { RequestValidationError } from "./http";

const cleanText = (value: string) =>
  value.normalize("NFKC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();

export const nameSchema = z
  .string()
  .transform(cleanText)
  .pipe(z.string().min(1, "Name is required.").max(50, "Name must be 50 characters or fewer."));

export const emailSchema = z
  .string()
  .transform((value) => cleanText(value).toLowerCase())
  .pipe(z.email("Enter a valid email address.").max(254));

export const sessionRequestSchema = z.object({
  idToken: z.string().min(20).max(20_000),
});

export const registrationRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
  firstName: nameSchema,
  lastName: nameSchema,
  recaptchaToken: z.string().max(10_000).default(""),
  websiteUrl: z.string().max(500).default(""),
});

export const contactRequestSchema = z.object({
  name: z.string().transform(cleanText).pipe(z.string().min(1).max(101)),
  email: emailSchema,
  message: z.string().transform(cleanText).pipe(z.string().min(1).max(5_000)),
  recaptchaToken: z.string().max(10_000).default(""),
  websiteUrl: z.string().max(500).default(""),
});

export const profileRequestSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
});

export const checkoutRequestSchema = z.object({
  plan: z.enum(["onetime", "subscription"]),
});

export async function parseJsonRequest<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new RequestValidationError("Request body must be valid JSON.");
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new RequestValidationError(result.error.issues[0]?.message || "Invalid request.");
  }

  return result.data;
}
