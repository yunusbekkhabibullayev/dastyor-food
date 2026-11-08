# Telegram order delivery — prepared, not connected

This project remains frontend-only. No bot, backend, database, or Telegram credentials are configured.

- `src/lib/telegram-order-config.ts` contains the requested empty `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` placeholders.
- **Never fill the bot token into this source file.** Anything imported by browser code is public. The token must later be stored securely on a trusted server, not in `VITE_*`, localStorage, or a committed file.
- `orderEndpoint` is blank. Until a trusted same-origin server is connected, checkout explicitly reports that sending is not configured and keeps the cart. It does not pretend to send to Telegram.
- `src/lib/telegram-orders.ts` prepares the requested message: customer name/phone, address, optional coordinates, items with quantity and unit price, delivery fee, total, notes and Asia/Tashkent time. Coordinates work with any map source.

## Future server contract

When secure sending is approved, connect a same-origin `/api/…` endpoint. It must validate input, calculate prices from authoritative menu data, securely call Telegram `sendMessage` with plain text from `formatTelegramOrder`, and return `{ "ok": true }` **only after Telegram confirms delivery**. Enforce idempotency using the supplied `Idempotency-Key` (order ID). Authentication/abuse protection and durable idempotency must be addressed before production use; none is supplied by the current placeholder.

The browser submits `{ order }` and waits for acknowledgement. Failures preserve the cart and allow retry; unchanged retries retain the same order ID. Success saves the local order, clears the cart and opens the existing order-success screen. Automated tests inject a sender and browser tests simulate the future server response; neither test sends a real Telegram message.
