import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Plus,
  Store,
  Clock,
  Bike,
  Star,
  Trash2,
  Pencil,
  X,
  Check,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Upload,
} from "lucide-react";
import {
  getFirestoreRestaurants,
  upsertFirestoreRestaurant,
  deleteFirestoreRestaurant,
} from "@/lib/firebase-data";
import { isFirebaseConfigured, db, type RestaurantDoc } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editRestaurant, setEditRestaurant] = useState<RestaurantDoc | null>(null);

  // Create form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [time, setTime] = useState("25-35");
  const [delivery, setDelivery] = useState("0");
  const [minOrder, setMinOrder] = useState("30000");
  const [category, setCategory] = useState("Burgerlar");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editTime, setEditTime] = useState("25-35");
  const [editDelivery, setEditDelivery] = useState("0");
  const [editMinOrder, setEditMinOrder] = useState("30000");
  const [editCategory, setEditCategory] = useState("Burgerlar");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const unsub = onSnapshot(
        collection(db, "restaurants"),
        (snap) => {
          if (!snap.empty) {
            setRestaurants(snap.docs.map((d) => d.data() as RestaurantDoc));
          } else {
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
          }
        },
        (err) => console.warn("Admin restaurants snapshot error:", err),
      );
      return () => unsub();
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
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (isEdit) setEditLogoPreview(result);
      else setLogoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (isEdit) setEditCoverPreview(result);
      else setCoverPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const openEditModal = (r: RestaurantDoc) => {
    setEditRestaurant(r);
    setEditName(r.name);
    setEditAddress(r.address || "");
    setEditTime(r.time || "25-35");
    setEditDelivery(String(r.delivery || 0));
    setEditMinOrder(String(r.minOrder || 30000));
    setEditCategory(r.category || "Burgerlar");
    setEditIsActive(r.isActive !== false);
    setEditLogoPreview(r.logo || null);
    setEditCoverPreview(r.cover || null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Rostdan ham ushbu restoranni o'chirmoqchimisiz?")) return;
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
    if (isFirebaseConfigured) {
      await deleteFirestoreRestaurant(id);
    }
    toast.success("Restoran o'chirildi");
  };

  const handleToggleStatus = async (r: RestaurantDoc) => {
    const updated: RestaurantDoc = {
      ...r,
      isActive: r.isActive === false ? true : false,
    };
    setRestaurants((prev) => prev.map((item) => (item.id === r.id ? updated : item)));
    if (isFirebaseConfigured) {
      await upsertFirestoreRestaurant(updated);
    }
    toast.success(`${r.name} holati yangilandi`);
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
      logo: logoPreview || undefined,
      cover: coverPreview || mockRestaurants[0]?.cover || "",
      rating: 5.0,
      reviews: "1",
      time: time.trim() || "30-40",
      delivery: parseInt(delivery, 10) || 0,
      minOrder: parseInt(minOrder, 10) || 30000,
      address: address.trim() || "Tuman markazi",
      category,
      tags: [category, "Tezkor"],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setRestaurants([newRest, ...restaurants]);
    if (isFirebaseConfigured) {
      await upsertFirestoreRestaurant(newRest);
    }
    toast.success("Yangi restoran muvaffaqiyatli qo'shildi!");
    setName("");
    setAddress("");
    setTime("25-35");
    setDelivery("0");
    setMinOrder("30000");
    setLogoPreview(null);
    setCoverPreview(null);
    setIsCreateModalOpen(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRestaurant || !editName.trim()) return;

    const updated: RestaurantDoc = {
      ...editRestaurant,
      name: editName.trim(),
      short: editName.slice(0, 3).toUpperCase(),
      address: editAddress.trim(),
      time: editTime.trim() || "25-35",
      delivery: parseInt(editDelivery, 10) || 0,
      minOrder: parseInt(editMinOrder, 10) || 30000,
      category: editCategory,
      isActive: editIsActive,
      logo: editLogoPreview || undefined,
      cover: editCoverPreview || editRestaurant.cover,
      updatedAt: new Date().toISOString(),
    };

    setRestaurants((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    if (isFirebaseConfigured) {
      await upsertFirestoreRestaurant(updated);
    }
    toast.success("Restoran ma'lumotlari muvaffaqiyatli saqlandi!");
    setEditRestaurant(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Fast-food Xonalar</h1>
          <p className="text-sm text-muted-foreground">
            Tizimga ulangan barcha fast-food restoranlar, logotiplar va yetkazib berish shartlari.
          </p>
        </div>

        <Button
          variant="unstyled"
          size="unset"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Yangi Restoran Qo'shish</span>
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurants.map((r) => (
          <div
            key={r.id}
            className={`rounded-3xl border bg-card p-5 shadow-xs flex flex-col justify-between transition-all ${
              r.isActive === false
                ? "border-dashed border-border/80 opacity-60 bg-muted/20"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white border border-border/70 overflow-hidden shadow-xs">
                    {r.logo ? (
                      <img src={r.logo} alt={r.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-display font-black text-sm text-primary">{r.short}</span>
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

                <button
                  type="button"
                  onClick={() => handleToggleStatus(r)}
                  title={r.isActive === false ? "Faollashtirish" : "Nofaol qilish"}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                    r.isActive === false
                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {r.isActive === false ? "Nofaol" : "Faol"}
                </button>
              </div>

              <div className="mt-4 space-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                <p className="truncate">📍 {r.address || "Manzil ko'rsatilmagan"}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {r.time} daq
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Bike className="h-3.5 w-3.5 text-primary" /> {formatDelivery(r.delivery)}
                  </span>
                </div>
                <p className="text-[11px]">
                  Min. buyurtma: <b>{formatSom(r.minOrder)}</b>
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-medium">
                Kategoriya: <b className="text-foreground">{r.category || "Fast Food"}</b>
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="unstyled"
                  size="unset"
                  onClick={() => openEditModal(r)}
                  title="Restoranni tahrirlash"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="unstyled"
                  size="unset"
                  onClick={() => handleDelete(r.id)}
                  title="Restoranni o'chirish"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal - Yangi Restoran Qo'shish */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl border border-border my-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold">Yangi Restoran Qo'shish</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tizimga yangi fast-food xonasini ulash va logotip yuklash.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddRestaurant} className="mt-5 space-y-4">
              {/* Logo & Cover yuklash */}
              <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-2xl border border-border/80">
                <label
                  htmlFor="create-logo-upload"
                  className="group relative cursor-pointer shrink-0"
                  title="Logotip yuklash"
                >
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-primary/40 bg-white flex items-center justify-center overflow-hidden shadow-xs group-hover:border-primary transition-all">
                    {logoPreview ? (
                      <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-1">
                        <Store className="w-6 h-6 mx-auto text-primary/60 group-hover:text-primary transition-colors" />
                        <span className="text-[9px] font-bold text-muted-foreground block mt-0.5">Logo</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                    <Plus className="w-3 h-3 stroke-[3]" />
                  </div>
                  <input
                    id="create-logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, false)}
                    className="hidden"
                  />
                </label>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">Restoran Logotipi</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    PNG, JPG yoki WebP formatida rasm yuklang
                  </p>
                  <label
                    htmlFor="create-logo-upload"
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Rasmni tanlash</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Restoran Nomi *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Street Burger"
                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Manzil *</label>
                <input
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Mustaqillik ko'chasi, 14"
                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Asosiy Kategoriya
                </label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Burgerlar, Lavash, Pizza..."
                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Vaqt (daq)
                  </label>
                  <input
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="25-35"
                    className="w-full rounded-xl border border-border bg-muted/40 px-2.5 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Yetkazish (UZS)
                  </label>
                  <input
                    type="number"
                    value={delivery}
                    onChange={(e) => setDelivery(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-border bg-muted/40 px-2.5 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Min. buyurtma
                  </label>
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
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 rounded-xl bg-muted py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted/80 cursor-pointer"
                >
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  variant="unstyled"
                  size="unset"
                  className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 cursor-pointer"
                >
                  Saqlash
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Restoranni Tahrirlash (EDIT) */}
      {editRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl border border-border my-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold">Restoranni Tahrirlash</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Restoran nomi, manzili, logotipi va yetkazib berish sozlamalarini yangilang.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditRestaurant(null)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4">
              {/* Logo tahrirlash */}
              <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-2xl border border-border/80">
                <label
                  htmlFor="edit-logo-upload"
                  className="group relative cursor-pointer shrink-0"
                  title="Yangi logotip yuklash"
                >
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-primary/40 bg-white flex items-center justify-center overflow-hidden shadow-xs group-hover:border-primary transition-all">
                    {editLogoPreview ? (
                      <img src={editLogoPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-1">
                        <Store className="w-6 h-6 mx-auto text-primary/60 group-hover:text-primary transition-colors" />
                        <span className="text-[9px] font-bold text-muted-foreground block mt-0.5">Logo</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                    <Pencil className="w-2.5 h-2.5" />
                  </div>
                  <input
                    id="edit-logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, true)}
                    className="hidden"
                  />
                </label>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">Restoran Logotipi</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Logotipni o'zgartirish uchun rasm yuklang
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <label
                      htmlFor="edit-logo-upload"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Yangi rasm tanlash</span>
                    </label>
                    {editLogoPreview && (
                      <button
                        type="button"
                        onClick={() => setEditLogoPreview(null)}
                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        O'chirish
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Restoran Nomi *
                </label>
                <input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Masalan: Street Burger"
                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Manzil *</label>
                <input
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Mustaqillik ko'chasi, 14"
                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Asosiy Kategoriya
                  </label>
                  <input
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="Burgerlar, Lavash..."
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Holati</label>
                  <select
                    value={editIsActive ? "active" : "inactive"}
                    onChange={(e) => setEditIsActive(e.target.value === "active")}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-xs outline-none focus:border-primary font-medium"
                  >
                    <option value="active">Faol (Ochiq)</option>
                    <option value="inactive">Nofaol (Yopiq)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Vaqt (daq)
                  </label>
                  <input
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    placeholder="25-35"
                    className="w-full rounded-xl border border-border bg-muted/40 px-2.5 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Yetkazish (UZS)
                  </label>
                  <input
                    type="number"
                    value={editDelivery}
                    onChange={(e) => setEditDelivery(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-border bg-muted/40 px-2.5 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Min. buyurtma
                  </label>
                  <input
                    type="number"
                    value={editMinOrder}
                    onChange={(e) => setEditMinOrder(e.target.value)}
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
                  onClick={() => setEditRestaurant(null)}
                  className="flex-1 rounded-xl bg-muted py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted/80 cursor-pointer"
                >
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  variant="unstyled"
                  size="unset"
                  className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 cursor-pointer"
                >
                  O'zgarishlarni saqlash
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
