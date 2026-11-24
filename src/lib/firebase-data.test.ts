import { describe, expect, it } from "vitest";
import {
  normalizePhone,
  subscribeToFirestoreOrders,
  subscribeToUserOrders,
  subscribeToOrder,
} from "./firebase-data";

describe("Firebase Data Service", () => {
  it("normalizes phone numbers correctly", () => {
    expect(normalizePhone("+998 90 123 45 67")).toBe("+998901234567");
    expect(normalizePhone("998994161110")).toBe("+998994161110");
    expect(normalizePhone("")).toBe("");
  });

  it("subscribeToFirestoreOrders provides a safe unsubscribe function", () => {
    const unsub = subscribeToFirestoreOrders(() => {});
    expect(typeof unsub).toBe("function");
    unsub();
  });

  it("subscribeToUserOrders provides a safe unsubscribe function", () => {
    const unsub = subscribeToUserOrders("+998901234567", () => {});
    expect(typeof unsub).toBe("function");
    unsub();
  });

  it("subscribeToOrder provides a safe unsubscribe function", () => {
    const unsub = subscribeToOrder("FF-123456", () => {});
    expect(typeof unsub).toBe("function");
    unsub();
  });
});
