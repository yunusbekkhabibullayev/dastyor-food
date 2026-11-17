import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  Store,
  UtensilsCrossed,
  ArrowUpRight,
  Plus,
  RefreshCw,
  CheckCircle2,
  Bike,
  Sparkles,
  Phone,
  MapPin,
  ChevronRight,
  Database,
} from "lucide-react";
import {
  getFirestoreOrders,
  getFirestoreProducts,
  getFirestoreRestaurants,
  subscribeToFirestoreOrders,
  updateFirestoreOrderStatus,
  seedFirestoreData,
} from "@/lib/firebase-data";
import { isFirebaseConfigured, type OrderDoc } from "@/lib/firebase";
import { restaurants as mockRestaurants, products as mockProducts, formatSom } from "@/lib/mock-data";
import { cart } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AdminDashboard() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [productsCount, setProductsCount] = useState(mockProducts.length);
  const [restaurantsCount, setRestaurantsCount] = useState(mockRestaurants.length);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Live date formatting
  const [timeStr, setTimeStr] = useState(() =>
    new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Fetch or Subscribe to Data
  useEffect(() => {
    let unsubscribe = () => {};

    const loadData = async () => {
      setLoading(true);
      if (isFirebaseConfigured) {
        // Realtime Firestore Orders
        unsubscribe = subscribeToFirestoreOrders((liveOrders) => {
          setOrders(liveOrders);
        });

        const [prods, rests] = await Promise.all([
          getFirestoreProducts(),
          getFirestoreRestaurants(),
        ]);
        if (prods.length > 0) setProductsCount(prods.length);
        if (rests.length > 0) setRestaurantsCount(rests.length);
      } else {
        // Fallback to local cart store orders for preview
        const localOrders = cart.get().orders.map((o) => ({
          id: o.id,
          createdAt: o.createdAt,
          restaurantId: o.restaurantId,
          lines: o.lines,
          subtotal: o.subtotal,
          delivery: o.delivery,
          total: o.total,
          status: "new" as const,
          customer: o.customer,
        }));
        setOrders(localOrders);
      }
      setLoading(false);
    };

    void loadData();

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedFirestoreData();
      if (res.success) {
        toast.success("Baza muvaffaqiyatli to'ldirildi!");
        setProductsCount(res.productsCount);
        setRestaurantsCount(res.restaurantsCount);
      } else {
        toast.error(res.message);
      }
    } finally {
      setSeeding(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderDoc["status"]) => {
    try {
      if (isFirebaseConfigured) {
        await updateFirestoreOrderStatus(orderId, newStatus);
      } else {
        // Update local preview state
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        );
      }
      toast.success("Buyurtma statusi yangilandi");
    } catch {
      toast.error("Statusni o'zgartirishda xatolik");
    }
  };

  // Calculations
  const todayRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === "new" || o.status === "preparing").length;

  return (
    <div className="space-y-6">
      {/* Welcome & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fast-food buyurtmalari, savdo ko'rsatkichlari va tushumlar hisoboti.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold shadow-xs">
            <Clock className="h-4 w-4 text-primary" />
            <span>{timeStr}</span>
          </div>

          <Link
            to="/admin/products"
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Yangi Taom</span>
          </Link>
        </div>
      </div>

      {/* Database Setup Banner (Agar Firestore hali bo'sh bo'lsa) */}
      {isFirebaseConfigured && productsCount === mockProducts.length && (
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-primary/5 p-5 md:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-xs">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base">
                  Firestore ma'lumotlar bazasini to'ldirish (1-marta)
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-xl">
                  Barcha mavjud fast-food restoranlar (Evos, Max Way va h.k.), menyu taomlari va bannerlarni
                  bir bosish bilan bulutli Firestore bazasiga yuklang.
                </p>
              </div>
            </div>

            <Button
              variant="unstyled"
              size="unset"
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all shrink-0"
            >
              <RefreshCw className={cn("h-4 w-4", seeding && "animate-spin")} />
              {seeding ? "Yuklanmoqda..." : "Hozir sinxronlash"}
            </Button>
          </div>
        </div>
      )}

      {/* 4 Asosiy Statistika Kartalari */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bugungi Buyurtmalar */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Buyurtmalar</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl font-bold tracking-tight">
              {orders.length} ta
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Faol buyurtmalar nazorati</span>
          </div>
        </div>

        {/* Umumiy Tushum */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Jami Tushum</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl font-bold tracking-tight">
              {formatSom(todayRevenue)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <span>Barcha buyurtmalar summasi</span>
          </div>
        </div>

        {/* Jarayondagi Buyurtmalar */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Kutilayotgan</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Bike className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {pendingOrders} ta
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <span>Tayyorlanmoqda yoki yangi</span>
          </div>
        </div>

        {/* Restoranlar & Taomlar */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Katalog</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tracking-tight">
              {restaurantsCount} xona
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              / {productsCount} taom
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            <span>Faol taomnoma</span>
          </div>
        </div>
      </div>

      {/* Ikki Ustun: So'nggi Buyurtmalar va Xonalar Ro'yxati */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chap 2 ustun: So'nggi Buyurtmalar */}
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-5 md:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-bold">Jonli Buyurtmalar</h2>
              <p className="text-xs text-muted-foreground">
                Real-vaqt rejimida qabul qilingan so'nggi buyurtmalar
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <span>Barchasi</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-muted/30 border border-dashed border-border/80">
              <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <p className="mt-3 font-display font-bold text-sm">Hozircha buyurtmalar yo'q</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Mijoz ilovadan buyurtma berganda bu yerda avtomatik paydo bo'ladi.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => {
                const isNew = order.status === "new";
                const isPreparing = order.status === "preparing";
                const isDelivered = order.status === "delivered";

                return (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-border/70 p-4 hover:border-primary/40 transition-colors bg-card"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-extrabold text-foreground">
                          {order.id}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            isNew && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                            isPreparing && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                            isDelivered && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                            order.status === "cancelled" && "bg-red-500/10 text-red-600",
                          )}
                        >
                          {order.status === "new"
                            ? "Yangi"
                            : order.status === "preparing"
                              ? "Tayyorlanmoqda"
                              : order.status === "delivering"
                                ? "Yo'lda"
                                : order.status === "delivered"
                                  ? "Yetkazildi"
                                  : "Bekor qilindi"}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-foreground truncate">
                        {order.customer?.name || "Mijoz"} ·{" "}
                        <span className="text-muted-foreground font-normal">
                          {order.lines.map((l) => `${l.qty}x ${l.name}`).join(", ")}
                        </span>
                      </p>

                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {order.customer?.phone}
                        </span>
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="h-3 w-3" />
                          {order.customer?.address}
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                      <span className="font-display font-extrabold text-sm text-foreground">
                        {formatSom(order.total)}
                      </span>

                      {/* Tezkor status almashtirish */}
                      {isNew && (
                        <Button
                          variant="unstyled"
                          size="unset"
                          onClick={() => handleStatusChange(order.id, "preparing")}
                          className="rounded-lg bg-amber-500/10 text-amber-600 px-2.5 py-1 text-[11px] font-bold hover:bg-amber-500/20"
                        >
                          Qabul qilish
                        </Button>
                      )}
                      {isPreparing && (
                        <Button
                          variant="unstyled"
                          size="unset"
                          onClick={() => handleStatusChange(order.id, "delivered")}
                          className="rounded-lg bg-emerald-500/10 text-emerald-600 px-2.5 py-1 text-[11px] font-bold hover:bg-emerald-500/20"
                        >
                          Yetkazildi
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* O'ng 1 ustun: Fast-food xonalar ro'yxati */}
        <div className="rounded-3xl border border-border bg-card p-5 md:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-bold">Fast-food Xonalar</h2>
              <p className="text-xs text-muted-foreground">Uланган restoranlar</p>
            </div>
            <Link
              to="/admin/restaurants"
              className="text-xs font-bold text-primary hover:underline"
            >
              Boshqarish
            </Link>
          </div>

          <div className="space-y-3">
            {mockRestaurants.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 p-3 bg-muted/20"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-card border border-border/60 overflow-hidden">
                    {r.logo ? (
                      <img src={r.logo} alt={r.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-display font-bold text-xs">{r.short}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-foreground">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {r.address} · ⭐ {r.rating}
                    </p>
                  </div>
                </div>

                <Link
                  to="/restaurants/$restaurantId"
                  params={{ restaurantId: r.id }}
                  target="_blank"
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                  aria-label={`${r.name} sahifasiga o'tish`}
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

