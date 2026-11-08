import { createFileRoute, useHydrated } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Check } from "lucide-react";
import { AppShell } from "@/components/app/BottomNav";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import {
  addressSchema,
  profileSettings,
  useProfileSettings,
  type SavedAddress,
} from "@/lib/profile-settings";
import { districts } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/addresses")({
  head: () => ({
    meta: [
      { title: "Saqlangan manzillar — Dastyor Food" },
      { name: "description", content: "Qurilmangizdagi yetkazish manzillarini boshqaring." },
      { property: "og:title", content: "Saqlangan manzillar — Dastyor Food" },
      { property: "og:description", content: "Qurilmangizdagi yetkazish manzillarini boshqaring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddressesPage,
});
function AddressesPage() {
  const s = useProfileSettings();
  const ready = useHydrated();
  const [form, setForm] = useState<SavedAddress | null>(null);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  function save(e: React.FormEvent) {
    e.preventDefault();
    const result = addressSchema.safeParse(form);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Manzilni tekshiring");
      return;
    }
    profileSettings.saveAddress(result.data);
    setForm(null);
    setError("");
    toast.success("Manzil saqlandi");
  }
  return (
    <AppShell>
      <PageHeader title="Saqlangan manzillar" back="/profile" />
      <main className="space-y-5 px-5">
        {form ? (
          <form onSubmit={save} noValidate className="space-y-3">
            <h2 className="font-display text-lg font-bold">Manzil ma'lumotlari</h2>
            {(
              [
                ["label", "Manzil nomi"],
                ["street", "Ko'cha"],
                ["house", "Uy raqami"],
                ["apartment", "Xonadon (ixtiyoriy)"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-sm font-semibold">
                {label}
                <input
                  aria-label={label}
                  value={form[key]}
                  onChange={(e) => {
                    setForm({ ...form, [key]: e.target.value });
                    setError("");
                  }}
                  className="mt-1.5 flex h-11 w-full rounded-2xl border border-border/70 bg-muted/40 px-3.5 text-sm font-medium transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/10 outline-none"
                />
              </label>
            ))}
            <label className="block text-sm font-semibold">
              Tuman
              <select
                aria-label="Tuman"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="mt-1.5 flex h-11 w-full rounded-2xl border border-border/70 bg-muted/40 px-3.5 text-sm font-medium transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/10 outline-none"
              >
                {districts.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setForm(null);
                  setError("");
                }}
              >
                Bekor qilish
              </Button>
              <Button type="submit">Saqlash</Button>
            </div>
          </form>
        ) : (
          <>
            <Button
              disabled={!ready}
              onClick={() =>
                setForm({
                  id: crypto.randomUUID(),
                  label: "Uy",
                  district: districts[0] ?? "",
                  street: "",
                  house: "",
                  apartment: "",
                })
              }
              className="h-12 w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Manzil qo'shish
            </Button>
            {ready && !s.addresses.length && (
              <div className="py-12 text-center">
                <MapPin className="mx-auto h-12 w-12 text-primary" />
                <h2 className="mt-4 font-display text-lg font-bold">Hali manzil saqlanmagan</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Uy yoki ish manzilingizni qo'shing.
                </p>
              </div>
            )}
            {ready &&
              s.addresses.map((a) => (
                <article
                  key={a.id}
                  className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h2 className="min-w-0 flex-1 break-words font-bold">{a.label}</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${a.label} manzilini tahrirlash`}
                      onClick={() => setForm(a)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${a.label} manzilini o'chirish`}
                      onClick={() => setRemoving(a.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="break-words text-sm text-muted-foreground">
                    {a.district}, {a.street}, {a.house}-uy
                    {a.apartment && `, ${a.apartment}-xonadon`}
                  </p>
                  {removing === a.id ? (
                    <div className="space-y-2">
                      <p className="text-sm">Manzil o'chirilsinmi?</p>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setRemoving(null)}>
                          Bekor qilish
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            profileSettings.removeAddress(a.id);
                            setRemoving(null);
                          }}
                        >
                          O'chirish
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className="gap-2 text-primary"
                      onClick={() => profileSettings.setDefault(a.id)}
                    >
                      {s.defaultAddressId === a.id && <Check className="h-4 w-4" />}
                      {s.defaultAddressId === a.id ? "Asosiy manzil" : "Asosiy qilish"}
                    </Button>
                  )}
                </article>
              ))}
          </>
        )}
        <p className="text-xs text-muted-foreground">Manzillar faqat shu qurilmada saqlanadi.</p>
      </main>
    </AppShell>
  );
}
