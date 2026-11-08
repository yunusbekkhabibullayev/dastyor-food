import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app/BottomNav";
import {
  Chips,
  EmptyState,
  ProductCard,
  ProductSheet,
  RestaurantCard,
  SearchInput,
} from "@/components/app/food";
import { categories, matches, products, restaurants, type Product } from "@/lib/mock-data";

export const Route = createFileRoute("/restaurants/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Fast-food xonalar — Dastyor Food" },
      {
        name: "description",
        content: "Tumandagi barcha fast-food xonalar: reyting, yetkazish vaqti va narxlar.",
      },
      { property: "og:title", content: "Fast-food xonalar — Dastyor Food" },
      {
        property: "og:description",
        content: "Tumandagi barcha fast-food xonalar: reyting, yetkazish vaqti va narxlar.",
      },
    ],
  }),
  component: RestaurantsPage,
});

function RestaurantsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Barchasi");
  const [open, setOpen] = useState<Product | null>(null);

  const shown = useMemo(
    () =>
      restaurants.filter(
        (r) =>
          (cat === "Barchasi" || r.tags.includes(cat as never)) &&
          (!q.trim() ||
            matches(r.name, q) ||
            products.some((p) => p.restaurantId === r.id && matches(p.name, q))),
      ),
    [q, cat],
  );
  const dishHits = useMemo(
    () =>
      q.trim()
        ? products.filter((p) => matches(p.name, q) && (cat === "Barchasi" || p.category === cat))
        : [],
    [q, cat],
  );

  return (
    <AppShell>
      <header className="pt-safe sticky top-0 z-30 space-y-3 bg-background/95 px-5 pb-3 backdrop-blur">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
          <Link
            to="/home"
            aria-label="Orqaga"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="min-w-0 truncate font-display text-xl font-bold">Fast-food xonalar</h1>
        </div>
        <SearchInput value={q} onChange={setQ} placeholder="Xona yoki taom nomi..." />
        <Chips items={categories} value={cat} onChange={setCat} />
      </header>
      <main className="space-y-4 px-5 pb-20 pt-2">
        <p className="text-xs font-semibold text-muted-foreground">{shown.length} ta xona</p>
        {shown.length === 0 ? (
          <EmptyState
            onReset={() => {
              setQ("");
              setCat("Barchasi");
            }}
          />
        ) : (
          shown.map((r) => <RestaurantCard key={r.id} r={r} />)
        )}
        {dishHits.length > 0 && (
          <section>
            <h2 className="mb-3 mt-2 font-display text-lg font-bold">Topilgan taomlar</h2>
            <div className="grid grid-cols-2 gap-3">
              {dishHits.map((p) => (
                <ProductCard key={p.id} p={p} onOpen={setOpen} />
              ))}
            </div>
          </section>
        )}
      </main>
      <ProductSheet product={open} onClose={() => setOpen(null)} />
    </AppShell>
  );
}
