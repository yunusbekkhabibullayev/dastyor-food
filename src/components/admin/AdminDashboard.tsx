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
  Calendar,
  Layers,
  Database,
  ArrowRight,
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
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Live date & time formatted as yyyy-mm-dd HH:MM
  const formatDateTime = (d = new Date()) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  const [currentDateTime, setCurrentDateTime] = useState(() => formatDateTime());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(formatDateTime()), 10000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      if (isFirebaseConfigured) {
        const [prods, rests] = await Promise.all([
          getFirestoreProducts(),
          getFirestoreRestaurants(),
        ]);
        if (prods.length > 0) setProductsCount(prods.length);
        if (rests.length > 0) setRestaurantsCount(rests.length);
      } else {
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let unsubscribe = () => {};

    if (isFirebaseConfigured) {
      unsubscribe = subscribeToFirestoreOrders((liveOrders) => {
        setOrders(liveOrders);
      });
    }

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

  const statCards = [
    {
      id: "orders",
      title: "Buyurtmalar",
      value: `${orders.length} ta`,
      icon: ShoppingBag,
      accentBg: "bg-blue-50 dark:bg-blue-500/10",
      accentText: "text-blue-600 dark:text-blue-400",
      accentBorder: "border-blue-100 dark:border-blue-500/20",
      footer: "Barcha tushgan buyurtmalar",
      to: "/admin/orders",
    },
    {
      id: "revenue",
      title: "Jami Tushum",
      value: formatSom(todayRevenue),
      icon: TrendingUp,
      accentBg: "bg-emerald-50 dark:bg-emerald-500/10",
      accentText: "text-emerald-600 dark:text-emerald-400",
      accentBorder: "border-emerald-100 dark:border-emerald-500/20",
      footer: "Yetkazilgan & faol hisob",
      to: "/admin/orders",
    },
    {
      id: "pending",
      title: "Jarayonda",
      value: `${pendingOrders} ta yangi`,
      icon: Clock,
      accentBg: "bg-amber-50 dark:bg-amber-500/10",
      accentText: "text-amber-600 dark:text-amber-400",
      accentBorder: "border-amber-100 dark:border-amber-500/20",
      footer: "Ko'rib chiqish zarur ⚡",
      to: "/admin/orders",
    },
    {
      id: "catalog",
      title: "Katalog & Xonalar",
      value: `${restaurantsCount} xona / ${productsCount} taom`,
      icon: Sparkles,
      accentBg: "bg-purple-50 dark:bg-purple-500/10",
      accentText: "text-purple-600 dark:text-purple-400",
      accentBorder: "border-purple-100 dark:border-purple-500/20",
      footer: "Menyuni boshqarish →",
      to: "/admin/products",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* ─── Hero Greeting & Status Bar (Exact Online Store Structure) ─── */}
      <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-1.5 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/20 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Dastyor Food Faol</span>
            </span>
            <span className="text-border hidden sm:inline">•</span>
            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2.5 py-0.5 rounded-full border border-border font-mono shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
              <span>{currentDateTime}</span>
            </span>
          </div>

          <div className="flex flex-col text-left pt-1">
            <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
              Xush kelibsiz,
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-black text-foreground tracking-tight leading-tight mt-0.5">
              <span className="text-primary">Admin</span> 👋
            </h2>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Fast-food buyurtmalari, savdo ko'rsatkichlari va tushumlar hisoboti.
          </p>
        </div>

        {/* 2 Equal Columns Action Buttons */}
        <div className="relative z-10 grid grid-cols-2 gap-2.5 w-full sm:w-auto self-stretch md:self-auto shrink-0">
          <Button
            type="button"
            variant="unstyled"
            size="unset"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-card hover:bg-muted active:scale-95 text-foreground border border-border rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer min-h-[42px]"
          >
            <RefreshCw className={cn("w-4 h-4 text-muted-foreground shrink-0", refreshing && "animate-spin text-primary")} />
            <span className="truncate">Yangilash</span>
          </Button>

          <Link
            to="/admin/products"
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground rounded-2xl text-xs font-bold shadow-md shadow-primary/20 transition-all cursor-pointer min-h-[42px]"
          >
            <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span className="truncate">+ Yangi Taom</span>
          </Link>
        </div>
      </div>

      {/* Database Sync Notification (Agar baza bo'sh bo'lsa) */}
      {isFirebaseConfigured && productsCount === mockProducts.length && (
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-primary/5 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-xs">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs sm:text-sm">
                  Firestore bazasini ma'lumotlar bilan to'ldirish
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Evos, Max Way va barcha taomlarni bulutli bazaga bir bosishda yuklang.
                </p>
              </div>
            </div>

            <Button
              variant="unstyled"
              size="unset"
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all shrink-0"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", seeding && "animate-spin")} />
              <span>{seeding ? "Yuklanmoqda..." : "Bazani sinxronlash"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* ─── 4 Top KPI Stat Cards (2 Columns on Mobile, 4 Columns on Desktop) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.id}
              to={card.to}
              className="bg-card p-4 sm:p-5 rounded-3xl border border-border shadow-2xs hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between cursor-pointer group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                  {card.title}
                </span>
                <div
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center border shadow-2xs transition-transform group-hover:scale-105",
                    card.accentBg,
                    card.accentText,
                    card.accentBorder,
                  )}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 stroke-[2.2]" />
                </div>
              </div>

              <div className="mt-2.5 sm:mt-4 text-left">
                <span className="text-lg sm:text-2xl font-display font-extrabold text-foreground leading-tight block tracking-tight">
                  {card.value}
                </span>
                {card.footer && (
                  <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground group-hover:text-primary mt-2 border-t pt-2 border-border/70 truncate transition-colors flex items-center justify-between">
                    <span>{card.footer}</span>
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* ─── Grid: So'nggi Buyurtmalar va Xonalar ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Chap 2 ustun: Jonli Buyurtmalar Ro'yxati */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary stroke-[2.2]" />
              <h3 className="font-display font-extrabold text-foreground text-sm sm:text-base">
                Jonli Buyurtmalar
              </h3>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Barchasi ({orders.length})</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-muted/20 border border-dashed border-border/70">
              <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 font-display font-bold text-sm">Hozircha buyurtmalar yo'q</p>
              <p className="text-xs text-muted-foreground mt-0.5">
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
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 p-3.5 sm:p-4 hover:border-primary/40 transition-colors bg-card shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-extrabold text-foreground">
                          {order.id}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                            isNew && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                            isPreparing && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                            isDelivered && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
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

                      <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-primary" />
                          {order.customer?.phone}
                        </span>
                        <span className="flex items-center gap-1 truncate max-w-[180px]">
                          <MapPin className="h-3 w-3 text-primary" />
                          {order.customer?.address}
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                      <span className="font-display font-extrabold text-sm text-foreground">
                        {formatSom(order.total)}
                      </span>

                      {/* Tezkor status almashtirish tugmalari */}
                      {isNew && (
                        <Button
                          variant="unstyled"
                          size="unset"
                          onClick={() => handleStatusChange(order.id, "preparing")}
                          className="rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 text-[11px] font-bold"
                        >
                          Qabul qilish
                        </Button>
                      )}
                      {isPreparing && (
                        <Button
                          variant="unstyled"
                          size="unset"
                          onClick={() => handleStatusChange(order.id, "delivered")}
                          className="rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-bold"
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
        <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary stroke-[2.2]" />
              <h3 className="font-display font-extrabold text-foreground text-sm sm:text-base">
                Xonalar
              </h3>
            </div>
            <Link
              to="/admin/restaurants"
              className="text-xs font-bold text-primary hover:underline"
            >
              Barchasi ({mockRestaurants.length})
            </Link>
          </div>

          <div className="space-y-2.5">
            {mockRestaurants.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 p-3 bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-card border border-border/60 overflow-hidden shadow-2xs">
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
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
