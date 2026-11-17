import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, ShieldCheck, Database, RefreshCw } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { seedFirestoreData } from "@/lib/firebase-data";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [{ title: "Tizim Sozlamalari — Dastyor Food Admin" }],
  }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const [storeName, setStoreName] = useState("Dastyor Food");
  const [phone, setPhone] = useState("+998 90 123 45 67");
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedFirestoreData();
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } finally {
      setSeeding(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Sozlamalar saqlandi!");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Tizim Sozlamalari</h1>
        <p className="text-sm text-muted-foreground">Admin panel va do'kon parametrlarini boshqarish.</p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-5">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">Xizmat Nomi</label>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">Aloqa Telefon Raqami</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs outline-none focus:border-primary"
            />
          </div>

          <Button
            type="submit"
            variant="unstyled"
            size="unset"
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Saqlash
          </Button>
        </form>

        <div className="pt-5 border-t border-border/60">
          <h3 className="font-display font-bold text-sm mb-1 flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span>Firebase Ma'lumotlar Bazasi</span>
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Holat:{" "}
            <b className={isFirebaseConfigured ? "text-emerald-600" : "text-amber-600"}>
              {isFirebaseConfigured ? "Ulangan (Firestore Live)" : "Lokal Rejim (.env to'ldirilmagan)"}
            </b>
          </p>

          <Button
            variant="unstyled"
            size="unset"
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className={seeding ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            <span>{seeding ? "Yuklanmoqda..." : "Barcha datalarni Firestore'ga sinxronlash"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

