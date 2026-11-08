import { Button } from "@/components/ui/button";
import { createFileRoute, useHydrated, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingBag, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app/BottomNav";
import { Stepper } from "@/components/app/food";
import { PageHeader } from "@/components/app/PageHeader";
import { cart, cartTotals, useCart } from "@/lib/cart-store";
import { formatDelivery, formatSom, getRestaurant, type Product } from "@/lib/mock-data";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Savat — Dastyor Food" },
      { name: "description", content: "Savatdagi taomlar va umumiy summa." },
      { property: "og:title", content: "Savat — Dastyor Food" },
      { property: "og:description", content: "Savatdagi taomlar va umumiy summa." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const s = useCart();
  const ready = useHydrated() && !!s.ready;
  const t = cartTotals(s);
  const r = t.restaurantId ? getRestaurant(t.restaurantId) : undefined;
  const [removing, setRemoving] = useState<Product | null>(null);

  if (!ready)
    return (
      <AppShell>
        <PageHeader title="Savat" back="/home" />
      </AppShell>
    );

  if (t.lines.length === 0)
    return (
      <AppShell>
        <PageHeader title="Savat" back="/home" />
        <div className="flex flex-col items-center px-8 pt-16 text-center">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-primary-soft text-primary">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <p className="mt-5 font-display text-xl font-bold">Savatingiz bo'sh</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sevimli fast-food xonangizdan taom tanlang.
          </p>
          <Link
            to="/restaurants"
            className="mt-6 flex h-12 items-center rounded-2xl bg-primary px-6 font-bold text-primary-foreground shadow-cta"
          >
            Xonalarni ko'rish
          </Link>
        </div>
      </AppShell>
    );

  return (
    <AppShell>
      <PageHeader
        title="Savat"
        back="/home"
        right={
          <Button
            variant="unstyled"
            size="unset"
            onClick={() => cart.clear()}
            className="text-xs font-semibold text-destructive"
          >
            Tozalash
          </Button>
        }
      />
      <main className="space-y-4 px-5 pb-48">
        {r && (
          <Link
            to="/restaurants/$restaurantId"
            params={{ restaurantId: r.id }}
            className="block text-sm font-semibold text-primary"
          >
            {r.name} · menyuga qaytish
          </Link>
        )}
        <ul className="space-y-3">
          {t.lines.map(({ product: p, qty, lineTotal }) => (
            <li
              key={p.id}
              data-testid="cart-line"
              className="flex gap-3 rounded-3xl border border-border bg-card p-3 shadow-card"
            >
              <img
                src={p.image}
                alt={p.name}
                width={80}
                height={80}
                loading="lazy"
                className="h-20 w-20 shrink-0 rounded-2xl object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatSom(p.price)} / dona</p>
                  </div>
                  <Button
                    variant="unstyled"
                    size="unset"
                    aria-label={`${p.name} ni o'chirish`}
                    onClick={() => setRemoving(p)}
                    className="shrink-0 text-muted-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <Stepper id={p.id} qty={qty} small />
                  <p className="truncate text-sm font-extrabold" data-testid="line-total">
                    {formatSom(lineTotal)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
      <div className="app-cart-summary fixed inset-x-0 z-40 mx-auto max-w-md border-t border-border bg-background px-5 pb-4 pt-3">
        <Row label="Taomlar" value={formatSom(t.subtotal)} />
        <Row label="Yetkazib berish" value={formatDelivery(t.delivery)} />
        <div className="mt-1 flex justify-between font-display text-lg font-extrabold">
          <span>Jami</span>
          <span data-testid="cart-total">{formatSom(t.total)}</span>
        </div>
        <Link
          to="/checkout"
          className="mt-3 flex h-14 items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground shadow-cta"
        >
          Buyurtmani davom ettirish
        </Link>
      </div>

      {removing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/50 px-6"
          role="dialog"
          aria-modal="true"
          aria-label="Mahsulotni o'chirish"
        >
          <div className="w-full max-w-sm rounded-3xl bg-card p-5 shadow-card animate-in fade-in zoom-in-95 duration-200">
            <p className="font-display text-base font-bold">{removing.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ushbu mahsulotni savatdan o'chirmoqchimisiz?
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                variant="unstyled"
                size="unset"
                onClick={() => setRemoving(null)}
                className="h-12 rounded-2xl border border-border font-bold"
              >
                Bekor qilish
              </Button>
              <Button
                variant="unstyled"
                size="unset"
                data-testid="confirm-remove"
                onClick={() => {
                  cart.remove(removing.id);
                  setRemoving(null);
                }}
                className="h-12 rounded-2xl bg-destructive font-bold text-destructive-foreground"
              >
                Ha, o'chirish
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm text-muted-foreground">
      <span>{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
