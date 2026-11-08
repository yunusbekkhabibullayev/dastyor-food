import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { useState } from "react";
import { Heart } from "lucide-react";
import { AppShell } from "@/components/app/BottomNav";
import { Chips, ProductCard, ProductSheet, RestaurantCard } from "@/components/app/food";
import { useCart } from "@/lib/cart-store";
import { products, restaurants, type Product } from "@/lib/mock-data";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Sevimlilar — Dastyor Food" },
      { name: "description", content: "Sevimli xonalar va taomlaringiz." },
      { property: "og:title", content: "Sevimlilar — Dastyor Food" },
      { property: "og:description", content: "Sevimli xonalar va taomlaringiz." },
    ],
  }),
  component: FavoritesPage,
});

const tabs = ["Taomlar", "Xonalar"];

function FavoritesPage() {
  const s = useCart();
  const ready = useHydrated() && !!s.ready;
  const [tab, setTab] = useState("Taomlar");
  const [open, setOpen] = useState<Product | null>(null);
  const favProducts = products.filter((p) => s.liked.includes(p.id));
  const favRestaurants = restaurants.filter((r) => s.likedRestaurants.includes(r.id));
  const empty = tab === "Taomlar" ? favProducts.length === 0 : favRestaurants.length === 0;

  return (
    <AppShell>
      <header className="pt-safe space-y-3 px-5 pb-3">
        <h1 className="font-display text-2xl font-bold">Sevimlilar</h1>
        <Chips
          items={tabs.map(
            (t) =>
              `${t} (${ready ? (t === "Taomlar" ? favProducts.length : favRestaurants.length) : 0})`,
          )}
          value={`${tab} (${ready ? (tab === "Taomlar" ? favProducts.length : favRestaurants.length) : 0})`}
          onChange={(v) => setTab(v.split(" ")[0] ?? "Taomlar")}
        />
      </header>
      {!ready ? null : empty ? (
        <div className="flex flex-col items-center px-8 pt-14 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-primary-soft text-primary">
            <Heart className="h-9 w-9" />
          </div>
          <p className="mt-5 font-display text-lg font-semibold">
            {tab === "Taomlar" ? "Sevimli taomlar yo'q" : "Sevimli xonalar yo'q"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Yoqqan {tab === "Taomlar" ? "taom" : "xona"} rasmidagi yurakcha belgisini bosing — u shu
            yerda saqlanadi.
          </p>
          <Link
            to="/restaurants"
            className="mt-6 flex h-12 items-center rounded-2xl bg-primary px-6 font-bold text-primary-foreground shadow-cta"
          >
            Xonalarni ko'rish
          </Link>
        </div>
      ) : tab === "Taomlar" ? (
        <main className="grid grid-cols-2 gap-3 px-5 pb-20">
          {favProducts.map((p) => (
            <ProductCard key={p.id} p={p} onOpen={setOpen} />
          ))}
        </main>
      ) : (
        <main className="space-y-4 px-5 pb-20">
          {favRestaurants.map((r) => (
            <RestaurantCard key={r.id} r={r} />
          ))}
        </main>
      )}
      <ProductSheet product={open} onClose={() => setOpen(null)} />
    </AppShell>
  );
}
