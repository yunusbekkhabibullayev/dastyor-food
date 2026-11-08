import { beforeEach, describe, expect, it } from "vitest";
import { addressSchema, profileSettings } from "./profile-settings";
import { districts } from "./mock-data";

const address = {
  id: "home",
  label: "Uy",
  district: districts[0] ?? "",
  street: "Navoiy",
  house: "12",
  apartment: "3",
};
describe("Local profile settings", () => {
  beforeEach(() => profileSettings.reset());
  it("saves, edits and removes addresses", () => {
    profileSettings.saveAddress(address);
    profileSettings.saveAddress({ ...address, house: "15" });
    expect(profileSettings.get().addresses).toEqual([{ ...address, house: "15" }]);
    profileSettings.removeAddress("home");
    expect(profileSettings.get().addresses).toEqual([]);
    expect(profileSettings.get().defaultAddressId).toBeNull();
  });
  it("persists the selected default address", () => {
    profileSettings.saveAddress(address);
    profileSettings.saveAddress({ ...address, id: "work", label: "Ish" });
    profileSettings.setDefault("work");
    profileSettings.hydrate();
    expect(profileSettings.get().defaultAddressId).toBe("work");
  });
  it("persists notification choices", () => {
    profileSettings.setNotification("orders", false);
    profileSettings.setNotification("offers", true);
    profileSettings.hydrate();
    expect(profileSettings.get().notifications).toEqual({ orders: false, offers: true });
  });
  it("requires street, house and a configured district", () => {
    expect(
      addressSchema.safeParse({ ...address, street: "", house: "", district: "missing" }).success,
    ).toBe(false);
  });
  it("recovers malformed storage and retains Uzbek Latin", () => {
    localStorage.setItem("fastfood-settings-v1", "broken");
    profileSettings.hydrate();
    expect(profileSettings.get().language).toBe("uz");
    expect(profileSettings.get().addresses).toEqual([]);
  });
});
