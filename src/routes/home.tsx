import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ArrowRight, Star, Clock, ChevronRight, X } from "lucide-react";
import { AppShell } from "@/components/app/BottomNav";
import { cn } from "@/lib/utils";
import { categories, products, restaurants, type Product } from "@/lib/mock-data";
import { Chips, EmptyState, ProductCard, ProductSheet } from "@/components/app/food";
import { BannerCarousel } from "@/components/app/BannerCarousel";
import { RestaurantLogo } from "@/components/app/food";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Dastyor Food" },
      {
        name: "description",
        content: "Tumaningizdagi eng yaxshi fast-food xonalar va mashhur taomlar.",
      },
      { property: "og:title", content: "Dastyor Food" },
      {
        property: "og:description",
        content: "Tumaningizdagi eng yaxshi fast-food xonalar va mashhur taomlar.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Barchasi");
  const [open, setOpen] = useState<Product | null>(null);

  const q = query.trim().toLowerCase();
  const shownRestaurants = useMemo(
    () =>
      restaurants
        .filter(
          (r) =>
            (cat === "Barchasi" || r.tags.includes(cat as never)) &&
            (!q || r.name.toLowerCase().includes(q)),
        )
        .slice(0, 6),
    [cat, q],
  );
  const shownProducts = useMemo(
    () =>
      products
        .filter(
          (p) =>
            (cat === "Barchasi" || p.category === cat) &&
            (!q || `${p.name} ${p.restaurant}`.toLowerCase().includes(q)),
        )
        .slice(0, q ? 20 : 8),
    [cat, q],
  );

  return (
    <AppShell>
      <header className="pt-safe sticky top-0 z-30 bg-background/95 px-5 pb-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-border/60 bg-muted/50 px-3.5 transition-all focus-within:border-primary/50 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/10 shadow-xs">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground/80" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Fast-food yoki mahsulot qidirish..."
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[13px] placeholder:text-muted-foreground/75 leading-normal"
            />
            {query && (
              <Button
                variant="unstyled"
                size="unset"
                aria-label="Tozalash"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </label>
        </div>
      </header>

      <main className="space-y-6 px-5 pb-20">
        {!q && <BannerCarousel />}

        <Chips items={categories} value={cat} onChange={setCat} />

        <section>
          <SectionTitle title="Fast-food xonalar" link />
          {shownRestaurants.length === 0 ? (
            <Empty />
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {shownRestaurants.map((r) => (
                <Link
                  key={r.id}
                  to="/restaurants/$restaurantId"
                  params={{ restaurantId: r.id }}
                  className="min-w-0 text-left active:scale-[0.97]"
                >
                  <RestaurantLogo r={r} className="aspect-square w-full shadow-card" big />
                  <p className="mt-2 truncate text-sm font-bold">{r.name}</p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Star className="h-3 w-3 fill-star text-star" /> {r.rating}
                    <span className="mx-0.5">·</span>
                    <Clock className="h-3 w-3" /> {r.time}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle title="Mashhur taomlar" />
          {shownProducts.length === 0 ? (
            <Empty />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {shownProducts.map((p) => (
                <ProductCard key={p.id} p={p} onOpen={setOpen} />
              ))}
            </div>
          )}
        </section>
      </main>

      <ProductSheet product={open} onClose={() => setOpen(null)} />
    </AppShell>
  );
}

function SectionTitle({ title, link }: { title: string; link?: boolean }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {link && (
        <Link
          to="/restaurants"
          className="flex items-center text-xs font-semibold text-muted-foreground"
        >
          Barchasi <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function Empty() {
  return <EmptyState />;
}
