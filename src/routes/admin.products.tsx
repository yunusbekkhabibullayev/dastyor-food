import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  UtensilsCrossed,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Check,
  Store,
  ShoppingBag,
  ArrowUpDown,
  LayoutGrid,
  List,
  RotateCcw,
  Eye,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import {
  getFirestoreProducts,
  upsertFirestoreProduct,
  deleteFirestoreProduct,
  getFirestoreCategories,
  getFirestoreRestaurants,
} from "@/lib/firebase-data";
import { isFirebaseConfigured, type ProductDoc } from "@/lib/firebase";
import {
  products as mockProducts,
  menuCategories,
  formatSom,
  restaurants as mockRestaurants,
  type MenuCategory,
} from "@/lib/mock-data";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/products")({
  head: () => ({
    meta: [{ title: "Taomlar boshqaruvi — Dastyor Food Admin" }],
  }),
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>(Array.from(menuCategories));
  const [availableRestaurants, setAvailableRestaurants] = useState<{ id: string; name: string }[]>(
    mockRestaurants.map((r) => ({ id: r.id, name: r.name })),
  );
  const [cat, setCat] = useState("Barchasi");
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "unavailable">("all");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc" | "name_asc" | "restaurant_asc">("default");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [q, setQ] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<ProductDoc | null>(null);
  const [editProduct, setEditProduct] = useState<ProductDoc | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<ProductDoc | null>(null);

  // Create form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<string>("Burgerlar");
  const [restaurant, setRestaurant] = useState("Evos");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCat, setEditCat] = useState<string>("Burgerlar");
  const [editRestaurant, setEditRestaurant] = useState("Evos");
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [editIsAvailable, setEditIsAvailable] = useState<boolean>(true);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (isEdit) setEditPhotoPreview(result);
      else setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const load = async () => {
      if (isFirebaseConfigured) {
        const [liveProds, liveCats, liveRests] = await Promise.all([
          getFirestoreProducts(),
          getFirestoreCategories(),
          getFirestoreRestaurants(),
        ]);

        if (liveCats && liveCats.length > 0) {
          const sortedCats = [...liveCats]
            .filter((c) => c.isActive !== false)
            .sort((a, b) => (Number(a.orderIndex) || 0) - (Number(b.orderIndex) || 0));
          const catNames = sortedCats.map((c) => c.name);
          setAvailableCategories(catNames);
          if (catNames.length > 0) {
            setCategory((prev) => (catNames.includes(prev) ? prev : catNames[0]));
          }
        }

        if (liveRests && liveRests.length > 0) {
          const sortedRests = [...liveRests]
            .filter((r) => r.isActive !== false)
            .sort((a, b) => (Number(a.orderIndex) || 0) - (Number(b.orderIndex) || 0));
          const restItems = sortedRests.map((r) => ({ id: r.id, name: r.name }));
          setAvailableRestaurants(restItems);
          if (restItems.length > 0) {
            setRestaurant((prev) => (restItems.some((r) => r.name === prev) ? prev : restItems[0].name));
          }
        }

        if (liveProds && liveProds.length > 0) {
          setProducts(liveProds);
          return;
        }
      }
      setProducts(
        mockProducts.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.image,
          category: p.category,
          restaurantId: p.restaurantId,
          restaurant: p.restaurant,
          isAvailable: true,
        })),
      );
    };
    void load();
  }, []);

  const handleToggle = async (p: ProductDoc) => {
    const updated = { ...p, isAvailable: p.isAvailable === false ? true : false };
    setProducts((prev) => prev.map((item) => (item.id === p.id ? updated : item)));
    if (detailProduct?.id === p.id) {
      setDetailProduct(updated);
    }
    if (isFirebaseConfigured) {
      await upsertFirestoreProduct(updated);
    }
    toast.success(`${p.name} holati o'zgartirildi`);
  };

  const confirmDelete = async () => {
    if (!deleteProduct) return;
    const id = deleteProduct.id;
    setProducts((prev) => prev.filter((item) => item.id !== id));
    if (isFirebaseConfigured) {
      await deleteFirestoreProduct(id);
    }
    if (detailProduct?.id === id) {
      setDetailProduct(null);
    }
    setDeleteProduct(null);
    toast.success("Taom o'chirildi");
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      toast.error("Nomi va narxini kiritish shart");
      return;
    }

    const newProd: ProductDoc = {
      id: `prod-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || "Yangi mazali fast-food taomi",
      price: parseInt(price, 10) || 25000,
      image: photoPreview || mockProducts[0]?.image || "",
      category,
      restaurantId: restaurant.toLowerCase().replace(/\s+/g, ""),
      restaurant,
      isAvailable: true,
      orderCount: 0,
      createdAt: new Date().toISOString(),
    };

    setProducts([newProd, ...products]);
    if (isFirebaseConfigured) {
      await upsertFirestoreProduct(newProd);
    }
    toast.success("Yangi taom qo'shildi!");
    setName("");
    setDescription("");
    setPrice("");
    setPhotoPreview(null);
    setIsCreateModalOpen(false);
  };

  const handleOpenEdit = (p: ProductDoc) => {
    setEditProduct(p);
    setEditName(p.name);
    setEditDesc(p.description || "");
    setEditPrice(String(p.price));
    setEditCat(p.category);
    setEditRestaurant(p.restaurant);
    setEditPhotoPreview(p.image);
    setEditIsAvailable(p.isAvailable !== false);
    if (detailProduct) setDetailProduct(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct || !editName.trim() || !editPrice) {
      toast.error("Nomi va narxini kiritish shart");
      return;
    }

    const updated: ProductDoc = {
      ...editProduct,
      name: editName.trim(),
      description: editDesc.trim(),
      price: parseInt(editPrice, 10) || editProduct.price,
      category: editCat,
      restaurant: editRestaurant,
      restaurantId: editRestaurant.toLowerCase().replace(/\s+/g, ""),
      image: editPhotoPreview || editProduct.image,
      isAvailable: editIsAvailable,
    };

    setProducts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    if (isFirebaseConfigured) {
      await upsertFirestoreProduct(updated);
    }
    toast.success("Taom muvaffaqiyatli yangilandi!");
    setEditProduct(null);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = products.length;
    const available = products.filter((p) => p.isAvailable !== false).length;
    const unavailable = products.filter((p) => p.isAvailable === false).length;
    const uniqueRestaurants = new Set(products.map((p) => p.restaurant)).size;
    return { total, available, unavailable, uniqueRestaurants };
  }, [products]);

  // Restaurant product counts for tabs
  const restaurantCounts = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      map[p.restaurant] = (map[p.restaurant] || 0) + 1;
    });
    return map;
  }, [products]);

  // Filtering and Sorting
  const filteredProducts = useMemo(() => {
    const result = products.filter((p) => {
      const matchQ =
        !q.trim() ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.restaurant.toLowerCase().includes(q.toLowerCase()) ||
        p.description?.toLowerCase().includes(q.toLowerCase());

      const matchCat = cat === "Barchasi" || p.category === cat;
      const matchRest = selectedRestaurant === "all" || p.restaurant === selectedRestaurant;

      let matchStatus = true;
      if (statusFilter === "available") matchStatus = p.isAvailable !== false;
      if (statusFilter === "unavailable") matchStatus = p.isAvailable === false;

      return matchQ && matchCat && matchRest && matchStatus;
    });

    result.sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "restaurant_asc") return a.restaurant.localeCompare(b.restaurant);
      return 0;
    });

    return result;
  }, [products, q, cat, selectedRestaurant, statusFilter, sortBy]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [q, cat, selectedRestaurant, statusFilter, sortBy, viewMode]);

  const itemsPerPage = viewMode === "grid" ? 8 : 10;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const validPage = totalPages > 0 ? Math.max(1, Math.min(currentPage, totalPages)) : 1;
  const paginated = filteredProducts.slice((validPage - 1) * itemsPerPage, validPage * itemsPerPage);

  const clearAllFilters = () => {
    setQ("");
    setCat("Barchasi");
    setSelectedRestaurant("all");
    setStatusFilter("all");
    setSortBy("default");
  };

  const hasActiveFilters = q || cat !== "Barchasi" || selectedRestaurant !== "all" || statusFilter !== "all" || sortBy !== "default";

  return (
    <div className="space-y-4 animate-fadeIn pb-10 text-left">
      {/* ─── Page Title Header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
            Menyu & Taomlar Katalogi
          </h1>
          <p className="text-xs text-gray-500 font-normal mt-0.5">
            Barcha fast-food restoranlarining taomlari, narxlari va mavjudlik nazorati.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#F97316] hover:bg-[#ea580c] active:scale-95 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" />
          <span>Yangi Taom Qo'shish</span>
        </button>
      </div>

      {/* ─── Top KPI Statistics Cards (Crisp Rounded-LG) ────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Foods */}
        <div
          onClick={() => setStatusFilter("all")}
          className={cn(
            "p-3 rounded-lg border transition-all duration-150 cursor-pointer flex items-center justify-between shadow-2xs",
            statusFilter === "all"
              ? "bg-gray-900 text-white border-gray-900 shadow-xs"
              : "bg-white text-gray-800 border-gray-200/80 hover:border-gray-300",
          )}
        >
          <div>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider block",
                statusFilter === "all" ? "text-gray-300" : "text-gray-400",
              )}
            >
              Jami Taomlar
            </span>
            <span className="text-base sm:text-lg font-bold mt-0.5 block">
              {stats.total} ta
            </span>
          </div>
          <div
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center border shrink-0",
              statusFilter === "all"
                ? "bg-white/15 text-white border-white/20"
                : "bg-gray-50 text-gray-600 border-gray-200",
            )}
          >
            <ShoppingBag className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        {/* Available Foods */}
        <div
          onClick={() => setStatusFilter("available")}
          className={cn(
            "p-3 rounded-lg border transition-all duration-150 cursor-pointer flex items-center justify-between shadow-2xs",
            statusFilter === "available"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
              : "bg-white text-gray-800 border-gray-200/80 hover:border-emerald-200",
          )}
        >
          <div>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider block",
                statusFilter === "available" ? "text-emerald-100" : "text-emerald-700",
              )}
            >
              Sotuvda Mavjud
            </span>
            <span className="text-base sm:text-lg font-bold mt-0.5 block">
              {stats.available} ta
            </span>
          </div>
          <div
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center border shrink-0",
              statusFilter === "available"
                ? "bg-white/20 text-white border-white/30"
                : "bg-emerald-50 text-emerald-600 border-emerald-200",
            )}
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        {/* Unavailable Foods */}
        <div
          onClick={() => setStatusFilter("unavailable")}
          className={cn(
            "p-3 rounded-lg border transition-all duration-150 cursor-pointer flex items-center justify-between shadow-2xs",
            statusFilter === "unavailable"
              ? "bg-rose-600 text-white border-rose-600 shadow-xs"
              : "bg-white text-gray-800 border-gray-200/80 hover:border-rose-200",
          )}
        >
          <div>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider block",
                statusFilter === "unavailable" ? "text-rose-100" : "text-rose-700",
              )}
            >
              Tugagan (Nofaol)
            </span>
            <span className="text-base sm:text-lg font-bold mt-0.5 block">
              {stats.unavailable} ta
            </span>
          </div>
          <div
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center border shrink-0",
              statusFilter === "unavailable"
                ? "bg-white/20 text-white border-white/30"
                : "bg-rose-50 text-rose-600 border-rose-200",
            )}
          >
            <XCircle className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        {/* Restaurant Count */}
        <div
          onClick={() => setSelectedRestaurant("all")}
          className="p-3 rounded-lg border border-gray-200/80 bg-white hover:border-orange-200 transition-all duration-150 cursor-pointer flex items-center justify-between shadow-2xs"
        >
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider block text-gray-400">
              Fast-Food Oshxonalar
            </span>
            <span className="text-base sm:text-lg font-bold text-gray-900 mt-0.5 block">
              {stats.uniqueRestaurants} ta tarmoq
            </span>
          </div>
          <div className="w-8 h-8 rounded-md flex items-center justify-center border shrink-0 bg-orange-50 text-[#F97316] border-orange-200/60">
            <Store className="w-4 h-4 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* ─── Filter, Search & View Controls Bar ── */}
      <div className="bg-white border border-gray-200/80 rounded-lg p-3 sm:p-3.5 shadow-2xs space-y-2.5">
        {/* Row 1: Search + Category Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Taom nomi, oshxona yoki tavsif bo'yicha qidirish..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="admin-input w-full pl-8 pr-7 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-lg text-xs font-normal text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#F97316] transition-all"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-52 shrink-0">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="admin-input w-full bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-normal text-gray-800 focus:outline-none focus:border-[#F97316] cursor-pointer"
            >
              <option value="Barchasi">Barcha toifalar</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
              title="Filtrlarni tozalash"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tozalash</span>
            </button>
          )}
        </div>

        {/* Row 2: Multi-Restaurant Filter Tabs */}
        <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedRestaurant("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
              selectedRestaurant === "all"
                ? "bg-gray-900 text-white shadow-2xs font-bold"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/70",
            )}
          >
            <span>🏢 Barchasi</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                selectedRestaurant === "all" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700",
              )}
            >
              {products.length}
            </span>
          </button>

          {availableRestaurants.map((res) => {
            const count = restaurantCounts[res.name] || 0;
            const isSel = selectedRestaurant === res.name;
            return (
              <button
                key={res.name}
                type="button"
                onClick={() => setSelectedRestaurant(res.name)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                  isSel
                    ? "bg-[#F97316] text-white shadow-2xs font-bold"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/70",
                )}
              >
                <span>{res.name}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                    isSel ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 3: Status Filter Chips + Sort Dropdown + Grid/Table Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
          {/* Status Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: "all", label: "Barchasi", count: stats.total },
              { id: "available", label: "Mavjud", count: stats.available, dot: "bg-emerald-500" },
              { id: "unavailable", label: "Tugagan", count: stats.unavailable, dot: "bg-rose-500" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer",
                  statusFilter === tab.id
                    ? "bg-gray-900 text-white shadow-2xs font-bold"
                    : "bg-gray-100/80 text-gray-600 hover:bg-gray-200 hover:text-gray-900",
                )}
              >
                {tab.dot && statusFilter !== tab.id && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />}
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-semibold",
                    statusFilter === tab.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Right Tools: Sort Dropdown + View Toggle */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Sorting */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="admin-input bg-transparent text-xs font-medium text-gray-700 focus:outline-none cursor-pointer pr-1"
              >
                <option value="default">Standart tartib</option>
                <option value="price_asc">Narx: Avval arzonlari</option>
                <option value="price_desc">Narx: Avval qimmatlari</option>
                <option value="name_asc">Nomi: A — Z</option>
                <option value="restaurant_asc">Oshxona bo'yicha</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-gray-100 rounded-lg border border-gray-200 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1 rounded-md transition-all cursor-pointer",
                  viewMode === "grid" ? "bg-white text-[#F97316] shadow-2xs font-bold" : "text-gray-500 hover:text-gray-800",
                )}
                title="Karta ko'rinishi"
              >
                <LayoutGrid className="w-3.5 h-3.5 stroke-[2]" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1 rounded-md transition-all cursor-pointer",
                  viewMode === "table" ? "bg-white text-[#F97316] shadow-2xs font-bold" : "text-gray-500 hover:text-gray-800",
                )}
                title="Jadval ko'rinishi"
              >
                <List className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Products Display (Grid vs Table) ────────────────────────── */}
      {paginated.length > 0 ? (
        viewMode === "grid" ? (
          /* ─── Grid View (Cards Mode: Crisp Rounded-LG) ──────────── */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {paginated.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-gray-200/80 rounded-lg p-3 shadow-2xs hover:shadow-sm hover:border-gray-300 transition-all duration-150 flex flex-col justify-between group space-y-2.5 text-left"
              >
                {/* Image & Badges */}
                <div
                  onClick={() => setDetailProduct(p)}
                  className="relative aspect-[16/10] w-full rounded-md bg-gray-50 border border-gray-150 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />

                  {/* Restaurant badge top-left */}
                  <span className="absolute top-1.5 left-1.5 z-10 px-2 py-0.5 rounded-md text-[9px] font-bold bg-gray-900/85 backdrop-blur-xs text-white uppercase tracking-wider shadow-2xs">
                    {p.restaurant}
                  </span>

                  {/* Category pill top-right */}
                  <span className="absolute top-1.5 right-1.5 z-10 px-2 py-0.5 rounded-md text-[9px] font-semibold bg-white/90 backdrop-blur-xs text-[#F97316] border border-orange-200/50 shadow-2xs">
                    {p.category}
                  </span>

                  {/* Unavailable warning badge bottom */}
                  {p.isAvailable === false && (
                    <span className="absolute bottom-1.5 left-1.5 right-1.5 text-center py-0.5 rounded-md text-[9px] font-bold bg-rose-600/90 text-white backdrop-blur-xs shadow-2xs">
                      Tugagan (Sotuvda yo'q)
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1 flex-1">
                  <h4
                    onClick={() => setDetailProduct(p)}
                    className="font-bold text-xs text-gray-800 line-clamp-1 group-hover:text-[#F97316] transition-colors cursor-pointer"
                  >
                    {p.name}
                  </h4>
                  <p className="text-[11px] text-gray-400 line-clamp-1 leading-normal">
                    {p.description}
                  </p>
                  <div className="pt-0.5">
                    <span className="font-bold text-xs sm:text-sm text-gray-900 font-mono">
                      {formatSom(p.price)}
                    </span>
                  </div>
                </div>

                {/* Actions: Status Toggle, Details, Edit, Delete */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggle(p)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium border transition-all cursor-pointer",
                      p.isAvailable !== false
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
                    )}
                    title="Holatni almashtirish"
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        p.isAvailable !== false ? "bg-emerald-500" : "bg-rose-500",
                      )}
                    />
                    <span>{p.isAvailable !== false ? "Mavjud" : "Tugagan"}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDetailProduct(p)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                      title="Batafsil ko'rish"
                    >
                      <Eye className="w-3.5 h-3.5 stroke-[2]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="p-1 text-gray-400 hover:text-[#F97316] hover:bg-orange-50 rounded-md transition-colors cursor-pointer"
                      title="Tahrirlash"
                    >
                      <Pencil className="w-3.5 h-3.5 stroke-[2]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteProduct(p)}
                      className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="O'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ─── Table View (Dense Table Mode: Rounded-LG) ─────────────── */
          <div className="bg-white border border-gray-200/80 rounded-lg shadow-2xs overflow-hidden text-left">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3.5 w-14">Rasm</th>
                    <th className="py-2.5 px-3.5">Taom Nomi & Tavsif</th>
                    <th className="py-2.5 px-3.5">Oshxona</th>
                    <th className="py-2.5 px-3.5">Kategoriya</th>
                    <th className="py-2.5 px-3.5">Narxi</th>
                    <th className="py-2.5 px-3.5">Holati</th>
                    <th className="py-2.5 px-3.5 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-normal text-gray-800">
                  {paginated.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-2 px-3.5">
                        <img
                          src={p.image}
                          alt={p.name}
                          onClick={() => setDetailProduct(p)}
                          className="w-9 h-9 rounded-lg object-cover border border-gray-200/70 bg-white shrink-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3.5 max-w-xs cursor-pointer" onClick={() => setDetailProduct(p)}>
                        <div className="font-bold text-gray-900 text-xs hover:text-[#F97316] transition-colors">{p.name}</div>
                        <div className="text-[10px] text-gray-400 truncate">{p.description}</div>
                      </td>
                      <td className="py-2 px-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-700">
                          <Store className="w-3 h-3 text-gray-400" />
                          <span>{p.restaurant}</span>
                        </span>
                      </td>
                      <td className="py-2 px-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-orange-50 text-[#F97316] border border-orange-200/40">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-2 px-3.5">
                        <span className="font-bold text-xs font-mono text-gray-900">
                          {formatSom(p.price)}
                        </span>
                      </td>
                      <td className="py-2 px-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggle(p)}
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition-all cursor-pointer",
                            p.isAvailable !== false
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              p.isAvailable !== false ? "bg-emerald-500" : "bg-rose-500",
                            )}
                          />
                          <span>{p.isAvailable !== false ? "Mavjud" : "Tugagan"}</span>
                        </button>
                      </td>
                      <td className="py-2 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailProduct(p)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="Batafsil"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[2]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 text-gray-400 hover:text-[#F97316] hover:bg-orange-50 rounded-md transition-colors cursor-pointer"
                            title="Tahrirlash"
                          >
                            <Pencil className="w-3.5 h-3.5 stroke-[2]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteProduct(p)}
                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="O'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-white border border-gray-200/80 rounded-lg p-8 text-center shadow-2xs space-y-2.5">
          <div className="w-10 h-10 rounded-md bg-orange-50 text-[#F97316] border border-orange-200/60 flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">Taomlar topilmadi</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Tanlangan filtrlar yoki qidiruv so'zi bo'yicha hech qanday taom mavjud emas.
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium transition-colors cursor-pointer"
          >
            Filtrlarni tozalash
          </button>
        </div>
      )}

      {/* ─── Pagination (Online Store 1:1 Match) ──────────────────────── */}
      {filteredProducts.length > 0 && (
        <AdminPagination
          currentPage={validPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* ─── 1. Product Detail Modal (Online Store Style) ─────────────── */}
      {detailProduct && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setDetailProduct(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200/80 animate-scaleUp max-h-[90vh] overflow-hidden flex flex-col text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-[#F97316] border border-orange-200/60">
                  {detailProduct.category}
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {detailProduct.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer text-slate-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto no-scrollbar p-5 space-y-4 flex-1">
              {/* Image & Quick Info */}
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-full sm:w-40 aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-200 shrink-0">
                  <img
                    src={detailProduct.image}
                    alt={detailProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-base text-gray-900 leading-snug">
                    {detailProduct.name}
                  </h3>

                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-150 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                        Narxi
                      </span>
                      <span className="text-base font-bold text-gray-900 font-mono mt-0.5 block">
                        {formatSom(detailProduct.price)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                        Holati
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold mt-0.5",
                          detailProduct.isAvailable !== false
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200",
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            detailProduct.isAvailable !== false ? "bg-emerald-500" : "bg-rose-500",
                          )}
                        />
                        <span>{detailProduct.isAvailable !== false ? "Mavjud" : "Tugagan"}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-medium flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-gray-500" />
                      <span>{detailProduct.restaurant}</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-medium">
                      📁 {detailProduct.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {detailProduct.description && (
                <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-150 space-y-1">
                  <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Tavsif (Masalliqlar)
                  </h4>
                  <p className="text-xs text-gray-700 font-normal leading-relaxed">
                    {detailProduct.description}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-gray-50 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDeleteProduct(detailProduct)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>O'chirish</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailProduct(null)}
                  className="px-3 py-1.5 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-medium text-xs transition-colors cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(detailProduct)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#F97316] text-white hover:bg-[#ea580c] font-semibold text-xs transition-all shadow-2xs cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Tahrirlash</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. Edit Product Modal ────────────────────────────────────── */}
      {editProduct && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setEditProduct(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200/80 animate-scaleUp max-h-[92vh] overflow-hidden flex flex-col text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md flex items-center justify-center border shrink-0 bg-amber-50 text-amber-600 border-amber-200/60">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                    Taomni Tahrirlash
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">
                    {editProduct.restaurant} • {editProduct.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditProduct(null)}
                className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="overflow-y-auto no-scrollbar px-6 py-4 flex-1">
              <form id="edit-product-form" onSubmit={handleSaveEdit} className="space-y-3.5">
                {/* Photo & Name */}
                <div className="flex items-center gap-4">
                  <label htmlFor="edit-photo-upload" className="relative shrink-0 cursor-pointer block group">
                    <div className="w-16 h-16 rounded-lg border-2 border-dashed overflow-hidden flex items-center justify-center bg-slate-50 border-slate-200 group-hover:border-[#F97316]">
                      {editPhotoPreview ? (
                        <img src={editPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <UtensilsCrossed className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <input
                      id="edit-photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhoto(e, true)}
                      className="hidden"
                    />
                  </label>
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Taom Nomi *
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="admin-input student-modal-input w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                </div>

                {/* Restaurant & Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Restoran *
                    </label>
                    <select
                      value={editRestaurant}
                      onChange={(e) => setEditRestaurant(e.target.value)}
                      className="admin-input student-modal-input w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F97316]"
                    >
                      {availableRestaurants.map((r) => (
                        <option key={r.name} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Narxi (UZS) *
                    </label>
                    <input
                      type="number"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="admin-input student-modal-input w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                </div>

                {/* Category & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Kategoriya *
                    </label>
                    <select
                      value={editCat}
                      onChange={(e) => setEditCat(e.target.value)}
                      className="admin-input student-modal-input w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F97316]"
                    >
                      {availableCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Holati *
                    </label>
                    <select
                      value={editIsAvailable ? "active" : "inactive"}
                      onChange={(e) => setEditIsAvailable(e.target.value === "active")}
                      className="admin-input student-modal-input w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F97316]"
                    >
                      <option value="active">Mavjud (Sotuvda)</option>
                      <option value="inactive">Tugagan (Nofaol)</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Tavsif (Masalliqlar)
                  </label>
                  <textarea
                    rows={2}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="admin-input student-modal-input w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F97316] resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 pt-3 border-t border-slate-100 flex gap-2.5">
              <button
                type="button"
                onClick={() => setEditProduct(null)}
                className="flex-1 py-2 rounded-md bg-slate-100 text-slate-700 font-medium text-xs hover:bg-slate-200 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                form="edit-product-form"
                className="flex-1 py-2 rounded-md bg-[#F97316] hover:bg-[#ea580c] text-white font-medium text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Saqlash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. Delete Confirmation Modal ─────────────────────────────── */}
      {deleteProduct && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setDeleteProduct(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-xl shadow-2xl border border-slate-200/80 p-5 text-center space-y-3.5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-md bg-rose-50 text-rose-600 border border-rose-200/70 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="font-bold text-sm text-gray-900">
                Taomni o'chirish
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Haqiqatan ham <strong className="text-gray-800">"{deleteProduct.name}"</strong> taomini menyudan o'chirmoqchimisiz?
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteProduct(null)}
                className="flex-1 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2 rounded-md bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>O'chirish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. Create Product Modal ──────────────────────────────────── */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200/80 animate-scaleUp max-h-[92vh] overflow-hidden flex flex-col text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md flex items-center justify-center border shrink-0 bg-orange-50 text-[#F97316] border-orange-200/60">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                    Yangi Taom Qo'shish
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">
                    Menyuga yangi taom kiritiladi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <div className="overflow-y-auto no-scrollbar px-6 py-4 flex-1">
              <form id="create-product-form" onSubmit={handleAddProduct} className="space-y-3.5">
                {/* Photo Upload & Name */}
                <div className="flex items-center gap-4">
                  <label
                    htmlFor="create-photo-upload"
                    className="relative shrink-0 cursor-pointer block group"
                    title="Rasm yuklash"
                  >
                    <div
                      className={`w-16 h-16 rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center transition-all group-hover:border-[#F97316] group-hover:bg-orange-50/50 ${
                        photoPreview ? "border-orange-300 bg-orange-50" : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Taom rasmi" className="w-full h-full object-cover" />
                      ) : (
                        <UtensilsCrossed className="w-6 h-6 text-slate-300 group-hover:text-[#F97316] transition-colors" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#F97316] group-hover:bg-[#ea580c] text-white flex items-center justify-center shadow-xs transition-colors">
                      <Plus className="w-3 h-3 stroke-[3]" />
                    </div>
                    <input
                      id="create-photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhoto(e, false)}
                      className="hidden"
                    />
                  </label>
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Taom Nomi *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masalan: Double Cheeseburger"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="admin-input student-modal-input w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F97316] transition-all"
                    />
                  </div>
                </div>

                {/* Restoran & Narxi */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Restoran / Fast-food xona *
                    </label>
                    <select
                      value={restaurant}
                      onChange={(e) => setRestaurant(e.target.value)}
                      className="admin-input student-modal-input w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F97316] transition-all"
                    >
                      {availableRestaurants.map((r) => (
                        <option key={r.name} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Narxi (UZS) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="35000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="admin-input student-modal-input w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F97316] transition-all"
                    />
                  </div>
                </div>

                {/* Kategoriya & Holati */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Kategoriya *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="admin-input student-modal-input w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F97316] transition-all"
                    >
                      {availableCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Holati *
                    </label>
                    <select
                      className="admin-input student-modal-input w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F97316] transition-all"
                      defaultValue="active"
                    >
                      <option value="active">Mavjud (Sotuvda)</option>
                      <option value="inactive">Tugagan (Nofaol)</option>
                    </select>
                  </div>
                </div>

                {/* Tavsif */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Tavsif (Masalliqlar)
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mol go'shti, cheddar pishlog'i, pomidor va maxsus sous..."
                    className="admin-input student-modal-input w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F97316] transition-all resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 pt-3 border-t border-slate-100 flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 py-2 rounded-md bg-slate-100 text-slate-700 font-medium text-xs hover:bg-slate-200 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                form="create-product-form"
                className="flex-1 py-2 rounded-md bg-[#F97316] hover:bg-[#ea580c] active:scale-95 text-white font-medium text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Saqlash</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
