import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/app/BottomNav";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState, ProductCard, ProductSheet } from "@/components/app/food";
import { Button } from "@/components/ui/button";
import { products, type Product } from "@/lib/mock-data";
import { recommend, type Diet } from "@/lib/recommend";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recommend")({
  head: () => ({
    meta: [
      { title: "Siz uchun tavsiyalar — Dastyor Food" },
      { name: "description", content: "Xohishingiz va parhezingizga mos taomlarni toping." },
      { property: "og:title", content: "Siz uchun tavsiyalar — Dastyor Food" },
      { property: "og:description", content: "Xohishingiz va parhezingizga mos taomlarni toping." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecommendPage,
});

const diets: { id: Diet; label: string }[] = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "noMeat", label: "Go'shtsiz" },
  { id: "noSpicy", label: "Achchiqsiz" },
  { id: "light", label: "Yengil" },
];
const budgets = [null, 25000, 40000, 60000];

function RecommendPage() {
  const t = useT();
  const [craving, setCraving] = useState("");
  const [sel, setSel] = useState<Diet[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [open, setOpen] = useState<Product | null>(null);
  const list = useMemo(
    () => recommend(products, { craving, diets: sel, budget }),
    [craving, sel, budget],
  );

  return (
    <AppShell>
      <PageHeader title={t("Siz uchun tavsiyalar")} back="/home" />
      <main className="space-y-5 px-5 pb-20">
        <label className="block">
          <span className="text-sm font-bold">{t("Nima yegingiz keladi?")}</span>
          <input
            value={craving}
            onChange={(e) => setCraving(e.target.value)}
            placeholder={t("Masalan: pishloqli, tovuq, pizza")}
            className="mt-2 h-12 w-full rounded-2xl bg-muted px-4 text-sm outline-none"
          />
        </label>
        <div>
          <p className="mb-2 text-sm font-bold">{t("Parhez afzalliklari")}</p>
          <div className="flex flex-wrap gap-2">
            {diets.map((d) => {
              const on = sel.includes(d.id);
              return (
                <Button
                  key={d.id}
                  variant="unstyled"
                  size="unset"
                  aria-pressed={on}
                  onClick={() => setSel((s) => (on ? s.filter((x) => x !== d.id) : [...s, d.id]))}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {t(d.label)}
                </Button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold">{t("Byudjet")}</p>
          <div className="flex flex-wrap gap-2">
            {budgets.map((b) => (
              <Button
                key={String(b)}
                variant="unstyled"
                size="unset"
                onClick={() => setBudget(b)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold",
                  b === budget ? "border-ink bg-ink text-ink-foreground" : "border-border",
                )}
              >
                {b ? `≤ ${b.toLocaleString("ru-RU")} UZS` : t("Farqi yo'q")}
              </Button>
            ))}
          </div>
        </div>
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("Mos taomlar")}
          </h2>
          {list.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {list.map((p) => (
                <ProductCard key={p.id} p={p} onOpen={setOpen} />
              ))}
            </div>
          )}
        </section>
      </main>
      <ProductSheet product={open} onClose={() => setOpen(null)} />
    </AppShell>
  );
}
