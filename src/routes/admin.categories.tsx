import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Layers, Trash2 } from "lucide-react";
import {
  getFirestoreCategories,
  upsertFirestoreCategory,
  deleteFirestoreCategory,
} from "@/lib/firebase-data";
import { isFirebaseConfigured, type CategoryDoc } from "@/lib/firebase";
import { menuCategories } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({
    meta: [{ title: "Kategoriyalar — Dastyor Food Admin" }],
  }),
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [newCat, setNewCat] = useState("");

  useEffect(() => {
    const load = async () => {
      if (isFirebaseConfigured) {
        const live = await getFirestoreCategories();
        if (live.length > 0) {
          setCategories(live);
          return;
        }
      }
      setCategories(
        menuCategories.map((name, idx) => ({
          id: `cat-${idx + 1}`,
          name,
          orderIndex: idx + 1,
          isActive: true,
        })),
      );
    };
    void load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim()) return;

    const item: CategoryDoc = {
      id: `cat-${Date.now()}`,
      name: newCat.trim(),
      orderIndex: categories.length + 1,
      isActive: true,
    };

    setCategories([...categories, item]);
    if (isFirebaseConfigured) {
      await upsertFirestoreCategory(item);
    }
    toast.success("Kategoriya qo'shildi!");
    setNewCat("");
  };

  const handleDelete = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (isFirebaseConfigured) {
      await deleteFirestoreCategory(id);
    }
    toast.success("Kategoriya o'chirildi");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Kategoriyalar</h1>
        <p className="text-sm text-muted-foreground">Menyudagi taomlar toifalari va ularning ketma-ketligi.</p>
      </div>

      {/* Yangi qo'shish */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          required
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="Yangi kategoriya (masalan: Pitsalar, Desertlar)..."
          className="flex-1 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs outline-none focus:border-primary shadow-xs"
        />
        <Button
          type="submit"
          variant="unstyled"
          size="unset"
          className="flex items-center gap-1.5 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          <span>Qo'shish</span>
        </Button>
      </form>

      {/* Ro'yxat */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-xs divide-y divide-border/60">
        {categories.map((c, idx) => (
          <div key={c.id} className="flex items-center justify-between py-3 first:pt-1 last:pb-1">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-muted text-xs font-bold text-muted-foreground">
                {idx + 1}
              </span>
              <span className="font-display font-bold text-sm">{c.name}</span>
            </div>

            <Button
              variant="unstyled"
              size="unset"
              onClick={() => handleDelete(c.id)}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

