import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { Bike, ChevronLeft, Clock, MapPin, Star, Wallet } from "lucide-react";
import { AppShell } from "@/components/app/BottomNav";
import {
  Chips,
  EmptyState,
  ProductCard,
  ProductSheet,
  RestaurantLogo,
  SearchInput,
  LikeRestaurantButton,
} from "@/components/app/food";
import {
  formatDelivery,
  formatSom,
  getMenu,
  getRestaurant,
  matches,
  type Product,
} from "@/lib/mock-data";

export const Route = createFileRoute("/restaurants/$restaurantId")({
  loader: ({ params }) => {
    const r = getRestaurant(params.restaurantId);
    if (!r) throw notFound();
    return { r };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
          { title: `${loaderData.r.name} menyusi — Dastyor Food` },
          {
            name: "description",
            content: `${loaderData.r.name}: ${loaderData.r.tags.join(", ")}. Yetkazish ${loaderData.r.time} daqiqa.`,
          },
          { property: "og:title", content: `${loaderData.r.name} menyusi — Dastyor Food` },
          {
            property: "og:description",
            content: `${loaderData.r.name} menyusidan buyurtma bering.`,
          },
        ]
      : [{ title: "Xona topilmadi — Dastyor Food" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <p className="font-display text-lg font-bold">Xona topilmadi</p>
      <Link to="/restaurants" className="mt-4 inline-block font-semibold text-primary">
        Barcha xonalar
      </Link>
    </div>
  ),
  component: RestaurantPage,
});

function RestaurantPage() {
  const { r } = Route.useLoaderData();
  const menu = useMemo(() => getMenu(r.id), [r.id]);
  const [cat, setCat] = useState("Barchasi");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Product | null>(null);

  const handleOpen = useCallback((p: Product) => setOpen(p), []);
  const handleClose = useCallback(() => setOpen(null), []);
  const handleReset = useCallback(() => {
    setQ("");
    setCat("Barchasi");
  }, []);

  const shown = useMemo(
    () =>
      menu.filter(
        (p) => (cat === "Barchasi" || p.category === cat) && (!q.trim() || matches(p.name, q)),
      ),
    [menu, cat, q],
  );

  return (
    <AppShell>
      <div className="relative">
        <img
          src={r.cover}
          alt={r.name}
          width={800}
          height={400}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          className="aspect-[16/9] w-full object-cover"
        />
        <div className="absolute inset-0 bg-splash" />
        <Link
          to="/home"
          onClick={(e) => {
            if (window.history.length > 1) {
              e.preventDefault();
              window.history.back();
            }
          }}
          aria-label="Orqaga"
          className="restaurant-back absolute left-4 grid h-10 w-10 place-items-center rounded-full bg-background/90"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <LikeRestaurantButton id={r.id} className="restaurant-back absolute right-4 h-10 w-10" />
      </div>
      <section className="relative -mt-10 rounded-t-[32px] bg-background px-5 pt-6 shadow-xl">
        <div className="flex items-center gap-3.5">
          <RestaurantLogo r={r} className="h-16 w-16 shrink-0 rounded-2xl text-lg shadow-md ring-4 ring-background" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl font-extrabold tracking-tight text-foreground">{r.name}</h1>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span className="flex items-center gap-1 font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <Star className="h-3.5 w-3.5 fill-amber-500" /> {r.rating}
              </span>
              <span className="text-muted-foreground font-medium">({r.reviews} sharh)</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <Info icon={<Clock className="h-4 w-4" />} label="Vaqt" value={`${r.time} daq`} />
          <Info
            icon={<Bike className="h-4 w-4" />}
            label="Yetkazish"
            value={formatDelivery(r.delivery)}
          />
          <Info
            icon={<Wallet className="h-4 w-4" />}
            label="Min. buyurtma"
            value={formatSom(r.minOrder)}
          />
        </div>

        <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground border border-border/40">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">{r.address}</span>
        </div>
      </section>

      <div className="pt-safe sticky top-0 z-30 space-y-3 bg-background/95 px-5 pb-3 backdrop-blur">
        <SearchInput value={q} onChange={setQ} placeholder={`${r.name} menyusidan qidirish...`} />
        <Chips items={["Barchasi", ...r.tags]} value={cat} onChange={setCat} />
      </div>

      <main className="px-5 pb-20">
        <h2 className="mb-3 font-display text-lg font-bold">
          {cat === "Barchasi" ? "Menyu" : cat}
        </h2>
        {shown.length === 0 ? (
          <EmptyState
            text="Menyuda bunday taom yo'q"
            onReset={handleReset}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {shown.map((p, idx) => (
              <ProductCard key={p.id} p={p} onOpen={handleOpen} priority={idx < 4} />
            ))}
          </div>
        )}
      </main>
      <ProductSheet product={open} onClose={handleClose} />
    </AppShell>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-card border border-border/60 px-2 py-3 shadow-xs">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="mt-1.5 text-[10px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 max-w-full truncate text-[11px] font-bold text-foreground">{value}</p>
    </div>
  );
}
