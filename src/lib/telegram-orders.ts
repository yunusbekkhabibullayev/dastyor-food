import { cart, type Order } from "./cart-store";
import { telegramOrderConfig } from "./telegram-order-config";

export type OrderSender = (order: Order) => Promise<void>;
const amount = (value: number) => `${new Intl.NumberFormat("uz-UZ").format(value)} UZS`;

/** Plain text, so customer input cannot inject Telegram HTML/Markdown. */
export function formatTelegramOrder(order: Order): string {
  const { customer } = order;
  const coordinates =
    customer.lat !== undefined && customer.lng !== undefined
      ? `\n📌 ${customer.lat}, ${customer.lng}\nhttps://maps.google.com/?q=${customer.lat},${customer.lng}`
      : "";
  const time = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tashkent",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(order.createdAt));
  return [
    "🛒 YANGI BUYURTMA",
    `#${order.id}`,
    `👤 Mijoz: ${customer.name}\n📞 Telefon: ${customer.phone}`,
    `📍 Manzil: ${customer.address}${coordinates}`,
    `🍔 Buyurtma:\n${order.lines.map((line) => `• ${line.name} — ${line.qty} × ${amount(line.price)}`).join("\n")}`,
    `🚚 Yetkazib berish: ${amount(order.delivery)}`,
    `💰 Jami: ${amount(order.total)}`,
    ...(customer.notes ? [`📝 Izoh: ${customer.notes}`] : []),
    `🕐 Vaqt: ${time}`,
  ].join("\n\n");
}

/**
 * To'g'ridan-to'g'ri Telegram Bot API ga yuboradi (hackathon/demo rejim).
 * Token VITE_TELEGRAM_BOT_TOKEN va chat VITE_TELEGRAM_CHAT_ID .env da bo'lishi kerak.
 */
export const sendTelegramOrder: OrderSender = async (order) => {
  // 1. Server endpoint bo'lsa — u orqali yubor (xavfsizroq)
  if (
    telegramOrderConfig.orderEndpoint &&
    telegramOrderConfig.orderEndpoint.startsWith("/api/")
  ) {
    const response = await fetch(telegramOrderConfig.orderEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": order.id },
      body: JSON.stringify({ order }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error("TELEGRAM_SEND_FAILED");
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
      throw new Error("TELEGRAM_SEND_FAILED");
    }
    return;
  }

  // 2. To'g'ridan-to'g'ri Telegram API (demo/hackathon rejim)
  if (!telegramOrderConfig.TELEGRAM_BOT_TOKEN || !telegramOrderConfig.TELEGRAM_CHAT_ID) {
    throw new Error("TELEGRAM_NOT_CONFIGURED");
  }

  const text = formatTelegramOrder(order);
  const url = `https://api.telegram.org/bot${telegramOrderConfig.TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: telegramOrderConfig.TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) throw new Error("TELEGRAM_SEND_FAILED");
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
    throw new Error("TELEGRAM_SEND_FAILED");
  }
};

/** Save the order and empty the cart ONLY after the sender confirms delivery. */
export async function submitTelegramOrder(order: Order, sender: OrderSender = sendTelegramOrder) {
  await sender(order);
  cart.commitOrder(order);
}
