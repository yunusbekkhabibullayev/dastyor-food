import { useSyncExternalStore } from "react";
import { z } from "zod";
import { districts } from "./mock-data";

export const addressSchema = z
  .object({
    id: z.string(),
    label: z.string().trim().min(1, "Manzil nomini kiriting").max(40),
    district: z.string().refine((v) => districts.includes(v), "Tumanni tanlang"),
    street: z.string().trim().min(2, "Ko'cha nomini kiriting").max(100),
    house: z.string().trim().max(20),
    apartment: z.string().trim().max(20),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  })
  .superRefine((a, ctx) => {
    // A map-picked address (with coordinates) does not need a house number.
    if (a.lat === undefined && !a.house.trim()) {
      ctx.addIssue({ code: "custom", path: ["house"], message: "Uy raqamini kiriting" });
    }
  });
export type SavedAddress = z.infer<typeof addressSchema>;

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  address: z.string().trim().min(3, "Manzilni kiriting").max(200),
});
export type DeliveryLocation = z.infer<typeof locationSchema>;

export const formatAddress = (a: SavedAddress) =>
  `${a.district}, ${a.street}${a.house ? `, ${a.house}-uy` : ""}${a.apartment ? `, ${a.apartment}-xonadon` : ""}`;

const schema = z.object({
  addresses: z.array(addressSchema),
  defaultAddressId: z.string().nullable(),
  notifications: z.object({ orders: z.boolean(), offers: z.boolean() }),
  language: z
    .preprocess((v) => (v === "uz-Latn" ? "uz" : v), z.enum(["uz", "ru", "en"]))
    .catch("uz"),
  location: locationSchema.nullable().default(null),
});
type Settings = z.infer<typeof schema>;
const defaults: Settings = {
  addresses: [],
  defaultAddressId: null,
  notifications: { orders: true, offers: false },
  language: "uz",
  location: null,
};
const key = "fastfood-settings-v1";
let state: Settings = defaults;
const listeners = new Set<() => void>();
function update(next: Settings) {
  state = next;
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((f) => f());
}
export const profileSettings = {
  hydrate() {
    try {
      const parsed = schema.safeParse(JSON.parse(localStorage.getItem(key) ?? "null"));
      state = parsed.success ? parsed.data : defaults;
      if (!state.addresses.some((a) => a.id === state.defaultAddressId))
        state = { ...state, defaultAddressId: state.addresses[0]?.id ?? null };
    } catch {
      state = defaults;
    }
    listeners.forEach((f) => f());
  },
  saveAddress(input: SavedAddress) {
    const address = addressSchema.parse(input);
    update({
      ...state,
      addresses: [...state.addresses.filter((a) => a.id !== address.id), address],
      defaultAddressId: state.defaultAddressId ?? address.id,
    });
  },
  removeAddress(id: string) {
    const addresses = state.addresses.filter((a) => a.id !== id);
    update({
      ...state,
      addresses,
      defaultAddressId:
        state.defaultAddressId === id ? (addresses[0]?.id ?? null) : state.defaultAddressId,
    });
  },
  setDefault(id: string) {
    if (state.addresses.some((a) => a.id === id)) update({ ...state, defaultAddressId: id });
  },
  setLocation(location: DeliveryLocation) {
    update({ ...state, location: locationSchema.parse(location) });
  },
  setNotification(name: "orders" | "offers", enabled: boolean) {
    update({ ...state, notifications: { ...state.notifications, [name]: enabled } });
  },
  setLanguage(language: "uz" | "ru" | "en") {
    update({ ...state, language });
  },
  reset() {
    update(defaults);
  },
  get: () => state,
};
export function useProfileSettings() {
  return useSyncExternalStore(
    (f) => {
      listeners.add(f);
      return () => {
        listeners.delete(f);
      };
    },
    () => state,
    () => defaults,
  );
}
