<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Frontend-only prototype: demo data lives in src/lib/mock-data.ts; cart, favorites and the last demo order live in src/lib/cart-store.ts (in-memory store persisted to localStorage, restored via cart.hydrate() in __root), because there is no backend. Pages reading saved cart state gate on useHydrated() to avoid SSR mismatches.
- Optional Telegram presentation integration lives in TelegramBridge and is initialized only in client effects; shared CSS viewport/inset variables keep web-browser fallback and Telegram layout consistent without using Telegram identity.
- BottomNav reads the shared cart store and gates its quantity badge on hydration, so saved quantities update across pages without SSR mismatches.
- Profile preferences and validated saved addresses use a separate browser-only local store hydrated in the root; settings screens gate persisted reads on hydration to preserve SSR consistency.
- Telegram orders use a prepared draft and a sender adapter; commit/clear only after delivery acknowledgement, because failed or unconfigured delivery must preserve the cart. Keep tokens out of browser code; the empty config reserves a future trusted-server endpoint, not a working Telegram connection.
