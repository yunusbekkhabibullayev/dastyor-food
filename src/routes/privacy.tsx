import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app/BottomNav";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { cart } from "@/lib/cart-store";
import { profileSettings } from "@/lib/profile-settings";
import { toast } from "sonner";
export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Maxfiylik — Dastyor Food" },
      { name: "description", content: "Qurilmada saqlangan ma'lumotlarini boshqaring." },
      { property: "og:title", content: "Maxfiylik — Dastyor Food" },
      { property: "og:description", content: "Qurilmada saqlangan ma'lumotlarini boshqaring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});
function PrivacyPage() {
  const [confirm, setConfirm] = useState(false);
  return (
    <AppShell>
      <PageHeader title="Maxfiylik" back="/profile" />
      <main className="space-y-5 px-5">
        <ShieldCheck className="h-12 w-12 text-primary" />
        <h2 className="font-display text-xl font-bold">Ma'lumotlaringiz shu qurilmada</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Profil, manzillar, savat, sevimlilar, buyurtmalar va sozlamalar brauzeringizda saqlanadi.
        </p>
        {confirm ? (
          <section className="space-y-3 border-t border-border pt-5">
            <h3 className="font-bold">Barcha ma'lumotlar o'chirilsinmi?</h3>
            <p className="text-sm text-muted-foreground">
              Savat, buyurtmalar, sevimlilar, profil, manzillar va sozlamalar tozalanadi. Buni ortga
              qaytarib bo'lmaydi.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setConfirm(false)}>
                Bekor qilish
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  cart.reset();
                  profileSettings.reset();
                  setConfirm(false);
                  toast.success("Ma'lumotlar tozalandi");
                }}
              >
                Ha, tozalash
              </Button>
            </div>
          </section>
        ) : (
          <Button
            variant="outline"
            className="h-12 w-full gap-2 text-destructive"
            onClick={() => setConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
            Ma'lumotlarni tozalash
          </Button>
        )}
      </main>
    </AppShell>
  );
}
