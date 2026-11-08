import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { Clock, MapPin, Wallet } from "lucide-react";
import { AppShell } from "@/components/app/BottomNav";
import { DemoNotice } from "@/components/app/PageHeader";
import { OrderTimeline, StatusBadge, useNow } from "@/components/app/orders";
import { ChevronLeft } from "lucide-react";
import { orderEtaMinutes, orderStageIndex, orderStages, useCart } from "@/lib/cart-store";
import { formatDelivery, formatSom, getRestaurant } from "@/lib/mock-data";

export const Route = createFileRoute("/orders/$orderId")({
  head: ({ params }) => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: `Buyurtma ${params.orderId} — Dastyor Food` },
      { name: "description", content: "Buyurtma holati va tafsilotlari." },
      { property: "og:title", content: `Buyurtma ${params.orderId} — Dastyor Food` },
      { property: "og:description", content: "Buyurtma holati va tafsilotlari." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { orderId } = Route.useParams();
  const s = useCart();
  const ready = useHydrated() && !!s.ready;
  const now = useNow(1000);
  const o = s.orders.find((x) => x.id === orderId);
  const r = o ? getRestaurant(o.restaurantId) : undefined;

  const header = (
    <header className="pt-safe sticky top-0 z-30 grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 bg-background/95 px-5 pb-3 backdrop-blur">
      <Link
        to="/orders"
        aria-label="Orqaga"
        className="grid h-10 w-10 place-items-center rounded-full border border-border"
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <h1 className="truncate text-center font-display text-lg font-bold">Buyurtma holati</h1>
      <span />
    </header>
  );

  if (!ready) return <AppShell>{header}</AppShell>;
  if (!o)
    return (
      <AppShell>
        {header}
        <div className="px-8 pt-16 text-center">
          <p className="font-display text-lg font-bold">Buyurtma topilmadi</p>
          <Link to="/orders" className="mt-4 inline-block font-semibold text-primary">
            Buyurtmalarim
          </Link>
        </div>
      </AppShell>
    );

  const stage = now ? orderStageIndex(o, now) : 0;
  const delivered = stage === orderStages.length - 1;
  const eta = now ? orderEtaMinutes(o, now) : 0;

  return (
    <AppShell>
      {header}
      <main className="space-y-5 px-5 pb-6">
        <section className="rounded-3xl bg-ink p-5 text-ink-foreground">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-ink-foreground/70">{o.id}</p>
            <StatusBadge stage={stage} />
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-ink-foreground/70">
            <Clock className="h-4 w-4" /> Taxminiy yetkazish vaqti
          </p>
          <p className="font-display text-3xl font-extrabold" data-testid="eta">
            {delivered ? "Yetkazildi" : eta <= 1 ? "1 daqiqadan kam" : `${eta} daqiqa`}
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <OrderTimeline stage={stage} />
        </section>

        <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-bold">
            {r?.name ?? "Xona"} · buyurtma tarkibi
          </h2>
          <ul className="space-y-2 text-sm">
            {o.lines.map((l) => (
              <li key={l.productId} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">
                  {l.name} <span className="text-muted-foreground">× {l.qty}</span>
                </span>
                <span className="shrink-0 font-semibold">{formatSom(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Taomlar</span>
              <span className="font-semibold text-foreground">{formatSom(o.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Yetkazib berish</span>
              <span className="font-semibold text-foreground">{formatDelivery(o.delivery)}</span>
            </div>
            <div className="flex justify-between pt-1 font-display text-lg font-extrabold">
              <span>Jami</span>
              <span>{formatSom(o.total)}</span>
            </div>
          </div>
          <div className="space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {o.customer.address}
            </p>
            {o.customer.payment && (
              <p className="flex items-center gap-2">
                <Wallet className="h-3.5 w-3.5 shrink-0" /> {o.customer.payment}
              </p>
            )}
            {o.customer.notes && <p className="italic">“{o.customer.notes}”</p>}
          </div>
        </section>

        {r && (
          <Link
            to="/restaurants/$restaurantId"
            params={{ restaurantId: r.id }}
            className="flex h-14 items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground shadow-cta"
          >
            {r.name} menyusiga qaytish
          </Link>
        )}
      </main>
    </AppShell>
  );
}
