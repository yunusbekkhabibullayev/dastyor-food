import { Link, useHydrated } from "@tanstack/react-router";
import { Home, ShoppingBag, Heart, User } from "lucide-react";
import { cartCount, useCart } from "@/lib/cart-store";

export const bottomNavItems = [
  { to: "/home", label: "Bosh sahifa", icon: Home },
  { to: "/favorites", label: "Sevimlilar", icon: Heart },
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
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {bottomNavItems.map(({ to, label, icon: Icon }) => (
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
        ))}
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
