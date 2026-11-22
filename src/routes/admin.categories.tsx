import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Folder,
  FolderPlus,
  Plus,
  Search,
  X,
  ArrowUpDown,
  LayoutGrid,
  List,
  CheckCircle2,
  EyeOff,
  Eye,
  Pencil,
  Trash2,
  ShoppingBag,
  Hash,
  AlertTriangle,
  Check,
  Store,
  RotateCcw,
} from "lucide-react";
import {
  getFirestoreCategories,
  upsertFirestoreCategory,
  deleteFirestoreCategory,
  getFirestoreProducts,
} from "@/lib/firebase-data";
import { isFirebaseConfigured, type CategoryDoc, type ProductDoc } from "@/lib/firebase";
import { menuCategories, products as mockProducts, formatSom } from "@/lib/mock-data";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({
    meta: [{ title: "Katalog Toifalari — Dastyor Food Admin" }],
  }),
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & View states
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"order_asc" | "name_asc" | "products_desc">("order_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === "grid" ? 8 : 10;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDoc | null>(null);
  const [detailCategory, setDetailCategory] = useState<CategoryDoc | null>(null);
  const [deleteCategoryItem, setDeleteCategoryItem] = useState<CategoryDoc | null>(null);

  // Form states for Add/Edit Modal
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Load initial categories & products
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let loadedCats: CategoryDoc[] = [];
        let loadedProds: ProductDoc[] = [];

        if (isFirebaseConfigured) {
          const [catsLive, prodsLive] = await Promise.all([
            getFirestoreCategories(),
            getFirestoreProducts(),
          ]);
          if (catsLive.length > 0) loadedCats = catsLive;
          if (prodsLive.length > 0) loadedProds = prodsLive;
        }

        if (loadedCats.length === 0) {
          loadedCats = menuCategories.map((name, idx) => ({
            id: `cat-${idx + 1}`,
            name,
            orderIndex: idx + 1,
            isActive: true,
          }));
        }

        if (loadedProds.length === 0) {
          loadedProds = mockProducts.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            image: p.image,
            category: p.category,
            restaurantId: p.restaurantId,
            restaurant: p.restaurant,
            isAvailable: true,
          }));
        }

        setCategories(loadedCats);
        setProducts(loadedProds);
      } catch (err) {
        console.warn("Categories loading error:", err);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.isActive !== false).length;
    const inactive = total - active;
    const totalProducts = products.length;
    return { total, active, inactive, totalProducts };
  }, [categories, products]);

  // Product counts per category
  const categoryProductsMap = useMemo(() => {
    const map: Record<string, ProductDoc[]> = {};
    products.forEach((p) => {
      const catKey = p.category;
      if (!map[catKey]) map[catKey] = [];
      map[catKey].push(p);
    });
    return map;
  }, [products]);

  // Filter & Search
  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories
      .filter((c) => {
        const nameMatches = c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
        const isActive = c.isActive !== false;
        const statusMatches =
          statusFilter === "all" ||
          (statusFilter === "active" && isActive) ||
          (statusFilter === "inactive" && !isActive);

        return nameMatches && statusMatches;
      })
      .sort((a, b) => {
        if (sortBy === "order_asc") {
          return (Number(a.orderIndex) || 0) - (Number(b.orderIndex) || 0);
        }
        if (sortBy === "name_asc") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "products_desc") {
          const countA = (categoryProductsMap[a.name] || []).length;
          const countB = (categoryProductsMap[b.name] || []).length;
          return countB - countA;
        }
        return 0;
      });
  }, [categories, search, statusFilter, sortBy, categoryProductsMap]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortBy, viewMode]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const validPage = totalPages > 0 ? Math.max(1, Math.min(currentPage, totalPages)) : 1;
  const paginatedCategories = useMemo(() => {
    const start = (validPage - 1) * itemsPerPage;
    return filteredCategories.slice(start, start + itemsPerPage);
  }, [filteredCategories, validPage, itemsPerPage]);

  // Open Create Modal
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug(`cat-${categories.length + 1}`);
    setFormOrder(categories.length + 1);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (c: CategoryDoc) => {
    setEditingCategory(c);
    setFormName(c.name);
    setFormSlug(c.id);
    setFormOrder(c.orderIndex || 1);
    setFormIsActive(c.isActive !== false);
    setIsModalOpen(true);
    if (detailCategory) setDetailCategory(null);
  };

  // 1-Click Status Toggle
  const handleToggleStatus = async (category: CategoryDoc, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = !(category.isActive !== false);
    const updated: CategoryDoc = {
      ...category,
      isActive: newStatus,
    };

    setCategories((prev) => prev.map((item) => (item.id === category.id ? updated : item)));
    if (detailCategory && detailCategory.id === category.id) {
      setDetailCategory(updated);
    }

    if (isFirebaseConfigured) {
      await upsertFirestoreCategory(updated);
    }

    toast.success(
      newStatus
        ? `"${category.name}" toifasi faollashtirildi! 🟢`
        : `"${category.name}" toifasi nofaol qilindi! ⚪`,
    );
  };

  // Save Add/Edit
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Toifa nomini kiriting");
      return;
    }

    if (editingCategory) {
      // Edit
      const updated: CategoryDoc = {
        ...editingCategory,
        name: formName.trim(),
        orderIndex: Number(formOrder) || 1,
        isActive: formIsActive,
      };

      setCategories((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      if (isFirebaseConfigured) {
        await upsertFirestoreCategory(updated);
      }
      toast.success("Toifa muvaffaqiyatli yangilandi!");
    } else {
      // Create
      const slug = formSlug.trim() || `cat-${Date.now()}`;
      const newCat: CategoryDoc = {
        id: slug,
        name: formName.trim(),
        orderIndex: Number(formOrder) || categories.length + 1,
        isActive: formIsActive,
      };

      setCategories((prev) => [...prev, newCat]);
      if (isFirebaseConfigured) {
        await upsertFirestoreCategory(newCat);
      }
      toast.success("Yangi toifa qo'shildi!");
    }

    setIsModalOpen(false);
  };

  // Delete Category
  const handleDeleteConfirm = async () => {
    if (!deleteCategoryItem) return;
    const catId = deleteCategoryItem.id;
    setCategories((prev) => prev.filter((c) => c.id !== catId));

    if (isFirebaseConfigured) {
      await deleteFirestoreCategory(catId);
    }

    if (detailCategory && detailCategory.id === catId) {
      setDetailCategory(null);
    }

    toast.success("Toifa menyudan o'chirildi! 🗑️");
    setDeleteCategoryItem(null);
  };

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortBy("order_asc");
  };

  const hasActiveFilters = search || statusFilter !== "all" || sortBy !== "order_asc";

  return (
    <div className="space-y-4 animate-fadeIn pb-10 text-left">
      {/* ─── Header & Top Action ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200/80 rounded-lg p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-orange-50 text-[#F97316] flex items-center justify-center font-bold border border-orange-200/60 shadow-2xs shrink-0">
            <Folder className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
              Katalog Toifalari
            </h1>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              Do'kon toifalari va ularga biriktirilgan taomlar boshqaruvi
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#F97316] hover:bg-[#ea580c] active:scale-95 text-white rounded-md text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.4]" />
          <span>Yangi Toifa Qo'shish</span>
        </button>
      </div>

      {/* ─── KPI Metrics Cards (Online Store Style: 4 Cards) ─────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Categories */}
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
              Jami Toifalar
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
                : "bg-blue-50 text-blue-600 border-blue-200/60",
            )}
          >
            <Folder className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        {/* Active Categories */}
        <div
          onClick={() => setStatusFilter("active")}
          className={cn(
            "p-3 rounded-lg border transition-all duration-150 cursor-pointer flex items-center justify-between shadow-2xs",
            statusFilter === "active"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
              : "bg-white text-gray-800 border-gray-200/80 hover:border-emerald-200",
          )}
        >
          <div>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider block",
                statusFilter === "active" ? "text-emerald-100" : "text-emerald-700",
              )}
            >
              Faol Toifalar
            </span>
            <span className="text-base sm:text-lg font-bold mt-0.5 block">
              {stats.active} ta
            </span>
          </div>
          <div
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center border shrink-0",
              statusFilter === "active"
                ? "bg-white/20 text-white border-white/30"
                : "bg-emerald-50 text-emerald-600 border-emerald-200",
            )}
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        {/* Inactive Categories */}
        <div
          onClick={() => setStatusFilter("inactive")}
          className={cn(
            "p-3 rounded-lg border transition-all duration-150 cursor-pointer flex items-center justify-between shadow-2xs",
            statusFilter === "inactive"
              ? "bg-gray-700 text-white border-gray-700 shadow-xs"
              : "bg-white text-gray-800 border-gray-200/80 hover:border-gray-400",
          )}
        >
          <div>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider block",
                statusFilter === "inactive" ? "text-gray-300" : "text-gray-400",
              )}
            >
              Nofaol Toifalar
            </span>
            <span className="text-base sm:text-lg font-bold mt-0.5 block">
              {stats.inactive} ta
            </span>
          </div>
          <div
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center border shrink-0",
              statusFilter === "inactive"
                ? "bg-white/20 text-white border-white/30"
                : "bg-gray-100 text-gray-500 border-gray-200",
            )}
          >
            <EyeOff className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        {/* Attached Products Count */}
        <div className="p-3 rounded-lg border border-gray-200/80 bg-white hover:border-orange-200 transition-all duration-150 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider block text-gray-400">
              Biriktirilgan Taomlar
            </span>
            <span className="text-base sm:text-lg font-bold text-gray-900 mt-0.5 block">
              {stats.totalProducts} ta taom
            </span>
          </div>
          <div className="w-8 h-8 rounded-md flex items-center justify-center border shrink-0 bg-orange-50 text-[#F97316] border-orange-200/60">
            <ShoppingBag className="w-4 h-4 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* ─── Search, Filter, Sort & View Modes Bar ─────────────────────── */}
      <div className="bg-white border border-gray-200/80 rounded-lg p-3 sm:p-3.5 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Toifa nomi yoki ID bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input w-full pl-8 pr-7 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-md text-xs font-normal text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#F97316] transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Tools: Sort + View Mode */}
          <div className="flex items-center gap-2">
            {/* Sorting */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1 text-xs text-gray-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="admin-input bg-transparent text-xs font-medium text-gray-700 focus:outline-none cursor-pointer pr-1"
              >
                <option value="order_asc">Tartib bo'yicha (1-9)</option>
                <option value="name_asc">Nomi bo'yicha (A-Z)</option>
                <option value="products_desc">Taomlar soni bo'yicha</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-gray-100 rounded-md border border-gray-200 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1 rounded-sm transition-all cursor-pointer",
                  viewMode === "grid"
                    ? "bg-white text-[#F97316] shadow-2xs font-bold"
                    : "text-gray-500 hover:text-gray-800",
                )}
                title="Karta ko'rinishi"
              >
                <LayoutGrid className="w-3.5 h-3.5 stroke-[2]" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1 rounded-sm transition-all cursor-pointer",
                  viewMode === "table"
                    ? "bg-white text-[#F97316] shadow-2xs font-bold"
                    : "text-gray-500 hover:text-gray-800",
                )}
                title="Jadval ko'rinishi"
              >
                <List className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Status Filter Chips */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: "all", label: "Barchasi", count: stats.total },
              { id: "active", label: "Faol", count: stats.active, dot: "bg-emerald-500" },
              { id: "inactive", label: "Nofaol", count: stats.inactive, dot: "bg-gray-400" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 cursor-pointer",
                  statusFilter === st.id
                    ? "bg-gray-900 text-white shadow-2xs font-bold"
                    : "bg-gray-100/80 text-gray-600 hover:bg-gray-200 hover:text-gray-900",
                )}
              >
                {st.dot && statusFilter !== st.id && (
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                )}
                <span>{st.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-semibold",
                    statusFilter === st.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700",
                  )}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Tozalash</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Categories Display (Grid or Table) ────────────────────────── */}
      {paginatedCategories.length > 0 ? (
        viewMode === "grid" ? (
          /* ─── Grid View (Card Mode) ────────────────────────────────── */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {paginatedCategories.map((c, idx) => {
              const attachedProducts = categoryProductsMap[c.name] || [];
              const productsCount = attachedProducts.length;
              const isActive = c.isActive !== false;

              return (
                <div
                  key={c.id}
                  className="bg-white border border-gray-200/80 rounded-lg p-3.5 shadow-2xs hover:shadow-sm hover:border-gray-300 transition-all duration-150 flex flex-col justify-between group space-y-3"
                >
                  {/* Top Bar: Icon + Order & Status */}
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-md bg-orange-50 text-[#F97316] border border-orange-200/60 flex items-center justify-center font-bold">
                      <Folder className="w-4 h-4 stroke-[2.2]" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Order number tag */}
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[10px] font-mono font-bold text-gray-600">
                        № {c.orderIndex || idx + 1}
                      </span>

                      {/* Interactive Status Pill */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleStatus(c, e)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition-all cursor-pointer",
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100",
                        )}
                        title="Statusni o'zgartirish uchun bosing"
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isActive ? "bg-emerald-500" : "bg-gray-400",
                          )}
                        />
                        <span>{isActive ? "Faol" : "Nofaol"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Category Title & Slug */}
                  <div className="space-y-0.5">
                    <h3
                      className="font-bold text-sm text-gray-900 group-hover:text-[#F97316] transition-colors cursor-pointer line-clamp-1"
                      onClick={() => setDetailCategory(c)}
                      title={c.name}
                    >
                      {c.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                      <Hash className="w-3 h-3 text-gray-300" />
                      <span className="truncate">{c.id}</span>
                    </div>
                  </div>

                  {/* Bottom Stats & Action Buttons */}
                  <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                    {/* Products Counter Badge */}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600 text-[11px] font-medium">
                      <ShoppingBag className="w-3 h-3 text-gray-400" />
                      <span>{productsCount} ta taom</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailCategory(c)}
                        className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Batafsil ko'rish"
                      >
                        <Eye className="w-3.5 h-3.5 stroke-[2]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(c)}
                        className="p-1 rounded-md text-gray-400 hover:text-[#F97316] hover:bg-orange-50 transition-colors cursor-pointer"
                        title="Tahrirlash"
                      >
                        <Pencil className="w-3.5 h-3.5 stroke-[2]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteCategoryItem(c)}
                        className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ─── Table View (Data Mode) ───────────────────────────────── */
          <div className="bg-white border border-gray-200/80 rounded-lg shadow-2xs overflow-hidden text-left">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3.5 w-16 text-center">Tartib</th>
                    <th className="py-2.5 px-3.5">Toifa Nomi</th>
                    <th className="py-2.5 px-3.5">ID (Slug)</th>
                    <th className="py-2.5 px-3.5">Biriktirilgan Taomlar</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5 text-right w-32">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-normal text-gray-800">
                  {paginatedCategories.map((c, idx) => {
                    const attachedProducts = categoryProductsMap[c.name] || [];
                    const productsCount = attachedProducts.length;
                    const isActive = c.isActive !== false;

                    return (
                      <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-2.5 px-3.5 text-center font-mono font-bold text-gray-600">
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[10px]">
                            {c.orderIndex || idx + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span
                            className="font-bold text-gray-900 text-xs sm:text-sm hover:text-[#F97316] transition-colors cursor-pointer"
                            onClick={() => setDetailCategory(c)}
                          >
                            {c.name}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] text-gray-500">
                          #{c.id}
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            {productsCount} ta taom
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(c)}
                            className={cn(
                              "flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-medium border transition-all cursor-pointer",
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100",
                            )}
                            title="Statusni o'zgartirish"
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isActive ? "bg-emerald-500" : "bg-gray-400",
                              )}
                            />
                            <span>{isActive ? "Faol" : "Nofaol"}</span>
                          </button>
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailCategory(c)}
                              className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Batafsil"
                            >
                              <Eye className="w-3.5 h-3.5 stroke-[2]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(c)}
                              className="p-1 rounded-md text-gray-400 hover:text-[#F97316] hover:bg-orange-50 transition-colors cursor-pointer"
                              title="Tahrirlash"
                            >
                              <Pencil className="w-3.5 h-3.5 stroke-[2]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteCategoryItem(c)}
                              className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="O'chirish"
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-white border border-gray-200/80 rounded-lg p-8 text-center shadow-2xs space-y-2.5">
          <div className="w-10 h-10 rounded-md bg-orange-50 text-[#F97316] border border-orange-200/60 flex items-center justify-center mx-auto">
            <Folder className="w-5 h-5 stroke-[2]" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">Toifalar topilmadi</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Qidiruv so'zi yoki tanlangan filtrlar bo'yicha hech qanday toifa topilmadi.
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

      {/* ─── Pagination ──────────────────────────────────────────────── */}
      {filteredCategories.length > 0 && (
        <AdminPagination
          currentPage={validPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* ─── 1. Add / Edit Category Modal ────────────────────────────── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200/80 animate-scaleUp overflow-hidden flex flex-col text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md flex items-center justify-center border shrink-0 bg-orange-50 text-[#F97316] border-orange-200/60">
                  {editingCategory ? <Pencil className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                    {editingCategory ? "Toifani Tahrirlash" : "Yangi Toifa Qo'shish"}
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">
                    {editingCategory ? editingCategory.name : "Katalogga yangi toifa kiritish"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer text-slate-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCategory} className="p-6 space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Toifa Nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Pitsalar, Desertlar..."
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingCategory) {
                      setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                    }
                  }}
                  className="admin-input student-modal-input w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Toifa ID (Slug)
                  </label>
                  <input
                    type="text"
                    disabled={Boolean(editingCategory)}
                    placeholder="pitsalar"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="admin-input student-modal-input w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-md text-xs font-mono text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Tartib Raqami
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value, 10) || 1)}
                    className="admin-input student-modal-input w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Vitrinada ko'rinish holati
                </label>
                <select
                  value={formIsActive ? "active" : "inactive"}
                  onChange={(e) => setFormIsActive(e.target.value === "active")}
                  className="admin-input student-modal-input w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F97316]"
                >
                  <option value="active">🟢 Faol (Mijozlar menyuda ko'radi)</option>
                  <option value="inactive">⚪ Nofaol (Yashirilgan)</option>
                </select>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-md bg-slate-100 text-slate-700 font-medium text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-md bg-[#F97316] hover:bg-[#ea580c] active:scale-95 text-white font-medium text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 2. Category Details Modal ───────────────────────────────── */}
      {detailCategory && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setDetailCategory(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200/80 animate-scaleUp max-h-[90vh] overflow-hidden flex flex-col text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                <h3 className="font-bold text-sm text-gray-900">
                  {detailCategory.name}
                </h3>
                <span className="text-xs font-mono text-gray-400">
                  #{detailCategory.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailCategory(null)}
                className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer text-slate-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto no-scrollbar p-5 space-y-4 flex-1">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-150">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Tartib Raqami
                  </span>
                  <span className="text-sm font-bold text-gray-900 font-mono mt-0.5 block">
                    № {detailCategory.orderIndex || 1}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-150">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Holati
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-semibold mt-0.5",
                      detailCategory.isActive !== false ? "text-emerald-700" : "text-gray-500",
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        detailCategory.isActive !== false ? "bg-emerald-500" : "bg-gray-400",
                      )}
                    />
                    <span>{detailCategory.isActive !== false ? "Faol" : "Nofaol"}</span>
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-150">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Taomlar Soni
                  </span>
                  <span className="text-sm font-bold text-gray-900 font-mono mt-0.5 block">
                    {(categoryProductsMap[detailCategory.name] || []).length} ta
                  </span>
                </div>
              </div>

              {/* Attached Products List */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Biriktirilgan Taomlar</span>
                  <span className="text-[10px] font-normal text-gray-400">
                    {(categoryProductsMap[detailCategory.name] || []).length} ta mahsulot
                  </span>
                </h4>

                {(categoryProductsMap[detailCategory.name] || []).length > 0 ? (
                  <div className="border border-gray-150 rounded-lg divide-y divide-gray-100 max-h-60 overflow-y-auto">
                    {(categoryProductsMap[detailCategory.name] || []).map((p) => (
                      <div key={p.id} className="p-2.5 flex items-center justify-between gap-3 hover:bg-gray-50/70">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-9 h-9 rounded-md object-cover border border-gray-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-gray-900 truncate">{p.name}</h5>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Store className="w-3 h-3" />
                              <span>{p.restaurant}</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-xs text-gray-900 font-mono block">
                            {formatSom(p.price)}
                          </span>
                          <span
                            className={cn(
                              "text-[9px] font-semibold",
                              p.isAvailable !== false ? "text-emerald-600" : "text-rose-600",
                            )}
                          >
                            {p.isAvailable !== false ? "Mavjud" : "Tugagan"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 text-center bg-gray-50 rounded-lg border border-gray-150 text-xs text-gray-400">
                    Ushbu toifaga hozircha hech qanday taom biriktirilmagan.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-gray-50 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDeleteCategoryItem(detailCategory)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>O'chirish</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailCategory(null)}
                  className="px-3 py-1.5 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-medium text-xs transition-colors cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(detailCategory)}
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

      {/* ─── 3. Delete Confirmation Modal ─────────────────────────────── */}
      {deleteCategoryItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setDeleteCategoryItem(null)}
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
                Toifani o'chirish
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {(categoryProductsMap[deleteCategoryItem.name] || []).length > 0 ? (
                  <>
                    Diqqat! Ushbu toifada{" "}
                    <strong className="text-rose-600">
                      {(categoryProductsMap[deleteCategoryItem.name] || []).length} ta taom
                    </strong>{" "}
                    mavjud. Haqiqatan ham{" "}
                    <strong className="text-gray-800">"{deleteCategoryItem.name}"</strong> toifasini
                    o'chirmoqchimisiz?
                  </>
                ) : (
                  <>
                    Haqiqatan ham{" "}
                    <strong className="text-gray-800">"{deleteCategoryItem.name}"</strong> toifasini
                    menyudan o'chirmoqchimisiz?
                  </>
                )}
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteCategoryItem(null)}
                className="flex-1 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 rounded-md bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>O'chirish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
