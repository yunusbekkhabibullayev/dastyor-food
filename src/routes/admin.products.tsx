import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Search, UtensilsCrossed, Trash2, CheckCircle2, XCircle } from "lucide-react";
import {
  getFirestoreProducts,
  upsertFirestoreProduct,
  deleteFirestoreProduct,
} from "@/lib/firebase-data";
import { isFirebaseConfigured, type ProductDoc } from "@/lib/firebase";
import { products as mockProducts, menuCategories, formatSom } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
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
  const [cat, setCat] = useState("Barchasi");
  const [q, setQ] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New product form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<string>("Burgerlar");
  const [restaurant, setRestaurant] = useState("Evos");

  useEffect(() => {
    const load = async () => {
      if (isFirebaseConfigured) {
        const live = await getFirestoreProducts();
        if (live.length > 0) {
          setProducts(live);
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
    if (isFirebaseConfigured) {
      await upsertFirestoreProduct(updated);
    }
    toast.success(`${p.name} holati o'zgartirildi`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Rostdan ham ushbu taomni o'chirmoqchimisiz?")) return;
    setProducts((prev) => prev.filter((item) => item.id !== id));
    if (isFirebaseConfigured) {
      await deleteFirestoreProduct(id);
    }
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
      image: mockProducts[0]?.image || "",
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
    setIsModalOpen(false);
  };

  const filtered = products.filter((p) => {
    const matchCat = cat === "Barchasi" || p.category === cat;
    const matchQ =
      !q.trim() ||
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.restaurant.toLowerCase().includes(q.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Menyu & Taomlar</h1>
          <p className="text-sm text-muted-foreground">Katalogdagi barcha taomlar, narxlar va mavjudlik nazorati.</p>
        </div>

        <Button
          variant="unstyled"
          size="unset"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Yangi Taom Qo'shish</span>
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex h-11 flex-1 items-center gap-2.5 rounded-2xl border border-border bg-card px-3.5 shadow-xs">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Taom yoki restoran nomidan qidirish..."
            className="flex-1 bg-transparent text-xs outline-none"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["Barchasi", ...menuCategories].map((item) => (
            <Button
              key={item}
              variant="unstyled"
              size="unset"
              onClick={() => setCat(item)}
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-semibold shrink-0 transition-colors",
                cat === item
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="rounded-3xl border border-border bg-card p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors"
          >
            <div className="flex gap-3">
              <img
                src={p.image}
                alt={p.name}
                className="h-20 w-20 shrink-0 rounded-2xl object-cover border border-border/50"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wide">
                  {p.restaurant} · {p.category}
                </span>
                <h3 className="font-display font-bold text-sm truncate mt-0.5">{p.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.description}</p>
                <p className="font-display font-extrabold text-sm text-foreground mt-1.5">
                  {formatSom(p.price)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              <Button
                variant="unstyled"
                size="unset"
                onClick={() => handleToggle(p)}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-bold rounded-lg px-2.5 py-1 transition-colors",
                  p.isAvailable !== false
                    ? "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
                    : "text-amber-600 bg-amber-500/10 hover:bg-amber-500/20",
                )}
              >
                {p.isAvailable !== false ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Mavjud</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Tugagan</span>
                  </>
                )}
              </Button>

              <Button
                variant="unstyled"
                size="unset"
                onClick={() => handleDelete(p.id)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal - Yangi Taom Qo'shish */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl border border-border">
            <h3 className="font-display text-lg font-bold">Yangi Taom Qo'shish</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Menyuga yangi fast-food taomi qo'shish formasi.</p>

            <form onSubmit={handleAddProduct} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Taom Nomi</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Double Cheeseburger"
                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Restoran / Fast-food xona</label>
                <select
                  value={restaurant}
                  onChange={(e) => setRestaurant(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                >
                  {["Evos", "Max Way", "Oqtepa Lavash", "Bellissimo", "Les Ailes", "Chopar Pizza", "Burger House", "Tovuq City"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Kategoriya</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                  >
                    {menuCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Narxi (UZS)</label>
                  <input
                    required
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="35000"
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Tavsif (Masalliqlar)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mol go'shti, cheddar pishlog'i, pomidor va maxsus sous"
                  rows={2}
                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs outline-none focus:border-primary"
                />
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

