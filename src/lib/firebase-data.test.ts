import { describe, expect, it } from "vitest";
import {
  seedFirestoreData,
  getFirestoreRestaurants,
  getFirestoreProducts,
  getFirestoreCategories,
  getFirestoreBanners,
  getFirestoreOrders,
  subscribeToFirestoreOrders,
} from "./firebase-data";

describe("Firebase Data Service", () => {
  it("seedFirestoreData returns safe message when not configured", async () => {
    const res = await seedFirestoreData();
    expect(res.success).toBe(false);
    expect(res.message).toContain("Firebase hali to'liq ulanmagan");
  });

  it("getFirestoreRestaurants returns empty array when not configured", async () => {
    const data = await getFirestoreRestaurants();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  it("getFirestoreProducts returns empty array when not configured", async () => {
    const data = await getFirestoreProducts();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  it("getFirestoreCategories returns empty array when not configured", async () => {
    const data = await getFirestoreCategories();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  it("getFirestoreBanners returns empty array when not configured", async () => {
    const data = await getFirestoreBanners();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  it("getFirestoreOrders returns empty array when not configured", async () => {
    const data = await getFirestoreOrders();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  it("subscribeToFirestoreOrders provides a safe unsubscribe function", () => {
    let received: unknown[] = [];
    const unsub = subscribeToFirestoreOrders((orders) => {
      received = orders;
    });
    expect(typeof unsub).toBe("function");
    expect(received).toEqual([]);
    unsub();
  });
});
