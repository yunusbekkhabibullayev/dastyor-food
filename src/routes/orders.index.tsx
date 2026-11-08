import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { ChevronRight, ClipboardList } from "lucide-react";
import { AppShell } from "@/components/app/BottomNav";
import { RestaurantLogo } from "@/components/app/food";
import { StatusBadge, useNow } from "@/components/app/orders";
import { PageHeader } from "@/components/app/PageHeader";
import { orderStageIndex, orderStages, useCart, type Order } from "@/lib/cart-store";
import { formatSom, getRestaurant } from "@/lib/mock-data";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Buyurtmalar — Dastyor Food" },
      { name: "description", content: "Joriy va oldingi buyurtmalaringiz." },
      { property: "og:title", content: "Buyurtmalar — Dastyor Food" },
      { property: "og:description", content: "Joriy va oldingi buyurtmalaringiz." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const s = useCart();
  const ready = useHydrated() && !!s.ready;
  const now = useNow(5000);
  const last = orderStages.length - 1;
  const current = s.orders.filter((o) => orderStageIndex(o, now) < last);
  const past = s.orders.filter((o) => orderStageIndex(o, now) >= last);

  return (
    <AppShell>
      <PageHeader title="Buyurtmalarim" back="/profile" />
      <div className="px-5 pb-3"></div>
      {!ready ? null : s.orders.length === 0 ? (
        <div className="flex flex-col items-center px-8 pt-16 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-primary-soft text-primary">
            <ClipboardList className="h-9 w-9" />
          </div>
          <p className="mt-5 font-display text-lg font-semibold">Hali buyurtmalar yo'q</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Birinchi buyurtmangizni bering — u shu yerda paydo bo'ladi.
          </p>
          <Link
            to="/home"
            className="mt-6 flex h-12 items-center rounded-2xl bg-primary px-6 font-bold text-primary-foreground shadow-cta"
          >
            Bosh sahifaga qaytish
          </Link>
        </div>
      ) : (
        <main className="space-y-6 px-5">
          {current.length > 0 && <Group title="Joriy" orders={current} now={now} />}
          {past.length > 0 && <Group title="Oldingi" orders={past} now={now} />}
        </main>
      )}
    </AppShell>
  );
}

function Group({ title, orders, now }: { title: string; orders: Order[]; now: number }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>
      <ul className="space-y-3">
        {orders.map((o) => {
          const r = getRestaurant(o.restaurantId);
          return (
            <li key={o.id}>
              <Link
                to="/orders/$orderId"
                params={{ orderId: o.id }}
                data-testid="order-row"
                className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3 shadow-card"
              >
                {r && <RestaurantLogo r={r} className="h-12 w-12 shrink-0 text-xs" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold">{r?.name ?? "Xona"}</p>
                    <StatusBadge stage={orderStageIndex(o, now)} />
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {o.id} · {new Date(o.createdAt).toLocaleDateString("uz-UZ")} ·{" "}
                    {o.lines.reduce((a, l) => a + l.qty, 0)} ta taom
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {o.lines.map((l) => l.name).join(", ")}
                  </p>
                  <p className="mt-1 text-sm font-extrabold">{formatSom(o.total)}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
