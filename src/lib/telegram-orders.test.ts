import { beforeEach, describe, expect, it, vi } from "vitest";
import { cart, type Order } from "./cart-store";
import { formatTelegramOrder, sendTelegramOrder, submitTelegramOrder } from "./telegram-orders";
import { telegramOrderConfig } from "./telegram-order-config";

const customer = {
  name: "Ali",
  phone: "+998901234567",
  address: "Mustaqillik 12",
  lat: 41.3,
  lng: 69.2,
};
function draft(): Order {
  cart.add("evos-0", 2);
  const order = cart.createOrder(customer);
  if (!order) throw new Error("Expected draft");
  return order;
}
beforeEach(() => {
  cart.reset();
  telegramOrderConfig.orderEndpoint = "";
  telegramOrderConfig.TELEGRAM_BOT_TOKEN = "";
  telegramOrderConfig.TELEGRAM_CHAT_ID = "";
  vi.restoreAllMocks();
});

describe("Telegram order delivery", () => {
  it("includes customer, coordinates, line quantities/prices, total and Tashkent time", () => {
    const order = draft();
    order.createdAt = "2026-11-06T04:30:00Z";
    const message = formatTelegramOrder(order);
    expect(message).toContain("Ali");
    expect(message).toContain("+998901234567");
    expect(message).toContain("Mustaqillik 12");
    expect(message).toContain("41.3, 69.2");
    expect(message).toContain(`${order.lines[0]?.name} — 2 × 32`);
    expect(message.replace(/\s/g, "")).toContain("64000UZS");
    expect(message).toContain("06.11.2026, 09:30");
  });
  it("unconfigured sender fails without clearing the cart or creating an order", async () => {
    const order = draft();
    await expect(submitTelegramOrder(order)).rejects.toThrow("TELEGRAM_NOT_CONFIGURED");
    expect(cart.get().items).toEqual({ "evos-0": 2 });
    expect(cart.get().orders).toHaveLength(0);
    expect(telegramOrderConfig.TELEGRAM_BOT_TOKEN).toBe("");
    expect(telegramOrderConfig.TELEGRAM_CHAT_ID).toBe("");
  });
  it("failed delivery retains the cart and allows a successful retry", async () => {
    const order = draft();
    const sender = vi
      .fn()
      .mockRejectedValueOnce(new Error("failed"))
      .mockResolvedValueOnce(undefined);
    await expect(submitTelegramOrder(order, sender)).rejects.toThrow("failed");
    expect(cart.get().items).toEqual({ "evos-0": 2 });
    expect(cart.get().lastOrder).toBeNull();
    await submitTelegramOrder(order, sender);
    expect(cart.get().items).toEqual({});
    expect(cart.get().lastOrder?.id).toBe(order.id);
    expect(cart.get().orders).toHaveLength(1);
  });
  it("does not clear before a delivery acknowledgement", async () => {
    const order = draft();
    let acknowledge: (() => void) | undefined;
    const pending = submitTelegramOrder(
      order,
      () =>
        new Promise<void>((resolve) => {
          acknowledge = resolve;
        }),
    );
    expect(cart.get().items).toEqual({ "evos-0": 2 });
    if (!acknowledge) throw new Error("Missing acknowledgement");
    acknowledge();
    await pending;
    expect(cart.get().items).toEqual({});
  });
  it("rejects an unsuccessful response instead of treating HTTP 200 as delivered", async () => {
    telegramOrderConfig.orderEndpoint = "/api/orders";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ok: false }));
    await expect(sendTelegramOrder(draft())).rejects.toThrow("TELEGRAM_SEND_FAILED");
    expect(cart.get().items).toEqual({ "evos-0": 2 });
  });
});
