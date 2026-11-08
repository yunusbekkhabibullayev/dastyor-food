import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  const shown = menu.filter(
    (p) => (cat === "Barchasi" || p.category === cat) && (!q.trim() || matches(p.name, q)),
  );

  return (
    <AppShell>
      <div className="relative">
        <img
          src={r.cover}
          alt={r.name}
          width={800}
          height={400}
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
      <section className="relative -mt-8 rounded-t-3xl bg-background px-5 pt-5">
        <div className="flex items-center gap-3">
          <RestaurantLogo r={r} className="h-16 w-16 shrink-0 text-lg shadow-card" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold">{r.name}</h1>
            <p className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-star text-star" /> <b>{r.rating}</b>
              <span className="text-muted-foreground">({r.reviews} sharh)</span>
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
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
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {r.address}
        </p>
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
            onReset={() => {
              setQ("");
              setCat("Barchasi");
            }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {shown.map((p) => (
              <ProductCard key={p.id} p={p} onOpen={setOpen} />
            ))}
          </div>
        )}
      </main>
      <ProductSheet product={open} onClose={() => setOpen(null)} />
    </AppShell>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-muted px-2 py-2.5">
      <div className="flex justify-center text-primary">{icon}</div>
      <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
      <p className="break-words text-xs font-bold">{value}</p>
    </div>
  );
}
