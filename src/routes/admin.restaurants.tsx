import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Store, Clock, Bike, Star, Trash2 } from "lucide-react";
import {
  getFirestoreRestaurants,
  upsertFirestoreRestaurant,
  deleteFirestoreRestaurant,
} from "@/lib/firebase-data";
import { isFirebaseConfigured, type RestaurantDoc } from "@/lib/firebase";
import { restaurants as mockRestaurants, formatSom, formatDelivery } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/restaurants")({
  head: () => ({
    meta: [{ title: "Restoranlar boshqaruvi — Dastyor Food Admin" }],
  }),
  component: AdminRestaurantsPage,
});

function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantDoc[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New restaurant form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [time, setTime] = useState("25-35");
  const [delivery, setDelivery] = useState("0");
  const [minOrder, setMinOrder] = useState("30000");

  useEffect(() => {
    const load = async () => {
      if (isFirebaseConfigured) {
        const live = await getFirestoreRestaurants();
        if (live.length > 0) {
          setRestaurants(live);
          return;
        }
      }
      setRestaurants(
        mockRestaurants.map((r) => ({
          id: r.id,
          name: r.name,
          short: r.short,
          tone: r.tone,
          cover: r.cover,
          logo: r.logo,
          rating: r.rating,
          reviews: r.reviews,
          time: r.time,
          delivery: r.delivery,
          minOrder: r.minOrder,
          address: r.address,
          category: r.category,
          tags: r.tags,
          isActive: true,
        })),
      );
    };
    void load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Rostdan ham ushbu restoranni o'chirmoqchimisiz?")) return;
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
    if (isFirebaseConfigured) {
      await deleteFirestoreRestaurant(id);
    }
    toast.success("Restoran o'chirildi");
  };

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const id = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const newRest: RestaurantDoc = {
      id,
      name: name.trim(),
      short: name.slice(0, 3).toUpperCase(),
      tone: "bg-primary text-primary-foreground",
      cover: mockRestaurants[0]?.cover || "",
      rating: 5.0,
      reviews: "1",
      time: time.trim() || "30-40",
      delivery: parseInt(delivery, 10) || 0,
      minOrder: parseInt(minOrder, 10) || 30000,
      address: address.trim() || "Tuman markazi",
      category: "Burgerlar",
      tags: ["Burgerlar", "Lavash"],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setRestaurants([newRest, ...restaurants]);
    if (isFirebaseConfigured) {
      await upsertFirestoreRestaurant(newRest);
    }
    toast.success("Yangi restoran qo'shildi!");
    setName("");
    setAddress("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Fast-food Xonalar</h1>
          <p className="text-sm text-muted-foreground">Tizimga ulangan barcha fast-food restoranlar va ularning shartlari.</p>
        </div>

        <Button
          variant="unstyled"
          size="unset"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Yangi Restoran Qo'shish</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurants.map((r) => (
          <div
            key={r.id}
            className="rounded-3xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-card border border-border/70 overflow-hidden shadow-xs">
                  {r.logo ? (
                    <img src={r.logo} alt={r.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display font-black text-sm">{r.short}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-bold text-base truncate">{r.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-0.5 font-bold text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-amber-500" /> {r.rating}
                    </span>
                    <span>({r.reviews} sharh)</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                <p className="truncate">📍 {r.address}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {r.time} daq
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Bike className="h-3.5 w-3.5 text-primary" /> {formatDelivery(r.delivery)}
                  </span>
                </div>
                <p className="text-[11px]">Min. buyurtma: <b>{formatSom(r.minOrder)}</b></p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/60 flex justify-end">
              <Button
                variant="unstyled"
                size="unset"
                onClick={() => handleDelete(r.id)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal - Yangi Restoran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl border border-border">
            <h3 className="font-display text-lg font-bold">Yangi Restoran Qo'shish</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Tizimga yangi fast-food xonasini ulash.</p>

            <form onSubmit={handleAddRestaurant} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Restoran Nomi</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Street Burger"
                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Manzil</label>
                <input
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Mustaqillik ko'chasi, 14"
                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">Vaqt (daq)</label>
                  <input
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="25-35"
                    className="w-full rounded-xl border border-border bg-muted/40 px-2.5 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">Yetkazish</label>
                  <input
                    type="number"
                    value={delivery}
                    onChange={(e) => setDelivery(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-border bg-muted/40 px-2.5 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">Min. buyurtma</label>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    placeholder="30000"
                    className="w-full rounded-xl border border-border bg-muted/40 px-2.5 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="unstyled"
                  size="unset"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl bg-muted py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted/80"
                >
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  variant="unstyled"
                  size="unset"
                  className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Saqlash
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

