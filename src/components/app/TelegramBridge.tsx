import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

type Insets = { top?: number; bottom?: number; left?: number; right?: number };
type TelegramApp = {
  initData?: string;
  colorScheme?: string;
  viewportStableHeight?: number;
  safeAreaInset?: Insets;
  contentSafeAreaInset?: Insets;
  ready: () => void;
  expand: () => void;
  onEvent: (event: string, handler: () => void) => void;
  offEvent: (event: string, handler: () => void) => void;
  BackButton: { show: () => void; hide: () => void };
};
declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramApp };
  }
}

// Only presentation hints are read. Telegram identity is never used or trusted.
export function TelegramBridge() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  useEffect(() => {
    let disposed = false;
    let teardown = () => {};
    const initialize = () => {
      const app = window.Telegram?.WebApp;
      if (disposed || !app?.initData) return; // ordinary browser fallback
      const root = document.documentElement;
      const sync = () => {
        root.dataset["telegramTheme"] = app.colorScheme ?? "light";
        if (app.viewportStableHeight && app.viewportStableHeight > 0) {
          root.style.setProperty("--app-viewport-height", `${app.viewportStableHeight}px`);
        }
        for (const edge of ["top", "bottom", "left", "right"] as const) {
          const inset = (app.safeAreaInset?.[edge] ?? 0) + (app.contentSafeAreaInset?.[edge] ?? 0);
          root.style.setProperty(`--app-safe-${edge}`, `${Math.max(0, inset)}px`);
        }
      };
      const back = () => {
        // Close a product sheet first rather than abandoning its menu.
        const close = document.querySelector<HTMLButtonElement>(
          '[role="dialog"] [data-sheet-close]',
        );
        if (close) {
          close.click();
          return;
        }
        if (pathname === "/checkout") void navigate({ to: "/cart" });
        else if (pathname.startsWith("/restaurants/")) void navigate({ to: "/restaurants" });
        else if (pathname.startsWith("/orders/")) void navigate({ to: "/orders" });
        else if (pathname === "/orders" || pathname === "/order-success")
          void navigate({ to: "/profile" });
        else void navigate({ to: "/home" });
      };
      const events = [
        "viewportChanged",
        "themeChanged",
        "safeAreaChanged",
        "contentSafeAreaChanged",
      ];
      sync();
      app.ready();
      app.expand();
      if (pathname === "/" || pathname === "/home") app.BackButton.hide();
      else app.BackButton.show();
      for (const event of events) app.onEvent(event, sync);
      app.onEvent("backButtonClicked", back);
      teardown = () => {
        for (const event of events) app.offEvent(event, sync);
        app.offEvent("backButtonClicked", back);
        app.BackButton.hide();
      };
    };
    let script = document.querySelector<HTMLScriptElement>("script[data-telegram-sdk]");
    if (window.Telegram?.WebApp) initialize();
    else {
      if (!script) {
        script = document.createElement("script");
        script.src = "https://telegram.org/js/telegram-web-app.js";
        script.async = true;
        script.dataset["telegramSdk"] = "true";
        document.head.appendChild(script);
      }
      script.addEventListener("load", initialize);
    }
    return () => {
      disposed = true;
      script?.removeEventListener("load", initialize);
      teardown();
    };
  }, [pathname, navigate]);
  return null;
}
