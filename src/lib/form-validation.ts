import { z } from "zod";
import { locationSchema } from "./profile-settings";

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
