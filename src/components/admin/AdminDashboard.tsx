import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  Store,
  UtensilsCrossed,
  Plus,
  RefreshCw,
  Sparkles,
  Phone,
  MapPin,
  Calendar,
  Truck,
  Settings,
  ArrowRight,
  Eye,
} from "lucide-react";
import {
  getFirestoreOrders,
  getFirestoreProducts,
  getFirestoreRestaurants,
  subscribeToFirestoreOrders,
  updateFirestoreOrderStatus,
} from "@/lib/firebase-data";
import { isFirebaseConfigured, type OrderDoc } from "@/lib/firebase";
import { restaurants as mockRestaurants, products as mockProducts, formatSom } from "@/lib/mock-data";
import { cart } from "@/lib/cart-store";
import { AdminSalesChart } from "./AdminSalesChart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AdminDashboard() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [productsCount, setProductsCount] = useState(mockProducts.length);
  const [restaurantsCount, setRestaurantsCount] = useState(mockRestaurants.length);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("all");

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

  // Filtered orders for dashboard based on selected restaurant
  const filteredOrders = useMemo(() => {
    if (selectedRestaurant === "all") return orders;
    return orders.filter((o) => o.restaurantId === selectedRestaurant);
  }, [orders, selectedRestaurant]);

  // Calculations
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingCount = filteredOrders.filter((o) => o.status === "new").length;
  const preparingCount = filteredOrders.filter((o) => o.status === "preparing").length;
  const deliveringCount = filteredOrders.filter((o) => o.status === "delivering").length;
  const deliveredCount = filteredOrders.filter((o) => o.status === "delivered").length;
  const cancelledCount = filteredOrders.filter((o) => o.status === "cancelled").length;
  const totalOrdersCount = Math.max(1, filteredOrders.length);

  const currentRestaurantObj = mockRestaurants.find((r) => r.id === selectedRestaurant);

  const statCards = [
    {
      id: "orders",
      title: "Buyurtmalar",
      value: `${filteredOrders.length} ta`,
      icon: ShoppingBag,
      accentBg: "bg-blue-50",
      accentText: "text-blue-600",
      accentBorder: "border-blue-100",
      footer: selectedRestaurant === "all" ? "Barcha buyurtmalar ro'yxati →" : `${currentRestaurantObj?.name} buyurtmalari →`,
      to: "/admin/orders",
    },
    {
      id: "revenue",
      title: "Jami Tushum",
      value: formatSom(totalRevenue),
      icon: TrendingUp,
      accentBg: "bg-emerald-50",
      accentText: "text-emerald-600",
      accentBorder: "border-emerald-100",
      footer: "Kassadagi umumiy hisob",
      to: "/admin/orders",
    },
    {
      id: "pending_orders",
      title: "Kutilmoqda",
      value: `${pendingCount} ta yangi`,
      icon: Clock,
      accentBg: "bg-amber-50",
      accentText: "text-amber-600",
      accentBorder: "border-amber-100",
      footer: "Ko'rib chiqish zarur ⚡",
      to: "/admin/orders",
    },
    {
      id: "products",
      title: "Taomlar Katalogi",
      value: `${productsCount} ta tovar`,
      icon: Sparkles,
      accentBg: "bg-purple-50",
      accentText: "text-purple-600",
      accentBorder: "border-purple-100",
      footer: `${restaurantsCount} ta faol xona →`,
      to: "/admin/products",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ─── Hero Greeting & Status Bar (Exact reference style) ─── */}
      <div className="bg-white border border-gray-150 rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden text-left">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-rose-50/50 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-2 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Do'kon Faol</span>
            </span>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5 bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-150 font-mono shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>{currentDateTime}</span>
            </span>
          </div>

          <div className="flex flex-col text-left">
            <span className="text-xs sm:text-sm font-extrabold text-gray-400 uppercase tracking-wider">
              Xush kelibsiz,
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight mt-0.5">
              <span className="text-[#F97316]">Admin</span> 👋
            </h2>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Fast-food buyurtmalari, savdo ko'rsatkichlari va tushumlar hisoboti
          </p>
        </div>

        {/* 2 Equal Columns Action Buttons */}
        <div className="relative z-10 grid grid-cols-2 gap-2.5 w-full sm:w-auto self-stretch md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-[#FFF7ED] hover:text-[#F97316] active:scale-95 text-gray-700 border border-gray-200 rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer min-h-[42px]"
          >
            <RefreshCw className={cn("w-4 h-4 text-gray-500 shrink-0", refreshing && "animate-spin text-[#F97316]")} />
            <span className="truncate">Yangilash</span>
          </button>

          <Link
            to="/admin/products"
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6b00] active:scale-95 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-[#F97316]/20 transition-all cursor-pointer min-h-[42px]"
          >
            <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span className="truncate">Yangi Taom</span>
          </Link>
        </div>
      </div>

      {/* ─── Fast-food Brand Switcher Bar (Barcha Oshxonalar) ─────────── */}
      <div className="bg-white border border-gray-150 rounded-3xl p-3 sm:p-4 shadow-2xs flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 pl-1 mr-1">
          <Store className="w-4 h-4 text-gray-400" />
          <span>Oshxona:</span>
        </span>

        <button
          type="button"
          onClick={() => setSelectedRestaurant("all")}
          className={cn(
            "px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
            selectedRestaurant === "all"
              ? "bg-gray-900 text-white shadow-xs font-black"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/80",
          )}
        >
          <span>🏢 Barcha Oshxonalar</span>
          <span
            className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
              selectedRestaurant === "all" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700",
            )}
          >
            {orders.length}
          </span>
        </button>

        {mockRestaurants.map((res) => {
          const resOrderCount = orders.filter((o) => o.restaurantId === res.id).length;
          const isSelected = selectedRestaurant === res.id;
          return (
            <button
              key={res.id}
              type="button"
              onClick={() => setSelectedRestaurant(res.id)}
              className={cn(
                "px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2",
                isSelected
                  ? "bg-[#F97316] text-white shadow-xs font-black"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/80",
              )}
            >
              {res.logo ? (
                <img src={res.logo} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
              ) : (
                <UtensilsCrossed className="w-3.5 h-3.5 text-gray-400" />
              )}
              <span>{res.name}</span>
              {resOrderCount > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold",
                    isSelected ? "bg-white/25 text-white" : "bg-gray-200 text-gray-700",
                  )}
                >
                  {resOrderCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── 4 Top KPI Stat Cards (2 Columns Mobile, 4 Columns Desktop) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.id}
              to={card.to}
              className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-150 shadow-2xs hover:shadow-md hover:border-gray-250 transition-all duration-200 flex flex-col justify-between cursor-pointer group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-600 transition-colors">
                  {card.title}
                </span>
                <div
                  className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center border shadow-2xs group-hover:scale-105 transition-transform",
                    card.accentBg,
                    card.accentText,
                    card.accentBorder,
                  )}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 stroke-[2.2]" />
                </div>
              </div>

              <div className="mt-3 sm:mt-4 text-left">
                <span className="text-xl sm:text-2xl font-black text-gray-900 leading-tight block tracking-tight">
                  {card.value}
                </span>
                {card.footer && (
                  <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 group-hover:text-[#F97316] mt-2 border-t pt-2 border-gray-100 truncate transition-colors flex items-center justify-between">
                    <span>{card.footer}</span>
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* ─── Interactive Sales Dynamic Chart for Store Owner ─── */}
      <AdminSalesChart orders={filteredOrders} />

      {/* ─── Orders Distribution & Quick Actions Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Orders Status Health Bar (2 columns on lg) */}
        <div className="lg:col-span-2 bg-white border border-gray-150 rounded-3xl p-5 shadow-2xs space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#F97316] stroke-[2.2]" />
              <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">
                Buyurtmalar Taqsimoti
              </h3>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-black text-[#F97316] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Barchasi</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Link>
          </div>

          {/* Segmented multi-color progress bar */}
          <div className="space-y-2">
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex gap-0.5 p-0.5">
              <div
                style={{ width: `${(pendingCount / totalOrdersCount) * 100}%` }}
                className="bg-amber-500 rounded-l-full transition-all duration-500"
                title={`Kutilmoqda: ${pendingCount}`}
              />
              <div
                style={{ width: `${(preparingCount / totalOrdersCount) * 100}%` }}
                className="bg-blue-500 transition-all duration-500"
                title={`Tayyorlanmoqda: ${preparingCount}`}
              />
              <div
                style={{ width: `${(deliveringCount / totalOrdersCount) * 100}%` }}
                className="bg-indigo-500 transition-all duration-500"
                title={`Yo'lda: ${deliveringCount}`}
              />
              <div
                style={{ width: `${(deliveredCount / totalOrdersCount) * 100}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Yetkazildi: ${deliveredCount}`}
              />
              <div
                style={{ width: `${(cancelledCount / totalOrdersCount) * 100}%` }}
                className="bg-rose-500 rounded-r-full transition-all duration-500"
                title={`Bekor qilindi: ${cancelledCount}`}
              />
            </div>
          </div>

          {/* 5 Status Pills Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            <Link
              to="/admin/orders"
              className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex flex-col justify-between cursor-pointer hover:bg-amber-100/70 transition-colors"
            >
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Kutilmoqda</span>
              <span className="text-sm sm:text-base font-black text-amber-900 mt-1">{pendingCount} ta</span>
            </Link>

            <Link
              to="/admin/orders"
              className="p-2.5 rounded-2xl bg-blue-50/70 border border-blue-200/70 flex flex-col justify-between cursor-pointer hover:bg-blue-100/70 transition-colors"
            >
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Tayyorlanmoqda</span>
              <span className="text-sm sm:text-base font-black text-blue-900 mt-1">{preparingCount} ta</span>
            </Link>

            <Link
              to="/admin/orders"
              className="p-2.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/70 flex flex-col justify-between cursor-pointer hover:bg-indigo-100/70 transition-colors"
            >
              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Yo'lda</span>
              <span className="text-sm sm:text-base font-black text-indigo-900 mt-1">{deliveringCount} ta</span>
            </Link>

            <Link
              to="/admin/orders"
              className="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 flex flex-col justify-between cursor-pointer hover:bg-emerald-100/70 transition-colors"
            >
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Yetkazildi</span>
              <span className="text-sm sm:text-base font-black text-emerald-900 mt-1">{deliveredCount} ta</span>
            </Link>

            <Link
              to="/admin/orders"
              className="p-2.5 rounded-2xl bg-rose-50/70 border border-rose-200/70 flex flex-col justify-between cursor-pointer hover:bg-rose-100/70 transition-colors"
            >
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Bekor qilindi</span>
              <span className="text-sm sm:text-base font-black text-rose-900 mt-1">{cancelledCount} ta</span>
            </Link>
          </div>
        </div>

        {/* Right: Quick Action Shortcuts (1 column on lg) */}
        <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-2xs space-y-3 flex flex-col justify-between text-left">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Sparkles className="w-5 h-5 text-[#F97316] stroke-[2.2]" />
            <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">
              Tezkor Amallar
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Link
              to="/admin/products"
              className="p-3 bg-gray-50 hover:bg-[#FFF7ED] hover:text-[#F97316] border border-gray-200 hover:border-[#FFEDD5] rounded-2xl text-left transition-all active:scale-95 cursor-pointer group flex items-center gap-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200/80 group-hover:border-[#FFEDD5] flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-[#FFF7ED] transition-colors">
                <UtensilsCrossed className="w-4 h-4 text-gray-600 group-hover:text-[#F97316] transition-colors stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-extrabold text-gray-900 group-hover:text-[#F97316] block leading-tight truncate">Tovarlar</span>
                <span className="text-[10px] text-gray-400 font-medium block mt-0.5 truncate">Katalog</span>
              </div>
            </Link>

            <Link
              to="/admin/orders"
              className="p-3 bg-gray-50 hover:bg-[#FFF7ED] hover:text-[#F97316] border border-gray-200 hover:border-[#FFEDD5] rounded-2xl text-left transition-all active:scale-95 cursor-pointer group flex items-center gap-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200/80 group-hover:border-[#FFEDD5] flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-[#FFF7ED] transition-colors">
                <Truck className="w-4 h-4 text-gray-600 group-hover:text-[#F97316] transition-colors stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-extrabold text-gray-900 group-hover:text-[#F97316] block leading-tight truncate">Buyurtmalar</span>
                <span className="text-[10px] text-gray-400 font-medium block mt-0.5 truncate">Yetkazish</span>
              </div>
            </Link>

            <Link
              to="/admin/restaurants"
              className="p-3 bg-gray-50 hover:bg-[#FFF7ED] hover:text-[#F97316] border border-gray-200 hover:border-[#FFEDD5] rounded-2xl text-left transition-all active:scale-95 cursor-pointer group flex items-center gap-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200/80 group-hover:border-[#FFEDD5] flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-[#FFF7ED] transition-colors">
                <Store className="w-4 h-4 text-gray-600 group-hover:text-[#F97316] transition-colors stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-extrabold text-gray-900 group-hover:text-[#F97316] block leading-tight truncate">Xonalar</span>
                <span className="text-[10px] text-gray-400 font-medium block mt-0.5 truncate">Restoranlar</span>
              </div>
            </Link>

            <Link
              to="/admin/settings"
              className="p-3 bg-gray-50 hover:bg-[#FFF7ED] hover:text-[#F97316] border border-gray-200 hover:border-[#FFEDD5] rounded-2xl text-left transition-all active:scale-95 cursor-pointer group flex items-center gap-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200/80 group-hover:border-[#FFEDD5] flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-[#FFF7ED] transition-colors">
                <Settings className="w-4 h-4 text-gray-600 group-hover:text-[#F97316] transition-colors stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-extrabold text-gray-900 group-hover:text-[#F97316] block leading-tight truncate">Sozlamalar</span>
                <span className="text-[10px] text-gray-400 font-medium block mt-0.5 truncate">Baza & Bot</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Recent Orders Section (Responsive Dual-View) ─── */}
      <div className="bg-white border border-gray-150 rounded-3xl shadow-2xs overflow-hidden text-left">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#F97316] shrink-0 stroke-[2.2]" />
            <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">So'nggi Buyurtmalar</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FFF7ED] text-[#F97316] border border-[#FFEDD5]">
              {filteredOrders.length} ta
            </span>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-black text-[#F97316] flex items-center gap-1 hover:text-[#ea580c] transition-colors cursor-pointer"
          >
            <span>Barchasi</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
        </div>

        {filteredOrders.length > 0 ? (
          <>
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Buyurtma #</th>
                    <th className="py-3 px-4">Mijoz</th>
                    <th className="py-3 px-4">Tarkib</th>
                    <th className="py-3 px-4">Summa</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredOrders.slice(0, 6).map((order) => {
                    const isNew = order.status === "new";
                    const isPreparing = order.status === "preparing";

                    return (
                      <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                          {order.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-gray-900">{order.customer?.name || "Mijoz"}</p>
                          <p className="text-[11px] text-gray-400">{order.customer?.phone}</p>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-gray-600">
                          {order.lines.map((l) => `${l.qty}x ${l.name}`).join(", ")}
                        </td>
                        <td className="py-3.5 px-4 font-black text-gray-900">
                          {formatSom(order.total)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block",
                              isNew && "bg-amber-50 text-amber-700 border border-amber-200",
                              isPreparing && "bg-blue-50 text-blue-700 border border-blue-200",
                              order.status === "delivering" && "bg-purple-50 text-purple-700 border border-purple-200",
                              order.status === "delivered" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                              order.status === "cancelled" && "bg-rose-50 text-rose-700 border border-rose-200",
                            )}
                          >
                            {order.status === "new"
                              ? "Kutilmoqda"
                              : order.status === "preparing"
                                ? "Tayyorlanmoqda"
                                : order.status === "delivering"
                                  ? "Yo'lda"
                                  : order.status === "delivered"
                                    ? "Yetkazildi"
                                    : "Bekor qilindi"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isNew && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(order.id, "preparing")}
                              className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                            >
                              Qabul qilish
                            </button>
                          )}
                          {isPreparing && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(order.id, "delivered")}
                              className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                            >
                              Yetkazildi
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (Visible only on mobile) */}
            <div className="sm:hidden divide-y divide-gray-100 p-3 space-y-3">
              {filteredOrders.slice(0, 6).map((order) => {
                const isNew = order.status === "new";
                const isPreparing = order.status === "preparing";

                return (
                  <div key={order.id} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-gray-900">{order.id}</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                          isNew && "bg-amber-50 text-amber-700 border border-amber-200",
                          isPreparing && "bg-blue-50 text-blue-700 border border-blue-200",
                          order.status === "delivering" && "bg-purple-50 text-purple-700 border border-purple-200",
                          order.status === "delivered" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                          order.status === "cancelled" && "bg-rose-50 text-rose-700 border border-rose-200",
                        )}
                      >
                        {order.status === "new"
                          ? "Kutilmoqda"
                          : order.status === "preparing"
                            ? "Tayyorlanmoqda"
                            : order.status === "delivering"
                              ? "Yo'lda"
                              : order.status === "delivered"
                                ? "Yetkazildi"
                                : "Bekor qilindi"}
                      </span>
                    </div>

                    <div className="text-xs">
                      <p className="font-bold text-gray-900">{order.customer?.name || "Mijoz"}</p>
                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                        {order.lines.map((l) => `${l.qty}x ${l.name}`).join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-black text-sm text-[#F97316]">
                        {formatSom(order.total)}
                      </span>

                      {isNew && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, "preparing")}
                          className="px-3 py-1 rounded-xl bg-amber-500 text-white font-bold text-xs active:scale-95 shadow-2xs"
                        >
                          Qabul qilish
                        </button>
                      )}
                      {isPreparing && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, "delivered")}
                          className="px-3 py-1 rounded-xl bg-emerald-500 text-white font-bold text-xs active:scale-95 shadow-2xs"
                        >
                          Yetkazildi
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <ShoppingBag className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-xs font-bold">Hozircha buyurtmalar yo'q</p>
          </div>
        )}
      </div>
    </div>
  );
}
