import { z } from "zod";
import { locationSchema } from "./profile-settings";

/**
 * Format string as Uzbekistan phone number: +998 (90) 123-45-67
 */
export function formatUzPhone(raw: string): string {
  // Extract all digits
  let digits = raw.replace(/\D/g, "");

  // If user pasted or typed with leading 998, keep only following 9 digits
  if (digits.startsWith("998")) {
    digits = digits.slice(3);
  }

  // Limit to 9 digits (local number)
  digits = digits.slice(0, 9);

  if (digits.length === 0) return "+998 ";

  let res = "+998";
  if (digits.length > 0) {
    res += ` (${digits.slice(0, 2)}`;
  }
  if (digits.length >= 2) {
    res += `) ${digits.slice(2, 5)}`;
  }
  if (digits.length >= 5) {
    res += `-${digits.slice(5, 7)}`;
  }
  if (digits.length >= 7) {
    res += `-${digits.slice(7, 9)}`;
  }

  return res;
}

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Ismingizni kiriting").max(60, "Juda uzun"),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .refine((v) => /^(\+?998)?\d{9}$/.test(v), "Telefon raqami noto'g'ri (+998 XX XXX XX XX)"),
});

/** Ordering requires a valid name, phone number and a chosen delivery location. */
export function customerReady(profile: unknown, location: unknown): boolean {
  return profileSchema.safeParse(profile).success && locationSchema.safeParse(location).success;
}
