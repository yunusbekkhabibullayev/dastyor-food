import { createFileRoute, useHydrated, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { DemoNotice } from "@/components/app/PageHeader";
import { useCart } from "@/lib/cart-store";
import { formatSom, getRestaurant } from "@/lib/mock-data";

export const Route = createFileRoute("/order-success")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Buyurtma qabul qilindi — Dastyor Food" },
      { name: "description", content: "Buyurtmangiz muvaffaqiyatli yaratildi." },
      { property: "og:title", content: "Buyurtma qabul qilindi — Dastyor Food" },
      { property: "og:description", content: "Buyurtmangiz muvaffaqiyatli yaratildi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const s = useCart();
  const ready = useHydrated() && !!s.ready;
  const o = s.lastOrder;
  const r = o ? getRestaurant(o.restaurantId) : undefined;

  return (
    <div className="app-screen pt-safe pb-safe mx-auto flex max-w-md flex-col px-5">
      <div className="flex flex-col items-center pt-14 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="relative grid h-28 w-28 place-items-center rounded-full bg-success-soft">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-success text-success-foreground">
            <Check className="h-11 w-11" strokeWidth={3} />
          </div>
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold">
          {ready && !o ? "Hali buyurtma yo'q" : "Buyurtma muvaffaqiyatli yaratildi!"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ready && !o ? "Taom tanlab, buyurtma bering." : "Rahmat! Buyurtmangiz qabul qilindi."}
        </p>
      </div>

      {ready && o && (
        <div className="mt-8 space-y-2 rounded-3xl border border-border bg-card p-5 text-sm shadow-card">
          <Line k="Buyurtma raqami" v={o.id} />
          {r && <Line k="Xona" v={r.name} />}
          <ul className="space-y-1 border-t border-border pt-2">
            {o.lines.map((l) => (
              <li key={l.productId} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">
                  {l.name} <span className="text-muted-foreground">× {l.qty}</span>
                </span>
                <span className="shrink-0 font-semibold">{formatSom(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <Line k="Yetkazish manzili" v={o.customer.address} />
          <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-extrabold">
            <span>Jami</span>
            <span data-testid="order-total">{formatSom(o.total)}</span>
          </div>
          <Link
            to="/orders/$orderId"
            params={{ orderId: o.id }}
            className="block pt-1 text-center text-sm font-bold text-primary"
          >
            Buyurtma holatini kuzatish
          </Link>
        </div>
      )}

      <div className="mt-auto space-y-3 pb-6 pt-8">
        <Link
          to="/orders"
          className="flex h-14 items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground shadow-cta"
        >
          Buyurtmalarim
        </Link>
        <Link
          to="/home"
          className="flex h-14 items-center justify-center rounded-2xl border border-border font-bold"
        >
          Bosh sahifaga qaytish
        </Link>
      </div>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{k}</span>
      <span className="min-w-0 text-right font-semibold">{v}</span>
    </div>
  );
}
