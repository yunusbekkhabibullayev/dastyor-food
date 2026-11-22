import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  ShoppingBag,
  Search,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCw,
  ExternalLink,
  Phone,
  Eye,
  X,
  Check,
  LayoutGrid,
  List,
  Trash2,
  Printer,
  UtensilsCrossed,
  Store,
} from "lucide-react";
import {
  subscribeToFirestoreOrders,
  updateFirestoreOrderStatus,
  deleteFirestoreOrder,
  bulkDeleteFirestoreOrders,
} from "@/lib/firebase-data";
import { isFirebaseConfigured, type OrderDoc } from "@/lib/firebase";
import { cart } from "@/lib/cart-store";
import { restaurants } from "@/lib/mock-data";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [{ title: "Buyurtmalar boshqaruvi — Dastyor Food Admin" }],
  }),
  component: AdminOrdersPage,
});

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  new: {
    label: "Kutilmoqda",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  preparing: {
    label: "Tayyorlanmoqda",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  delivering: {
    label: "Yo'lda",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  delivered: {
    label: "Yetkazildi",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Bekor qilingan",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

function formatPrice(val?: number) {
  return new Intl.NumberFormat("uz-UZ").format(val || 0);
}

function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showCustomDate, setShowCustomDate] = useState(false);

  // View Mode: 'grid' | 'table'
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    if (typeof window !== "undefined") {
      try {
        return (localStorage.getItem("dastyor_admin_orders_view") as "grid" | "table") || "table";
      } catch {
        return "table";
      }
    }
    return "table";
  });

  const handleSetViewMode = (mode: "grid" | "table") => {
    setViewMode(mode);
    try {
      localStorage.setItem("dastyor_admin_orders_view", mode);
    } catch {}
  };

  // Expanded items state in grid cards
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Modal Detail state
  const [modalOrder, setModalOrder] = useState<OrderDoc | null>(null);

  // Cancel Confirmation modal state
  const [cancelModalOrder, setCancelModalOrder] = useState<OrderDoc | null>(null);

  // Selected orders for bulk action
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === "grid" ? 6 : 10;

  // Real-time synchronization
  const loadOrders = (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    if (isFirebaseConfigured) {
      const unsub = subscribeToFirestoreOrders((liveOrders) => {
        setOrders(liveOrders);
        setLoading(false);
        setRefreshing(false);
      });
      return unsub;
    } else {
      const local = cart.get().orders.map((o) => ({
        id: o.id,
        createdAt: o.createdAt,
        restaurantId: o.restaurantId || "evos",
        restaurantName:
          restaurants.find((r) => r.id === o.restaurantId)?.name || "EVOS Fast Food",
        lines: o.lines,
        subtotal: o.subtotal,
        delivery: o.delivery,
        total: o.total,
        status: "new" as const,
        customer: o.customer,
      }));
      setOrders(local);
      setLoading(false);
      setRefreshing(false);
      return () => {};
    }
  };

  useEffect(() => {
    const unsub = loadOrders();
    return () => unsub?.();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedOrderIds([]);
  }, [search, selectedStatus, selectedRestaurant, datePreset, startDate, endDate, viewMode]);

  // Status update
  const handleUpdateStatus = async (orderId: string, newStatus: OrderDoc["status"]) => {
    setUpdatingId(orderId);
    try {
      if (isFirebaseConfigured) {
        await updateFirestoreOrderStatus(orderId, newStatus);
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        );
      }
      if (modalOrder && modalOrder.id === orderId) {
        setModalOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      toast.success(`Buyurtma holati "${statusConfig[newStatus]?.label}" deb o'zgartirildi`);
    } catch (err) {
      console.warn("Status update failed:", err);
      toast.error("Holatni yangilashda xatolik yuz berdi");
    } finally {
      setUpdatingId(null);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedOrderIds.length === 0) return;
    if (
      !confirm(
        `Haqiqatan ham tanlangan ${selectedOrderIds.length} ta buyurtmani o'chirmoqchimisiz?`,
      )
    ) {
      return;
    }

    try {
      if (isFirebaseConfigured) {
        await bulkDeleteFirestoreOrders(selectedOrderIds);
      } else {
        setOrders((prev) => prev.filter((o) => !selectedOrderIds.includes(o.id)));
      }
      toast.success(`${selectedOrderIds.length} ta buyurtma o'chirildi`);
      setSelectedOrderIds([]);
    } catch {
      toast.error("Buyurtmalarni o'chirishda xatolik");
    }
  };

  // Single delete
  const handleDeleteSingle = async (orderId: string) => {
    if (!confirm("Ushbu buyurtmani o'chirishni tasdiqlaysizmi?")) return;
    try {
      if (isFirebaseConfigured) {
        await deleteFirestoreOrder(orderId);
      } else {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
      if (modalOrder?.id === orderId) setModalOrder(null);
      toast.success("Buyurtma o'chirildi");
    } catch {
      toast.error("O'chirishda xatolik");
    }
  };

  // Date range helpers
  const dateRanges = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const todayStr = toDateStr(now);

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = toDateStr(yesterday);

    const weekStart = new Date();
    weekStart.setDate(now.getDate() - 7);
    const weekStartStr = toDateStr(weekStart);

    const monthStart = new Date();
    monthStart.setDate(now.getDate() - 30);
    const monthStartStr = toDateStr(monthStart);

    return {
      today: { start: todayStr, end: todayStr },
      yesterday: { start: yesterdayStr, end: yesterdayStr },
      week: { start: weekStartStr, end: todayStr },
      month: { start: monthStartStr, end: todayStr },
    };
  }, []);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = search.toLowerCase().trim();
      const numId = (order.id || "").replace("ORD-", "").toLowerCase();
      const name = (order.customer?.name || "").toLowerCase();
      const phone = (order.customer?.phone || "");
      const addr = (order.customer?.address || "").toLowerCase();

      const matchesSearch =
        !q ||
        numId.includes(q) ||
        name.includes(q) ||
        phone.includes(q) ||
        addr.includes(q);

      const matchesStatus =
        selectedStatus === "all" || order.status === selectedStatus;

      const matchesRestaurant =
        selectedRestaurant === "all" || order.restaurantId === selectedRestaurant;

      let matchesDate = true;
      let effStart = startDate;
      let effEnd = endDate;

      if (datePreset !== "all" && datePreset !== "custom") {
        const range = dateRanges[datePreset as keyof typeof dateRanges];
        if (range) {
          effStart = range.start;
          effEnd = range.end;
        }
      }

      if (effStart || effEnd) {
        const rawDate = (order.createdAt || "").slice(0, 10);
        if (rawDate) {
          if (effStart && rawDate < effStart) matchesDate = false;
          if (effEnd && rawDate > effEnd) matchesDate = false;
        }
      }

      return matchesSearch && matchesStatus && matchesRestaurant && matchesDate;
    });
  }, [
    orders,
    search,
    selectedStatus,
    selectedRestaurant,
    datePreset,
    startDate,
    endDate,
    dateRanges,
  ]);

  // Counts by status
  const counts = useMemo(() => {
    return {
      all: orders.length,
      new: orders.filter((o) => o.status === "new").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      delivering: orders.filter((o) => o.status === "delivering").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
  }, [orders]);

  // Restaurant order counts
  const restaurantCounts = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      const rId = o.restaurantId || "other";
      map[rId] = (map[rId] || 0) + 1;
    });
    return map;
  }, [orders]);

  // Paginated data
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const allPaginatedSelected =
    paginatedOrders.length > 0 &&
    paginatedOrders.every((o) => selectedOrderIds.includes(o.id));

  const toggleSelectAll = () => {
    if (allPaginatedSelected) {
      setSelectedOrderIds((prev) =>
        prev.filter((id) => !paginatedOrders.some((o) => o.id === id)),
      );
    } else {
      const pageIds = paginatedOrders.map((o) => o.id);
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectOrder = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn pb-16 text-left">
      {/* ─── Top Control & Search Bar ───────────────────────────────── */}
      <div className="bg-white border border-gray-150 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3.5">
        {/* Row 1: Search Input (Left) + Quick Date Presets & Refresh (Right) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Mijoz ismi, ID (#34), telefon yoki manzil..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: "11px" }}
              className="w-full pl-9 pr-8 py-1.5 admin-input bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-2xl font-normal text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#F97316] transition-all shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Date Presets + Refresh Button */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
            <span className="shrink-0 mr-1 hidden sm:inline" />

            {[
              { id: "all", label: "Barchasi" },
              { id: "today", label: "Bugun" },
              { id: "yesterday", label: "Kecha" },
              { id: "week", label: "Bu hafta" },
              { id: "month", label: "Bu oy" },
              { id: "custom", label: "📅 Oraliq" },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setDatePreset(preset.id);
                  if (preset.id === "custom") {
                    setShowCustomDate(!showCustomDate);
                  } else {
                    setShowCustomDate(false);
                    setStartDate("");
                    setEndDate("");
                  }
                }}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  datePreset === preset.id
                    ? "bg-gray-900 text-white shadow-2xs font-black"
                    : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900"
                }`}
              >
                {preset.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => loadOrders(true)}
              disabled={refreshing}
              className="p-2 bg-gray-50 hover:bg-[#FFF7ED] hover:text-[#F97316] active:scale-95 text-gray-600 border border-gray-200 rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer ml-0.5"
              title="Yangilash"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#F97316]" : ""}`} />
            </button>
          </div>
        </div>

        {/* Custom Date Range Collapsible Picker */}
        {showCustomDate && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-fadeIn">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">Dan (boshlanish):</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ fontSize: "11px" }}
                className="w-full px-2.5 py-1 admin-input bg-white border border-gray-200 rounded-xl font-normal text-gray-900 focus:outline-none focus:border-[#F97316]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">Gacha (tugash):</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ fontSize: "11px" }}
                className="w-full px-2.5 py-1 admin-input bg-white border border-gray-200 rounded-xl font-normal text-gray-900 focus:outline-none focus:border-[#F97316]"
              />
            </div>
          </div>
        )}

        {/* ─── Multi-Restaurant Filter Bar (Fast-food brand separator) ─────── */}
        <div className="pt-2 border-t border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedRestaurant("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedRestaurant === "all"
                ? "bg-gray-900 text-white shadow-2xs font-black"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/80"
            }`}
          >
            <span>🏢 Barchasi</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                selectedRestaurant === "all" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              {orders.length}
            </span>
          </button>

          {restaurants.map((res) => {
            const count = restaurantCounts[res.id] || 0;
            const isSelected = selectedRestaurant === res.id;
            return (
              <button
                key={res.id}
                type="button"
                onClick={() => setSelectedRestaurant(res.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#F97316] text-white shadow-xs font-black"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/80"
                }`}
              >
                {res.logo ? (
                  <img
                    src={res.logo}
                    alt={res.name}
                    className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <UtensilsCrossed className="w-3 h-3 text-gray-400" />
                )}
                <span>{res.name}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isSelected ? "bg-white/25 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Row 3: Status Tabs with Count Badges & View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-gray-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
            {[
              { id: "all", label: "Barchasi", count: counts.all },
              { id: "new", label: "Kutilmoqda", count: counts.new, dot: "bg-amber-500" },
              { id: "preparing", label: "Tayyorlanmoqda", count: counts.preparing, dot: "bg-blue-500" },
              { id: "delivering", label: "Yo'lda", count: counts.delivering, dot: "bg-indigo-500" },
              { id: "delivered", label: "Yetkazildi", count: counts.delivered, dot: "bg-emerald-500" },
              { id: "cancelled", label: "Bekor qilingan", count: counts.cancelled, dot: "bg-rose-500" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatus(st.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
                  selectedStatus === st.id
                    ? "bg-[#F97316] text-white shadow-xs font-black"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {st.dot && selectedStatus !== st.id && (
                  <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                )}
                <span>{st.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    selectedStatus === st.id ? "bg-white/25 text-white" : "bg-gray-200/80 text-gray-700"
                  }`}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          {/* View Mode Toggle (Grid / Table) */}
          <div className="flex items-center p-1 bg-gray-100 rounded-2xl border border-gray-200 shrink-0">
            <button
              type="button"
              onClick={() => handleSetViewMode("grid")}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-[#F97316] shadow-2xs font-black"
                  : "text-gray-500 hover:text-gray-800"
              }`}
              title="Karta ko'rinishi"
            >
              <LayoutGrid className="w-4 h-4 stroke-[2.2]" />
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode("table")}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-[#F97316] shadow-2xs font-black"
                  : "text-gray-500 hover:text-gray-800"
              }`}
              title="Jadval ko'rinishi"
            >
              <List className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Bulk Action Bar ────────────────────────────────────────── */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {selectedOrderIds.length}
            </span>
            <span className="text-xs font-extrabold text-rose-900">
              {selectedOrderIds.length} ta buyurtma belgilandi
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedOrderIds([])}
              className="px-3 py-1.5 bg-white hover:bg-rose-100/50 text-gray-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4 stroke-[2.2]" />
              <span>O'chirish ({selectedOrderIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Orders Display (Cards or Table) ────────────────────────── */}
      {paginatedOrders.length > 0 ? (
        <div className="space-y-4">
          {viewMode === "grid" ? (
            /* ─── Cards View ───────────────────────────────────────── */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {paginatedOrders.map((order) => {
                const numId = (order.id || "").replace("ORD-", "");
                const isExpanded = expandedOrderId === order.id;
                const isUpdating = updatingId === order.id;
                const isSelected = selectedOrderIds.includes(order.id);
                const cfg = statusConfig[order.status] || statusConfig.new;
                const restaurant = restaurants.find((r) => r.id === order.restaurantId);
                const restName = order.restaurantName || restaurant?.name || "Fast Food";

                const mapLink = order.customer?.lat && order.customer?.lng
                  ? `https://yandex.uz/maps/?pt=${order.customer.lng},${order.customer.lat}&z=16&l=map`
                  : order.customer?.address
                  ? `https://yandex.uz/maps/?text=${encodeURIComponent(order.customer.address)}`
                  : null;

                return (
                  <div
                    key={order.id}
                    className={`bg-white border rounded-3xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3.5 ${
                      isSelected
                        ? "border-[#F97316]/50 ring-2 ring-[#FFF7ED]"
                        : "border-gray-150 hover:border-gray-250"
                    }`}
                  >
                    {/* Top Bar: Checkbox + ID + Restaurant Pill + Status + Total */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="w-4 h-4 text-[#F97316] rounded border-gray-300 focus:ring-[#F97316] cursor-pointer mr-0.5"
                        />

                        <span className="px-2.5 py-1 rounded-xl bg-gray-900 text-white font-mono font-black text-xs shadow-2xs">
                          #{numId}
                        </span>

                        {/* Restaurant Tag */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFF7ED] text-[#F97316] border border-[#FFEDD5]">
                          {restaurant?.logo ? (
                            <img
                              src={restaurant.logo}
                              alt=""
                              className="w-3 h-3 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <UtensilsCrossed className="w-2.5 h-2.5" />
                          )}
                          <span className="truncate max-w-[110px]">{restName}</span>
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-2xs ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          <span>{cfg.label}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
                          {formatPrice(order.total)} so'm
                        </span>
                      </div>
                    </div>

                    {/* Customer & Address Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                      {/* Left: Customer Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-700 font-black text-sm border border-gray-200/80 shrink-0">
                          {order.customer?.name ? order.customer.name.slice(0, 1).toUpperCase() : "M"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-xs text-gray-900 truncate">
                            {order.customer?.name || "Mijoz"}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-bold text-gray-500 font-mono">
                              {order.customer?.phone || "—"}
                            </span>
                            {order.customer?.phone && (
                              <a
                                href={`tel:${order.customer.phone}`}
                                className="p-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200/60 transition-colors"
                                title="Qo'ng'iroq qilish"
                              >
                                <Phone className="w-3 h-3 stroke-[2.2]" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Address Info */}
                      <div className="flex items-start gap-2.5 text-xs text-gray-600 bg-gray-50/60 p-2.5 rounded-2xl border border-gray-100">
                        <MapPin className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-800 line-clamp-2 leading-relaxed">
                            {order.customer?.address || "Manzil ko'rsatilmagan"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {mapLink && (
                              <a
                                href={mapLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-black text-[#F97316] hover:text-[#ea580c] hover:underline bg-white px-2 py-0.5 rounded-md border border-[#FFEDD5] shadow-2xs"
                              >
                                <span>Xarita</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            <span className="text-[10px] font-bold text-gray-400">
                              To'lov:{" "}
                              <span className="text-gray-700 font-extrabold">
                                {order.customer?.payment || "Naqd pul"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Chips */}
                    {order.lines && order.lines.length > 0 && (
                      <div className="pt-2">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {order.lines.slice(0, 3).map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-50 border border-gray-200/70 text-[11px] font-bold text-gray-800"
                            >
                              <span className="truncate max-w-[130px]">{item.name}</span>
                              <span className="text-gray-400 font-mono text-[10px]">
                                ({item.qty} ta)
                              </span>
                            </span>
                          ))}

                          {order.lines.length > 3 && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedOrderId(isExpanded ? null : order.id)
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-[11px] font-black text-gray-700 transition-colors cursor-pointer"
                            >
                              <span>+{order.lines.length - 3} ta</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Collapsible Full Items List */}
                        {isExpanded && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-2xl border border-gray-150 space-y-2 animate-fadeIn">
                            <div className="divide-y divide-gray-200/60">
                              {order.lines.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="py-1.5 flex items-center justify-between text-xs font-semibold text-gray-800"
                                >
                                  <span>{item.name}</span>
                                  <div className="text-right font-mono">
                                    <span className="text-gray-400 text-[11px] mr-2">
                                      {formatPrice(item.price)} × {item.qty}
                                    </span>
                                    <span className="font-bold text-gray-900">
                                      {formatPrice(item.price * item.qty)} so'm
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Customer Notes (if any) */}
                    {order.customer?.notes && (
                      <div className="p-2.5 bg-amber-50/70 border border-amber-200/50 rounded-xl text-amber-900 text-xs font-medium">
                        <span className="font-bold text-amber-800 mr-1">Izoh:</span>
                        {order.customer.notes}
                      </div>
                    )}

                    {/* Bottom Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
                      {/* Left: Quick Status Actions */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {order.status === "new" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, "preparing")}
                              disabled={isUpdating}
                              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                              <span>Qabul qilish</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancelModalOrder(order)}
                              disabled={isUpdating}
                              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 text-xs font-extrabold rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4 stroke-[2.2]" />
                              <span>Bekor qilish</span>
                            </button>
                          </>
                        )}

                        {order.status === "preparing" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, "delivering")}
                            disabled={isUpdating}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <Truck className="w-4 h-4 stroke-[2.2]" />
                            <span>Kuryerga berish</span>
                          </button>
                        )}

                        {order.status === "delivering" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, "delivered")}
                            disabled={isUpdating}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>Yetkazildi</span>
                          </button>
                        )}

                        {order.status === "delivered" && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>Muvaffaqiyatli yetkazildi</span>
                          </span>
                        )}

                        {order.status === "cancelled" && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 stroke-[2.2]" />
                              <span>Bekor qilingan</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, "new")}
                              disabled={isUpdating}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                              <span>Tiklash</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right button: View Details Modal */}
                      <button
                        type="button"
                        onClick={() => setModalOrder(order)}
                        className="px-4 py-2 bg-gray-50 hover:bg-gray-100 hover:text-[#F97316] active:scale-95 text-gray-700 text-xs font-extrabold rounded-xl border border-gray-200 transition-all cursor-pointer min-h-[38px] flex items-center gap-1.5 shadow-2xs"
                      >
                        <Eye className="w-4 h-4 text-gray-500 stroke-[2.2]" />
                        <span>Batafsil</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ─── Table View (Dense) ───────────────────────────────── */
            <div className="bg-white border border-gray-150 rounded-3xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                      <th className="py-3.5 pl-4 pr-1 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={allPaginatedSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-[#F97316] rounded border-gray-300 focus:ring-[#F97316] cursor-pointer"
                        />
                      </th>
                      <th className="py-3.5 px-4 w-16">#ID</th>
                      <th className="py-3.5 px-4">Oshxona</th>
                      <th className="py-3.5 px-4">Xaridor</th>
                      <th className="py-3.5 px-4">Manzil</th>
                      <th className="py-3.5 px-4">Taomlar</th>
                      <th className="py-3.5 px-4">Summa</th>
                      <th className="py-3.5 px-4">Holati</th>
                      <th className="py-3.5 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-800">
                    {paginatedOrders.map((order) => {
                      const numId = (order.id || "").replace("ORD-", "");
                      const cfg = statusConfig[order.status] || statusConfig.new;
                      const isSelected = selectedOrderIds.includes(order.id);
                      const rest = restaurants.find((r) => r.id === order.restaurantId);

                      return (
                        <tr
                          key={order.id}
                          className={`hover:bg-gray-50/80 transition-colors group cursor-pointer ${
                            isSelected ? "bg-[#FFF7ED]/60" : ""
                          }`}
                          onClick={() => setModalOrder(order)}
                        >
                          <td
                            className="py-3.5 pl-4 pr-1 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOrder(order.id)}
                              className="w-4 h-4 text-[#F97316] rounded border-gray-300 focus:ring-[#F97316] cursor-pointer"
                            />
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-1 rounded-lg bg-gray-900 text-white font-mono font-black text-xs shadow-2xs">
                              #{numId}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-gray-800">
                              {rest?.name || "Fast Food"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="min-w-[140px]">
                              <p className="font-black text-gray-900 text-xs truncate max-w-[140px]">
                                {order.customer?.name || "Mijoz"}
                              </p>
                              <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                                {order.customer?.phone || "—"}
                              </p>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 max-w-[180px]">
                            <p className="text-xs text-gray-700 font-bold line-clamp-1">
                              {order.customer?.address || "—"}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 max-w-[200px]">
                            <p className="text-xs text-gray-700 font-semibold truncate">
                              {order.lines.map((l) => `${l.name} (${l.qty})`).join(", ")}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <p className="font-black text-gray-900 text-xs">
                              {formatPrice(order.total)} so'm
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold">
                              {order.customer?.payment || "Naqd pul"}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border shadow-2xs ${cfg.bg} ${cfg.text} ${cfg.border}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              <span>{cfg.label}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalOrder(order);
                              }}
                              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 hover:text-[#F97316] active:scale-95 text-gray-700 text-xs font-black rounded-xl border border-gray-200 transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-500 stroke-[2.2]" />
                              <span>Batafsil</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 text-center bg-white border border-gray-150 rounded-3xl shadow-xs space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFF7ED] text-[#F97316] flex items-center justify-center border border-[#FFEDD5]">
            <ShoppingBag className="w-8 h-8 stroke-[2]" />
          </div>
          <h3 className="text-sm font-bold text-gray-700">Buyurtmalar topilmadi</h3>
          <p className="text-xs text-gray-400 font-medium max-w-xs mx-auto">
            Tanlangan qidiruv, oshxona yoki sana oralig'i bo'yicha hech qanday buyurtma mavjud emas.
          </p>
          {(search || selectedStatus !== "all" || selectedRestaurant !== "all" || datePreset !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedStatus("all");
                setSelectedRestaurant("all");
                setDatePreset("all");
                setStartDate("");
                setEndDate("");
                setShowCustomDate(false);
              }}
              className="px-4 py-2 bg-[#FFF7ED] text-[#F97316] hover:bg-[#FFEDD5] active:scale-95 rounded-xl text-xs font-bold transition-all border border-[#FFEDD5] cursor-pointer"
            >
              Filtrlarni tozalash
            </button>
          )}
        </div>
      )}

      {/* ─── Order Detail Modal (Receipt & Actions) ─────────────────── */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setModalOrder(null)} />

          <div className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] z-10 animate-slideUp sm:animate-scaleUp text-left">
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF7ED] text-[#F97316] flex items-center justify-center font-bold border border-[#FFEDD5] shadow-2xs">
                  <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                    Buyurtma Tafsiloti
                  </h2>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    ID #{modalOrder.id.replace("ORD-", "")} •{" "}
                    {modalOrder.restaurantName || "Fast Food"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOrder(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
              {/* Customer Info Card */}
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-150 space-y-2 text-xs">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                  Xaridor Ma'lumotlari
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-gray-900 text-sm">
                    {modalOrder.customer?.name || "Noma'lum"}
                  </span>
                  <a
                    href={`tel:${modalOrder.customer?.phone}`}
                    className="font-mono font-bold text-[#F97316] hover:underline"
                  >
                    {modalOrder.customer?.phone || "—"}
                  </a>
                </div>
                {modalOrder.customer?.address && (
                  <div className="pt-2 border-t border-gray-200/60 flex items-start gap-1.5 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <span className="leading-tight flex-1">{modalOrder.customer.address}</span>
                  </div>
                )}
                {modalOrder.customer?.notes && (
                  <div className="pt-2 border-t border-gray-200/60 text-amber-800 text-[11px] font-medium">
                    <span className="font-bold mr-1">Mijoz izohi:</span>
                    {modalOrder.customer.notes}
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                  Buyurtma Tarkibi ({modalOrder.lines.length} xil taom)
                </span>
                <div className="bg-gray-50/80 border border-gray-150 rounded-2xl p-3 divide-y divide-gray-200/60">
                  {modalOrder.lines.map((line, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-extrabold text-gray-900">{line.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          {formatPrice(line.price)} so'm × {line.qty} dona
                        </p>
                      </div>
                      <span className="font-black text-gray-900 font-mono">
                        {formatPrice(line.price * line.qty)} so'm
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 space-y-2 text-xs">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Taomlar summasi:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {formatPrice(modalOrder.subtotal)} so'm
                  </span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Yetkazib berish xizmati:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {formatPrice(modalOrder.delivery)} so'm
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm">
                  <span className="font-black text-gray-900">Jami to'lov:</span>
                  <span className="font-black text-[#F97316] text-base font-mono">
                    {formatPrice(modalOrder.total)} so'm
                  </span>
                </div>
              </div>

              {/* Status Switcher In Modal */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                  Buyurtma Holatini O'zgartirish
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["new", "preparing", "delivering", "delivered"] as const).map((s) => {
                    const cfg = statusConfig[s];
                    const isActive = modalOrder.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleUpdateStatus(modalOrder.id, s)}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          isActive
                            ? "bg-gray-900 text-white border-gray-900 shadow-xs font-black"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleDeleteSingle(modalOrder.id)}
                className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold border border-rose-200 cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>O'chirish</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold border border-gray-200 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Chek chiqarish</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalOrder(null)}
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-colors"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Cancel Confirmation Modal ───────────────────────────────── */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white max-w-sm w-full rounded-3xl p-5 border border-gray-150 shadow-2xl space-y-4 text-center animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-200">
              <XCircle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-black text-base text-gray-900">
                Buyurtmani bekor qilish
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Haqiqatan ham #{cancelModalOrder.id.replace("ORD-", "")} sonli buyurtmani bekor qilmoqchimisiz?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="py-2.5 rounded-xl border border-gray-200 text-xs font-extrabold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Yo'q, qoldirish
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUpdateStatus(cancelModalOrder.id, "cancelled");
                  setCancelModalOrder(null);
                }}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs transition-colors cursor-pointer"
              >
                Ha, bekor qilinsin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
