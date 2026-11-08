import { describe, expect, it } from "vitest";
import { customerReady, profileSchema } from "./form-validation";
import { formatSom } from "./mock-data";

const profile = { name: "Bunyod", phone: "+998 90 123 45 67" };
const location = { lat: 41.31, lng: 69.28, address: "Navoiy ko'chasi, 12" };

describe("frontend form validation", () => {
  it("requires a valid name and phone for the profile", () => {
    expect(profileSchema.safeParse({ name: "", phone: "123" }).success).toBe(false);
    expect(profileSchema.parse(profile).phone).toBe("+998901234567");
  });
  it("allows ordering only with profile details and a delivery location", () => {
    expect(customerReady(profile, location)).toBe(true);
    expect(customerReady({ name: "", phone: "123" }, location)).toBe(false);
    expect(customerReady(profile, null)).toBe(false);
    expect(customerReady(profile, { address: "" })).toBe(false);
  });
  it("accepts a manually entered location without coordinates", () => {
    expect(customerReady(profile, { address: "Tuman markazi, Navoiy 12" })).toBe(true);
  });
  it("formats all prices in UZS", () => {
    expect(formatSom(32000)).toBe("32 000 UZS");
    expect(formatSom(0)).toBe("0 UZS");
  });
});
