import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Image as ImageIcon, Trash2 } from "lucide-react";
import {
  getFirestoreBanners,
  upsertFirestoreBanner,
  deleteFirestoreBanner,
} from "@/lib/firebase-data";
import { isFirebaseConfigured, db, type BannerDoc } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { products } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/banners")({
  head: () => ({
    meta: [{ title: "Bannerlar & Aksiyalar — Dastyor Food Admin" }],
  }),
  component: AdminBannersPage,
});

function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerDoc[]>([]);
  const [badge, setBadge] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const unsub = onSnapshot(
        collection(db, "banners"),
        (snap) => {
          if (!snap.empty) {
            setBanners(snap.docs.map((d) => d.data() as BannerDoc));
          } else {
            setBanners([
              {
                id: "banner-1",
                badge: "-20% chegirma",
                title: "Eng yaxshi fast-foodlar endi bir joyda!",
                text: "Buyurtma bering va tezkor yetkazib berishni oling",
                img: products[0]?.image || "",
                isActive: true,
              },
              {
                id: "banner-2",
                badge: "Yangi",
                title: "Issiq pitsalar 30 daqiqada",
                text: "Sevimli pitsangizni uyga buyurtma qiling",
                img: products[3]?.image || "",
                isActive: true,
              },
              {
                id: "banner-3",
                badge: "Bepul yetkazish",
                title: "Lavash va donarlar",
                text: "Ko'pchilik xonalardan yetkazib berish — 0 UZS",
                img: products[1]?.image || "",
                isActive: true,
              },
            ]);
          }
        },
        (err) => console.warn("Admin banners snapshot error:", err),
      );
      return () => unsub();
    }

    setBanners([
      {
        id: "banner-1",
        badge: "-20% chegirma",
        title: "Eng yaxshi fast-foodlar endi bir joyda!",
        text: "Buyurtma bering va tezkor yetkazib berishni oling",
        img: products[0]?.image || "",
        isActive: true,
      },
      {
        id: "banner-2",
        badge: "Yangi",
        title: "Issiq pitsalar 30 daqiqada",
        text: "Sevimli pitsangizni uyga buyurtma qiling",
        img: products[3]?.image || "",
        isActive: true,
      },
      {
        id: "banner-3",
        badge: "Bepul yetkazish",
        title: "Lavash va donarlar",
        text: "Ko'pchilik xonalardan yetkazib berish — 0 UZS",
        img: products[1]?.image || "",
        isActive: true,
      },
    ]);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const b: BannerDoc = {
      id: `banner-${Date.now()}`,
      badge: badge.trim() || "Aksiya",
      title: title.trim(),
      text: text.trim() || "Tezkor yetkazib berish",
      img: products[2]?.image || "",
      isActive: true,
    };

    setBanners([...banners, b]);
    if (isFirebaseConfigured) {
      await upsertFirestoreBanner(b);
    }
    toast.success("Banner qo'shildi!");
    setBadge("");
    setTitle("");
    setText("");
  };

  const handleDelete = async (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    if (isFirebaseConfigured) {
      await deleteFirestoreBanner(id);
    }
    toast.success("Banner o'chirildi");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Bannerlar & Aksiya</h1>
        <p className="text-sm text-muted-foreground">Bosh sahifadagi karusel slaydlarini boshqarish.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Qo'shish formasi */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs h-fit">
          <h3 className="font-display font-bold text-sm mb-3">Yangi Banner Qo'shish</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Badge (Yorliq)</label>
              <input
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="-20% chegirma"
                className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Sarlavha</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Yozgi maxsus taklif..."
                className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Qisqa matn</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Buyurtma bering va sovg'alarga ega bo'ling"
                rows={2}
                className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs outline-none focus:border-primary"
              />
            </div>

            <Button
              type="submit"
              variant="unstyled"
              size="unset"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 mt-2"
            >
              <Plus className="h-4 w-4" />
              <span>Qo'shish</span>
            </Button>
          </form>
        </div>

        {/* Bannerlar ko'rinishi */}
        <div className="md:col-span-2 space-y-3">
          {banners.map((b) => (
            <div
              key={b.id}
              className="relative overflow-hidden rounded-3xl bg-ink p-5 text-ink-foreground shadow-card flex items-center justify-between gap-4"
            >
              <div className="relative z-10 max-w-sm">
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                  {b.badge}
                </span>
                <h4 className="font-display font-bold text-base mt-2">{b.title}</h4>
                <p className="text-xs text-ink-foreground/75 mt-1">{b.text}</p>
              </div>

              <Button
                variant="unstyled"
                size="unset"
                onClick={() => handleDelete(b.id)}
                className="relative z-10 grid h-8 w-8 place-items-center rounded-lg bg-white/10 hover:bg-destructive/80 text-white transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

