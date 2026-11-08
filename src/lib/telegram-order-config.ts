/**
 * Telegram bot sozlamalari — .env faylidan o'qiladi.
 *
 * Loyiha papkasida .env fayl yarating:
 *   VITE_TELEGRAM_BOT_TOKEN=7xxxxxxxxx:AAF...
 *   VITE_TELEGRAM_CHAT_ID=-100xxxxxxxxx
 *
 * ⚠️  VITE_ prefiksli o'zgaruvchilar browser bundlega tushadi.
 *     Demo/hackathon uchun yaxshi, real production uchun server endpoint kerak.
 */
export const telegramOrderConfig: {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  orderEndpoint: string;
} = {
  TELEGRAM_BOT_TOKEN: (import.meta.env["VITE_TELEGRAM_BOT_TOKEN"] as string) ?? "",
  TELEGRAM_CHAT_ID: (import.meta.env["VITE_TELEGRAM_CHAT_ID"] as string) ?? "",
  // Server endpoint bo'lsa shu yerga yozing, bo'lmasa bo'sh qoldiring
  orderEndpoint: "",
};
