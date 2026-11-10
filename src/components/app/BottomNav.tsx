import { Link, useHydrated } from "@tanstack/react-router";
import { Home, ShoppingBag, Heart, User, Gamepad2 } from "lucide-react";
import { cartCount, useCart } from "@/lib/cart-store";

export const bottomNavItems = [
  { to: "/home", label: "Bosh sahifa", icon: Home },
  { to: "/favorites", label: "Sevimlilar", icon: Heart },
  { to: "/game", label: "O'yin", icon: Gamepad2, isSpecial: true },
  { to: "/cart", label: "Savat", icon: ShoppingBag },
  { to: "/profile", label: "Profil", icon: User },
] as const;

export function BottomNav() {
  const s = useCart();
  const hydrated = useHydrated();
  const count = hydrated && s.ready ? cartCount(s) : 0;
  return (
    <nav
      aria-label="Asosiy menyu"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/80 backdrop-blur-xl"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 items-end">
        {bottomNavItems.map(({ to, label, icon: Icon, ...rest }) => {
          const isGame = "isSpecial" in rest && rest.isSpecial;

          if (isGame) {
            return (
              <li key={to} className="flex justify-center pb-2">
                <Link
                  to={to}
                  className="group relative -top-3 flex flex-col items-center"
                  aria-label="O'yin o'ynash va sovg'alar yutish"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/35 ring-4 ring-background transition-transform duration-200 active:scale-95 group-hover:scale-105">
                    <Icon className="h-6 w-6 stroke-[2.3]" />
                  </div>
                  <span className="mt-1 text-[10px] font-bold tracking-tight text-orange-500">
                    {label}
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={to}>
              <Link
                to={to}
                className="flex flex-col items-center gap-1 py-2 text-[11px] font-semibold text-muted-foreground transition-colors"
                activeProps={{ className: "text-primary" }}
                aria-label={to === "/cart" && count > 0 ? `Savat, ${count} ta taom` : label}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                  {to === "/cart" && count > 0 && (
                    <span
                      aria-hidden="true"
                      data-testid="cart-nav-badge"
                      className="absolute -right-3 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground"
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell mx-auto max-w-md bg-background">
      {children}
      <BottomNav />
    </div>
  );
}
